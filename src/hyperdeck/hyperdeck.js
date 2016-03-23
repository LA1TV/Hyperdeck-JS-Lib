/*jshint latedef: false */
var ResponseHandler = require('./response-handler.js');
var Promise = require('promise');
var net = require('net');
var events = require('events');

var notifier = new events.EventEmitter();

var pendingRequests = [];
var requestCompletionPromises = [];
var requestInProgress = false;

/**
 * Represents a Hyperdeck.
 * Allows you to make requests to the hyperdeck and get its parsed responses.
 * This chains the requests so only one is sent at a time.
 * You can also listen for asynchronous events sent from the hyperdeck.
 * @param ip, The IP address of the hyperdeck.
 **/
function Hyperdeck(ip) {

  var client = new net.Socket();
  var responseHandler = new ResponseHandler(client);
  var connecting = true;
  var connected = false;

  // TODO add a destroy method which will
  // - disconnect from the hypedeck
  // - call destroy() on the response handler
  // - remove the asynchronousResponse listener on the response handler notifier

  responseHandler.getNotifier().on("asynchronousResponse", function(data) {
    // the developer will listen on the notifier for asynchronous events
    // fired from the hyperdeck
    notifier.emit("asynchronousEvent", data);
  });

  client.connect({
    host: ip,
    port: 9993
  }, function() {
    console.log('Connected.');
    connected = true;
    connecting = false;
    // a request might have been queued whilst the connection
    // was being made
    performNextRequest();
  });

    // TODO call this if the connection is lost
    // or the connection fails to be made
    /*function onConnectionLost() {
        if (!connected) {
            throw "Must be connected in order to loose the connection!";
        }

        connecting = false;
        connected = false;
        notifier.emit("connectionLost");
        performNextRequest();
    }*/

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
      responseHandler.getNotifier().on("synchronousResponse", handleResponse);
      notifier.on("connectionLost", handleConnectionLoss);
    }

    function removeListeners() {
      if (listenersRegistered) {
        responseHandler.getNotifier().removeListener("synchronousResponse", handleResponse);
        notifier.removeListener("connectionLost", handleConnectionLoss);
      }
    }

    function handleResponse(response) {
      console.log("Got response. Resolving provided promise with response.");
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

    function handleConnectionLoss() {
      console.log("Connection lost. Rejecting provided promise to signify failure.");
      removeListeners();
      // null to signify connection loss
      requestCompletionPromise.reject(null);
      onRequestCompleted();
    }

    if (!connected) {
      // connection has been lost
      // don't even attempt the request
      console.log("Not attempting request because connection lost.");
      handleConnectionLoss();
    }
    else {
      registerListeners();
      // make the request
      // either the "synchronousResponse" or "connectionLost" event should be
      // fired at some point in the future.
      console.log("Making request: "+request);
      client.write(request);
    }
  }

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
    **/
    this.makeRequest = function(requestToProcess) {

        var completionPromise = new Promise(function(resolve, reject) {
            requestCompletionPromises.push({
                resolve: resolve,
                reject: reject
            });
        });

        pendingRequests.push(requestToProcess);
        console.log("Queueing request: "+requestToProcess);
        performNextRequest();
        return completionPromise;
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
    * Events with id "asynchronousEvent" will be emitted from this for asynchronous events
    * from the hyperdeck.
    */
    this.getNotifier = function() {
       return notifier;
    };
}

module.exports = Hyperdeck;
