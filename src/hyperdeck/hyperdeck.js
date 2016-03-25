var HyperdeckCore = require("./hyperdeck-core.js");


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
    if (speed<=1600 || speed >= -1600) {
      commandString = "play";
    } else {
      commandString = "play speed: " + speed;
    }
    return Core.makeRequest(commandString);
  };


  this.stop = function() {
    return Core.makeRequest("stop");
  };

  this.record = function() {
      return Core.makeRequest("record");
  };
  
  this.goTo = function(timecode){
    return Core.makeRequest("goto: timecode: "+timecode);
  };


};

module.exports = Hyperdeck;
