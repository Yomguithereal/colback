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
function noop() {}

function atoa(a) {
  return Array.prototype.slice.call(a, 0);
};

function isPlainObject(v) {
  return v instanceof Object &&
         !(v instanceof Array) &&
         !(v instanceof Function);
}

function checkParadigm(paradigm) {
  if (!~PARADIGMS.indexOf(paradigm))
    throw Error('colback: unknown paradigm (' + paradigm + ')');
}

// Main function
function colback(fn, scope) {

  // Checking
  if (!isPlainObject(fn) && typeof fn !== 'function')
    throw Error('colback: first argument must be a function or an object.');

  // Process
  return {
    from: function(fromParadigm) {
      checkParadigm(fromParadigm);

      // Where do we want to go?
      return {
        to: function(toParadigm, engine) {
          checkParadigm(toParadigm);

          if (typeof fn === 'function') {
            return make(fn, scope || null, fromParadigm, toParadigm, engine);
          }
          else {
            var original = fn,
                shifted = {},
                k;

            for (k in original) {
              if (typeof original[k] === 'function')
                shifted[k] = make(original[k], scope || null, fromParadigm, toParadigm, engine);
            }

            return shifted;
          }
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
function make(fn, scope, from, to, engine) {
  engine = colback.defaultPromise || engine;

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

          return engine(function(resolve, reject) {
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

          return engine(function(resolve, reject) {
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
    },

    // From modern
    modern: {
      classical: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest.concat(function(err, result) {
            if (!err)
              a.callback(result);
            else
              a.errback(err);
          }));
        };
      },
      baroque: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest.concat(function(err, result) {
            if (!err)
              a.callback(result);
            else
              a.errback(err);
          }));
        };
      },
      promise: function(signature) {
        return function() {
          var a = signature(arguments);
          return engine(function(resolve, reject) {
            fn.apply(scope, a.rest.concat(function(err, result) {
              if (!err)
                resolve(result);
              else
                reject(err);
            }));
          });
        };
      }
    },

    // From promise
    promise: {
      classical: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest)
            .then(
              function(result) {
                a.callback(result);
              },
              function(err) {
                a.errback(err);
              }
            );
        };
      },
      baroque: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest)
            .then(
              function(result) {
                a.callback(result);
              },
              function(err) {
                a.errback(err);
              }
            );
        };
      },
      modern: function(signature) {
        return function() {
          var a = signature(arguments);
          fn.apply(scope, a.rest)
            .then(
              function(result) {
                a.callback(null, result);
              },
              function(err) {
                a.callback(err || true);
              }
            );
        };
      }
    }
  };

  if (from === to)
    throw Error('colback: trying to shift a function to the same paradigm.');
  return cases[from][to](signatures[to]);
}

// Overloading
Object.defineProperty(colback, 'paradigms', {
  value: PARADIGMS
});

// Exporting
module.exports = colback;
