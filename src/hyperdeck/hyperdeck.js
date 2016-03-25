var HyperdeckCore = require("./hyperdeck-core.js");


var Hyperdeck = function(ip) {
  //Start by connecting to Hyperdeck via HypderdeckCore
  var Core = new HyperdeckCore(ip);
  Core.makeRequest("notify: remote: true");
  Core.makeRequest("notify: transport: true");
  Core.makeRequest("notify: slot: true");
  Core.makeRequest("notify: configuration: true");




  //Publicise functions from Core
  this.getNotifier = Core.getNotifier();
  this.makeRequest = Core.makeRequest();
  this.onConnected = Core.onConnected();

  //make Easy Access commands
  this.play = function(speed) {
    var commandString;
    if (Math.abs(speed) <= 1600) {
      commandString = "play speed: " + speed;
    } else {
      if (speed) {
        throw "Speed out of range";
      } else {
        commandString = "play";
      }
    }
    return Core.makeRequest(commandString);
  };


  this.stop = function() {
    return Core.makeRequest("stop");
  };

  this.record = function() {
    return Core.makeRequest("record");
  };

  this.goTo = function(timecode) {
    return Core.makeRequest("goto: timecode: " + timecode);
  };


};

module.exports = Hyperdeck;
