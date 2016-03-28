[![Build Status](https://travis-ci.org/LA1TV/Hyperdeck-JS-Lib.svg?branch=master)](https://travis-ci.org/LA1TV/Hyperdeck-JS-Lib)
[![npm version](https://badge.fury.io/js/hyperdeck-js-lib.svg)](https://badge.fury.io/js/hyperdeck-js-lib)

Hyperdeck-JS-Lib
----------------
A javascript library for communication with the Blackmagic Hyperdeck.

# Installing
`npm install --save hyperdeck-js-lib`

# Using The HyperDeck Library
The functions all return a promise which will resolve with the response from the HyperDeck if it is a successful response, and otherwise will reject.

```javascript
var HyperdeckLib = require("hyperdeck-js-lib");
var hyperdeck = new HyperdeckLib.Hyperdeck("192.168.1.12");
hyperdeck.onConnected().then(function() {
	// connected to hyperdeck
	// Note: you do not have to wait for the connection before you start making requests.
	// Requests are buffered until the connection completes. If the connection fails, any
	// buffered requests will be rejected.
  hyperdeck.makeRequest("device info").then(function(response) {
    console.log("HyperDeck unique id: "+response.params["unique id"]);
  }).catch(function(errResponse) {
    console.error("The hyperdeck returned an error with status code"+errResponse.code+".");
  });
});
```

If the connection was lost the response object will be `null` otherwise it will be the error response from the HyperDeck.

The response is an object with the following properties:
- `code`: The numeric response code.
- `text`: The response text.

It may contain another key `params` which will be an object where the keys are the parameter keys in the response, and the values are the corresponding values in the response. If the response from the HyperDeck doesn't support parameters this key won't exist.

There are a number of different predefined commands which can be called upon:

```javascript
hyperdeck.play();
hyperdeck.play(35); //play at 35%
hyperdeck.stop();
hyperdeck.record();
hyperdeck.goTo("00:13:03:55"); //goes to timecode in format hh:mm:ss:ff
hyperdeck.slotSelect(2);
hyperdeck.slotInfo(); //Gives info on currently selected slot
hyperdeck.slotInfo(1);
hyperdeck.clipsGet();
hyperdeck.transportInfo();
```


# API Documentation
The hyperdeck API documentation can be found at "https://www.blackmagicdesign.com/uk/manuals/HyperDeck/HyperDeck_Manual.pdf".
