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
var guide = new EventEmitter();

var Client = function() {

  // Methods
  this.emitter = function(data) {
    guide.emit('clientMessage', data);
  };

  this.receptor = function(callback) {
    guide.on('serverMessage', callback);
  }
};

var Server = function() {

  // Methods
  this.emitter = function(data) {
    guide.emit('serverMessage', data);
  };

  this.receptor = function(callback) {
    guide.on('clientMessage', callback);
  };
};

/**
 * Testing
 */
describe('When dealing with simple messagers', function() {
  var client = new Client(),
      server = new Server();

  it('should be possible to instantiate one.', function() {
    var messenger = new colback.messenger({
      name: 'Ney',
      emitter: client.emitter,
      receptor: client.receptor
    });

    assert.equal(messenger.name, 'Ney');
  });
});
