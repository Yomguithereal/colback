/**
 * Colback Asynchronous Messenger Abstraction
 * ===========================================
 *
 * Author: Yomguithereal
 */

// Dependencies
var Q = require('q'),
    core = require('./core.js');

// TODO: work the unbinding correctly
// TODO: store currently used names?
// Constants
var DEFAULT_PARADIGM = 'deferred',
    DEFAULT_TIMEOUT = 2000;

// Main class
function Messenger(params) {
  var self = this;
  params = params || {};

  // Checking name
  if (typeof params.name !== 'string')
    throw Error('colback.messenger: messengers must be given a name.');

  // Properties and defaults
  this.name = params.name;
  this.timeout = params.timeout || DEFAULT_TIMEOUT;
  this.paradigm = params.paradigm || DEFAULT_PARADIGM;

  var emitter = params.emitter,
      receptor = params.receptor,
      scope = params.scope || this,
      shot = false;

  // Checking
  if (typeof receptor !== 'function' ||
      typeof emitter !== 'function')
    throw Error('colback.messenger: invalid emitter or receptor.');

  // Private
  var counter = 0,
      calls = {},
      listeners = {},
      onceListeners = [];

  // Sending message
  function request(head, body, timeoutOverride) {
    var deferred = Q.defer(),
        timeout = timeoutOverride || self.timeout;

    // Checking
    if (typeof timeout !== 'number' || !head)
      throw Error('colback.messenger.send: wrong parameters.');

    // Assigning identifier to call
    var id = counter++;

    // Registering call and its timeout
    calls[id] = {
      deferred: deferred,
      timeout: setTimeout(function() {
        deferred.reject({reason: 'timeout'});
      }, timeout)
    };

    // Using emitter to send message to server
    emitter.call(scope, {
      messenger: self.name,
      id: id,
      head: head,
      body: body
    });

    return deferred.promise;
  }

  // Unilateral message
  function send(to, head, body) {
    if (!body)
      emitter.call(scope, {
        messenger: self.name,
        head: to,
        body: head
      });
    else
      emitter.call(scope, {
        messenger: self.name,
        to: to,
        head: head,
        body: body
      });
  }

  // Replying
  function reply(id, to, body) {
    emitter.call(scope, {
      to: to,
      messenger: self.name,
      id: id,
      body: body
    });
  }

  // Bind a listener
  function bind(head, fn, onlyOnce) {
    if (!(head in listeners))
      listeners[head] = [];
    listeners[head].push(fn);

    if (onlyOnce)
      onceListeners.push(onlyOnce);
  }

  // Unbind a listener
  function unbind(head, fn) {
    var idx = (listeners[head] || []).indexOf(fn);

    if (!listeners[head] || !~idx)
      throw Error('colback.messenger: trying to unbind an irrelevant function.');

    listeners[head].splice(idx, 1);
    if (!listeners[head].length)
      delete listeners[head];

    // Dropping from once
    idx = onlyOnce.indexOf(fn);
    if (~idx)
      onlyOnce.splice(idx, 1);
  }

  // Is the messenger shot?
  function isShot() {
    if (shot)
      throw Error('colback.messenger: this messenger has been shot.');
  }

  // Receiving message
  receptor.call(scope, function(message) {
    message = message || {};

    // Ensuring message is correct
    if (!message.messenger)
      return;

    // If a listener is configured, fire callback
    if ((message.head in listeners || (listeners['*'] || []).length) &&
        (message.to === self.name || !message.to))
      (listeners[message.head] || [])
        .concat(listeners['*'] || [])
        .forEach(function(l) {
          l.call(self, message.body, function(data) {
            reply(message.id, message.messenger, data);
          });

          // Unbinding listener if needed
          if (~onceListeners.indexOf(l))
            unbind(l);
        }
      );

    // Ensuring message belongs to messenger
    if (message.to !== self.name)
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
  this.request = function(head, data, timeoutOverride) {
    isShot();
    return request(head, data, timeoutOverride);
  };

  this.send = function(to, head, data) {
    isShot();
    send(to, head, data);
  };

  this.on = function(head, fn) {
    isShot();
    bind(head, fn);
  };

  this.once = function(head, fn) {
    isShot();
    bind(head, fn);
  };

  this.off = function(head, fn) {
    isShot();
    unbind(head, fn);
  };

  this.shoot = function() {
    if (shot)
      throw Error('colback.messenger: this messenger has already been shot.' +
                  ' \'Twould be a bit overkill to shoot him again, no?');

    // Deleting listeners
    delete listeners;

    // Terminating calls
    for (var k in calls) {
      calls[k].deferred.reject({reason: 'shot'});
      clearTimeout(call[k].timeout);
    };

    delete calls;

    shot = true;
  };

  // Applying paradigm
  if (this.paradigm !== DEFAULT_PARADIGM)
    this.request = core(this.request, this)
      .from(DEFAULT_PARADIGM)
      .to(this.paradigm);
}

module.exports = Messenger;
