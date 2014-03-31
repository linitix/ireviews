var xml2js = require("xml2js");
var async = require("async");
var jsonschema = require("jsonschema");
var moment = require("moment");
var request = require("request");
var debug = require("debug")("main");

var Configurator = require("./configurator");
var InvalidParametersError = require("../errors/invalid_parameters_error");

var ITUNES_STORE_CUSTOMER_REVIEWS_URL = "https://itunes.apple.com/__COUNTRYCODE__/rss/customerreviews/page=__COUNTER__/id=__APPSTOREID__/sortby=mostrecent/xml";

var parametersSchema = Configurator.loadSync("parameters_schema");
var Validator = new jsonschema.Validator();
var Parser = new xml2js.Parser();

exports.INVALID_PARAMETERS_ERROR = InvalidParametersError;
exports.downloadAllReviewsForApplicationInCountry = downloadAllReviewsForApplicationInCountry;

function downloadAllReviewsForApplicationInCountry(parameters, callback) {
    debug("Template URL: %s", ITUNES_STORE_CUSTOMER_REVIEWS_URL);

    async.waterfall(
        [
            function (callback) {
                validateAllJSON(parameters, callback);
            },
            function (callback) {
                downloadAllReviews(parameters, callback);
            },
            function (parsedData, callback) {
                processingParsedData(parsedData, callback);
            }
        ],
        function (err, reviews) {
            if (err) return callback(err);
            callback(null, reviews);
        }
    );
}

// FIRST STEP

function validateAllJSON(parameters, callback) {
    var parametersErrors = validateJSON(parameters, parametersSchema);
    var err = null;

    if (parametersErrors) {
        err = new InvalidParametersError(
            "Please enter all the required parameters.",
            parametersErrors
        );
        return callback(err);
    }

    callback();
}

function validateJSON(json, schema) {
    var result = Validator.validate(json, schema);

    if (result.errors.length > 0)
        return result.errors;

    return null;
}

// SECOND STEP

function downloadAllReviews(parameters, callback) {
    var counter = 0;
    var finished = false;
    var parsedData = [];

    parameters.country_code = parameters.country_code.toLowerCase();

    async.whilst(
        function () {
            return !finished;
        },
        function (callback) {
            counter++;

            async.waterfall(
                [
                    function (callback) {
                        downloadPageReviews(parameters, counter, callback);
                    },
                    function (data, callback) {
                        parseXMLDataToJSON(data, callback);
                    }
                ],
                function (err, entries) {
                    if (err) return callback(err);
                    if (!entries) finished = true;
                    if (entries) parsedData.push(entries);
                    callback();
                }
            );
        },
        function (err) {
            callback(err, parsedData);
        }
    );
}

function downloadPageReviews(parameters, counter, callback) {
    var url = ITUNES_STORE_CUSTOMER_REVIEWS_URL.replace("__COUNTRYCODE__", parameters.country_code);

    url = url.replace("__COUNTER__", counter);
    url = url.replace("__APPSTOREID__", parameters.store_id);

    debug("URL: %s", url);

    request.get(
        url,
        function (err, res, body) {
            if (err) return callback(err);

            switch (res.statusCode) {
                case 200:
                    callback(null, body);
                    break;
                default:
                    callback(new Error("HTTP status code : " + res.statusCode));
            }
        }
    );
}

function parseXMLDataToJSON(data, callback) {
    var entries = null;

    Parser.parseString(
        data,
        function (err, result) {
            if (err) return callback(err);
            if (result.feed.entry && result.feed.entry.length > 1) entries = result.feed.entry;
            callback(null, entries);
        }
    );
}

// THIRD STEP

function processingParsedData(parsedData, callback) {
    var reviews = [];

    async.each(
        parsedData,
        function (items, callback) {
            items.shift();

            async.each(
                items,
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
                        updated: moment.utc(item.updated[0]).unix()
                    };

                    reviews.push(review);

                    callback();
                },
                callback
            );
        },
        function (err) {
            callback(err, reviews);
        }
    );
}
