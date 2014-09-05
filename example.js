var sender = function(data) {
  window.postMessage(data, '*');
};

var receptor = function(callback) {
  window.addEventListener('message', function(msg) {
    callback(msg);
  });
};

var client = new colback.client({
  name:,
  sender
});
