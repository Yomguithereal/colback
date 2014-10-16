/**
 * Colback Public Interface
 * =========================
 *
 * Author: Yomguithereal
 */

// Dependencies
var colback = require('./src/core.js');

// Constants
var VERSION = '0.1.1';

// Overloading
Object.defineProperty(colback, 'version', {
  value: VERSION
});

// Exporting
module.exports = colback;
