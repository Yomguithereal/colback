/**
 * Colback API Unit tests
 * =======================
 *
 * Author: Yomguithereal
 */
var assert = require('assert'),
    async = require('async'),
    colback = require('../index.js');

// TODO: add scoping tests
// TODO: add loner tests
// TODO: check exceptions on wrong paradigms

/**
 * Utilities
 */
var noop = function() {};

var functions = {
  classical: function(successful, callback, errback) {
    if (successful)
      callback('success');
    else
      errback('failure');
  }
};

/**
 * Paradigm shift
 */
describe('When shifting asynchronous paradigms', function() {

  // Tests
  it('a function can go from classical to baroque', function(done) {

    // Shifting function
    var baroque = colback(functions.classical).from('classical').to('baroque');

    // Testing success and failure
    async.parallel({
      success: function(next) {
        baroque(true, noop, function(result) {
          assert.equal(result, 'success');
          next();
        });
      },
      fail: function(next) {
        baroque(false, function(error) {
          assert.equal(error, 'failure');
          next();
        }, noop);
      }
    }, done);
  });

  it('a function can go from classical to modern', function(done) {

    // Shifting function
    var modern = colback(functions.classical).from('classical').to('modern');

    // Testing success and failure
    async.parallel({
      success: function(next) {
        modern(true, function(err, result) {
          assert.equal(result, 'success');
          next();
        });
      },
      fail: function(next) {
        modern(false, function(err) {
          assert.equal(err, 'failure');
          next();
        });
      }
    }, done);
  });
});
