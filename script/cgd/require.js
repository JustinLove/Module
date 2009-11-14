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

  require.onload = function() {
    switch (this.readyState) {
      case undefined:
      case 'loaded':
      case 'complete':
        require.complete[this.src] = true;
        require.loaded++;
        break;
      default: break;
    }
  };

  require.addTagToHead = function(tag, attributes) {
    var element = document.createElement(tag);
    for (var a in attributes) {
      if (attributes.hasOwnProperty(a)) {
        element.setAttribute(a, attributes[a]);
      }
    }
    element.onload = element.onreadystatechange = require.onload;
    document.getElementsByTagName('head')[0].appendChild(element);
  };

  require.files = {};
  require.queued = 0;
  require.once = function(path) {
    if (require.files[path]) {
      return null;
    } else {
      require.queued++;
      return require.files[path] = require.root() + path;
    }
  };
  
  require.roots = [""];
  require.root = function() {
    return require.roots.slice(-1)[0];
  };

  require.under = function(path, f) {
    require.path.push(path);
    try { f(); }
    finally { require.path.pop(); }
  };
  
  require.rooted = function(path, f) {
    require.roots.push(path);
    try { f(); }
    finally { require.roots.pop(); }
  };

  require.DependenciesNotYetLoaded = function() {};
  var dnyl = require.DependenciesNotYetLoaded.prototype;
  dnyl.name = "DependenciesNotYetLoaded";
  dnyl.message = "Not all dependencies loaded; file will be retried later.";
  dnyl.toString = function() {return this.name + ": " + this.message;};
  
  var window_onerror = window.onerror;
  window.onerror = require.onerror = function(message, url, line)  {
    if (message.match(dnyl.name)) {
      return true;
    } else {
      return window_onerror(message, url, line);
    }
  };
  
  require.within = function(file, f) {
    var path = require.pathTo(file);
    var fullPath = require.findMe('script', 'src', file);
    var queued = require.queued;
    if (fullPath) {
      var root = fullPath.slice(0, -file.length);
      require.rooted(root, function() {require.under(path, f);});
    } else {
      require.under(path, f);
    }
    if (require.queued > queued) {
      require.include(file);
      throw new require.DependenciesNotYetLoaded;
    }
  };

  require.pathTo = function(file) {
    var slash = file.lastIndexOf('/');
    if (slash >= 1) {
      return file.slice(0,slash);
    } else {
      return ".";
    }
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

  require.complete = {};
  require.loaded = 0;
  require.alreadyNamed = function(tag, attr) {
    var tags = document.getElementsByTagName(tag);
    for (var i = 0;i < tags.length;i++) {
      var path = tags[i][attr];
      if (path.indexOf(require.root()) == 0) {
        require.queued++;
        require.files[path.substr(require.root().length)] = path;
        require.files[path] = path;
        require.loaded++;
        require.complete[path] = true;
      }
    }
  };
  
  require.rooted(require.pathTo(window.location + "") + '/', function() {
    require.alreadyNamed('script', 'src');
    require.alreadyNamed('link', 'href');
  });
  
  CGD.Dependency = function(path, fullPath) {
    this.path = path || fullPath.substr(require.root().length);
    this.canonicalPath = fullPath || (require.root() + path);
  };
  
  CGD.Dependency.prototype = {
    constructor: CGD.Dependency,
    register: function() {
      require.files[this.path] = this;
      require.files[this.canonicalPath] = this;
      require.queued++;
      return this;
    }
  };
  
}());
