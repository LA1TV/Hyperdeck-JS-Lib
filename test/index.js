var index = require('../src/index');

describe('index', function() {
  it('should provide the Hyperdeck class', function() {
    index.Hyperdeck.should.be.ok();
  });

  it('should provide the HyperdeckCore class', function() {
    index.HyperdeckCore.should.be.ok();
  });

  it('should provide the Logger class', function() {
    index.Logger.should.be.ok();
  });
});
