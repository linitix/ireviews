# iReviews

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/linitix/ireviews?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![NPM version](https://badge.fury.io/js/ireviews.svg)](http://badge.fury.io/js/ireviews) [![Build Status](https://travis-ci.org/linitix/ireviews.svg?branch=master)](https://travis-ci.org/linitix/ireviews) [![Dependency Status](https://david-dm.org/linitix/ireviews.svg)](https://david-dm.org/linitix/ireviews)

iTunes store customer reviews fetcher.

## Dependencies

* [async](https://www.npmjs.org/package/async) : Higher-order functions and common patterns for asynchronous code.
* [request](https://www.npmjs.org/package/request) : Simplified HTTP request client.
* [moment](https://www.npmjs.org/package/moment) : Parse, manipulate, and display dates.
* [jsonschema](https://www.npmjs.org/package/jsonschema) : A fast and easy to use JSON schema validator.
* [debug](https://www.npmjs.org/package/debug) : Small debugging utility.
* [xml2js](https://www.npmjs.org/package/xml2js) : Simple XML to JavaScript object converter.
* [temporal](https://www.npmjs.org/package/temporal) : Non-blocking, temporal task sequencing.

## Features

* Use of events.
* Automatic validation of all parameters.
* Asynchronous reviews download.
* Parse XML to JSON.
* Choose a delay before each request.
* Choose between XML or JSON for the response format (there is an update date for all reviews in XML format).
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
	countries_code: [ "ALPHA_2_ISO_COUNTRY_CODE" ],
	delay: 100, // millisecond
	format: "json" // JSON format by default
};

var ireviews = new iReviews.Processor(parameters);

ireviews.storeId = "APPLICATION_ITUNES_STORE_ID";
ireviews.countriesCode = [ "ALPHA_2_ISO_COUNTRY_CODE" ];
ireviews.delay = 100;
ireviews.format = "xml";

// ============= WITHOUT EVENTS

ireviews.listAll(
	parameters, // not needed if already set before calling this method
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
    	"count": 1,
        "countryCode": "US",
        "items": [
            {
                "id": "533332669",
                "title": "Help",
                "author": "DanBenedit1",
                "content": "I can't see my playlist after the update...",
                "rating": 1,
                "helpful_vote_count": 3,
                "total_vote_count": 3,
                "application_version": "1.1",
                "updated": 1330129380, // Only with response in XML format
                "country_code": "US"
            }
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
    "updated": 1330129380, // Only with response in XML format
    "country_code": "US"
}
```

## Examples

I use the application [The Beatblaster](https://itunes.apple.com/us/app/the-beatblaster/id493081063?mt=8) with 7 countries as example. You can run one of these commands :

* `npm run-script ex-beatblaster-xml-stream`
* `npm run-script ex-beatblaster-delay-xml-stream`
* `npm run-script ex-beatblaster-xml`
* `npm run-script ex-beatblaster-delay-xml`
* `npm run-script ex-beatblaster-json-stream`
* `npm run-script ex-beatblaster-delay-json-stream`
* `npm run-script ex-beatblaster-json`
* `npm run-script ex-beatblaster-delay-json`

## API

### Class

###### Class: Processor([options])

* **options** : object with following parameters

```json
{
	"store_id": "",
    "countries_code": [],
    "delay": 1000,
    "format": "json"
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
