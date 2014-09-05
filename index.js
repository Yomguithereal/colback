/**
 * Colback Public Interface
 * =========================
 *
 * Author: Yomguithereal
 */

// Dependencies
var Promise = require('promise');

// Constants
var PARADIGMS = [
  'classical',
  'baroque',
  'modern',
  'promise'
];

// Helpers
function atoa(a) {
  return Array.prototype.slice.call(a, 0);
};

function noop() {}

function checkParadigm(paradigm) {
  if (!~PARADIGMS.indexOf(paradigm))
    throw Error('colback: unknown paradigm (' + paradigm + ')');
}

// Main function
function colback(fn, scope) {
  return {
    from: function(fromParadigm) {
      checkParadigm(fromParadigm);

      // Where do we want to go?
      return {
        to: function(toParadigm) {
          checkParadigm(toParadigm);
          return make(fn, scope || null, fromParadigm, toParadigm);
        }
      };
    }
  };
}

// Standard promise engine
colback.defaultPromise = function(fn) {
  return new Promise(fn);
};

// Arguments signatures
var signatures = {
  classical: function(args) {
    var a = atoa(args),
        l = a.length;

    // TODO: detect loners
    return {
      callback: a[l - 2],
      errback: a[l - 1],
      rest: l > 2 ? a.slice(0, -2) : []
    };
  },
  baroque: function(args) {
    var a = atoa(args),
        l = a.length;

    // TODO: detect loners
    return {
      callback: a[l - 1],
      errback: a[l - 2],
      rest: l > 2 ? a.slice(0, -2) : []
    };
  },
  modern: function(args) {
    var a = atoa(args),
        l = a.length;

    return {
      callback: a[l - 1],
      rest: l > 1 ? a.slice(0, -1) : []
    };
  },
  promise: function(args) {
    return {
      rest: atoa(args)
    };
  }
};

// Forge
function make(fn, scope, from, to) {

  // The idea here is always to analyze the target paradigm argument signature
  // to then apply it in a correct fashion to the original function.
  var cases = {

    // From classical
    classical: {
      baroque: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest.concat([a.callback, a.errback]));
        };
      },
      modern: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest.concat([
            function(result) {
              a.callback(null, result);
            },
            function(err) {
              a.callback(err || true);
            }
          ]));
        };
      },
      promise: function(signature) {
        return function() {
          var a = signature(arguments);

          return colback.defaultPromise(function(resolve, reject) {
            fn.apply(scope, a.rest.concat([
              function(result) {
                resolve(result);
              },
              function(err) {
                reject(err);
              }
            ]));
          });
        };
      }
    },

    // From baroque
    baroque: {
      classical: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest.concat([a.errback, a.callback]));
        };
      },
      modern: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest.concat([
            function(err) {
              a.callback(err || true);
            },
            function(result) {
              a.callback(null, result);
            }
          ]));
        };
      },
      promise: function(signature) {
        return function() {
          var a = signature(arguments);

          return colback.defaultPromise(function(resolve, reject) {
            fn.apply(scope, a.rest.concat([
              function(err) {
                reject(err);
              },
              function(result) {
                resolve(result);
              }
            ]));
          });
        };
      }
    }
  };

  return cases[from][to](signatures[to]);
}

// Overloading
Object.defineProperty(colback, 'paradigms', {
  value: PARADIGMS
});

// Exporting
module.exports = colback;
