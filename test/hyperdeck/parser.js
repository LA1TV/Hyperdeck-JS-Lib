var Parser = require('../../src/hyperdeck/parser');

var SUCCESS_RESPONSE = [ '200 ok' ];
var SUCCESS_RESPONSE_WITH_PARAMS = [
    '201 Success with data:',
    'something: 123',
    'something else: test'
];
var SUCCESS_RESPONSE_WITH_UNPARSEABLE_PARAMS = [
    '201 Success with data:',
    '<something-unexpected />'
];
var FAILURE_RESPONSE = [ '102 Failure' ];
var ASYNC_RESPONSE = [
    '512 Async event:',
    'protocol version: 9.5',
    'model: xyz',
    'time: 12:40:12'
];
var INVALID_RESPONSE = [ 'something invalid' ];

var SUCCESS_RESPONSE_DATA = {
    type: 'synchronousSuccess',
    data: {
        code: 200,
        text: 'ok'
    }
};

var SUCCESS_PARAMS_RESPONSE_DATA = {
    type: 'synchronousSuccess',
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

var SUCCESS_UNPARSEABLE_PARAMS_RESPONSE_DATA = {
    type: 'synchronousSuccess',
    data: {
        code: 201,
        text: 'Success with data',
        rawData: '<something-unexpected />',
        params: {}
    }
};

var FAILURE_RESPONSE_DATA = {
    type: 'synchronousFailure',
    data: {
        code: 102,
        text: 'Failure'
    }
};

var ASYNC_RESPONSE_DATA = {
    type: 'asynchronous',
    data: {
        code: 512,
        text: 'Async event',
        rawData: 'protocol version: 9.5\r\nmodel: xyz\r\ntime: 12:40:12',
        params: {
            'protocol version': '9.5',
            model: 'xyz',
            time: '12:40:12'
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