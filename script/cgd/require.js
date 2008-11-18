// Creative Commons Attribution-Share Alike 3.0 Unported Licence
// http://creativecommons.org/licenses/by-sa/3.0/

var CGD = window.CGD || {};

// Global Object Definitions ;^)
CGD.god = window;

CGD.JS = CGD.JS || {};
(function() {
  function findMe(tag, attr, file) {
    var tags = document.getElementsByTagName(tag);
    var r = new RegExp(file + '$');
    for (var i = 0;i < tags.length;i++) {
      if (r.exec(tags[i][attr])) {
        return tags[i][attr];
      }
    }
  }
  
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

  require.files = {};
  function require(filename, type) {
    var file = require.path.concat(filename).join('/');
    if (!require.files[file]) {
      require.files[file] = true;
      include(file, type);
    }
  }
  require.path = [];
  
  require.under = function(path, f) {
    require.path.push(path);
    f();
    require.path.pop();
  };
  
  require.expect = function(path, f) {
    var p = require.path;
    if (p[p.length-1] == path) {
      f();
    } else {
      require.under(path, f);
    }
  };
  
  require.within = function(path, file, f) {
    var fullPath = findMe('script', 'src', file);
    if (fullPath) {
      require.under(fullPath.substr(0, fullPath.length - file.length - 1), f);
    } else {
      require.under(path, f);
    }
  };
  
  CGD.JS.require = require;
}());
