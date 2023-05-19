var HyperdeckJSLib = (function (require$$0$2, require$$0, require$$0$1, require$$2) {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var FIRST_LINE_REGEX = /^([0-9]+) (.+?)(\:?)$/;
	var PARAMS_REGEX = /^(.*)\: (.*)$/;

	/**
	 * Converts the data to a Object.
	 * So the hyperdeck class can do things nicely with it.
	 * @return dataObject, The data in a nice object. This will contain 'code', 'text' and 'params' keys,
	 *                     (if there are parameters) where params is an object.
	 **/
	function convertDataToObject(lines) {
	  var dataObject = {
	    code: null,
	    text: null
	  };

	  var firstLine = lines.shift(); // should contain {Response code} {Response text}
	  var firstLineMatches = FIRST_LINE_REGEX.exec(firstLine);
	  var code = parseInt(firstLineMatches[1]);
	  var text = firstLineMatches[2];
	  dataObject.code = code;
	  dataObject.text = text;
	  
	  if (lines.length) {
	    // provide the raw data in addition to attempting to parse the response into params
	    dataObject.rawData = lines.join('\r\n');
	  }
	  
	  if (firstLineMatches[3] === ':') {
	    // the response should have params on the next lines
	    // (although sometimes it doesn't because of the responses (e.g 'commands'), do not return
	    // the usual format, and in this case params will likely remain as {})
	    var params = {};
	    //Append the rest into an object for emitting.
	    lines.forEach(function(line) {
	      var lineData = PARAMS_REGEX.exec(line);
	      //First element in array is the whole string.
	      if(lineData) {
	        params[lineData[1]] = lineData[2];
	      }
	    });
	    dataObject.params = params;
	  }
	  return dataObject;
	}

	/**
	 * Parses responses from the hyperdeck into a nice object.
	 */
	 function failureResponseCode(lines) {
	   return {
	     type: 'synchronousFailure',
	     data: convertDataToObject(lines)
	   };
	 }

	 function successResponseCode(lines) {
	   return {
	     type: 'synchronousSuccess',
	     data: convertDataToObject(lines)
	   };
	 }

	 function asynchornousResponseCode(lines) {
	   return {
	     type: 'asynchronous',
	     data: convertDataToObject(lines)
	   };
	 }

	var Parser$1 = {

	  parse: function(lines) {
	    // pass into the switch/case to decide which function to use.
	    switch (lines[0].charAt(0)){
	      case '1':
	        return failureResponseCode(lines);
	      case '2':
	        return successResponseCode(lines);
	      case '5':
	        return asynchornousResponseCode(lines);
	      default:
	        throw new Error('Invalid payload. Unknown response code.');
	    }
	  }
	};

	var parser = Parser$1;

	var logger$3 = {exports: {}};

	/*!
	 * js-logger - http://github.com/jonnyreeves/js-logger
	 * Jonny Reeves, http://jonnyreeves.co.uk/
	 * js-logger may be freely distributed under the MIT license.
	 */

	(function (module) {
		(function (global) {

			// Top level module for the global, static logger instance.
			var Logger = { };

			// For those that are at home that are keeping score.
			Logger.VERSION = "1.6.0";

			// Function which handles all incoming log messages.
			var logHandler;

			// Map of ContextualLogger instances by name; used by Logger.get() to return the same named instance.
			var contextualLoggersByNameMap = {};

			// Polyfill for ES5's Function.bind.
			var bind = function(scope, func) {
				return function() {
					return func.apply(scope, arguments);
				};
			};

			// Super exciting object merger-matron 9000 adding another 100 bytes to your download.
			var merge = function () {
				var args = arguments, target = args[0], key, i;
				for (i = 1; i < args.length; i++) {
					for (key in args[i]) {
						if (!(key in target) && args[i].hasOwnProperty(key)) {
							target[key] = args[i][key];
						}
					}
				}
				return target;
			};

			// Helper to define a logging level object; helps with optimisation.
			var defineLogLevel = function(value, name) {
				return { value: value, name: name };
			};

			// Predefined logging levels.
			Logger.TRACE = defineLogLevel(1, 'TRACE');
			Logger.DEBUG = defineLogLevel(2, 'DEBUG');
			Logger.INFO = defineLogLevel(3, 'INFO');
			Logger.TIME = defineLogLevel(4, 'TIME');
			Logger.WARN = defineLogLevel(5, 'WARN');
			Logger.ERROR = defineLogLevel(8, 'ERROR');
			Logger.OFF = defineLogLevel(99, 'OFF');

			// Inner class which performs the bulk of the work; ContextualLogger instances can be configured independently
			// of each other.
			var ContextualLogger = function(defaultContext) {
				this.context = defaultContext;
				this.setLevel(defaultContext.filterLevel);
				this.log = this.info;  // Convenience alias.
			};

			ContextualLogger.prototype = {
				// Changes the current logging level for the logging instance.
				setLevel: function (newLevel) {
					// Ensure the supplied Level object looks valid.
					if (newLevel && "value" in newLevel) {
						this.context.filterLevel = newLevel;
					}
				},
				
				// Gets the current logging level for the logging instance
				getLevel: function () {
					return this.context.filterLevel;
				},

				// Is the logger configured to output messages at the supplied level?
				enabledFor: function (lvl) {
					var filterLevel = this.context.filterLevel;
					return lvl.value >= filterLevel.value;
				},

				trace: function () {
					this.invoke(Logger.TRACE, arguments);
				},

				debug: function () {
					this.invoke(Logger.DEBUG, arguments);
				},

				info: function () {
					this.invoke(Logger.INFO, arguments);
				},

				warn: function () {
					this.invoke(Logger.WARN, arguments);
				},

				error: function () {
					this.invoke(Logger.ERROR, arguments);
				},

				time: function (label) {
					if (typeof label === 'string' && label.length > 0) {
						this.invoke(Logger.TIME, [ label, 'start' ]);
					}
				},

				timeEnd: function (label) {
					if (typeof label === 'string' && label.length > 0) {
						this.invoke(Logger.TIME, [ label, 'end' ]);
					}
				},

				// Invokes the logger callback if it's not being filtered.
				invoke: function (level, msgArgs) {
					if (logHandler && this.enabledFor(level)) {
						logHandler(msgArgs, merge({ level: level }, this.context));
					}
				}
			};

			// Protected instance which all calls to the to level `Logger` module will be routed through.
			var globalLogger = new ContextualLogger({ filterLevel: Logger.OFF });

			// Configure the global Logger instance.
			(function() {
				// Shortcut for optimisers.
				var L = Logger;

				L.enabledFor = bind(globalLogger, globalLogger.enabledFor);
				L.trace = bind(globalLogger, globalLogger.trace);
				L.debug = bind(globalLogger, globalLogger.debug);
				L.time = bind(globalLogger, globalLogger.time);
				L.timeEnd = bind(globalLogger, globalLogger.timeEnd);
				L.info = bind(globalLogger, globalLogger.info);
				L.warn = bind(globalLogger, globalLogger.warn);
				L.error = bind(globalLogger, globalLogger.error);

				// Don't forget the convenience alias!
				L.log = L.info;
			}());

			// Set the global logging handler.  The supplied function should expect two arguments, the first being an arguments
			// object with the supplied log messages and the second being a context object which contains a hash of stateful
			// parameters which the logging function can consume.
			Logger.setHandler = function (func) {
				logHandler = func;
			};

			// Sets the global logging filter level which applies to *all* previously registered, and future Logger instances.
			// (note that named loggers (retrieved via `Logger.get`) can be configured independently if required).
			Logger.setLevel = function(level) {
				// Set the globalLogger's level.
				globalLogger.setLevel(level);

				// Apply this level to all registered contextual loggers.
				for (var key in contextualLoggersByNameMap) {
					if (contextualLoggersByNameMap.hasOwnProperty(key)) {
						contextualLoggersByNameMap[key].setLevel(level);
					}
				}
			};

			// Gets the global logging filter level
			Logger.getLevel = function() {
				return globalLogger.getLevel();
			};

			// Retrieve a ContextualLogger instance.  Note that named loggers automatically inherit the global logger's level,
			// default context and log handler.
			Logger.get = function (name) {
				// All logger instances are cached so they can be configured ahead of use.
				return contextualLoggersByNameMap[name] ||
					(contextualLoggersByNameMap[name] = new ContextualLogger(merge({ name: name }, globalLogger.context)));
			};

			// CreateDefaultHandler returns a handler function which can be passed to `Logger.setHandler()` which will
			// write to the window's console object (if present); the optional options object can be used to customise the
			// formatter used to format each log message.
			Logger.createDefaultHandler = function (options) {
				options = options || {};

				options.formatter = options.formatter || function defaultMessageFormatter(messages, context) {
					// Prepend the logger's name to the log message for easy identification.
					if (context.name) {
						messages.unshift("[" + context.name + "]");
					}
				};

				// Map of timestamps by timer labels used to track `#time` and `#timeEnd()` invocations in environments
				// that don't offer a native console method.
				var timerStartTimeByLabelMap = {};

				// Support for IE8+ (and other, slightly more sane environments)
				var invokeConsoleMethod = function (hdlr, messages) {
					Function.prototype.apply.call(hdlr, console, messages);
				};

				// Check for the presence of a logger.
				if (typeof console === "undefined") {
					return function () { /* no console */ };
				}

				return function(messages, context) {
					// Convert arguments object to Array.
					messages = Array.prototype.slice.call(messages);

					var hdlr = console.log;
					var timerLabel;

					if (context.level === Logger.TIME) {
						timerLabel = (context.name ? '[' + context.name + '] ' : '') + messages[0];

						if (messages[1] === 'start') {
							if (console.time) {
								console.time(timerLabel);
							}
							else {
								timerStartTimeByLabelMap[timerLabel] = new Date().getTime();
							}
						}
						else {
							if (console.timeEnd) {
								console.timeEnd(timerLabel);
							}
							else {
								invokeConsoleMethod(hdlr, [ timerLabel + ': ' +
									(new Date().getTime() - timerStartTimeByLabelMap[timerLabel]) + 'ms' ]);
							}
						}
					}
					else {
						// Delegate through to custom warn/error loggers if present on the console.
						if (context.level === Logger.WARN && console.warn) {
							hdlr = console.warn;
						} else if (context.level === Logger.ERROR && console.error) {
							hdlr = console.error;
						} else if (context.level === Logger.INFO && console.info) {
							hdlr = console.info;
						} else if (context.level === Logger.DEBUG && console.debug) {
							hdlr = console.debug;
						} else if (context.level === Logger.TRACE && console.trace) {
							hdlr = console.trace;
						}

						options.formatter(messages, context);
						invokeConsoleMethod(hdlr, messages);
					}
				};
			};

			// Configure and example a Default implementation which writes to the `window.console` (if present).  The
			// `options` hash can be used to configure the default logLevel and provide a custom message formatter.
			Logger.useDefaults = function(options) {
				Logger.setLevel(options && options.defaultLevel || Logger.DEBUG);
				Logger.setHandler(Logger.createDefaultHandler(options));
			};

			// Export to popular environments boilerplate.
			if (module.exports) {
				module.exports = Logger;
			}
			else {
				Logger._prevLogger = global.Logger;

				Logger.noConflict = function () {
					global.Logger = Logger._prevLogger;
					return Logger;
				};

				global.Logger = Logger;
			}
		}(commonjsGlobal)); 
	} (logger$3));

	var loggerExports = logger$3.exports;

	var JsLogger = loggerExports;

	JsLogger.useDefaults({
	  formatter: function(messages, context) {
	    if (context.name) {
	      messages.unshift('[' + context.name + ']');
	    }
	    messages.unshift('[HyperdeckJSLib]');
	  }
	});

	JsLogger.setLevel(JsLogger.OFF);

	var logger$2 = JsLogger;

	var events$1 = require$$0;
	var Parser = parser;
	var Logger$1 = logger$2;

	var logger$1 = Logger$1.get('hyperdeck.ResponseHandler');

	var SINGLE_LINE_REGEX = /^(?:1\d{2}|200) /;

	/**
	 * Handles responses from they hyperdeck.
	 */
	function ResponseHandler$1(clientSocket) {
	  var destroyed = false;
	  var notifier = new events$1.EventEmitter();
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
	    logger$1.debug('Got data on socket.\n', rawData);
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

	          logger$1.debug('Got complete data.\n', buffer.join('\n'));
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
	    logger$1.debug('Destroying...');
	    destroyed = true;
	    clientSocket.removeListener('data', onData);
	  };
	}

	var responseHandler = ResponseHandler$1;

	var domain; // The domain module is executed on demand
	var hasSetImmediate = typeof setImmediate === "function";

	// Use the fastest means possible to execute a task in its own turn, with
	// priority over other events including network IO events in Node.js.
	//
	// An exception thrown by a task will permanently interrupt the processing of
	// subsequent tasks. The higher level `asap` function ensures that if an
	// exception is thrown by a task, that the task queue will continue flushing as
	// soon as possible, but if you use `rawAsap` directly, you are responsible to
	// either ensure that no exceptions are thrown from your task, or to manually
	// call `rawAsap.requestFlush` if an exception is thrown.
	var raw = rawAsap$1;
	function rawAsap$1(task) {
	    if (!queue.length) {
	        requestFlush();
	        flushing = true;
	    }
	    // Avoids a function call
	    queue[queue.length] = task;
	}

	var queue = [];
	// Once a flush has been requested, no further calls to `requestFlush` are
	// necessary until the next `flush` completes.
	var flushing = false;
	// The position of the next task to execute in the task queue. This is
	// preserved between calls to `flush` so that it can be resumed if
	// a task throws an exception.
	var index$1 = 0;
	// If a task schedules additional tasks recursively, the task queue can grow
	// unbounded. To prevent memory excaustion, the task queue will periodically
	// truncate already-completed tasks.
	var capacity = 1024;

	// The flush function processes all tasks that have been scheduled with
	// `rawAsap` unless and until one of those tasks throws an exception.
	// If a task throws an exception, `flush` ensures that its state will remain
	// consistent and will resume where it left off when called again.
	// However, `flush` does not make any arrangements to be called again if an
	// exception is thrown.
	function flush() {
	    while (index$1 < queue.length) {
	        var currentIndex = index$1;
	        // Advance the index before calling the task. This ensures that we will
	        // begin flushing on the next task the task throws an error.
	        index$1 = index$1 + 1;
	        queue[currentIndex].call();
	        // Prevent leaking memory for long chains of recursive calls to `asap`.
	        // If we call `asap` within tasks scheduled by `asap`, the queue will
	        // grow, but to avoid an O(n) walk for every task we execute, we don't
	        // shift tasks off the queue after they have been executed.
	        // Instead, we periodically shift 1024 tasks off the queue.
	        if (index$1 > capacity) {
	            // Manually shift all values starting at the index back to the
	            // beginning of the queue.
	            for (var scan = 0, newLength = queue.length - index$1; scan < newLength; scan++) {
	                queue[scan] = queue[scan + index$1];
	            }
	            queue.length -= index$1;
	            index$1 = 0;
	        }
	    }
	    queue.length = 0;
	    index$1 = 0;
	    flushing = false;
	}

	rawAsap$1.requestFlush = requestFlush;
	function requestFlush() {
	    // Ensure flushing is not bound to any domain.
	    // It is not sufficient to exit the domain, because domains exist on a stack.
	    // To execute code outside of any domain, the following dance is necessary.
	    var parentDomain = process.domain;
	    if (parentDomain) {
	        if (!domain) {
	            // Lazy execute the domain module.
	            // Only employed if the user elects to use domains.
	            domain = require$$0$1;
	        }
	        domain.active = process.domain = null;
	    }

	    // `setImmediate` is slower that `process.nextTick`, but `process.nextTick`
	    // cannot handle recursion.
	    // `requestFlush` will only be called recursively from `asap.js`, to resume
	    // flushing after an error is thrown into a domain.
	    // Conveniently, `setImmediate` was introduced in the same version
	    // `process.nextTick` started throwing recursion errors.
	    if (flushing && hasSetImmediate) {
	        setImmediate(flush);
	    } else {
	        process.nextTick(flush);
	    }

	    if (parentDomain) {
	        domain.active = process.domain = parentDomain;
	    }
	}

	var asap$2 = raw;

	function noop() {}

	// States:
	//
	// 0 - pending
	// 1 - fulfilled with _value
	// 2 - rejected with _value
	// 3 - adopted the state of another promise, _value
	//
	// once the state is no longer pending (0) it is immutable

	// All `_` prefixed properties will be reduced to `_{random number}`
	// at build time to obfuscate them and discourage their use.
	// We don't use symbols or Object.defineProperty to fully hide them
	// because the performance isn't good enough.


	// to avoid using try/catch inside critical functions, we
	// extract them to here.
	var LAST_ERROR = null;
	var IS_ERROR = {};
	function getThen(obj) {
	  try {
	    return obj.then;
	  } catch (ex) {
	    LAST_ERROR = ex;
	    return IS_ERROR;
	  }
	}

	function tryCallOne(fn, a) {
	  try {
	    return fn(a);
	  } catch (ex) {
	    LAST_ERROR = ex;
	    return IS_ERROR;
	  }
	}
	function tryCallTwo(fn, a, b) {
	  try {
	    fn(a, b);
	  } catch (ex) {
	    LAST_ERROR = ex;
	    return IS_ERROR;
	  }
	}

	var core = Promise$7;

	function Promise$7(fn) {
	  if (typeof this !== 'object') {
	    throw new TypeError('Promises must be constructed via new');
	  }
	  if (typeof fn !== 'function') {
	    throw new TypeError('Promise constructor\'s argument is not a function');
	  }
	  this._h = 0;
	  this._i = 0;
	  this._j = null;
	  this._k = null;
	  if (fn === noop) return;
	  doResolve(fn, this);
	}
	Promise$7._l = null;
	Promise$7._m = null;
	Promise$7._n = noop;

	Promise$7.prototype.then = function(onFulfilled, onRejected) {
	  if (this.constructor !== Promise$7) {
	    return safeThen(this, onFulfilled, onRejected);
	  }
	  var res = new Promise$7(noop);
	  handle(this, new Handler(onFulfilled, onRejected, res));
	  return res;
	};

	function safeThen(self, onFulfilled, onRejected) {
	  return new self.constructor(function (resolve, reject) {
	    var res = new Promise$7(noop);
	    res.then(resolve, reject);
	    handle(self, new Handler(onFulfilled, onRejected, res));
	  });
	}
	function handle(self, deferred) {
	  while (self._i === 3) {
	    self = self._j;
	  }
	  if (Promise$7._l) {
	    Promise$7._l(self);
	  }
	  if (self._i === 0) {
	    if (self._h === 0) {
	      self._h = 1;
	      self._k = deferred;
	      return;
	    }
	    if (self._h === 1) {
	      self._h = 2;
	      self._k = [self._k, deferred];
	      return;
	    }
	    self._k.push(deferred);
	    return;
	  }
	  handleResolved(self, deferred);
	}

	function handleResolved(self, deferred) {
	  asap$2(function() {
	    var cb = self._i === 1 ? deferred.onFulfilled : deferred.onRejected;
	    if (cb === null) {
	      if (self._i === 1) {
	        resolve(deferred.promise, self._j);
	      } else {
	        reject(deferred.promise, self._j);
	      }
	      return;
	    }
	    var ret = tryCallOne(cb, self._j);
	    if (ret === IS_ERROR) {
	      reject(deferred.promise, LAST_ERROR);
	    } else {
	      resolve(deferred.promise, ret);
	    }
	  });
	}
	function resolve(self, newValue) {
	  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
	  if (newValue === self) {
	    return reject(
	      self,
	      new TypeError('A promise cannot be resolved with itself.')
	    );
	  }
	  if (
	    newValue &&
	    (typeof newValue === 'object' || typeof newValue === 'function')
	  ) {
	    var then = getThen(newValue);
	    if (then === IS_ERROR) {
	      return reject(self, LAST_ERROR);
	    }
	    if (
	      then === self.then &&
	      newValue instanceof Promise$7
	    ) {
	      self._i = 3;
	      self._j = newValue;
	      finale(self);
	      return;
	    } else if (typeof then === 'function') {
	      doResolve(then.bind(newValue), self);
	      return;
	    }
	  }
	  self._i = 1;
	  self._j = newValue;
	  finale(self);
	}

	function reject(self, newValue) {
	  self._i = 2;
	  self._j = newValue;
	  if (Promise$7._m) {
	    Promise$7._m(self, newValue);
	  }
	  finale(self);
	}
	function finale(self) {
	  if (self._h === 1) {
	    handle(self, self._k);
	    self._k = null;
	  }
	  if (self._h === 2) {
	    for (var i = 0; i < self._k.length; i++) {
	      handle(self, self._k[i]);
	    }
	    self._k = null;
	  }
	}

	function Handler(onFulfilled, onRejected, promise){
	  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
	  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
	  this.promise = promise;
	}

	/**
	 * Take a potentially misbehaving resolver function and make sure
	 * onFulfilled and onRejected are only called once.
	 *
	 * Makes no guarantees about asynchrony.
	 */
	function doResolve(fn, promise) {
	  var done = false;
	  var res = tryCallTwo(fn, function (value) {
	    if (done) return;
	    done = true;
	    resolve(promise, value);
	  }, function (reason) {
	    if (done) return;
	    done = true;
	    reject(promise, reason);
	  });
	  if (!done && res === IS_ERROR) {
	    done = true;
	    reject(promise, LAST_ERROR);
	  }
	}

	var Promise$6 = core;
	Promise$6.prototype.done = function (onFulfilled, onRejected) {
	  var self = arguments.length ? this.then.apply(this, arguments) : this;
	  self.then(null, function (err) {
	    setTimeout(function () {
	      throw err;
	    }, 0);
	  });
	};

	var Promise$5 = core;
	Promise$5.prototype.finally = function (f) {
	  return this.then(function (value) {
	    return Promise$5.resolve(f()).then(function () {
	      return value;
	    });
	  }, function (err) {
	    return Promise$5.resolve(f()).then(function () {
	      throw err;
	    });
	  });
	};

	//This file contains the ES6 extensions to the core Promises/A+ API

	var Promise$4 = core;

	/* Static Functions */

	var TRUE = valuePromise(true);
	var FALSE = valuePromise(false);
	var NULL = valuePromise(null);
	var UNDEFINED = valuePromise(undefined);
	var ZERO = valuePromise(0);
	var EMPTYSTRING = valuePromise('');

	function valuePromise(value) {
	  var p = new Promise$4(Promise$4._n);
	  p._i = 1;
	  p._j = value;
	  return p;
	}
	Promise$4.resolve = function (value) {
	  if (value instanceof Promise$4) return value;

	  if (value === null) return NULL;
	  if (value === undefined) return UNDEFINED;
	  if (value === true) return TRUE;
	  if (value === false) return FALSE;
	  if (value === 0) return ZERO;
	  if (value === '') return EMPTYSTRING;

	  if (typeof value === 'object' || typeof value === 'function') {
	    try {
	      var then = value.then;
	      if (typeof then === 'function') {
	        return new Promise$4(then.bind(value));
	      }
	    } catch (ex) {
	      return new Promise$4(function (resolve, reject) {
	        reject(ex);
	      });
	    }
	  }
	  return valuePromise(value);
	};

	Promise$4.all = function (arr) {
	  var args = Array.prototype.slice.call(arr);

	  return new Promise$4(function (resolve, reject) {
	    if (args.length === 0) return resolve([]);
	    var remaining = args.length;
	    function res(i, val) {
	      if (val && (typeof val === 'object' || typeof val === 'function')) {
	        if (val instanceof Promise$4 && val.then === Promise$4.prototype.then) {
	          while (val._i === 3) {
	            val = val._j;
	          }
	          if (val._i === 1) return res(i, val._j);
	          if (val._i === 2) reject(val._j);
	          val.then(function (val) {
	            res(i, val);
	          }, reject);
	          return;
	        } else {
	          var then = val.then;
	          if (typeof then === 'function') {
	            var p = new Promise$4(then.bind(val));
	            p.then(function (val) {
	              res(i, val);
	            }, reject);
	            return;
	          }
	        }
	      }
	      args[i] = val;
	      if (--remaining === 0) {
	        resolve(args);
	      }
	    }
	    for (var i = 0; i < args.length; i++) {
	      res(i, args[i]);
	    }
	  });
	};

	Promise$4.reject = function (value) {
	  return new Promise$4(function (resolve, reject) {
	    reject(value);
	  });
	};

	Promise$4.race = function (values) {
	  return new Promise$4(function (resolve, reject) {
	    values.forEach(function(value){
	      Promise$4.resolve(value).then(resolve, reject);
	    });
	  });
	};

	/* Prototype Methods */

	Promise$4.prototype['catch'] = function (onRejected) {
	  return this.then(null, onRejected);
	};

	var rawAsap = raw;
	var freeTasks = [];

	/**
	 * Calls a task as soon as possible after returning, in its own event, with
	 * priority over IO events. An exception thrown in a task can be handled by
	 * `process.on("uncaughtException") or `domain.on("error")`, but will otherwise
	 * crash the process. If the error is handled, all subsequent tasks will
	 * resume.
	 *
	 * @param {{call}} task A callable object, typically a function that takes no
	 * arguments.
	 */
	var asap_1 = asap$1;
	function asap$1(task) {
	    var rawTask;
	    if (freeTasks.length) {
	        rawTask = freeTasks.pop();
	    } else {
	        rawTask = new RawTask();
	    }
	    rawTask.task = task;
	    rawTask.domain = process.domain;
	    rawAsap(rawTask);
	}

	function RawTask() {
	    this.task = null;
	    this.domain = null;
	}

	RawTask.prototype.call = function () {
	    if (this.domain) {
	        this.domain.enter();
	    }
	    var threw = true;
	    try {
	        this.task.call();
	        threw = false;
	        // If the task throws an exception (presumably) Node.js restores the
	        // domain stack for the next event.
	        if (this.domain) {
	            this.domain.exit();
	        }
	    } finally {
	        // We use try/finally and a threw flag to avoid messing up stack traces
	        // when we catch and release errors.
	        if (threw) {
	            // In Node.js, uncaught exceptions are considered fatal errors.
	            // Re-throw them to interrupt flushing!
	            // Ensure that flushing continues if an uncaught exception is
	            // suppressed listening process.on("uncaughtException") or
	            // domain.on("error").
	            rawAsap.requestFlush();
	        }
	        // If the task threw an error, we do not want to exit the domain here.
	        // Exiting the domain would prevent the domain from catching the error.
	        this.task = null;
	        this.domain = null;
	        freeTasks.push(this);
	    }
	};

	// This file contains then/promise specific extensions that are only useful
	// for node.js interop

	var Promise$3 = core;
	var asap = asap_1;

	/* Static Functions */

	Promise$3.denodeify = function (fn, argumentCount) {
	  if (
	    typeof argumentCount === 'number' && argumentCount !== Infinity
	  ) {
	    return denodeifyWithCount(fn, argumentCount);
	  } else {
	    return denodeifyWithoutCount(fn);
	  }
	};

	var callbackFn = (
	  'function (err, res) {' +
	  'if (err) { rj(err); } else { rs(res); }' +
	  '}'
	);
	function denodeifyWithCount(fn, argumentCount) {
	  var args = [];
	  for (var i = 0; i < argumentCount; i++) {
	    args.push('a' + i);
	  }
	  var body = [
	    'return function (' + args.join(',') + ') {',
	    'var self = this;',
	    'return new Promise(function (rs, rj) {',
	    'var res = fn.call(',
	    ['self'].concat(args).concat([callbackFn]).join(','),
	    ');',
	    'if (res &&',
	    '(typeof res === "object" || typeof res === "function") &&',
	    'typeof res.then === "function"',
	    ') {rs(res);}',
	    '});',
	    '};'
	  ].join('');
	  return Function(['Promise', 'fn'], body)(Promise$3, fn);
	}
	function denodeifyWithoutCount(fn) {
	  var fnLength = Math.max(fn.length - 1, 3);
	  var args = [];
	  for (var i = 0; i < fnLength; i++) {
	    args.push('a' + i);
	  }
	  var body = [
	    'return function (' + args.join(',') + ') {',
	    'var self = this;',
	    'var args;',
	    'var argLength = arguments.length;',
	    'if (arguments.length > ' + fnLength + ') {',
	    'args = new Array(arguments.length + 1);',
	    'for (var i = 0; i < arguments.length; i++) {',
	    'args[i] = arguments[i];',
	    '}',
	    '}',
	    'return new Promise(function (rs, rj) {',
	    'var cb = ' + callbackFn + ';',
	    'var res;',
	    'switch (argLength) {',
	    args.concat(['extra']).map(function (_, index) {
	      return (
	        'case ' + (index) + ':' +
	        'res = fn.call(' + ['self'].concat(args.slice(0, index)).concat('cb').join(',') + ');' +
	        'break;'
	      );
	    }).join(''),
	    'default:',
	    'args[argLength] = cb;',
	    'res = fn.apply(self, args);',
	    '}',
	    
	    'if (res &&',
	    '(typeof res === "object" || typeof res === "function") &&',
	    'typeof res.then === "function"',
	    ') {rs(res);}',
	    '});',
	    '};'
	  ].join('');

	  return Function(
	    ['Promise', 'fn'],
	    body
	  )(Promise$3, fn);
	}

	Promise$3.nodeify = function (fn) {
	  return function () {
	    var args = Array.prototype.slice.call(arguments);
	    var callback =
	      typeof args[args.length - 1] === 'function' ? args.pop() : null;
	    var ctx = this;
	    try {
	      return fn.apply(this, arguments).nodeify(callback, ctx);
	    } catch (ex) {
	      if (callback === null || typeof callback == 'undefined') {
	        return new Promise$3(function (resolve, reject) {
	          reject(ex);
	        });
	      } else {
	        asap(function () {
	          callback.call(ctx, ex);
	        });
	      }
	    }
	  }
	};

	Promise$3.prototype.nodeify = function (callback, ctx) {
	  if (typeof callback != 'function') return this;

	  this.then(function (value) {
	    asap(function () {
	      callback.call(ctx, null, value);
	    });
	  }, function (err) {
	    asap(function () {
	      callback.call(ctx, err);
	    });
	  });
	};

	var Promise$2 = core;
	Promise$2.enableSynchronous = function () {
	  Promise$2.prototype.isPending = function() {
	    return this.getState() == 0;
	  };

	  Promise$2.prototype.isFulfilled = function() {
	    return this.getState() == 1;
	  };

	  Promise$2.prototype.isRejected = function() {
	    return this.getState() == 2;
	  };

	  Promise$2.prototype.getValue = function () {
	    if (this._i === 3) {
	      return this._j.getValue();
	    }

	    if (!this.isFulfilled()) {
	      throw new Error('Cannot get a value of an unfulfilled promise.');
	    }

	    return this._j;
	  };

	  Promise$2.prototype.getReason = function () {
	    if (this._i === 3) {
	      return this._j.getReason();
	    }

	    if (!this.isRejected()) {
	      throw new Error('Cannot get a rejection reason of a non-rejected promise.');
	    }

	    return this._j;
	  };

	  Promise$2.prototype.getState = function () {
	    if (this._i === 3) {
	      return this._j.getState();
	    }
	    if (this._i === -1 || this._i === -2) {
	      return 0;
	    }

	    return this._i;
	  };
	};

	Promise$2.disableSynchronous = function() {
	  Promise$2.prototype.isPending = undefined;
	  Promise$2.prototype.isFulfilled = undefined;
	  Promise$2.prototype.isRejected = undefined;
	  Promise$2.prototype.getValue = undefined;
	  Promise$2.prototype.getReason = undefined;
	  Promise$2.prototype.getState = undefined;
	};

	var lib = core;

	var promise = lib;

	/*jshint latedef: false */

	var ResponseHandler = responseHandler;
	var Promise$1 = promise;
	var net = require$$2;
	var events = require$$0;
	var Logger = logger$2;

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
	function HyperdeckCore$1(config) {

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

	    var completionPromise = new Promise$1(function(resolve, reject) {
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
	    return new Promise$1(function(resolve, reject) {
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

	var hyperdeckCore = HyperdeckCore$1;

	var util = require$$0$2;
	var HyperdeckCore = hyperdeckCore;

	var Hyperdeck = function(config) {

	  // call constructor of HyperdeckCore
	  HyperdeckCore.call(this, config);

	  this.makeRequest('notify: remote: true');
	  this.makeRequest('notify: transport: true');
	  this.makeRequest('notify: slot: true');
	  this.makeRequest('notify: configuration: true');

	  // add Easy Access commands
	  this.play = function(speed) {
	    var commandString;
	    if (Math.abs(speed) <= 1600) {
	      commandString = 'play: speed: ' + speed;
	    } else {
	      if (speed) {
	        throw new Error('Speed value invalid or out of range');
	      } else {
	        commandString = 'play';
	      }
	    }
	    return this.makeRequest(commandString);
	  };

	  this.stop = function() {
	    return this.makeRequest('stop');
	  };

	  this.record = function() {
	    return this.makeRequest('record');
	  };

	  this.goTo = function(timecode) {
	    return this.makeRequest('goto: timecode: ' + timecode);
	  };

	  this.jogTo = function(timecode) {
	    return this.makeRequest('jog: timecode: ' + timecode);
	  };

	  this.jogForward = function(timecode) {
	    return this.makeRequest('jog: timecode: +' + timecode);
	  };

	  this.jogBackwards = function(timecode) {
	    return this.makeRequest('jog: timecode: -' + timecode);
	  };

	  this.slotInfo = function (id) {
	    if (typeof id === 'number') {
	      return this.makeRequest('slot info: slot id: ' + id);
	    } else {
	      return this.makeRequest('slot info');
	    }
	  };

	  this.transportInfo = function(){
	    return this.makeRequest('transport info');
	  };

	  this.clipsGet = function(){
	    return this.makeRequest('clips get');
	  };

	  this.nextClip = function() { 
	    return this.makeRequest('goto: clip id: +1'); 
	  };

	  this.prevClip = function() { 
	    return this.makeRequest('goto: clip id: -1'); 
	  };

	  this.slotSelect = function(id){
	    return this.makeRequest('slot select: slot id: ' + id);
	  };

	  this.format = function(format){
	    return this.makeRequest('format: prepare: ' + format).then(function(response){
	      if (response.code !== 216 || response.text !== 'format ready' || !response.rawData) {
	        throw new Error('Unexpected response.');
	      }
	      var token = response.rawData;
	      return this.makeRequest('format: confirm: ' + token);
	    }.bind(this));
	  };
	};

	// make this class extend HyperdeckCore
	// https://nodejs.org/docs/latest/api/util.html#util_util_inherits_constructor_superconstructor
	util.inherits(Hyperdeck, HyperdeckCore);

	var hyperdeck = Hyperdeck;

	// Here we export what we want to be accessible from the library to the developer

	var src = {
		Hyperdeck: hyperdeck,
		HyperdeckCore: hyperdeckCore,
		Logger: logger$2
	};

	var index = /*@__PURE__*/getDefaultExportFromCjs(src);

	return index;

})(require("util"), require("events"), require("domain"), require("net"));
