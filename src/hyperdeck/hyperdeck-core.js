/*jshint latedef: false */
var ResponseHandler = require('./response-handler');
var Promise = require('promise');
var net = require('net');
var events = require('events');
var Logger = require('../logger');

var logger = Logger.get('hyperdeck.HyperdeckCore');

/**
 * Represents a Hyperdeck.
 * Allows you to make requests to the hyperdeck and get its parsed responses.
 * This chains the requests so only one is sent at a time.
 * You can also listen for asynchronous events sent from the hyperdeck.
 * @param config hyperdeck configuration
 *               config = 'ip address string[string]'
 *               or
 *               config = {
 *                 ip: 'ip address string[string]',
 *                 [ pingInterval: ping interval in miliseconds[int][default = 10000] ]
 *               }
 **/
function HyperdeckCore(config) {

  /**
   * validate configuration
   * 
   * @param {*} config 
   */
  function isConfigValid(config) {
    return (
      config !== undefined &&
      config !== null &&
      (typeof config === 'string' || !!config.ip)
    );
  }

  // check for valid configuration
  if (!isConfigValid(config)) {
    throw new Error('Invalid Configuration, please refer to documentations.');
  }

  var self = this;

  if (typeof config === 'string') {
    config = { ip: config };
  }
  config = Object.assign({ pingInterval: 10000 }, config);

  function onConnectionStateChange(state) {
    if (!state.connected) {
      publicNotifier.emit('connectionLost');
    }
  }

  function handleConnectionResponse() {
    function removeListeners() {
      responseHandler.getNotifier().removeListener('asynchronousResponse', handler);
      responseHandler.getNotifier().removeListener('connectionStateChange', handleConnectionLoss);
    }

    function handler(response) {
      if (response.code === 500 && response.text === 'connection info') {
        removeListeners();
        connected = true;
        connecting = false;
        registerAsyncResponseListener();
        notifier.emit('connectionStateChange', {connected: true});
        if (config.pingInterval > 0) {
          pingTimerId = setInterval(ping, config.pingInterval);
        }
        // a request might have been queued whilst the connection
        // was being made
        performNextRequest();
      }
      else if (response.code === 120 && response.text === 'connection rejected') {
        removeListeners();
        // close the socket, which should then result in onConnectionLost() being called
        client.destroy();
      }
      else {
        throw new Error('Was expecting an async response stating whether the connection was succesful.');
      }
    }

    function handleConnectionLoss(state) {
      if (state.connected) {
        throw new Error('Invalid connection state.');
      }
      removeListeners();
    }
    responseHandler.getNotifier().on('asynchronousResponse', handler);
    responseHandler.getNotifier().on('connectionStateChange', handleConnectionLoss);
  }

  function registerAsyncResponseListener() {
    responseHandler.getNotifier().on('asynchronousResponse', function(data) {
      // the developer will listen on the notifier for asynchronous events
      // fired from the hyperdeck
      publicNotifier.emit('asynchronousEvent', data);
    });
  }

  // or the connection fails to be made
  function onConnectionLost() {
    if (!socketConnected && !connecting) {
      throw 'Must be connected (or connecting) in order to loose the connection!';
    }
    connecting = false;
    connected = false;
    socketConnected = false;
    if (pingTimerId !== null) {
      clearTimeout(pingTimerId);
      pingTimerId = null;
    }
    notifier.emit('connectionStateChange', {connected: false});
    performNextRequest();
  }

  function isValidRequest(request) {
    // requests must not contain new lines
    return request.indexOf('\r') === -1 && request.indexOf('\n') === -1;
  }

  // write to the socket
  function write(data) {
    logger.debug('Writing to socket.', data);
    client.write(data);
  }

  function ping() {
    self.makeRequest('ping');
  }

  /**
   * Checks the chain isn't empty or that the request is in progress.
   * Then takes from the bottom of the chain and do the request.
   * Once the request has finished do more things.
   * Performs the next request based of the chain, runs until the chain is empty.
   **/
  function performNextRequest() {
    if (connecting || pendingRequests.length === 0 || requestInProgress) {
      // connection in progress or
      // there's nothing left in the chain or there's a request in progress.
      return;
    }

    requestInProgress = true;
    var request = pendingRequests.shift();
    var requestCompletionPromise = requestCompletionPromises.shift();
    var listenersRegistered = false;

    function onRequestCompleted() {
      requestInProgress = false;
      performNextRequest();
    }

    function registerListeners() {
      listenersRegistered = true;
      responseHandler.getNotifier().on('synchronousResponse', handleResponse);
      notifier.on('connectionStateChange', handleConnectionLoss);
    }

    function removeListeners() {
      if (listenersRegistered) {
        responseHandler.getNotifier().removeListener('synchronousResponse', handleResponse);
        notifier.removeListener('connectionStateChange', handleConnectionLoss);
      }
    }

    function handleResponse(response) {
      logger.debug('Got response. Resolving provided promise with response.');
      removeListeners();
      if (response.success) {
        // response has a success status code
        requestCompletionPromise.resolve(response.data);
      }
      else {
        // response has a failure status code
        requestCompletionPromise.reject(response.data);
      }
      onRequestCompleted();
    }

    function handleConnectionLoss(state) {
      if (state.connected) {
        throw new Error('Invalid connection state.');
      }
      onConnectionLost();
    }

    function onConnectionLost() {
      logger.debug('Connection lost. Rejecting provided promise to signify failure.');
      removeListeners();
      // null to signify connection loss
      requestCompletionPromise.reject(null);
      onRequestCompleted();
    }

    if (!connected) {
      // connection has been lost
      // don't even attempt the request
      logger.debug('Not attempting request because connection lost.');
      onConnectionLost();
    }
    else {
      registerListeners();
      // make the request
      // either the 'synchronousResponse' or 'connectionLost' event should be
      // fired at some point in the future.
      logger.info('Making request.', request);
      write(request+'\n');
    }
  }

  var destroyed = false;
  var publicNotifier = new events.EventEmitter();
  var notifier = new events.EventEmitter();

  var pendingRequests = [];
  var requestCompletionPromises = [];
  var requestInProgress = false;

  var connecting = true;
  var socketConnected = false;
  // hyperdeck connection completed
  var connected = false;
  var pingTimerId = null;
  notifier.on('connectionStateChange', onConnectionStateChange);

  var client = net.connect({
    host: config.ip,
    port: 9993
  }, function() {
    logger.info('Socket connected.');
    socketConnected = true;
    // wait for the hyperdeck to confirm it's ready and connected.
    handleConnectionResponse();
  });
  client.setEncoding('utf8');

  client.on('error', function (e) {
    logger.warn('Socket error.', e);
  });
  // when the connection closes handle this
  // this should also happen if the connection fails at some point
  client.on('close', onConnectionLost);
  var responseHandler = new ResponseHandler(client);

  /**
   * Make a request to the hyperdeck.
   * - If the hyperdeck returns a success response the promise will be resolved
   *   with the payload.
   * - If the hyperdeck returns a failure response the promise will be rejected
   *   with the payload.
   * - If the hyperdeck looses connection or is not connected the promise will be
   *   rejected and the payload will be `null`.
   * @return The promise which will resolve/reject when a response has been received
   *         (or connection lost).
   */
  this.makeRequest = function(requestToProcess) {
    if (!isValidRequest(requestToProcess)) {
      throw new Error('Invalid request.');
    }

    var completionPromise = new Promise(function(resolve, reject) {
      requestCompletionPromises.push({
        resolve: resolve,
        reject: reject
      });
    });

    pendingRequests.push(requestToProcess);
    logger.info('Queueing request.', requestToProcess);
    performNextRequest();
    return completionPromise;
  };

  /**
   * Returns a promise that resolves when they hyperdeck is connected,
   * or rejected if the connection fails.
   */
  this.onConnected = function() {
    return new Promise(function(resolve, reject) {
      if (connected) {
        resolve();
      }
      else if (!connecting) {
        reject();
      }
      else {
        notifier.once('connectionStateChange', function(state) {
          if (state.connected) {
            resolve();
          }
          else {
            reject();
          }
        });
      }
    });
  };

  /**
  * Determine if currently connected to the hyperdeck.
  * @return boolean true if connected, false otherwise.
  */
  this.isConnected = function() {
    return connected;
  };

  /**
  * Get the notifier.
  * Events with id 'asynchronousEvent' will be emitted from this for asynchronous events
  * from the hyperdeck.
  * 'connectionLost' is emitted if the hyperdeck connection is lost (or fails to connect)
  */
  this.getNotifier = function() {
     return publicNotifier;
  };

  /**
   * Destroy the hyperdeck instance, and disconnect if connected.
   */
  this.destroy = function() {
    if (destroyed) {
      return;
    }
    logger.debug('Destroying...');
    destroyed = true;
    write('quit\n');
    responseHandler.destroy();
    client.destroy();
  };
}

module.exports = HyperdeckCore;
