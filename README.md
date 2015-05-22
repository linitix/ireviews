# iReviews

[![NPM version](https://img.shields.io/npm/v/ireviews.svg?style=flat-square)](http://badge.fury.io/js/ireviews)
[![Dependency Status](https://img.shields.io/david/linitix/ireviews.svg?style=flat-square)](https://david-dm.org/linitix/ireviews)
[![License](https://img.shields.io/npm/l/ireviews.svg?style=flat-square)]()
[![NPM Downloads](https://img.shields.io/npm/dm/ireviews.svg?style=flat-square)]()
[![Code Climate](https://img.shields.io/codeclimate/github/linitix/ireviews.svg?style=flat-square)](https://codeclimate.com/github/linitix/ireviews)

iTunes store customer reviews fetcher.

## Known issue

It will happen that the number of reviews by country is different and it comes from Apple. Sometimes the request is OK (HTTP 200) with the first page of reviews but after an hour or a day the same request will return OK without reviews.

## Features

* Use of events.
* Automatic validation of all parameters.
* Asynchronous reviews download.
* Parse XML to JSON.
* Choose a delay before each request.
* Choose between XML or JSON for the response format (there is an update date for all reviews in XML format).
* Return an enhance version of the structure (array of reviews).

## Changes log

See [changes log](CHANGES_LOG).

## Contributors

See [contributors](https://github.com/linitix/ireviews/graphs/contributors).

## License

See [license](LICENSE).

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

I use the application [MOVIST - Your Personal Movie List](https://itunes.apple.com/us/app/movist-your-personal-movie/id840784742?mt=8) with 7 countries as example. You can run one of these commands :

* `npm run-script movist-xml-stream`
* `npm run-script movist-delay-xml-stream`
* `npm run-script movist-xml`
* `npm run-script movist-delay-xml`
* `npm run-script movist-json-stream`
* `npm run-script movist-delay-json-stream`
* `npm run-script movist-json`
* `npm run-script movist-delay-json`

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
