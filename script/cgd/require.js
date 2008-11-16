// Creative Commons Attribution-Share Alike 3.0 Unported Licence
// http://creativecommons.org/licenses/by-sa/3.0/

var CGD = window.CGD || {};

// Global Object Definitions ;^)
CGD.god = window;

CGD.JS = CGD.JS || {};
(function() {
  function addTagToHead(tag, attributes) {
    var element = document.createElement(tag);
    for (var a in attributes) {
      if (attributes.hasOwnProperty(a)) {
        element.setAttribute(a, attributes[a]);
      }
    }
    document.getElementsByTagName('head')[0].appendChild(element);
  }

  function guessFileType(file, type) {
    if (type) {
      return type;
    } else {
      switch (file.match(/\.(\w*)$/)[1]) {
        case 'js': return 'text/javascript';
        case 'css': return 'text/css';
        default: return null;
      }
    }
  }

  function include(file, type) {
    var inferredType = guessFileType(file, type);
    switch (inferredType) {
      case 'text/javascript':
        addTagToHead('script', {src: file, type: inferredType, language: 'javascript'});
        break;
      case 'text/css':
        addTagToHead('link', {href: file, type: inferredType, rel: 'stylesheet'});
        break;
      default:
        throw "Don't know how to include " + type;
    }
  }

  requiredFiles = {};
  function require(file, type) {
    if (!requiredFiles[file]) {
      requiredFiles[file] = true;
      include(file, type);
    }
  }
  CGD.JS.require = require;
}());
