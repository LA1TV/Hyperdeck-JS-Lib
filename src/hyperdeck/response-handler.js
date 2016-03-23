var events = require('events');
var Parser = require('./parser');

/**
 * Handles responses from they hyperdeck.
 */
// TODO add a destroy method which will remove the listener.
function ResponseHandler(clientSocket) {
  var destroyed = false;
  var notifier = new events.EventEmitter();
  
  function onData(rawData) {
    var data = Parser.parse(rawData);
    switch (data.type) {
      case "synchronousFailure":
      case "synchronousSuccess":
        var response = {
          success: data.type === "synchronousSuccess",
          data: data.data
        };
        notifier.emit("synchronousResponse", response);
        break;
      case "asynchronous":
        notifier.emit("asynchronousResponse", data.data);
        break;
      default:
        throw "Unknown response type.";
    }
  }

  clientSocket.on('data', onData);

  this.getNotifier = function() {
    return notifier;
  };

  this.destroy = function() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    clientSocket.removeListener('data', onData);
  };
}

module.exports = ResponseHandler;
