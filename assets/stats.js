/* GoatCounter utan kakor. Byt bara GOATCOUNTER_CODE om sajtkoden ändras. */
(function () {
  'use strict';

  if (window.__buskStats) return;
  window.__buskStats = true;

  var GOATCOUNTER_CODE = 'buskalendern';
  var COUNT_URL = 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count';

  var pending = [];

  function flush() {
    var gc = window.goatcounter;
    if (!gc || typeof gc.count !== 'function') return;
    var batch = pending;
    pending = [];
    for (var i = 0; i < batch.length; i++) {
      try { gc.count(batch[i]); }
      catch (err) { pending.push(batch[i]); }
    }
  }

  function track(eventPath, title) {
    if (!eventPath || eventPath.charAt(0) === '/') return;
    pending.push({
      path: eventPath,
      title: title || eventPath,
      event: true,
      referrer: location.pathname || '/',
      no_session: true
    });
    if (pending.length > 50) pending.shift();
    flush();
  }

  function filePath(href) {
    if (!href) return '';
    try {
      var url = new URL(href, document.baseURI || location.href);
      var path = url.pathname || '';
      try { path = decodeURIComponent(path); } catch (err) {}
      return path.replace(/^\/+/, '');
    } catch (err) {
      return '';
    }
  }

  function linkPath(a) {
    var href = a.getAttribute('href');
    if (!href) return '';
    href = href.replace(/^\s+|\s+$/g, '');
    if (!href || href.charAt(0) === '#') return '';
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return '';
    try {
      var url = new URL(href, document.baseURI || location.href);
      if (url.origin !== location.origin) return '';
    } catch (err) {
      return '';
    }
    return filePath(href);
  }

  function isFileLink(path) {
    return /(^|\/)filer\//.test(path) || /(^|\/)brev\//.test(path);
  }

  function closestLink(node) {
    while (node && node !== document) {
      if (node.tagName === 'A') return node;
      node = node.parentNode;
    }
    return null;
  }

  function onActivate(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    var a = closestLink(e.target);
    if (!a) return;
    var path = linkPath(a);
    if (!path) return;
    if (!a.hasAttribute('download') && !isFileLink(path)) return;
    track('dl/' + path, path);
  }
  document.addEventListener('click', onActivate, true);
  document.addEventListener('auxclick', onActivate, true);

  function mediaPath(el) {
    var src = el.currentSrc || el.getAttribute('src') || '';
    if (!src && el.getElementsByTagName) {
      var sources = el.getElementsByTagName('source');
      for (var i = 0; i < sources.length; i++) {
        src = sources[i].getAttribute('src') || '';
        if (src) break;
      }
    }
    return filePath(src);
  }

  document.addEventListener('play', function (e) {
    var el = e.target;
    if (!el || (el.tagName !== 'AUDIO' && el.tagName !== 'VIDEO')) return;
    if (el.getAttribute('data-busk-played')) return;
    var file = mediaPath(el);
    if (!file) return;
    el.setAttribute('data-busk-played', '1');
    track('play/' + file, file);
  }, true);

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.setAttribute('data-goatcounter', COUNT_URL);
  script.onload = flush;
  (document.head || document.documentElement).appendChild(script);
})();
