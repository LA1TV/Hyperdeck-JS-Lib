var events = require('events');
var Parser = require('./parser');
var Logger = require("../logger");

var logger = Logger.get("hyperdeck.ResponseHandler");

var ASYNC_RESPONSE_REGEX = /^(5[0-9]{2} )/;

/**
 * Handles responses from they hyperdeck.
 */
function ResponseHandler(clientSocket) {
  var destroyed = false;
  var notifier = new events.EventEmitter();
  var buffer = "";
  var nextResponseIsMultiline = false;
  
  function isBufferComplete() {
    var lines = buffer.split("\r\n");
    // there will always be an empty element at the end as every line will always end in "\r\n"
    // so remove it.
    // i.e. "1\r\n2\r\n" => ["1", "2", ""]
    lines.pop();
    if (lines.length === 1) {
      var asyncResponse = ASYNC_RESPONSE_REGEX.exec(lines[0]);
      if (!asyncResponse) {
        if (nextResponseIsMultiline) {
          logger.debug('Assuming buffer is not complete because nextResponseIsMultiline flag is set.');
          nextResponseIsMultiline = false;
          return false;
        }
      }
      // is it a single line response?
      return lines[0].indexOf(":") !== lines[0].length-1;
    } 
    // multi line response so waiting for a blank line to signify end
    return lines[lines.length-1] === "";
  }
  
  function onData(rawData) {
    logger.debug('Got data on socket.', rawData);
    rawData.split("\r\n").forEach(function(line) {
      if (buffer === '' && line.trim() === '') {
        // handle empty lines before the data
        // see https://github.com/LA1TV/Hyperdeck-JS-Lib/issues/44
        return;
      }
      buffer += (line + "\r\n");
      if (!isBufferComplete()) {
        return;
      }
      logger.debug('Got complete data.', buffer);
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
    });
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

  // Call this if you know that the next synchronous response will be multiline
  // This is to handle cases like the format command where the response is not of params structure,
  // and the first line doesn't end in ':', which means by default we would assume it is single line.
  this.nextResponseIsMultiline = function() {
    nextResponseIsMultiline = true;
  };
}

module.exports = ResponseHandler;
