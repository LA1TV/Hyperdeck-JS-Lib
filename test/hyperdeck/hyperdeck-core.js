var proxyquire =  require('proxyquire');
var events = require('events');

var responseHandlerNotifier = null;
var onSocketWrite = null;
var onConnectionCompleted = null;
var ASYNCHRONOUS_EVENT_DATA = {
  code: 512,
  text: 'Async event',
  params: {
      'protocol version': '9.5',
      model: 'xyz',
      time: '12:40:12'
  }
};
var SUCCESS_DATA = {
  code: 201,
  text: 'Success with data',
  params: {
    something: '123',
    'something else': 'test'
  }
};
var FAILURE_DATA = {
  code: 102,
  text: 'Failure',
  params: {
    something: '123',
    'something else': 'test'
  }
};

// require Hyperdeck but overriding the require('net') and require('ResponseHandler') to use our stubs
var Hyperdeck = proxyquire('../../src/hyperdeck/hyperdeck-core', {
  'net': getNetStub(),
  './response-handler': getResponseHandlerStub()
});


describe('Hyperdeck', function() {

  var hyperdeck = null;

  // create a new response handler (and fake socket) before each test
  beforeEach(function() {
    hyperdeck = new Hyperdeck('127.0.0.1');
  });

  afterEach(function() {
    // this is important to make sure nothing is still relying on the things
    // we've mocked after this.
    hyperdeck.destroy();
    responseHandlerNotifier = null;
  });

  it('can be constructed', function() {
    hyperdeck.should.be.ok();
  });

  it('throws an exception if request contains a new line', function() {
    (function() {
      hyperdeck.makeRequest('something\r');
    }).should.throw();
    (function() {
      hyperdeck.makeRequest('something\r');
    }).should.throw();
    (function() {
      hyperdeck.makeRequest('something\r\n');
    }).should.throw();
  });

  it('triggers asynchronousEvent when the responseHandler gets an async response message.', function(done) {
      hyperdeck.getNotifier().once('asynchronousEvent', function(data) {
        data.should.eql(ASYNCHRONOUS_EVENT_DATA);
        done();
      });

      // when the response handler triggers this, the Hyperdeck should retrieve it and forward
      // it on with it's emitter.
      fakeAsyncResponse();
  });

  it('resolves a request promise correctly for a succesful response to a request', function(done) {
      queueFakeSuccesfulSynchronousResponse();

      hyperdeck.makeRequest('a valid hyperdeck request').then(function(data) {
        data.should.eql(SUCCESS_DATA);
        done();
      });

  });

  it('resolves a request promise correctly for a failure response to a request', function(done) {
      queueFakeFailureSynchronousResponse();

      hyperdeck.makeRequest('a valid hyperdeck request').catch(function(data) {
        data.should.eql(FAILURE_DATA);
        done();
      });

  });

  it('resolves a request promise correctly when there are asynchronous events inbetween', function(done) {
      // true means fake an async first
      queueFakeSuccesfulSynchronousResponse(true);

      hyperdeck.makeRequest('a valid hyperdeck request').then(function(data) {
        data.should.eql(SUCCESS_DATA);
        done();
      });

      fakeAsyncResponse();
  });

  // TODO tests to handle disconnection

});

function getNetStub() {
  var netStub = {
    connect: function(opts, onSuccess) {
      var onCloseListeners = [];
      var destroyed = false;
      // async
      setTimeout(function() {
        if (destroyed) {
          return;
        }
        onSuccess();
        setTimeout(function() {
          if (destroyed) {
            return;
          }
          // fake hyperdeck connection response
          responseHandlerNotifier.emit('asynchronousResponse', {
            code: 500,
            text: 'connection info',
            params: {
              'protocol version': 'some protocol version',
              model: 'some model'
            }
          });
          // allow tests to hook code that should run when connection completes
          if (onConnectionCompleted) {
            onConnectionCompleted();
          }
        }, 0);
      }, 0);
      return {
        write: function(data) {
          if (onSocketWrite) {
            onSocketWrite(data);
          }
        },
        on: function(evt, listener) {
          if (evt === 'close') {
            onCloseListeners.push(listener);
          }
          else if (evt !== 'error')  {
            throw new Error('Not supported in mock net.');
          }
        },
        setEncoding: function() {
          //
        },
        destroy: function() {
          if (destroyed) {
            throw new Error('Already destroyed.');
          }
          destroyed = true;
          onCloseListeners.forEach(function(listener) {
            listener();
          });
        }
      };
    }
  };
  return netStub;
}

function getResponseHandlerStub() {

  function ResponseHandler() {
    if (responseHandlerNotifier) {
      throw new Error('responseHandlerNotifier should have been destroyed after each test.');
    }
    var notifier = new events.EventEmitter();
    // we can now use this event emitter to emit events from the mocked ResponseHandler
    responseHandlerNotifier = notifier;
    this.getNotifier = function() {
      return notifier;
    };
    this.destroy = function() {
      // make sure nothing tries to emit events now
      responseHandlerNotifier = null;
    };
  }
  return ResponseHandler;
}

// have the ResponseHandler behave as if it has received a succesfull synchronous response
// once the Hyperdeck has written the request onto the socket
function queueFakeSuccesfulSynchronousResponse(fakeAsync) {
  if (onSocketWrite) {
    throw new Error('onSocketWrite already set. Should be cleared after use.');
  }
  // will be called when the Hyperdeck writes to the socket.
  onSocketWrite = function(/* data */) {
    onSocketWrite = null;

    // async
    setTimeout(function() {
      if (fakeAsync) {
        // fake an async response first
        responseHandlerNotifier.emit('asynchronousResponse', ASYNCHRONOUS_EVENT_DATA);
      }
      setTimeout(function() {
        responseHandlerNotifier.emit('synchronousResponse', {
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
    throw new Error('onSocketWrite already set. Should be cleared after use.');
  }
  // will be called when the Hyperdeck writes to the socket.
  onSocketWrite = function(/* data */) {
    onSocketWrite = null;

    // async
    setTimeout(function() {
      responseHandlerNotifier.emit('synchronousResponse', {
        success: false,
        data: FAILURE_DATA
      });
    }, 0);
  };
}

function fakeAsyncResponse() {
  if (onConnectionCompleted) {
    throw new Error('onConnectionCompleted already set. Should be cleared after use.');
  }
  onConnectionCompleted = function() {
    onConnectionCompleted = null;
    responseHandlerNotifier.emit('asynchronousResponse', ASYNCHRONOUS_EVENT_DATA);
  };
}
