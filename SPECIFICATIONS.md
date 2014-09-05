# Specifications

## Asynchronous paradigms

**Classical**
```js
function(callback, errback);

// Example
xhr.get(
	function() {
		// Things went smoothely
	},
	function() {
		// Something went horribly wrong
	}
);
```

**Baroque**
```js
function(errback, callback);

// Example
xhr.get(
	function() {
		// Something went horribly wrong

	},
	function() {
		// Things went smoothely
	}
);
```

**Modern**

Note that sometimes, the paradigm does not provide for a errback, one should target classical then. (Or should I do a variant?)

```js
function(callback(err, results));

// Example
xhr.get(function(error, results) {
	if (error)
		// Something went horribly wrong
	else
		// Everything went smoothely
		results.doSomething();
});
```

**Incomplete**
```js
var instance = function(callback);

// Example
var results = xhr.get(function(error) {
	if (error)
		// Something went horribly wrong
	else
		results.doSomething();
});
```

**Promise**
```js
function().then(callback).fail(errback);

// Example
xhr.get()
	.then(function() {
		// Everything went smoothely
	})
	.fail(function() {
		// Something went horribly wrong
	});
```

**Events**
```js
var handler = function();
handler.onCallback = function();
handler.onErrback = function();
```

## API

```js
// Paradigm shift
var fixedFn = colback(fn).from('classical').to('baroque');

// Creating a messenger instance
var messenger = new colback.messenger(sender, receiver).to('classical');

// Setting the default promise engine if the user does not want the default one
colback.defaultPromise = function() {
	return Q.deferred();
};
```

## Full example
```js
// Let's imagine an API that want you to access a database likewise:
api.get('key', function(err, results) {
	console.log(results);
});

// You do not like that and you prefer promises?
// Well just use colback for a quick and painless paradigm shift
var newApiGet = colback(api.get).from('monofunction').to('promise');

// Then use it likewise:
newApiGet('key')
	.then(function(results) {

	})
	.fail(function(err) {

	});
```

## Messaging model
Enable colback to do it painlessly.
Grants a way to deal with event reception and such.
Recoherent something (strange neologism...)

## Goal
Coherent style throughout your own code.

## Target
Node.js (deps less) and browser through browserify.
