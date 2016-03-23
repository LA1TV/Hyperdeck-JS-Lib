[![Build Status](https://travis-ci.org/LA1TV/Hyperdeck-JS-Lib.svg?branch=master)](https://travis-ci.org/LA1TV/Hyperdeck-JS-Lib)
[![npm version](https://badge.fury.io/js/hyperdeck-js-lib.svg)](https://badge.fury.io/js/hyperdeck-js-lib)

Hyperdeck-JS-Lib
----------------
A javascript library for communication with the Blackmagic Hyperdeck.

# Installing
`npm install --save hyperdeck-js-lib`

# Using The Library
The `makeRequest()` function returns a promise which will resolve with the response from the hyperdeck if it is a succcesful response. Otherwise it will reject. If the connection was lost the response object will be `null` otherwise it will be the error response from the hyperdeck.

The response is an object with the following properties:
- `code`: The nuemeric response code.
- `text`: The response text.

It may contain another key `params` which will be an object where the keys are the parameter keys in the response, and the values are the corresponding values in the response. If the response from the hyperdeck doesn't support parameters this key won't exist.

```javascript
var HyperdeckLib = require("hyperdeck-js-lib");

var hyperdeck = new HyperdeckLib.Hyperdeck("192.168.1.12");
hyperdeck.makeRequest("device info").then(function(response) {
  console.log("Got response with code "+response.code+".");
  console.log("Hyperdeck unique id: "+response.data["unique id"]);
}).catch(function(errResponse) {
  if (!errResponse) {
    console.error("The request failed because the hyperdeck connection was lost.");
  }
  else {
    console.error("The hyperdeck returned an error with status code "+errResponse.code+".");
  }
});

hyperdeck.getNotifier().on("asynchronousEvent", function(response) {
  console.log("Got an asynchronous event with code "+response.code+".");
});
```

# API Documentation
The hyperdeck API documentation can be found at "https://www.blackmagicdesign.com/uk/manuals/HyperDeck/HyperDeck_Manual.pdf".
