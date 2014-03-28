# iReviews

iTunes store customer reviews fetcher.

## Dependencies

* [async](https://www.npmjs.org/package/async) : Higher-order functions and common patterns for asynchronous code.
* [request](https://www.npmjs.org/package/request) : Simplified HTTP request client.
* [moment](https://www.npmjs.org/package/moment) : Parse, manipulate, and display dates.
* [jsonschema](https://www.npmjs.org/package/jsonschema) : A fast and easy to use JSON schema validator.
* [debug](https://www.npmjs.org/package/debug) : Small debugging utility.
* [xml2js](https://www.npmjs.org/package/xml2js) : Simple XML to JavaScript object converter.

## Features

* Automatic validation of all parameters.
* Asynchronous reviews download.
* Parse XML to JSON.
* Return an enhance version of the structure (array of reviews).

## How To

### Install

```
$ npm install [--save] ireviews
```

### Use

###### ADD MODULE

```javascript
var iReviews = require("ireviews");
```

###### CREATE A JSON WITH ALL REQUIRED PARAMETERS

```javascript
var parameters = {
	store_id: "APPLICATION_ITUNES_STORE_ID",
    country_code: "ALPHA_2_ISO_COUNTRY_CODE"
};
```

###### CALL `downloadAllReviewsForApplicationInCountry` METHOD

```javascript
iReviews.downloadAllReviewsForApplicationInCountry(
	parameters,
    function (err, reviews) {
    	if (err) return console.log(err);
        if (reviews.length === 0) return console.log("no reviews found!");
        
        console.log(reviews);
    }
);
```

The array that contains all reviews will have this structure :

```json
[
	{
    	"id": "527729133",
        "title": "Love this app",
        "author": "Michael Maher",
        "content": "Just downloaded this app tonight, the best 2.99 app that I purchased in a long time. The display, sound, quality and the cd library is killer.",
        "rating": 5,
        "application_version": "1.0",
        "updated": 1329186360
    }
]
```

**IMPORTANT :**

* You can have an `INVALID_PARAMETERS_ERROR` when there is an issue with the parameters JSON.

## License

The MIT License (MIT)

Copyright (c) 2014 [Linitix](http://www.linitix.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Changes Log

###### 1.0.0

* module creation.