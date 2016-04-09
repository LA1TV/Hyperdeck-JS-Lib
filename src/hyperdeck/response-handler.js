var events = require('events');
var Parser = require('./parser');
var Logger = require("../logger");

var logger = Logger.get("hyperdeck.ResponseHandler");

/**
 * Handles responses from they hyperdeck.
 */
function ResponseHandler(clientSocket) {
  var destroyed = false;
  var notifier = new events.EventEmitter();
  var buffer = "";
  
  function isBufferComplete() {
    var lines = buffer.split("\r\n");
    // there will always be an empty element at the end as every line will always end in "\r\n"
    // so remove it.
    // i.e. "1\r\n2\r\n" => ["1", "2", ""]
    lines.pop();
    if (lines.length === 1) {
      // is it a single line response?
      return lines[0].indexOf(":") !== lines[0].length-1;
    } 
    // multi line response so waiting for a blank line to signify end
    return lines[lines.length-1] === "";
  }
  
  function onData(rawData) {
    buffer += rawData;
    if (!isBufferComplete()) {
      return;
    }
    logger.debug('Got data on socket.', rawData);
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
    logger.debug('Destroying...');
    destroyed = true;
    clientSocket.removeListener('data', onData);
  };
}

module.exports = ResponseHandler;
