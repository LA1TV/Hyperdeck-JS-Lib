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
  var buffer = [];

  function isRespComplete() {
    let complete = false;

    if (buffer.length === 1) {
      // a single line response
      // single line response first line should never ends with ":" and
      // 1XX and 200 is always single line response
      complete = buffer[0].search(/^1\d\d\s|200\sok$/) === 0 && buffer[0].endsWith(':') === false;
    } else if (buffer.length >= 3) {
      // multi line response, so waiting for a blank line to signify end
      complete = buffer[buffer.length - 1] === '';
    }

    return complete;
  }

  function onData(rawData) {
    logger.debug('Got data on socket.\n', rawData);

    const resArray = rawData.split('\r\n');
    // every response(even one line) must always end with \r\n, if not its not a valid response
    if (resArray.length === 0 || resArray[resArray.length - 1] != '') {
      throw "Unknown response type.";
    }

    resArray.pop();
    resArray.forEach(function (line) {
      // push to buffer till response is read completly
      if (buffer.length > 0 || (buffer.length === 0 && line)) {
        buffer.push(line);
      }

      if (isRespComplete()) {
        // remove the command seperator or extra last line
        if (buffer[buffer.length - 1] === '') {
          buffer.pop();
        }

        logger.debug('Got complete data.\n', buffer.join('\r\n'));

        var data = Parser.parse(buffer);
        // reset buffer
        buffer = [];

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
    });
  }

  clientSocket.on('data', onData);

  this.getNotifier = function () {
    return notifier;
  };

  this.destroy = function () {
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
