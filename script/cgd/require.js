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
    this.load = {status: 'new'};
  };

  CGD.Dependency.prototype = {
    constructor: CGD.Dependency,
    register: function(files) {
      files[this.path] = this;
      files[this.canonicalPath] = this;
      return this;
    },
    status: function() {
      return this.load.status;
    },
    loaded: function() {
      this.load.status = 'loaded';
      return this;
    },
    aborted: function() {
      this.load = {status: 'aborted'};
      return this;
    },
    onloadFactory: function() {
      var file = this;
      var load = this.load = {status: 'pending'};
      return function() {
        switch (this.readyState) {
          case undefined:
          case 'loaded':
          case 'complete':
            load.status = 'loaded';
            break;
          default: break;
        }
      };
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
    this.queued = 0;
    if (fullPath) {
      this.root = fullPath.slice(0, -file.length);
    }
    this.cd(path);
    f(this);
    if (this.queued > 0) {
      this.files[file].aborted();
      this.require(file.slice(path.length));
      throw new require.DependenciesNotYetLoaded;
    }
  };
  
  CGD.Module.prototype = {
    path: '',
    root: '',
    files: {}, // typically shared by all instances
    constructor: CGD.Module,
    cd: function(path) {
      if (path != './') {
        this.path += path;
      }
    },
    under: function(path, f) {
      var m = this.beget();
      m.cd(path);
      f(m);
      this.queued += m.queued;
    },
    beget: function() {
      var F = function(){};
      F.prototype = this;
      return new F();
    },
    require: function(filename, type) {
      var x = this.fileFromPath(this.path + filename);
      switch (x.file.status()) {
        case 'new':
        case 'aborted':
          x.file.register(this.files);
          x.element.onload = x.element.onreadystatechange = x.file.onloadFactory();
          require.addElementToHead(x.element);
          this.queued++;
          break;
        case 'pending':
          this.queued++;
          break;
        case 'loaded': break;
        default: throw "unknown file status"; break;
      }
    },
    fileFromPath: function(path, type) {
      var file = this.files[path] || new CGD.Dependency(path, this.root + path);
      var element = file.element(type);
      file = this.files[file.canonicalPath] || file;
      return {file: file, element: element};
    },
    once: function(path) {
      if (this.files[path]) {
        return null;
      } else {
        return new CGD.Dependency(path, this.root + path);
      }
    },
    alreadyNamed: function(tag, attr) {
      var tags = document.getElementsByTagName(tag);
      for (var i = 0;i < tags.length;i++) {
        var fullPath = tags[i][attr];
        if (fullPath.indexOf(this.root) == 0) {
          var relativePath = fullPath.substr(this.root.length);
          new CGD.Dependency(relativePath, fullPath).register(this.files).loaded();
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
      return file.slice(0, slash+1);
    } else {
      return '';
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

  CGD.mod = new CGD.Module('require.js', function(m){
    m.root = require.pathTo(window.location.toString());
    m.alreadyNamed('script', 'src');
    m.alreadyNamed('link', 'href');
  });
  
}());
