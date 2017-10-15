[![NPM](https://nodei.co/npm-dl/hyperdeck-js-lib.png?months=1)](https://nodei.co/npm/hyperdeck-js-lib/)

[![Build Status](https://travis-ci.org/LA1TV/Hyperdeck-JS-Lib.svg?branch=master)](https://travis-ci.org/LA1TV/Hyperdeck-JS-Lib)
[![npm version](https://badge.fury.io/js/hyperdeck-js-lib.svg)](https://badge.fury.io/js/hyperdeck-js-lib)
[![Greenkeeper badge](https://badges.greenkeeper.io/LA1TV/Hyperdeck-JS-Lib.svg)](https://greenkeeper.io/)

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

If the response from the hyperdeck also contains data the following keys will also exist:
- `rawData`: A string which contains the unparsed data.
- `params`: An object where the keys are the parameter keys in the response, and the values are the corresponding values in the response. This is best-effort, and if the response is not structured in the params format shown in the documentation, may be an empty object. It will try to parse each line in the response individually.

```javascript
var HyperdeckLib = require("hyperdeck-js-lib");

var hyperdeck = new HyperdeckLib.Hyperdeck("192.168.1.12");
hyperdeck.onConnected().then(function() {
	// connected to hyperdeck
	// Note: you do not have to wait for the connection before you start making requests.
	// Requests are buffered until the connection completes. If the connection fails, any
	// buffered requests will be rejected.
	hyperdeck.makeRequest("device info").then(function(response) {
	  console.log("Got response with code "+response.code+".");
	  console.log("Hyperdeck unique id: "+response.params["unique id"]);
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

	hyperdeck.getNotifier().on("connectionLost", function() {
	  console.error("Connection lost.");
	});
}).catch(function() {
	console.error("Failed to connect to hyperdeck.");
});
```

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
hyperdeck.format(format);
```

# API Documentation
The hyperdeck API documentation can be found at "https://www.blackmagicdesign.com/uk/manuals/HyperDeck/HyperDeck_Manual.pdf".

# Debugging
You can enable logging:

```javascript
var HyperdeckLib = require("hyperdeck-js-lib");
var Logger = HyperdeckLib.Logger;
Logger.setLevel(Logger.DEBUG);
Logger.setLevel(Logger.INFO);
Logger.setLevel(Logger.WARN);
Logger.setLevel(Logger.ERROR);
Logger.setLevel(Logger.OFF);
```