var JsLogger = require('js-logger');

JsLogger.useDefaults({
  formatter: function(messages, context) {
    if (context.name) {
      messages.unshift('[' + context.name + ']');
    }
    messages.unshift('[HyperdeckJSLib]');
  }
});

JsLogger.setLevel(JsLogger.OFF);

module.exports = JsLogger;