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
    client: new Client(guide),
    server: new Server(guide)
  };
};

/**
 * Testing
 */
describe('When dealing with messenger API polymorphism', function() {
  this.timeout(4000);

  it('is a dummy test.', function() {
    assert(true);
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

  it('should be possible to wait for a message to be replied', function(done) {
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
});
