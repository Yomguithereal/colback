/**
 * Colback Asynchronous Messenger Abstraction
 * ===========================================
 *
 * Author: Yomguithereal
 */

// Dependencies
var Q = require('q'),
    core = require('./core.js');

// Constants
var DEFAULT_PARADIGM = 'deferred',
    DEFAULT_TIMEOUT = 2000;

// Helpers
function indexOf(a, fn, scope) {
  for (var i = 0, l = a.length; i < l; i++) {
    if (fn.call(scope || null, a[i]))
      return i;
  }
  return -1;
}

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
      listeners = {};

  // Unilateral message
  function send(to, head, body) {
    if (!to)
      emitter.call(scope, {
        from: self.name,
        head: head,
        body: body
      });
    else
      emitter.call(scope, {
        from: self.name,
        to: to,
        head: head,
        body: body
      }, to);
  }

  // Sending message
  function request(to, head, body, params) {
    params = params || {};

    var deferred = Q.defer(),
        timeout = params.timeout || self.timeout;

    // Checking
    if (typeof timeout !== 'number')
      throw Error('colback.messenger.send: wrong parameters.');

    // Assigning identifier to call
    var id = counter++;

    // Registering call and its timeout
    calls[id] = {
      deferred: deferred,
      timeout: setTimeout(function() {
        deferred.reject(new Error('timeout'));
      }, timeout)
    };

    // Using emitter to send message to server
    if (to)
      emitter.call(scope, {
        from: self.name,
        to: to,
        id: id,
        head: head,
        body: body
      }, to);
    else
      emitter.call(scope, {
        from: self.name,
        id: id,
        head: head,
        body: body
      });

    return deferred.promise;
  }

  // Replying
  function reply(id, to, body) {
    emitter.call(scope, {
      to: to,
      from: self.name,
      id: id,
      body: body
    }, to);
  }

  // Bind a listener
  function bind(head, fn, onlyOnce, from) {
    if (!(head in listeners))
      listeners[head] = [];

    listeners[head].push({
      fn: fn,
      once: onlyOnce,
      from: from
    });
  }

  // Unbind a listener
  function unbind(head, fn) {
    if (typeof head === 'function') {
      fn = head;
      head = null;
    }

    if (head) {

      // Searching in head
      var idx = indexOf(listeners[head] || [], function(listener) {
        return listener.fn === fn;
      });

      if (!~idx)
        throw Error('colback.messenger: trying to unbind an irrelevant function.');

      listeners[head].splice(idx, 1);

      if (!listeners[head].length)
        delete listeners[head];
    }
    else if (typeof fn === 'function') {

      // Searching in every category
      var heads = Object.keys(listeners);

      heads.forEach(function(head) {
        var idx = indexOf(listeners[head] || [], function(listener) {
          return listener.fn === fn;
        });

        if (~idx) {
          listeners[head].splice(idx, 1);

          if (!listeners[head].length)
            delete listeners[head];
        }
      });
    }
    else {

      // Obliterating a category
      if (!(head in listeners))
        throw Error('colback.messenger: trying to unbind an irrelevant head.');
      delete listeners[head];
    }
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
    if (!message.from)
      return;

    // If a listener is configured, fire callback
    var haystack = (listeners[message.head] || []).concat(listeners['*'] || []);

    haystack.forEach(function(listener) {

      // Conditions
      if ((message.to && message.to !== self.name) ||
          (listener.from && message.from !== listener.from))
        return;

      listener.fn.call(self, message.body, function(data) {
        reply(message.id, message.from, data);
      });

      if (listener.once)
        unbind(listener.fn);
    });

    // Ensuring such a call was passed
    if (message.to !== self.name || !(message.id in calls))
      return;

    // Resolving deferred
    calls[message.id].deferred.resolve(message.body);

    // Clearing call timeout
    clearTimeout(calls[message.id].timeout);
    delete calls[message.id];
  });

  // Main methods
  this.request = function(head, data, params) {
    isShot();
    return request(null, head, data, params);
  };

  this.send = function(head, data) {
    isShot();
    send(null, head, data);
    return this;
  };

  this.on = function(from, head, fn) {
    isShot();

    if (typeof head === 'function')
      bind(from, head, false, null);
    else
      bind(head, fn, false, from);
    return this;
  };

  this.once = function(from, head, fn) {
    isShot();

    if (typeof head === 'function')
      bind(from, head, true, null);
    else
      bind(head, fn, true, from);
    return this;
  };

  this.off = function(head, fn) {
    isShot();
    unbind(head, fn);
    return this;
  };

  this.to = function(to) {
    return {
      send: function(head, data) {
        isShot();
        send(to, head, data);
        return this;
      },
      request: function(head, data, params) {
        isShot();
        return request(to, head, data, params);
      }
    };
  };

  this.from = function(from) {
    return {
      on: function(head, fn) {
        return self.on(from, head, fn);
      },
      once: function(head, fn) {
        return self.once(from, head, fn);
      },
      off: function(head, fn) {
        return self.off(from, fn);
      }
    };
  };

  this.shoot = function() {
    if (shot)
      throw Error('colback.messenger: this messenger has already been shot.' +
                  ' \'Twould be a bit overkill to shoot him again, no?');

    // Deleting listeners
    delete listeners;

    // Terminating calls
    for (var k in calls) {
      calls[k].deferred.reject(new Error('messenger-shot'));
      clearTimeout(call[k].timeout);
    };

    delete calls;

    shot = true;

    return this;
  };

  // Applying paradigm
  if (this.paradigm !== DEFAULT_PARADIGM)
    this.request = core(this.request, this)
      .from(DEFAULT_PARADIGM)
      .to(this.paradigm);
}

module.exports = Messenger;
