var proxyquire =  require('proxyquire');
var events = require('events');

var responseHandlerNotifier = new events.EventEmitter();
var onSocketWrite = null;
var ASYNCHRONOUS_EVENT_DATA = {
  code: 512,
  text: "Async event",
  params: {
      "protocol version": "9.5",
      model: "xyz",
      time: "12:40:12"
  }
};
var SUCCESS_DATA = {
  code: 200,
  text: "Success with data",
  params: {
    something: "123",
    "something else": "test"
  }
};
var FAILURE_DATA = {
  code: 102,
  text: "Failure",
  params: {
    something: "123",
    "something else": "test"
  }
};

// require Hyperdeck but overriding the require("net") and require("ResponseHandler") to use our stubs
var Hyperdeck = proxyquire('../../src/hyperdeck/hyperdeck', {
  'net': getNetStub(),
  './response-handler.js': getResponseHandlerStub()
});


describe('Hyperdeck', function() {
  
  var hyperdeck = null;

  // create a new response handler (and fake socket) before each test
  beforeEach(function() {
    hyperdeck = new Hyperdeck("127.0.0.1");
  });

  afterEach(function() {
    // TODO call destroy() on hyperdeck
  });

  it('can be constructed', function() {
      hyperdeck.should.be.ok;
  });

  it('triggers asynchronousEvent when the responseHandler gets an async response message.', function(done) {
      hyperdeck.getNotifier().once("asynchronousEvent", function(data) {
        data.should.eql(ASYNCHRONOUS_EVENT_DATA);
        done();
      });

      // when the response handler triggers this, the Hyperdeck should retrieve it and forward
      // it on with it's emitter.
      fakeAsyncResponse();
  });

  it('resolves a request promise correctly for a succesful response to a request', function(done) {
      queueFakeSuccesfulSynchronousResponse();

      hyperdeck.makeRequest("a valid hyperdeck request").then(function(data) {
        data.should.eql(SUCCESS_DATA);
        done();
      });

  });

  it('resolves a request promise correctly for a failure response to a request', function(done) {
      queueFakeFailureSynchronousResponse();

      hyperdeck.makeRequest("a valid hyperdeck request").catch(function(data) {
        data.should.eql(FAILURE_DATA);
        done();
      });

  });

  it('resolves a request promise correctly when there are asynchronous events inbetween', function(done) {
      // true means fake an async first
      queueFakeSuccesfulSynchronousResponse(true);

      hyperdeck.makeRequest("a valid hyperdeck request").then(function(data) {
        data.should.eql(SUCCESS_DATA);
        done();
      });

      fakeAsyncResponse();
  });

  // TODO tests to handle disconnection

});

function getNetStub() {
  function SocketMock() {}
  SocketMock.prototype.connect = function(opts, onSuccess) {
    // async
    setTimeout(function() {
      onSuccess();
    }, 0);
  };
  SocketMock.prototype.write = function(data) {
    if (onSocketWrite) {
      onSocketWrite(data);
    }
  };

  var netStub = {
    Socket: SocketMock
  };
  return netStub;
}

function getResponseHandlerStub() {

  function ResponseHandler() {}
  // we can now use this event emitter to emit events from the mocked ResponseHandler
  ResponseHandler.prototype.getNotifier = function() {
    return responseHandlerNotifier;
  };
  return ResponseHandler;
}

// have the ResponseHandler behave as if it has received a succesfull synchronous response
// once the Hyperdeck has written the request onto the socket
function queueFakeSuccesfulSynchronousResponse(fakeAsync) {
  if (onSocketWrite) {
    throw new Error("onSocketWrite already set. Should be cleared after use.");
  }

  // will be called when the Hyperdeck writes to the socket.
  onSocketWrite = function(data) {
    onSocketWrite = null;

    // async
    setTimeout(function() {
      if (fakeAsync) {
        // fake an async response first
        fakeAsyncResponse();
      }
      setTimeout(function() {
        responseHandlerNotifier.emit("synchronousResponse", {
          success: true,
          data: SUCCESS_DATA
        });
      }, 0);
    }, 0);
  };
}

// have the ResponseHandler behave as if it has received a failure synchronous response
// once the Hyperdeck has written the request onto the socket
function queueFakeFailureSynchronousResponse() {
  if (onSocketWrite) {
    throw new Error("onSocketWrite already set. Should be cleared after use.");
  }

  // will be called when the Hyperdeck writes to the socket.
  onSocketWrite = function(data) {
    onSocketWrite = null;

    // async
    setTimeout(function() {
      responseHandlerNotifier.emit("synchronousResponse", {
        success: false,
        data: FAILURE_DATA
      });
    }, 0);
  };
}

function fakeAsyncResponse() {
  responseHandlerNotifier.emit("asynchronousResponse", ASYNCHRONOUS_EVENT_DATA);
}