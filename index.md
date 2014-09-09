---
layout: page
title:  "Colback.js"
---

---

There are a lot of ways to deal with asynchronous flow in JavaScript. But, even if diversity must be cherished, it is sometimes a drag to gather libraries abiding by some different asynchronous paradigms.

**Colback.js** therefore aims at providing a straightforward utility to shift functions from one asynchronous paradigm to another.

<br>

---

## The ominous culprit

---

Let's say you want to write some fairly consistent code but need to use some libraries to gather and process data in an asynchronous fashion.

You start writing your ideas down and then, it strikes you: those libraries use two different paradigms:

```js
var library1 = require('lib1'),
    library2 = require('lib2');

// Library one uses a classical node.js asynchronous paradigm
library1.method('key', function(err, results) {

  // Library two uses promises
  library2.method(results.id).then(
    function() {
      // Everything went smoothly...
    },
    function() {
      // Something went horribly wrong...
    }
  );
});
```

Well, now you start to understand why the fine hussar on the top of the page looks pissed.

Rejoice however, for it is very simple, with **Colback.js** to get consistent again.

```js
var library1 = require('lib1'),
    library2 = require('lib2'),
    colback = require('colback');

// Let's assume you prefer promises over standard node.js way
var shiftedFunction = colback(library1.method).from('modern').to('promise');

// Now let's use our shifted function likewise
shiftedFunction('key').then(function(results) {
  library2.method(results.id).then(
    function() {
      // Everything went smoothly...
    },
    function() {
      // Something went horribly bad...
    }
  );
});
```

