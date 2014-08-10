var util = require("util");
var EventEmitter = require("events").EventEmitter;

var debug = require("debug")("iReviews");
var async = require("async");
var jsonschema = require("jsonschema");
var xml2js = require("xml2js");
var moment = require("moment");
var request = require("request");
var temporal = require("temporal");

var Configurator = require("./configurator");
var InvalidParametersError = require("../errors/invalid_parameters_error");

var ITUNES_STORE_CUSTOMER_REVIEWS_URL = "https://itunes.apple.com/__COUNTRYCODE__/rss/customerreviews/id=__APPSTOREID__/sortby=mostrecent/__FORMAT__";
var RES_FORMAT = { JSON: "json", XML: "xml" };

var schema = Configurator.loadSync("parameters_schema");
var Validator = new jsonschema.Validator();
var Parser = new xml2js.Parser();

function IReviews(options) {
    this.storeId = null;
    this.countriesCode = null;
    this.delay = 0;
    this.format = "json";

    if (options) {
        this.storeId = options.store_id || null;
        this.countriesCode = options.countries_code || null;
        this.delay = options.delay || 0;

        if (options.format) this.format = options.format.toLowerCase();
    }

    debug("storeId: %s", this.storeId);
    debug("countriesCode: %s", JSON.stringify(this.countriesCode));
    debug("delay: %d", this.delay);
    debug("format: %s", this.format);

    EventEmitter.call(this);
}

util.inherits(IReviews, EventEmitter);

IReviews.prototype.parse = function (callback) {
    var self = this;

    if (!self.storeId || !self.countriesCode)
        return callback(new Error("All required parameters must be set."));

    self._processingReviews();
};

IReviews.prototype.listAll = function (parameters, callback) {
    var self = this;

    if (typeof parameters === "function")
        callback = parameters;

    if (typeof parameters === "object") {
        self.storeId = parameters.store_id;
        self.countriesCode = parameters.countries_code;
    }

    if (!self.storeId || !self.countriesCode)
        return callback(new Error("All required parameters must be set."));

    self._processingReviews(callback);
};

IReviews.prototype._processingReviews = function (callback) {
    var self = this;

    async.waterfall(
        [
            function (next) {
                self._validateParameters(next);
            },
            function (next) {
                self._downloadAllReviews(next);
            }
        ],
        function (err, result) {
            if (err) {
                if (!callback) return self.emit("error", err);
                return callback(err);
            }

            if (!callback) return self.emit("end", result);
            callback(null, result);
        }
    );
};

IReviews.prototype._validateParameters = function (callback) {
    var self = this;
    var result = Validator.validate({ storeId: self.storeId, countriesCode: self.countriesCode }, schema);
    var err = null;

    if (result.errors.length > 0)
        err = new InvalidParametersError("Please enter all required parameters.", result.errors);

    callback(err);
};

IReviews.prototype._downloadAllReviews = function (callback) {
    var self = this;
    var reviews = [];

    async.eachSeries(
        self.countriesCode,
        function (countryCode, next) {
            self._downloadAllReviewsForCountry(
                self.storeId,
                countryCode,
                function (err, result) {
                    if (err) return next(err);
                    reviews.push(result);
                    next();
                }
            );
        },
        function (err) {
            callback(err, reviews);
        }
    );
};

