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