Note that **Colback.js** does not aim at solving callback hell. Some fairly good libraries such as [async](https://github.com/caolan/async) or [contra](https://github.com/bevacqua/contra) already exist for this kind of issues.

<br>

---

## Summary

---

* **[Installation](#installation)**
* **[Asynchronous paradigms](#paradigms)**
* **[Paradigm shifting](#shifting)**
* **[Messengers](#messengers)**
* [What the hell is a colback?](#explanation)
* [Contribution](#contribution)
* [License](#license)

<br>

---

<h2 id="installation">Installation</h2>

---

**Colback.js** can be used with Node.js, Phantom.js, and in the browser through [Browserify](http://browserify.org/).

To install with npm:

```js
npm install colback

// To install latest development version
npm install git+https://github.com/Yomguithereal/colback.git
```

Then require it:

```js
var colback = require('colback');
```

<br>

---

<h2 id="paradigms">Asynchronous paradigms</h2>

---

One can find at least five main asynchronous functions' paradigms in JavaScript.

### The classical paradigm

Good ol' way to deal with asynchronous flow in JavaScript.

```js
asyncFunction(
  function(result) {
    // Everything went smoothly...
  },
  function(err) {
    // Something went horribly wrong...
  }
);
```

### The baroque paradigm

Quite frankly, I'd wish this one not to exist at all but we can never be sure we won't step on it one day.

```js
asyncFunction(
  function(err) {
    // Something went horribly wrong...
  },
  function(result) {
    // Everything went smoothly...
  }
);
```

### The modern paradigm

The node.js style.

```js
asyncFunction(function(err, result) {
  if (err)
    // Something went horribly wrong...
  else
    // Everything went smoothly...
});
```

### The promise paradigm

The cool kids way?

```js
asyncFunction().then(
  function(result) {
    // Everything went smoothly...
  },
  function(err) {
    // Something went horribly wrong...
  }
);
```

**N.B.**: By default, **Colback.js** uses [then](https://www.npmjs.org/package/promise)'s promise implementation.

### The deferred paradigm

The cool kids other way?

```js
asyncFunction()
  .then(function(result) {
    // Everything went smoothly...
  })
  .fail(function(err) {
    // Something went horribly wrong...
  });
```

**N.B.**: By default, **Colback.js** uses [Q](https://www.npmjs.org/package/q)'s deferred implementation.

<br>

---

<h2 id="shifting">Paradigm shifting</h2>

---

```js
var colback = require('colback');

var shiftedFunction = colback(originalFunction, [scope])
  .from(paradigm)
  .to(paradigm, [implementation]);

// Available paradigm, as stated before, are:
// 'classical', 'baroque', 'modern'
// 'promise' and 'deferred'
```

**Examples**

*Shifting a function from the promise paradigm to the modern one:*

```js
var modernFunction = colback(promiseFunction).from('promise').to('modern');
```

*Shifting a function that needs a precise scope:*

```js
// Example class
function Example() {

  this.salutation = 'Hello!';

  this.greet = function() {
    return this.salutation;
  };
}

// One would need the scope to be correct when applying this class' greeting method.
var example = new Example();

var shiftedMethod = colback(example.greet, example).from('modern').to('classical');
```

*Using your own `promise` or `deferred` implementation rather than defaults.*

```js
var myDeferred = require('deferred');

var shiftedFunction = colback(originalFunction)
  .from('classical')
  .to('deferred', myDeferred);
```

*Shifting a whole batch of functions at once*

```js
var originalFunctions = {
  one: function1,
  two: function2
};

var shiftedFunctions = colback(originalFunctions).from('deferred').to('classical');

// Now let's call them likewise:
shiftedFunctions.one();
shiftedFunctions.two();
```

<br>

---

<h2 id="messengers">Messengers</h2>

---

Even if this is quite simple to shift some functions from one paradigm to another, it remains difficult to use standard asynchronous functions in some precise use cases.

For instance, when using websockets, you might find yourself in a situation where you send a message to the server and you need to wait for its response before continuing.

Typically, this kind of messaging is often coded using event handlers, which is perfectly fine but feels clumsy at times.

You might prefer coding something like this:

```js
// You want this
socket.emit('message', function(err, result) {
  // Do something with server response.
});

// Rather than that
socket.emit('message');

socket.on('server-response', function(data) {
  // Do something with server response.
});
```

### Client & Server example usage

Let's assume we want to build a simple websocket client that would query a server to retrieve some data.

### Instantiation

```js
var colback = require('colback');

var messenger = colback.messenger(config);
```

* **emitter** *function* : a function taking the data to send and emitting messages.
* **receptor** *function* : a function taking a callback and boostrapping the message reception.
* **timeout** *?number* [`2000`] : default call timeout in milliseconds.
* **paradigm** *?string* [`'deferred'`] : the desired paradigm for the messenger's methods.

### Methods

*request*

```js
// Sending a message to another messenger and waiting a response
var promise = messenger.request(header, data, timeoutOverride);

// Example
messenger.request('users', {id: 23})
  .then(function(user) {
    // Do something with retrieved user.
  });
```

*send*

```js
// Sending an unilateral message which does not need to be replied
messenger.send(header, data);

// Example
messenger.send('message', {hello: 'world'});
```

*on*

```js
// Bind a listener on a precise kind of message
messenger.on(header, callback);

// Example
messenger.on('users', function(data, reply) {

  // Do something with data, then send response
  reply({firstname: 'Joachim', lastname: 'Murat'});
});
```

*off*

```js
// Unbind a listener
messenger.on(header, callback);
```

*shoot*

```js
// Shoot the messenger and terminate its current call so
// it won't be able to communicate again.
messenger.shoot();
```

<br>

---

<h2 id="explanation">What the hell is a colback?</h2>

---

Colbacks are a kind of hat originating from Turkey and that were mainly worn by napoleonic cavalry.

Unfortunately there is no English Wikipedia article about this fine hat. So, if you are the adventurous kind, you could be that one person willing to translate the French [page](http://fr.wikipedia.org/wiki/Colback). Note that if you do, I shall praise you until the end of times.

If you feel frustrated by this lack of sources but still want to quench your thirst about napoleonic headgear, have this [page](http://en.wikipedia.org/wiki/Shako) about shakos instead.

The phonetic proximity between "callback" and "colback" is of course strictly coincidental.

<br>

---

<h2 id="contribution">Contribution</h2>

---

[![Build Status](https://travis-ci.org/medialab/artoo.svg)](https://travis-ci.org/Yomguithereal/colback)

Contributions are more than welcome. Just remember to add and pass relevant unit tests before submitting any changes.

```bash
# Installing package dependencies
npm install

# Running tests
npm test
```

<br>

---

<h2 id="license">License</h2>

---

The MIT License (MIT)

Copyright (c) 2014 Guillaume Plique

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---
