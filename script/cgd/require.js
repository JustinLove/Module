// Creative Commons Attribution-Share Alike 3.0 Unported Licence
// http://creativecommons.org/licenses/by-sa/3.0/

var CGD = window.CGD || {};

// Global Object Definitions ;^)
CGD.god = window;

CGD.JS = CGD.JS || {};
(function() {

  function D(args) {
    if ('DEBUG' in CGD) {
      CGD.DEBUG.p.apply(CGD.DEBUG, arguments);
    }
  }
  
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

  require.roots = [""];
  require.root = function() {
    return require.roots.slice(-1)[0];
  };

  require.path = [];
  function require(filename, type) {
    var file = require.once(require.path.concat(filename).join('/'));
    if (file) {
      include(require.root() + file, type);
    }
  }
  
  require.files = {};
  require.once = function(path) {
    var p = findMe('script', 'src', path);
    return p ? null : path;
  };
  
  require.under = function(path, f) {
    require.path.push(path);
    f();
    require.path.pop();
  };
  
  require.rooted = function(path, f) {
    require.roots.push(path);
    f();
    require.roots.pop();
  };
  
  function pathTo(file) {
    return file.slice(0,file.lastIndexOf('/'));
  }
  
  require.within = function(file, f) {
    var fullPath = findMe('script', 'src', file);
    var path = pathTo(file);
    if (fullPath) {
      var root = fullPath.slice(0, -file.length);
      require.rooted(root, function() {require.under(path, f);});
    } else {
      require.under(path, f);
    }
  };
  
  function alreadyNamed(tag, attr) {
    var tags = document.getElementsByTagName(tag);
    for (var i = 0;i < tags.length;i++) {
      var path = tags[i][attr];
      if (path.indexOf(require.root()) == 0) {
        require.files[path.substr(require.root().length)] = path;
      }
    }
  }
  
  require.rooted(pathTo(window.location + "") + '/', function() {
    alreadyNamed('script', 'src');
    alreadyNamed('link', 'href');
  });
  
  CGD.JS.require = require;
}());
