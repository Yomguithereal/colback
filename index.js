/**
 * Colback Public Interface
 * =========================
 *
 * Author: Yomguithereal
 */

// Constants
var PARADIGMS = [
  'classical',
  'baroque',
  'modern',
  'incomplete',
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

// Arguments signatures
var signatures = {
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
      }
    }
  };

  return cases[from][to](signatures[to]);
}

// Overloading
colback.paradigms = PARADIGMS;

// Exporting
module.exports = colback;
