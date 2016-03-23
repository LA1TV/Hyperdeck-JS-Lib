var ResponseHandler = require('../../src/hyperdeck/response-handler');

var SUCCESS_RESPONSE = "200 Success with data:\r\nsomething: 123\r\nsomething else: test\r\n\r\n";
var SUCCESS_RESPONSE_EVENT_PAYLOAD = {
  success: true,
  data: {
    code: 200,
    text: "Success with data",
    params: {
      something: "123",
      "something else": "test"
    }
  }
};

var FAILURE_RESPONSE = "102 Failure:\r\nsomething: 123\r\nsomething else: test\r\n\r\n";
var FAILURE_RESPONSE_EVENT_PAYLOAD = {
  success: false,
  data: {
    code: 102,
    text: "Failure",
    params: {
      something: "123",
      "something else": "test"
    }
  }
};

var ASYNC_RESPONSE = "512 Async event:\r\nprotocol version: 9.5\r\nmodel: xyz\r\ntime: 12:40:12\r\n\r\n";
var ASYNC_RESPONSE_EVENT_PAYLOAD = {
  code: 512,
  text: "Async event",
  params: {
    "protocol version": "9.5",
    model: "xyz",
    time: "12:40:12"
  }
};

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
    responseHandler.should.be.ok;
  });

  it('emits a valid synchronous response event when receives a success response', function(done) {
    responseHandler.getNotifier().once("synchronousResponse", function(response) {
      response.should.eql(SUCCESS_RESPONSE_EVENT_PAYLOAD);
      done();
    });
    socket.write(SUCCESS_RESPONSE);
  });

  it('emits a valid synchronous response event when receives a failure response', function(done) {
    responseHandler.getNotifier().once("synchronousResponse", function(response) {
      response.should.eql(FAILURE_RESPONSE_EVENT_PAYLOAD);
      done();
    });
    socket.write(FAILURE_RESPONSE);
  });

  it('emits a valid asynchronous response event when receives an aync response', function(done) {
    responseHandler.getNotifier().once("asynchronousResponse", function(response) {
      response.should.eql(ASYNC_RESPONSE_EVENT_PAYLOAD);
      done();
    });
    socket.write(ASYNC_RESPONSE);
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
  if (evt === "data") {
    this._dataListeners.push(listener);
  }
  else {
    throw new Error("MockSocket doesn't support this!");
  }
};