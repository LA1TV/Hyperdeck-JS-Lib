var events = require('events');
var Parser = require('./parser');

/**
 * Handles responses from they hyperdeck.
 */
function ResponseHandler(clientSocket) {
  var destroyed = false;
  var notifier = new events.EventEmitter();
  var buffer = "";
  
  // we have received a complete message when the first line does not end in ":",
  // or the last line is empty
  function isBufferComplete() {
    var lines = buffer.split("\r\n");
    if (lines.length === 1) {
      // is it a single line response?
      return lines[0].indexOf(":") !== lines[0].length-1;
    }
    // multi line response so waiting for a blank line to signify end
    return lines[lines.length-1] === "";
  }
  
  function onData(rawData) {
    buffer += rawData.toString();
    if (!isBufferComplete()) {
      return;
    }
    var data = Parser.parse(buffer);
    // reset buffer
    buffer = "";
  
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
