var Parser = require('../../src/hyperdeck/parser');

// var SUCCESS_RESPONSE = "200 ok\r\n";
var SUCCESS_RESPONSE = ['200 ok'];

// var SUCCESS_RESPONSE_WITH_PARAMS = "201 Success with data:\r\nsomething: 123\r\nsomething else: test\r\n\r\n";
var SUCCESS_RESPONSE_WITH_PARAMS = [];
SUCCESS_RESPONSE_WITH_PARAMS.push('201 Success with data:');
SUCCESS_RESPONSE_WITH_PARAMS.push('something: 123');
SUCCESS_RESPONSE_WITH_PARAMS.push('something else: test');

// var SUCCESS_RESPONSE_WITH_UNPARSEABLE_PARAMS = "201 Success with data:\r\n<something-unexpected />\r\n\r\n";
var SUCCESS_RESPONSE_WITH_UNPARSEABLE_PARAMS = [];
SUCCESS_RESPONSE_WITH_UNPARSEABLE_PARAMS.push('201 Success with data:');
SUCCESS_RESPONSE_WITH_UNPARSEABLE_PARAMS.push('<something-unexpected />');

//var FAILURE_RESPONSE = "102 Failure";
var FAILURE_RESPONSE = ['102 Failure'];

// such case does not exists
// var FAILURE_RESPONSE_WITH_PARAMS = "102 Failure:\r\nsomething: 123\r\nsomething else: test\r\n\r\n";

// var ASYNC_RESPONSE = "512 Async event:\r\nprotocol version: 9.5\r\nmodel: xyz\r\ntime: 12:40:12\r\n\r\n";
var ASYNC_RESPONSE = [];
ASYNC_RESPONSE.push('512 Async event:');
ASYNC_RESPONSE.push('protocol version: 9.5');
ASYNC_RESPONSE.push('model: xyz');
ASYNC_RESPONSE.push('time: 12:40:12');

// var INVALID_RESPONSE = "something invalid";
var INVALID_RESPONSE = ['something invalid'];

var SUCCESS_RESPONSE_DATA = {
    type: "synchronousSuccess",
    data: {
        code: 200,
        text: "ok"
    }
};

var SUCCESS_PARAMS_RESPONSE_DATA = {
    type: "synchronousSuccess",
    data: {
        code: 201,
        text: "Success with data",
        rawData: 'something: 123\r\nsomething else: test',
        params: {
            something: "123",
            "something else": "test"
        }
    }
};

var SUCCESS_UNPARSEABLE_PARAMS_RESPONSE_DATA = {
    type: "synchronousSuccess",
    data: {
        code: 201,
        text: "Success with data",
        rawData: '<something-unexpected />',
        params: {}
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
        rawData: "something: 123\r\nsomething else: test",
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
        rawData: "protocol version: 9.5\r\nmodel: xyz\r\ntime: 12:40:12",
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

  // such case does not exists
//   it('should handle a response string with a failure status code and params', function() {
//     Parser.parse(FAILURE_RESPONSE_WITH_PARAMS).should.eql(FAILURE_PARAMS_RESPONSE_DATA);
//   });

  it('should handle a response string with an async status code', function() {
    Parser.parse(ASYNC_RESPONSE).should.eql(ASYNC_RESPONSE_DATA);
  });

  it('should throw an exception if the input string is not valid', function() {
    (function() {
        Parser.parse(INVALID_RESPONSE);
    }).should.throw();
  });

  it('should handle a response string with a success status code and unparseable params', function() {
    Parser.parse(SUCCESS_RESPONSE_WITH_UNPARSEABLE_PARAMS).should.eql(SUCCESS_UNPARSEABLE_PARAMS_RESPONSE_DATA);
  });

});