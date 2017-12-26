var events = require('events');
var Parser = require('./parser');
var Logger = require('../logger');

var logger = Logger.get('hyperdeck.ResponseHandler');

var SINGLE_LINE_REGEX = /^(?:1\d{2}|200) /;

/**
 * Handles responses from they hyperdeck.
 */
function ResponseHandler(clientSocket) {
  var destroyed = false;
  var notifier = new events.EventEmitter();
  var buffer = [];
  var incompleteLastLine = '';

  function isRespComplete() {
    var complete = false;
    if (buffer.length === 1) {
      // a single line response
      // 1XX and 200 is always single line response
      complete = SINGLE_LINE_REGEX.test(buffer[0]);
    } else {
      // multi line response, so waiting for a blank line to signify end
      complete = buffer[buffer.length - 1] === '';
    }
    return complete;
  }

  function onData(rawData) {
    logger.debug('Got data on socket.\n', rawData);
    var resArray = (incompleteLastLine + rawData).split('\r\n');
    incompleteLastLine = resArray.pop();
    resArray.forEach(function (line) {
      // push to buffer till response is read completly
      // handle empty lines before the data
      // see https://github.com/LA1TV/Hyperdeck-JS-Lib/issues/44
      if (buffer.length > 0 || (buffer.length === 0 && line.trim() !== '')) {
        buffer.push(line);
        if (isRespComplete()) {
          if (buffer.length > 1) {
            // multiline response, remove empty line
            buffer.pop();
          }

          logger.debug('Got complete data.\n', buffer.join('\n'));
          // reset buffer here and use clone (in case exception happens below)
          var bufferClone = buffer.splice(0);
          try {
            var data = Parser.parse(bufferClone);
            switch (data.type) {
              case 'synchronousFailure':
              case 'synchronousSuccess':
                var response = {
                  success: data.type === 'synchronousSuccess',
                  data: data.data
                };
                notifier.emit('synchronousResponse', response);
                break;
              case 'asynchronous':
                notifier.emit('asynchronousResponse', data.data);
                break;
              default:
                throw new Error('Unknown response type.');
            }
          } catch(e) {
            // defer exception so that we don't stop processing response
            setTimeout(function() {
              throw e;
            }, 0);
          }
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
}

module.exports = ResponseHandler;