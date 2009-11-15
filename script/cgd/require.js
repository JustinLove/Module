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

  CGD.Dependency = function(path, fullPath) {
    this.path = path;
    this.canonicalPath = fullPath || path;
    this.type = require.guessFileType(this.path);
  };

  CGD.Dependency.prototype = {
    constructor: CGD.Dependency,
    register: function() {
      require.files[this.path] = this;
      require.files[this.canonicalPath] = this;
      require.queued++;
      return this;
    },
    element: function(type) {
      var inferredType = type || this.type;
      switch (inferredType) {
        case 'text/javascript':
          var element = require.makeTag('script', {src: this.canonicalPath, type: inferredType, language: 'javascript'});
          this.canonicalPath = element.src;
          return element;
        case 'text/css':
          var element = require.makeTag('link', {href: this.canonicalPath, type: inferredType, rel: 'stylesheet'});
          this.canonicalPath = element.href;
          return element;
        default:
          throw "Don't know how to include " + type;
      }
    }
  };

  CGD.Module = function(file, f) {
    var path = require.pathTo(file);
    var fullPath = require.findMe('script', 'src', file);
    var queued = require.queued;
    var m = this;
    if (fullPath) {
      var root = fullPath.slice(0, -file.length);
      require.rooted(root, function() {m.under(path, f);});
    } else {
      m.under(path, f);
    }
    if (require.queued > queued) {
      require.include(file);
      throw new require.DependenciesNotYetLoaded;
    }
  };
  
  CGD.Module.prototype = {
    path: '',
    constructor: CGD.Module,
    under: function(path, f) {
      var m = this.beget();
      m.path = m.path + path + '/';
      f(m);
    },
    beget: function() {
      var F = function(){};
      F.prototype = this;
      return new F();
    },
    require: function(filename, type) {
      var file = this.once(this.path + filename);
      if (file) {
        var element = file.element(type);
        if (!require.files[file.canonicalPath]) {
          file.register();
          element.onload = element.onreadystatechange = require.onload;
          require.addElementToHead(element);
        }
      }
    },
    once: function(path) {
      if (require.files[path]) {
        return null;
      } else {
        return new CGD.Dependency(path, require.root() + path);
      }
    },
    alreadyNamed: function(tag, attr) {
      var tags = document.getElementsByTagName(tag);
      for (var i = 0;i < tags.length;i++) {
        var fullPath = tags[i][attr];
        if (fullPath.indexOf(require.root()) == 0) {
          var relativePath = fullPath.substr(require.root().length);
          new CGD.Dependency(relativePath, fullPath).register();
          require.loaded++;
          require.complete[fullPath] = true;
        }
      }
    }
  };

  function require(filename, type) {
    CGD.mod.require(filename, type);
  }
  CGD.JS.require = require;

  require.include = function(file, type) {
    if (typeof(file) == 'string') {
      file = new CGD.Dependency(file);
    }
    var element = file.element(type);
    require.addElementToHead(element);
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

  require.guessFileType = function(path) {
    return {
      'js': 'text/javascript',
      'css': 'text/css'
    }[path.match(/\.(\w*)$/)[1]];
  };

  require.makeTag = function(tag, attributes) {
    var element = document.createElement(tag);
    for (var a in attributes) {
      if (attributes.hasOwnProperty(a)) {
        element.setAttribute(a, attributes[a]);
      }
    }
    return element;
  };

  require.addElementToHead = function(element) {
    document.getElementsByTagName('head')[0].appendChild(element);
  };

  require.files = {};
  require.queued = 0;
  
  require.roots = [""];
  require.root = function() {
    return require.roots.slice(-1)[0];
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
    if (file[0] == '/') {
      var r = new RegExp(file + '$');
    } else {
      var r = new RegExp('/' + file + '$');
    }
    for (var i = 0;i < tags.length;i++) {
      if (r.exec(tags[i][attr])) {
        return tags[i][attr];
      }
    }
  };

  require.complete = {};
  require.loaded = 0;
  
  CGD.mod = new CGD.Module('require.js', function(){});
  
  require.rooted(require.pathTo(window.location + "") + '/', function() {
    CGD.mod.alreadyNamed('script', 'src');
    CGD.mod.alreadyNamed('link', 'href');
  });
  
}());
