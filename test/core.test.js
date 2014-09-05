/**
 * Colback Core Unit tests
 * ========================
 *
 * Author: Yomguithereal
 */
var assert = require('assert'),
    async = require('async'),
    Promise = require('promise'),
    colback = require('../index.js');

// TODO: add the deferred paradigm
// TODO: clearly state the difference between deferred and promises
// TODO: test with another promise engine
// TODO: document the question of event based API: not possible --> adhoc

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
        reject('failure');
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
  colback.paradigms.forEach(function(from) {
    colback.paradigms.forEach(function(to) {
      if (from === to)
        return;

      it('a function can go from ' + from + ' to ' + to + '.', function(done) {

        // Shifting function
        var fn = colback(functions[from]).from(from).to(to);

        // Testing
        tests[to](fn, done);
      });
    });
  });
});

/**
 * API Candy
 */
describe('When using the API', function() {

  it('should throw an exception when a requested paradigm does not exists.', function() {
    assert.throws(function() {
      colback(noop).from('unknown').to('classical');
    }, Error);

    assert.throws(function() {
      colback(noop).from('classical').to('unknown');
    }, Error);

    assert.throws(function() {
      colback(noop).from('unknown').to('unknown');
    }, Error);

    assert.doesNotThrow(function() {
      colback(noop).from('classical').to('baroque');
    }, Error);
  });

  it('should throw an exception when the argument passed to the main function is invalid.', function() {
    assert.throws(function() {
      colback(45).from('classical').to('baroque');
    }, Error);
  });

  it('should throw an exception when one is trying to shift a function to the same paradigm.', function() {
    assert.throws(function() {
      colback(noop).from('classical').to('classical');
    }, Error);
  });

  it('should use the specified scope.', function(done) {

    // Dummy class for the purpose of the test
    function Lib() {
      this.greeting = 'Hello!';
      this.greet = function(callback) {
        callback(null, this.greeting);
      };
    }

    // Instantiation
    var lib = new Lib();

    // Shifting the instance's method
    var shiftedGreet = colback(lib.greet, lib).from('modern').to('promise');

    // Testing
    async.parallel({
      normal: function(next) {
        lib.greet(function(err, greeting) {
          assert.equal(greeting, 'Hello!');
          next();
        });
      },
      shifted: function(next) {
        shiftedGreet().then(function(greeting) {
          assert.equal(greeting, 'Hello!');
          next();
        });
      }
    }, done);
  });

  it('should be able to return an object of shifted functions.', function(done) {

    // Original functions
    var original = {
      one: function(callback) {
        callback(null, 'success one');
      },
      two: function(callback) {
        callback(null, 'success two');
      }
    };

    // Shifting them
    var shifted = colback(original).from('modern').to('promise');

    // Correct keys?
    assert.deepEqual(Object.keys(shifted).join(' '), 'one two');

    // Correct functions?
    async.parallel({
      one: function(next) {
        shifted.one().then(function(result) {
          assert.equal(result, 'success one');
          next();
        });
      },
      two: function(next) {
        shifted.two().then(function(result) {
          assert.equal(result, 'success two');
          next();
        });
      }
    }, done);
  });

  it('should work with some strangely shaped classical functions.', function(done) {

    // Original functions
    var original = {
      loner: function(callback) {
        callback('success');
      },
      oneArg: function(key, callback) {
        callback('success');
      },
      twoArgs: function(key1, key2, callback) {
        callback('success');
      }
    };

    // Shifting them
    var shifted = colback(original).from('classical').to('modern');

    // Testing
    async.parallel({
      loner: function(next) {
        shifted.loner(function(err, result) {
          assert.equal(err, null);
          assert.equal(result, 'success');
          next();
        });
      },
      oneArg: function(next) {
        shifted.oneArg('key', function(err, result) {
          assert.equal(err, null);
          assert.equal(result, 'success');
          next();
        });
      },
      twoArgs: function(next) {
        shifted.twoArgs('key1', 'key2', function(err, result) {
          assert.equal(err, null);
          assert.equal(result, 'success');
          next();
        });
      }
    }, done);
  });
});
