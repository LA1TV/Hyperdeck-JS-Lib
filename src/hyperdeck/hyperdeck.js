var util = require('util');
var HyperdeckCore = require('./hyperdeck-core.js');

var Hyperdeck = function(config) {

  // call constructor of HyperdeckCore
  HyperdeckCore.call(this, config);

  this.makeRequest('notify: remote: true');
  this.makeRequest('notify: transport: true');
  this.makeRequest('notify: slot: true');
  this.makeRequest('notify: configuration: true');

  // add Easy Access commands
  this.play = function(speed) {
    var commandString;
    if (Math.abs(speed) <= 1600) {
      commandString = 'play: speed: ' + speed;
    } else {
      if (speed) {
        throw new Error('Speed value invalid or out of range');
      } else {
        commandString = 'play';
      }
    }
    return this.makeRequest(commandString);
  };

  this.stop = function() {
    return this.makeRequest('stop');
  };

  this.record = function() {
    return this.makeRequest('record');
  };

  this.goTo = function(timecode) {
    return this.makeRequest('goto: timecode: ' + timecode);
  };

  this.slotInfo = function (id) {
    if (id === 0 || id === 1 || id === 2){ //TO DO find if it's 0-1 or 1-2
      return this.makeRequest('slot info: slot id: ' + id);
    } else{
      if (!id){
        return this.makeRequest('slot info');
      }
      throw new Error('Slot ID Value out of range');
    }
  };

  this.transportInfo = function(){
    return this.makeRequest('transport info');
  };

  this.clipsGet = function(){
    return this.makeRequest('clips get');
  };

  this.slotSelect = function(id){
    return this.makeRequest('slot select: slot id: ' + id);
  };

  this.format = function(format){
    return this.makeRequest('format: prepare: ' + format).then((response)=>{
      if (response.code !== 216 || response.text !== 'format ready' || !response.rawData) {
        throw new Error('Unexpected response.');
      }
      var token = response.rawData;
      return this.makeRequest('format: confirm: ' + token);
    });
  };
};

// make this class extend HyperdeckCore
// https://nodejs.org/docs/latest/api/util.html#util_util_inherits_constructor_superconstructor
util.inherits(Hyperdeck, HyperdeckCore);

module.exports = Hyperdeck;
