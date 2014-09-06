(function() {

  var pathname = window.location.pathname;

  var links = document.getElementsByTagName('a');
  for(var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if(href.indexOf('sheevaboite') !== -1 || href[0] === "/") {
      listenLinksClick(links[i], links[i].getAttribute('href'));
    }
  }

  document.getElementById('logo').style.top = 0;
  document.getElementById('content').style.opacity = 1;

  function listenLinksClick(item, url) {
    item.addEventListener('click', function(e) {
      if(!(e.metaKey === true || e.ctrlKey === true)) {
        e.preventDefault();
        leavePage(url);
      }
    });
  }

  function leavePage(url) {
    var logo = document.getElementById('logo');
    var back = document.getElementById('back');
    if(back) {
      document.getElementById('back').className = "fade-out row";
    }
    document.getElementById('content').className = 'fade-out';
    logo.className = logo.className + " slide-up";
    setTimeout(function(){
      window.location = url;
    }, 500);
  }

})();

