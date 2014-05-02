# iReviews

[![NPM version](https://badge.fury.io/js/ireviews.svg)](http://badge.fury.io/js/ireviews) [![Build Status](https://travis-ci.org/linitix/ireviews.svg?branch=master)](https://travis-ci.org/linitix/ireviews) [![Dependency Status](https://david-dm.org/linitix/ireviews.svg)](https://david-dm.org/linitix/ireviews)

iTunes store customer reviews fetcher.

## Dependencies

* [async](https://www.npmjs.org/package/async) : Higher-order functions and common patterns for asynchronous code.
* [request](https://www.npmjs.org/package/request) : Simplified HTTP request client.
* [moment](https://www.npmjs.org/package/moment) : Parse, manipulate, and display dates.
* [jsonschema](https://www.npmjs.org/package/jsonschema) : A fast and easy to use JSON schema validator.
* [debug](https://www.npmjs.org/package/debug) : Small debugging utility.
* [xml2js](https://www.npmjs.org/package/xml2js) : Simple XML to JavaScript object converter.

## Features

* Use of events.
* Automatic validation of all parameters.
* Asynchronous reviews download.
* Parse XML to JSON.
* Return an enhance version of the structure (array of reviews).

## Installation

```
$ npm install [--save] ireviews
```

## Usage

```javascript
var iReviews = require("ireviews");

var parameters = {
	store_id: "APPLICATION_ITUNES_STORE_ID",
    countries_code: [ "ALPHA_2_ISO_COUNTRY_CODE" ]
};

var ireviews = new iReviews.Processor(parameters);

ireviews.storeId = "APPLICATION_ITUNES_STORE_ID";
ireviews.countriesCode = [ "ALPHA_2_ISO_COUNTRY_CODE" ];

// ============= WITHOUT EVENTS

ireviews.listAll(
	parameters,
    function (err, reviews) {
    	if (err) return console.log(err);
        console.log(reviews);
    }
);

// ============= WITH EVENTS

ireviews.on("error", function (err) {
	console.log(err);
});

ireviews.on("end", function (reviews) {
	console.log(reviews);
});

ireviews.on("review", function (review) {
	console.log(review);
});

ireviews.parse(function (err) {
	if (err) console.log(err);
});
```

**IMPORTANT :**

* You can have an `INVALID_PARAMETERS_ERROR` when there is an issue with the parameters JSON.

## Structure

* All reviews

```json
[
	{
    	"count": 100,
        "countryCode": "US",
        "pages": [
        	[
            	{
                    "id": "533332669",
                    "title": "Help",
                    "author": "DanBenedit1",
                    "content": "I can't see my playlist after the update...",
                    "rating": 1,
                    "helpful_vote_count": 3,
                    "total_vote_count": 3,
                    "application_version": "1.1",
                    "updated": 1330129380,
                    "country_code": "US"
                }
            ],
            [
            	{
                    "id": "533332669",
                    "title": "Help",
                    "author": "DanBenedit1",
                    "content": "I can't see my playlist after the update...",
                    "rating": 1,
                    "helpful_vote_count": 3,
                    "total_vote_count": 3,
                    "application_version": "1.1",
                    "updated": 1330129380,
                    "country_code": "US"
                }
            ]
        ]
    }
]
```

* A review

```json
{
	"id": "533332669",
    "title": "Help",
    "author": "DanBenedit1",
    "content": "I can't see my playlist after the update...",
    "rating": 1,
    "helpful_vote_count": 3,
    "total_vote_count": 3,
    "application_version": "1.1",
    "updated": 1330129380,
    "country_code": "US"
}
```

## API

### Class

###### Class: Processor([options])

* **options** : object with following parameters

```json
{
	"store_id": "",
    "countries_code": []
}
```

###### Class: InvalidParametersError([message, parameters])

Useful when you need to verify if the returned error have an `InvalidParametersError` type.

* **message** : error message
* **parameters** : add data to the error instance

### Methods

###### Method: listAll([parameters,] callback)

Start downloading and processing all reviews.

* **parameters** : object with following parameters

```json
{
	"store_id": "",
    "countries_code": []
}
```

* **callback** : function called if an error occured or all reviews have been downloaded and processed

```javascript
ireviews.listAll(function (err, reviews) {
	if (err) return console.log(err);
    console.log(reviews);
});
```

###### Method: parse([callback])

Start downloading and processing all reviews and emit following events.

* **callback** : function called if an error occured or not

```javascript
ireviews.parse();

ireviews.parse(function (err) {
	if (err) console.log(err);
});
```

### Events

###### Event: error

Emitted if an error occured.

```javascript
ireviews.on("error", function (err) {
	console.log(err);
});
```

###### Event: end

Emitted when all reviews have been downloaded and processed.

```javascript
ireviews.on("end", function (reviews) {
	console.log(reviews);
});
```

###### Event: review

Emitted on every review processed.

```javascript
ireviews.on("review", function (review) {
	console.log(review);
});
```