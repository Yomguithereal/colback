/**
 * Colback API Unit tests
 * =======================
 *
 * Author: Yomguithereal
 */
var assert = require('assert'),
    async = require('async'),
    Promise = require('promise'),
    colback = require('../index.js');

// TODO: add scoping tests
// TODO: add loner tests
// TODO: check exceptions on wrong paradigms
// TODO: test with another promise engine

/**
 * Utilities
 */
var noop = function() {};

// Input functions
var functions = {
  classical: function(successful, callback, errback) {
    if (successful)
      callback('success');
    else
      errback('failure');
  },
  baroque: function(successful, errback, callback) {
    if (successful)
      callback('success');
    else
      errback('failure');
  },
  modern: function(successful, callback) {
    if (successful)
      callback(null, 'success');
    else
      callback('failure');
  },
  promise: function(successful) {
    return new Promise(function(resolve, reject) {
      if (successful)
        resolve('success');
      else
        resolve('failure');
    });
  }
};

// Output testing
var tests = {
  classical: function(fn, done) {
    async.parallel({
      success: function(next) {
        fn(true, function(result) {
          assert.equal(result, 'success');
          next();
        }, noop);
      },
      fail: function(next) {
        fn(false, noop, function(error) {
          assert.equal(error, 'failure');
          next();
        });
      }
    }, done);
  },
  baroque: function(fn, done) {
    async.parallel({
      success: function(next) {
        fn(true, noop, function(result) {
          assert.equal(result, 'success');
          next();
        });
      },
      fail: function(next) {
        fn(false, function(error) {
          assert.equal(error, 'failure');
          next();
        }, noop);
      }
    }, done);
  },
  modern: function(fn, done) {
    async.parallel({
      success: function(next) {
        fn(true, function(err, result) {
          assert.equal(result, 'success');
          next();
        });
      },
      fail: function(next) {
        fn(false, function(err) {
          assert.equal(err, 'failure');
          next();
        });
      }
    }, done);
  },
  promise: function(fn, done) {
    async.parallel({
      success: function(next) {
        fn(true)
          .then(function(result) {
            assert.equal(result, 'success');
            next();
          });
      },
      fail: function(next) {
        fn(false)
          .then(noop, function(err) {
            assert.equal(err, 'failure');
            next();
          });
      }
    }, done);
  }
};

/**
 * Paradigm shift
 */
describe('When shifting asynchronous paradigms', function() {

  // Global testing
  ['classical', 'baroque'].forEach(function(from) {
    colback.paradigms.forEach(function(to) {
      if (from === to)
        return;

      it('a function can go from ' + from + ' to ' + to, function(done) {

        // Shifting function
        var fn = colback(functions[from]).from(from).to(to);

        // Testing
        tests[to](fn, done);
      });
    });
  });
});
