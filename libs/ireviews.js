var util = require("util");
var EventEmitter = require("events").EventEmitter;

var debug = require("debug")("iReviews");
var async = require("async");
var jsonschema = require("jsonschema");
var xml2js = require("xml2js");
var moment = require("moment");
var request = require("request");

var Configurator = require("./configurator");
var InvalidParametersError = require("../errors/invalid_parameters_error");

var ITUNES_STORE_CUSTOMER_REVIEWS_URL =
    "https://itunes.apple.com/__COUNTRYCODE__/rss/customerreviews/page=__COUNTER__/id=__APPSTOREID__/sortby=mostrecent/xml";

var schema = Configurator.loadSync("parameters_schema");
var Validator = new jsonschema.Validator();
var Parser = new xml2js.Parser();

function IReviews(options) {
    this.storeId = undefined;
    this.countriesCode = undefined;

    if (options) {
        this.storeId = options.store_id;
        this.countriesCode = options.countries_code;
    }

    debug("storeId: %s", this.storeId);
    debug("countriesCode: %s", JSON.stringify(this.countriesCode));

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

    self._processingReviews(callback);
};

IReviews.prototype._processingReviews = function (callback) {
    var self = this;
    var parameters = {
        storeId: self.storeId,
        countriesCode: self.countriesCode
    };

    debug(parameters.storeId);
    debug(parameters.countriesCode);

    async.waterfall(
        [
            function (next) {
                validateParameters(parameters, next);
            },
            function (next) {
                downloadAllReviews(self, parameters, next);
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

function validateParameters(parameters, callback) {
    var result = Validator.validate(parameters, schema);
    var err = null;

    if (result.errors.length > 0)
        err = new InvalidParametersError("Please enter all required parameters.", result.errors);

    callback(err);
}

function downloadAllReviews(self, parameters, callback) {
    var reviews = [];

    async.each(
        parameters.countriesCode,
        function (countryCode, next) {
            downloadAllReviewsForCountry(
                self,
                parameters.storeId,
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
}

function downloadAllReviewsForCountry(self, storeId, countryCode, callback) {
    var counter = 0;
    var finished = false;
    var reviews = {
        count: 0,
        countryCode: countryCode,
        pages: []
    };

    async.whilst(
        function () {
            return !finished;
        },
        function (next) {
            counter++;

            async.waterfall(
                [
                    function (next) {
                        downloadPageReviews(storeId, countryCode, counter, next)
                    },
                    function (data, next) {
                        parseXMLDataToJSON(
                            data,
                            function (err, result) {
                                if (err) return callback(err);
                                if (!result) finished = true;
                                next(null, result);
                            }
                        );
                    },
                    function (parsedData, next) {
                        processingParsedData(self, parsedData, countryCode, next);
                    }
                ],
                function (err, result) {
                    if (err) return next(err);

                    if (result.length > 0) {
                        reviews.count += result.length;
                        reviews.pages.push(result);
                    }

                    next();
                }
            );
        },
        function (err) {
            callback(err, reviews);
        }
    );
}

function downloadPageReviews(storeId, countryCode, page, callback) {
    var url = ITUNES_STORE_CUSTOMER_REVIEWS_URL.replace("__COUNTRYCODE__", countryCode);

    url = url.replace("__COUNTER__", page);
    url = url.replace("__APPSTOREID__", storeId);

    debug("URL: %s", url);

    request.get(
        url,
        function (err, res, body) {
            if (err) return callback(err);

            switch (res.statusCode) {
                case 200:
                    callback(null, body);
                    break;
                case 403:
                    debug("HTTP status code (%d) returned by Apple service", res.statusCode)
                    callback(null, null);
                    break;
                default:
                    callback(new Error("HTTP status code : " + res.statusCode));
            }
        }
    );
}

function parseXMLDataToJSON(data, callback) {
    var entries = null;

    if (!data) return callback(null, entries);

    Parser.parseString(
        data,
        function (err, result) {
            if (err) return callback(err);
            if (result.feed.entry && result.feed.entry.length > 1) entries = result.feed.entry;
            callback(null, entries);
        }
    );
}

function processingParsedData(self, parsedData, countryCode, callback) {
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
}

module.exports = IReviews;
