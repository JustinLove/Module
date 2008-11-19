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
  
  function require(filename, type) {
    var file = require.once(require.path.concat(filename).join('/'));
    if (file) {
      require.include(file, type);
    }
  }
  require.path = [];
  CGD.JS.require = require;

  require.include = function(file, type) {
    var inferredType = require.guessFileType(file, type);
    switch (inferredType) {
      case 'text/javascript':
        require.addTagToHead('script', {src: file, type: inferredType, language: 'javascript'});
        break;
      case 'text/css':
        require.addTagToHead('link', {href: file, type: inferredType, rel: 'stylesheet'});
        break;
      default:
        throw "Don't know how to include " + type;
    }
  };

  require.guessFileType = function(file, type) {
    if (type) {
      return type;
    } else {
      switch (file.match(/\.(\w*)$/)[1]) {
        case 'js': return 'text/javascript';
        case 'css': return 'text/css';
        default: return null;
      }
    }
  };

  require.addTagToHead = function(tag, attributes) {
    var element = document.createElement(tag);
    for (var a in attributes) {
      if (attributes.hasOwnProperty(a)) {
        element.setAttribute(a, attributes[a]);
      }
    }
    document.getElementsByTagName('head')[0].appendChild(element);
  };

  require.files = {};
  require.once = function(path) {
    if (require.files[path]) {
      return null;
    } else {
      return require.files[path] = require.root() + path;
    }
  };
  
  require.roots = [""];
  require.root = function() {
    return require.roots.slice(-1)[0];
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
  
  require.within = function(file, f) {
    var path = require.pathTo(file);
    var fullPath = require.findMe('script', 'src', file);
    if (fullPath) {
      var root = fullPath.slice(0, -file.length);
      require.rooted(root, function() {require.under(path, f);});
    } else {
      require.under(path, f);
    }
  };

  require.pathTo = function(file) {
    return file.slice(0,file.lastIndexOf('/'));
  };
  
  require.findMe = function(tag, attr, file) {
    var tags = document.getElementsByTagName(tag);
    var r = new RegExp(file + '$');
    for (var i = 0;i < tags.length;i++) {
      if (r.exec(tags[i][attr])) {
        return tags[i][attr];
      }
    }
  };

  require.alreadyNamed = function(tag, attr) {
    var tags = document.getElementsByTagName(tag);
    for (var i = 0;i < tags.length;i++) {
      var path = tags[i][attr];
      if (path.indexOf(require.root()) == 0) {
        require.files[path.substr(require.root().length)] = path;
      }
    }
  };
  
  require.rooted(require.pathTo(window.location + "") + '/', function() {
    require.alreadyNamed('script', 'src');
    require.alreadyNamed('link', 'href');
  });
}());