IReviews.prototype._downloadAllReviewsForCountry = function (storeId, countryCode, callback) {
    var self = this;
    var finished = false;
    var reviews = {
        count: 0,
        countryCode: countryCode,
        items: []
    };
    var url = ITUNES_STORE_CUSTOMER_REVIEWS_URL.replace("__FORMAT__", self.format);

    url = url.replace("__COUNTRYCODE__", countryCode.toLowerCase());
    url = url.replace("__APPSTOREID__", storeId);

    debug("URL: %s", url);

    async.whilst(
        function () {
            return !finished;
        },
        function (next) {
            async.waterfall(
                [
                    function (next) {
                        if (self.delay > 0) {
                            temporal.delay(self.delay, function () {
                                downloadPageReviews(url, next);
                            });
                        } else {
                            downloadPageReviews(url, next);
                        }
                    },
                    function (data, next) {
                        if (!data) return next(null, data);

                        switch (self.format) {
                            case RES_FORMAT.JSON:
                                parseJSONData(
                                    data,
                                    function (err, nextPageURL, entries) {
                                        if (err) return next(err);
                                        if (!nextPageURL) {
                                            finished = true;
                                            return next(null, entries);
                                        }
                                        if (nextPageURL.length == 0 || entries.length == 0) finished = true;
                                        if (nextPageURL && nextPageURL.length > 0) url = nextPageURL;

                                        next(null, entries);
                                    }
                                );
                                break;
                            case RES_FORMAT.XML:
                                parseXMLDataToJSON(
                                    data,
                                    function (err, nextPageURL, entries) {
                                        if (err) return next(err);
                                        if (!nextPageURL) {
                                            finished = true;
                                            return next(null, entries);
                                        }
                                        if (nextPageURL.length == 0 || entries.length == 0) finished = true;
                                        if (nextPageURL && nextPageURL.length > 0) url = nextPageURL;

                                        next(null, entries);
                                    }
                                );
                                break;
                            default:
                                finished = true;
                                next(null, null);
                                break;
                        }
                    },
                    function (parsedData, next) {
                        if (!parsedData) return next(null, parsedData);
                        if (parsedData.length == 0) return next(null, parsedData);

                        switch (self.format) {
                            case RES_FORMAT.JSON:
                                self._processingJSONParsedData(parsedData, countryCode, next);
                                break;
                            case RES_FORMAT.XML:
                                self._processingXMLParsedData(parsedData, countryCode, next);
                                break;
                            default:
                                next();
                                break;
                        }
                    }
                ],
                function (err, result) {
                    if (err) return next(err);
                    if (!result) {
                        finished = true;
                        return next();
                    }

                    if (result.length > 0) {
                        reviews.count += result.length;

                        result.forEach(function (item) {
                            reviews.items.push(item);
                        });
                    }

                    next();
                }
            );
        },
        function (err) {
            console.log(reviews);

            callback(err, reviews);
        }
    );
};

IReviews.prototype._processingXMLParsedData = function (parsedData, countryCode, callback) {
    var self = this;
    var reviews = [];

    if (!parsedData) return callback(null, reviews);

    parsedData.shift();

    async.each(
        parsedData,
        function (item, callback) {
            var review = {
                id: item.id[0],
                title: item.title[0],
                author: item.author[0].name[0],
                content: item.content[0]["_"],
                rating: parseInt(item["im:rating"][0]),
                helpful_vote_count: parseInt(item["im:voteSum"][0]),
                total_vote_count: parseInt(item["im:voteCount"][0]),
                application_version: item["im:version"][0],
                updated: moment.utc(item.updated[0]).unix(),
                country_code: countryCode
            };

            self.emit("review", review);
            reviews.push(review);

            callback();
        },
        function (err) {
            callback(err, reviews);
        }
    );
};

IReviews.prototype._processingJSONParsedData = function (parsedData, countryCode, callback) {
    var self = this;
    var reviews = [];

    if (!parsedData) return callback(null, reviews);

    parsedData.shift();

    async.each(
        parsedData,
        function (item, callback) {
            var review = {
                id: item.id.label,
                title: item.title.label,
                author: item.author.name.label,
                content: item.content.label,
                rating: parseInt(item["im:rating"].label),
                helpful_vote_count: parseInt(item["im:voteSum"].label),
                total_vote_count: parseInt(item["im:voteCount"].label),
                application_version: item["im:version"].label,
                country_code: countryCode
            };

            self.emit("review", review);
            reviews.push(review);

            callback();
        },
        function (err) {
            callback(err, reviews);
        }
    );
};

function downloadPageReviews(url, callback) {
    request.get(
        url,
        function (err, res, body) {
            if (err) return callback(err);

            switch (res.statusCode) {
                case 200:
                    callback(null, body);
                    break;
                case 403:
                    debug("HTTP status code (%d) returned by Apple service", res.statusCode);
                    callback(null, null);
                    break;
                default:
                    callback(new Error("HTTP status code : " + res.statusCode));
            }
        }
    );
}

function parseXMLDataToJSON(data, callback) {
    var entries;
    var nextPageUrl = "";
    var links;

    Parser.parseString(
        data,
        function (err, result) {
            if (err) return callback(err);

            entries = [];

            if (result.feed.link && result.feed.link.length == 6) {
                links = result.feed.link;
                nextPageUrl = links[5]["$"].href || "";
            }
            if (result.feed.entry && result.feed.entry.length > 1) entries = result.feed.entry;

            debug("Next page URL: %s", nextPageUrl);

            callback(null, nextPageUrl, entries);
        }
    );
}

function parseJSONData(data, callback) {
    var entries = [];
    var nextPageUrl = "";
    var links;

    data = JSON.parse(data);

    if (data.feed.link && data.feed.link.length == 6) {
        links = data.feed.link;
        nextPageUrl = links[5].attributes.href || "";
        nextPageUrl = nextPageUrl.replace("xml", RES_FORMAT.JSON);
    }
    if (data.feed.entry && data.feed.entry.length > 1) entries = data.feed.entry;

    debug("Next page URL: %s", nextPageUrl);

    callback(null, nextPageUrl, entries);
}

module.exports = IReviews;
