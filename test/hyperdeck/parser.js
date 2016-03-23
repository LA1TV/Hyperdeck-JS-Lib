var Parser = require('../../src/hyperdeck/parser');

var SUCCESS_RESPONSE = "200 Success";
var SUCCESS_RESPONSE_WITH_PARAMS = "200 Success with data:\r\nsomething: 123\r\nsomething else: test\r\n\r\n";
var FAILURE_RESPONSE = "102 Failure";
var FAILURE_RESPONSE_WITH_PARAMS = "102 Failure:\r\nsomething: 123\r\nsomething else: test\r\n\r\n";
var ASYNC_RESPONSE = "512 Async event:\r\nprotocol version: 9.5\r\nmodel: xyz\r\ntime: 12:40:12\r\n\r\n";
var INVALID_RESPONSE = "something invalid";

var SUCCESS_RESPONSE_DATA = {
    type: "synchronousSuccess",
    data: {
        code: 200,
        text: "Success"
    }
};

var SUCCESS_PARAMS_RESPONSE_DATA = {
    type: "synchronousSuccess",
    data: {
        code: 200,
        text: "Success with data",
        params: {
            something: "123",
            "something else": "test"
        }
    }
};

var FAILURE_RESPONSE_DATA = {
    type: "synchronousFailure",
    data: {
        code: 102,
        text: "Failure"
    }
};

var FAILURE_PARAMS_RESPONSE_DATA = {
    type: "synchronousFailure",
    data: {
        code: 102,
        text: "Failure",
        params:  {
            something: "123",
            "something else": "test"
        }
    }
};

var ASYNC_RESPONSE_DATA = {
    type: "asynchronous",
    data: {
        code: 512,
        text: "Async event",
        params: {
            "protocol version": "9.5",
            model: "xyz",
            time: "12:40:12"
        }
    }
};

describe('Parser', function() {

  it('should handle a response string with a success status code', function() {
    Parser.parse(SUCCESS_RESPONSE).should.eql(SUCCESS_RESPONSE_DATA);
  });

  it('should handle a response string with a success status code and params', function() {
    Parser.parse(SUCCESS_RESPONSE_WITH_PARAMS).should.eql(SUCCESS_PARAMS_RESPONSE_DATA);
  });

  it('should handle a response string with a failure status code', function() {
    Parser.parse(FAILURE_RESPONSE).should.eql(FAILURE_RESPONSE_DATA);
  });

  it('should handle a response string with a failure status code and params', function() {
    Parser.parse(FAILURE_RESPONSE_WITH_PARAMS).should.eql(FAILURE_PARAMS_RESPONSE_DATA);
  });

  it('should handle a response string with an async status code', function() {
    Parser.parse(ASYNC_RESPONSE).should.eql(ASYNC_RESPONSE_DATA);
  });

  it('should throw an exception if the input string is not valid', function() {
    (function() {
        Parser.parse(INVALID_RESPONSE);
    }).should.throw();
  });

});