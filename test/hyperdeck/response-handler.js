var ResponseHandler = require('../../src/hyperdeck/response-handler');

var SUCCESS_RESPONSE = '201 Success with data:\r\nsomething: 123\r\nsomething else: test\r\n\r\n';
var SUCCESS_RESPONSE_EVENT_PAYLOAD = {
  success: true,
  data: {
    code: 201,
    text: 'Success with data',
    rawData: 'something: 123\r\nsomething else: test',
    params: {
      something: '123',
      'something else': 'test'
    }
  }
};

// See format response
var SUCCESS_RESPONSE_WITH_DATA_NO_BUT_NOT_PARAMS = '201 Success with data but not params and no colon\r\nabc\r\n\r\n';
var SUCCESS_RESPONSE_WITH_DATA_NO_BUT_NOT_PARAMS_EVENT_PAYLOAD = {
  success: true,
  data: {
    code: 201,
    text: 'Success with data but not params and no colon',
    rawData: 'abc'
  }
};

var SINGLE_LINE_SUCCESS_RESPONSE = '200 ok\r\n';
var SINGLE_LINE_SUCCESS_RESPONSE_DATA = {
  success: true,
  data: {
    code: 200,
    text: 'ok'
  }
};

var ASYNC_RESPONSE = '512 Async event:\r\nprotocol version: 9.5\r\nmodel: xyz\r\ntime: 12:40:12\r\n\r\n';
var ASYNC_RESPONSE_EVENT_PAYLOAD = {
  code: 512,
  text: 'Async event',
  rawData: 'protocol version: 9.5\r\nmodel: xyz\r\ntime: 12:40:12',
  params: {
    'protocol version': '9.5',
    model: 'xyz',
    time: '12:40:12'
  }
};

var COMBINED_RESPONSE = SUCCESS_RESPONSE + SINGLE_LINE_SUCCESS_RESPONSE + ASYNC_RESPONSE;
var COMBINED_RESPONSE_EXTRA_LINES = ASYNC_RESPONSE + '\r\n' + SUCCESS_RESPONSE;

describe('ResponseHandler', function() {

  var responseHandler = null;
  var socket = null;

  // create a new response handler (and fake socket) before each test
  beforeEach(function() {
    socket = new MockSocket();
    responseHandler = new ResponseHandler(socket);
  });

  afterEach(function() {
    // TODO call destroy() on responseHandler
  });

  it('can be built', function() {
    responseHandler.should.be.ok();
  });

  it('emits a valid synchronous response event when receives a success response', function(done) {
    responseHandler.getNotifier().once('synchronousResponse', function(response) {
      response.should.eql(SUCCESS_RESPONSE_EVENT_PAYLOAD);
      done();
    });
    socket.write(SUCCESS_RESPONSE);
  });

  it('emits a valid synchronous response event when receives a success response with data which is not params', function(done) {
    responseHandler.getNotifier().once('synchronousResponse', function(response) {
      response.should.eql(SUCCESS_RESPONSE_WITH_DATA_NO_BUT_NOT_PARAMS_EVENT_PAYLOAD);
      done();
    });
    socket.write(SUCCESS_RESPONSE_WITH_DATA_NO_BUT_NOT_PARAMS);
  });

  it('emits a valid synchronous response event when receives a success response with data which is not params, after receiving an asynchronous response', function(done) {
    responseHandler.getNotifier().once('asynchronousResponse', function(response) {
      response.should.eql(ASYNC_RESPONSE_EVENT_PAYLOAD);
      responseHandler.getNotifier().once('synchronousResponse', function(response) {
        response.should.eql(SUCCESS_RESPONSE_WITH_DATA_NO_BUT_NOT_PARAMS_EVENT_PAYLOAD);
        done();
      });
    });
    socket.write(ASYNC_RESPONSE + SUCCESS_RESPONSE_WITH_DATA_NO_BUT_NOT_PARAMS);
  });

  it('emits a valid asynchronous response event when receives an aync response', function(done) {
    responseHandler.getNotifier().once('asynchronousResponse', function(response) {
      response.should.eql(ASYNC_RESPONSE_EVENT_PAYLOAD);
      done();
    });
    socket.write(ASYNC_RESPONSE);
  });
  
  it('handles multiple responses arriving at the same time', function(done) {
    responseHandler.getNotifier().once('synchronousResponse', function(response) {
      response.should.eql(SUCCESS_RESPONSE_EVENT_PAYLOAD);
      responseHandler.getNotifier().once('synchronousResponse', function(response) {
        response.should.eql(SINGLE_LINE_SUCCESS_RESPONSE_DATA);
        responseHandler.getNotifier().once('asynchronousResponse', function(response) {
          response.should.eql(ASYNC_RESPONSE_EVENT_PAYLOAD);
          done();
        });
      });
    });
    socket.write(COMBINED_RESPONSE);
  });

  // see https://github.com/LA1TV/Hyperdeck-JS-Lib/issues/44
  it('handles multiple responses arriving at the same time with extra lines inbetween', function(done) {
    responseHandler.getNotifier().once('asynchronousResponse', function(response) {
      response.should.eql(ASYNC_RESPONSE_EVENT_PAYLOAD);
      responseHandler.getNotifier().once('synchronousResponse', function(response) {
        response.should.eql(SUCCESS_RESPONSE_EVENT_PAYLOAD);
        done();
      });
    });
    socket.write(COMBINED_RESPONSE_EXTRA_LINES);
  });

  it('handles multiple responses arriving character by character', function(done) {
    responseHandler.getNotifier().once('synchronousResponse', function(response) {
      response.should.eql(SUCCESS_RESPONSE_EVENT_PAYLOAD);
      responseHandler.getNotifier().once('synchronousResponse', function(response) {
        response.should.eql(SINGLE_LINE_SUCCESS_RESPONSE_DATA);
        responseHandler.getNotifier().once('asynchronousResponse', function(response) {
          response.should.eql(ASYNC_RESPONSE_EVENT_PAYLOAD);
          done();
        });
      });
    });
    COMBINED_RESPONSE.split('').forEach(function(char) {
      socket.write(char);
    });
  });
});


// incredibly basic implementation of a socket for testing.
function MockSocket() {
  this._dataListeners = [];
}

MockSocket.prototype.write = function(data) {
  var _this = this;
  // make async
  setTimeout(function() {
    _this._dataListeners.forEach(function(listener) {
      listener(data);
    });
  }, 0);
};

MockSocket.prototype.on = function(evt, listener) {
  if (evt === 'data') {
    this._dataListeners.push(listener);
  }
  else {
    throw new Error('MockSocket doesn\'t support this!');
  }
};