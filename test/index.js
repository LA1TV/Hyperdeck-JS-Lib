var index = require('../src/index');

describe('index', function() {
  it('should provide the Hyperdeck class', function() {
    index.Hyperdeck.should.be.ok;
  });
});
