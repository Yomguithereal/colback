/**
 * Colback Public Interface
 * =========================
 *
 * Author: Yomguithereal
 */

// Dependencies
var colback = require('./src/core.js'),
    Messenger = require('./src/messenger.js');

// Constants
var VERSION = '0.0.1';

// Overloading
Object.defineProperty(colback, 'version', {
  value: VERSION
});

colback.messenger = Messenger;
colback.estafet = Messenger;

// Exporting
module.exports = colback;
