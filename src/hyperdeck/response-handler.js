var events = require('events');
var Parser = require('./parser');

var notifier = new events.EventEmitter();

/**
 * Handles responses from they hyperdeck.
 */
// TODO add a destroy method which will remove the listener.
function ResponseHandler(clientSocket) {
  clientSocket.on('data', function(rawData) {
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
  });
}

ResponseHandler.prototype.getNotifier = function() {
  return notifier;
};

module.exports = ResponseHandler;
