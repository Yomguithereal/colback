/**
 * Colback Messenger Unit tests
 * =============================
 *
 * Author: Yomguithereal
 */
var assert = require('assert'),
    EventEmitter = require('events').EventEmitter,
    colback = require('../index.js');

/**
 * Utilities
 */
var Client = function(guide) {

  // Methods
  this.emitter = function(data) {
    guide.emit('clientMessage', data);
  };

  this.receptor = function(callback) {
    guide.on('serverMessage', callback);
  }
};

var Server = function(guide) {

  // Methods
  this.emitter = function(data) {
    guide.emit('serverMessage', data);
  };

  this.receptor = function(callback) {
    guide.on('clientMessage', callback);
  };
};

var pair = function() {
  var guide = new EventEmitter();
  return {
    guide: guide,
    client: new Client(guide),
    server: new Server(guide)
  };
};

/**
 * Testing
 */
describe('When dealing with messenger API polymorphism', function() {
  this.timeout(4000);

  it('should throw an exception when passing wrong parameters.', function() {
    assert.throws(function() {
      new colback.messenger({receptor: 14});
    }, Error);

    assert.throws(function() {
      new colback.messenger({emitter: 'this is obviously not a function.'});
    }, Error);

    assert.throws(function() {
      new colback.messenger();
    }, Error);
  });

  it('should convert to the required paradigm.', function(done) {
    var p = pair();

    var clientMessenger = new colback.messenger({
      name: 'Soult',
      emitter: p.client.emitter,
      receptor: p.client.receptor,
      paradigm: 'modern'
    });

    var serverMessenger = new colback.messenger({
      name: 'Mortier',
      emitter: p.server.emitter,
      receptor: p.server.receptor
    });

    serverMessenger.on('message', function(data, reply) {
      reply('received');
    });

    clientMessenger.request('message', 'merde', function(err, data) {
      assert.equal(data, 'received');
      done();
    });
  });
});

describe('When dealing with messagers', function() {
  it('should be possible to instantiate one.', function() {
    var client = pair().client;

    var messenger = new colback.messenger({
      name: 'Berthier',
      emitter: client.emitter,
      receptor: client.receptor
    });

    assert.equal(messenger.name, 'Berthier');
  });

  it('should be possible to wait for a message to be replied.', function(done) {
    var p = pair();

    var clientMessenger = new colback.messenger({
      name: 'Ney',
      emitter: p.client.emitter,
      receptor: p.client.receptor
    });

    var serverMessenger = new colback.messenger({
      name: 'Murat',
      emitter: p.server.emitter,
      receptor: p.server.receptor
    });

    serverMessenger.on('message', function(data, reply) {
      reply('received');
    });

    clientMessenger.request('message', 'merde')
      .then(function(data) {
        assert.equal(data, 'received');
        done();
      });
  });

  it('should be possible to emit an unilateral message.', function(done) {
    var p = pair();

    var clientMessenger = new colback.messenger({
      name: 'Davout',
      emitter: p.client.emitter,
      receptor: p.client.receptor
    });

    p.guide.once('clientMessage', function(data) {
      assert.deepEqual(data, {
        messenger: 'Davout',
        head: 'more',
        body: 'troops',
      });

      done();
    });

    clientMessenger.send('more', 'troops');
  });

  it('should timeout calls correctly.', function(done) {
    var p = pair();

    var clientMessenger = new colback.messenger({
      name: 'Bernadotte',
      emitter: p.client.emitter,
      receptor: p.client.receptor
    });

    clientMessenger.request('message', 'roi', 10)
      .fail(function(err) {
        assert.equal(err.reason, 'timeout');
        done();
      });
  });
});
