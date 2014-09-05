/**
 * Colback Asynchronous Messenger Abstraction
 * ===========================================
 *
 * Author: Yomguithereal
 */

// Dependencies
var Q = require('q'),
    core = require('./core.js');

// Utilities
function capitalize(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Constants
var DEFAULT_PARADIGM = 'promise';

// Internals
var name = 0;

// Main class
function Messenger(params) {
  var self = this;

  // Properties and defaults
  params = params || {};
  this.name = params.name || '' + (name++);
  this.timeout = params.timeout || 2000;
  this.paradigm = params.paradigm || DEFAULT_PARADIGM;

  var emitter = params.emitter,
      receptor = params.receptor,
      scope = params.scope || this;

  // Checking
  if (typeof receptor !== 'function' ||
      typeof emitter !== 'function')
    throw Error('colback.messenger: invalid emitter or receptor.');

  // Private
  var counter = 0,
      calls = {},
      listeners = {};

  // Sending message
  function send(header, body, timeoutOverride) {
    var deferred = Q.defer(),
        timeout = timeoutOverride || self.timeout;

    // Checking
    if (typeof timeout !== 'number' || !header)
      throw Error('colback.messenger.send: wrong parameters.');

    // Assigning identifier to call
    var id = counter++;

    // Registering call and its timeout
    calls[id] = {
      deferred: deferred,
      timeout: setTimeout(function() {
        deferred.reject('timeout');
      }, timeout)
    };

    // Using emitter to send message to server
    emitter.call(scope, {
      messenger: self.name,
      id: id,
      header: header,
      body: body
    });

    return deferred.promise;
  }

  // Replying
  function reply(id, body) {
    emitter.call(scope, {
      messenger: self.name,
      id: id,
      body: body
    });
  }

  // Bind a listener
  function bind(header, fn) {
    if (!(header in listeners))
      listeners[header] = [];
    listeners[header].push(fn);
  }

  // Unbind a listener
  function unbind(header, fn) {
    var idx = (listeners[header] || []).indexOf(fn);

    if (!listeners[header] || !~idx)
      throw Error('colback.messenger: trying to unbind an irrelevant function.');

    listeners[header].splice(idx, 1);
    if (!listeners[header].length)
      delete listeners[header];
  }

  // Receiving message
  receptor.call(scope, function(message) {
    message = message || {};

    // Ensuring message is correct
    if (!message.id || !message.messenger)
      return;

    // If a listener is configured, fire callback
    if (message.header in listeners)
      listeners[message.header].forEach(function(l) {
        l.call(self, message.body, function(data) {
          reply(message.id, data);
        })
      });

    // Ensuring message belongs to messenger
    if (message.messenger !== self.name)
      return;

    // Ensuring such a call was passed
    if (!(message.id in calls))
      return;

    // Resolving deferred
    calls[message.id].deferred.resolve(message.body);

    // Clearing stack
    clearTimeout(calls[message.id].timeout);
    delete calls[message.id];
  });

  // Main methods
  this.request = function(header, data, timeoutOverride) {
    return send(header, data, timeoutOverride);
  };

  this.on = function(header, fn) {
    bind(header, fn);
  };

  this.off = function(header, fn) {
    unbind(header, fn);
  };

  // Applying paradigm
  if (this.paradigm !== DEFAULT_PARADIGM)
    this.request = core(this.request, this)
      .from(DEFAULT_PARADIGM)
      .to(this.paradigm);
}

module.exports = Messenger;
