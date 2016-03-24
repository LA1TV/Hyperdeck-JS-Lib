var HyperdeckCore = require("./hyperdeck-core.js");
var Promise = require('promise');


var Hyperdeck = function(ip) {
  //Start by connecting to Hyperdeck via HypderdeckCore
  var Core = new HyperdeckCore(ip);


  //Publicise functions from Core
  this.getNotifier = Core.getNotifier();
  this.makeRequest = Core.makeRequest();
  this.onConnected = Core.onConnected();

  //make Easy Access commands
  this.play = function(speed) {
    var commandString;
    if (!speed) {
      commandString = "play";
    } else {
      commandString = "play speed: " + speed.toString();
    }
    return new Promise(function(fulfill, reject) {
      Core.makeRequest(commandString).then(function(response) {
        fulfill(response);
      }).catch(function(errResponse) {
        reject(errResponse.code);
      });
    });
  };
  this.stop = function() {
    return new Promise(function(fulfill, reject) {
      Core.makeRequest("stop").then(function(response) {
        fulfill(response);
      }).catch(function(errResponse) {
        reject(errResponse.code);
      });
    });
  };

  this.record = function() {
    return new Promise(function(fulfill, reject) {
      Core.makeRequest("record").then(function(response) {
        fulfill(response);
      }).catch(function(errResponse) {
        reject(errResponse.code);
      });
    });
  };

};

module.exports = Hyperdeck;
