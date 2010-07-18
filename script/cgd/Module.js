// Creative Commons Attribution-Share Alike 3.0 Unported Licence
// http://creativecommons.org/licenses/by-sa/3.0/

var CGD = window.CGD || {};

// Global Object Definitions ;^)
CGD.god = window;

(function() {

  function D(args) {
    if ('DEBUG' in CGD) {
      CGD.DEBUG.p.apply(CGD.DEBUG, arguments);
    }
  }

  CGD.html = CGD.html || {};

  CGD.html.makeTag = function(tag, attributes) {
    var element = document.createElement(tag);
    for (var a in attributes) {
      if (attributes.hasOwnProperty(a)) {
        element.setAttribute(a, attributes[a]);
      }
    }
    return element;
  };

  CGD.html.addElementToHead = function(element) {
    document.getElementsByTagName('head')[0].appendChild(element);
  };

  CGD.html.findMe = function(tag, attr, filename) {
    var tags = document.getElementsByTagName(tag);
    if (filename[0] == '/') {
      var r = new RegExp(filename + '$');
    } else {
      var r = new RegExp('/' + filename + '$');
    }
    for (var i = 0;i < tags.length;i++) {
      if (r.exec(tags[i][attr])) {
        return tags[i][attr];
      }
    }
  };

  CGD.Dependency = function(identifier, type) {
    this.id = identifier;
    this.type = type || 'text/javascript';
    this.uri = identifier + CGD.Dependency.guessFileExtension(this.type);
    this.load = {status: 'new'};
    this.exports = {};
  };

  CGD.Dependency.prototype = {
    constructor: CGD.Dependency,
    canonically: function(fullPath) {
      this.uri = fullPath;
      return this;
    },
    under: function(root) {
      this.uri = root + this.uri;
      return this;
    },
    improve: function(files) {
      var x = this;
      x = files[x.uri] || files[x.id] || x;
      var fullPath = CGD.html.findMe('script', 'src', x.uri);
      if (fullPath) {
        x = files[fullPath] || x.canonically(fullPath);
      } else {
        x.element();
        x = files[x.uri] || x;
      }
      return x;
    },
    register: function(files) {
      files[this.id] = this;
      files[this.uri] = this;
      return this;
    },
    status: function() {
      return this.load.status;
    },
    loaded: function() {
      this.load.status = 'loaded';
      this.load.continuation && this.load.continuation();
      this.load.continuation = null;
      return this;
    },
    pending: function(continuation) {
      var old = this.load.continuation;
      delete(this.load.continuation);
      this.load = {status: 'pending', continuation: continuation || old};
      return this;
    },
    aborted: function() {
      var old = this.load.continuation;
      delete(this.load.continuation);
      this.load = {status: 'aborted', continuation: old};
      return this;
    },
    onloadFactory: function(continuation) {
      this.pending(continuation);
      var load = this.load;
      return function() {
        switch (this.readyState) {
          case undefined:
          case 'loaded':
          case 'complete':
            load.status = 'loaded';
            load.continuation && load.continuation();
            load.continuation = null;
            break;
          default: break;
        }
      };
    },
    element: function(overrideType) {
      var type = overrideType || this.type;
      switch (type) {
        case 'text/javascript':
          var element = CGD.html.makeTag('script',
            {src: this.uri, type: type, language: 'javascript'});
          this.uri = element.src;
          return element;
        case 'text/css':
          var element = CGD.html.makeTag('link', 
            {href: this.uri, type: type, rel: 'stylesheet'});
          this.uri = element.href;
          return element;
        default:
          throw "Don't know how to include " + type;
      }
    },
    include: function(overrideType, continuation) {
      var element = this.element(overrideType);
      var type = overrideType || this.type;
      switch (type) {
        case 'text/javascript':
          element.onload = element.onreadystatechange = this.onloadFactory(continuation);
          break;
        default:
        case 'text/css':
          this.loaded();
          break;
      }
      CGD.html.addElementToHead(element);
      return this;
    }
  };

  CGD.Dependency.guessFileExtension = function(type) {
    return {
      'text/javascript': '.js',
      'text/css': '.css'
    }[type];
  };
  CGD.Dependency.relative = function(path) {
    var first = path.split('/')[0];
    return first == '.' || first == '..';
  };

  CGD.Module = function(identifier, f) {
    var module = this;
    this.block = function(m) {f && f(m);};
    this.continuation = function() {module.reTry();};
    this.file = new CGD.Dependency(identifier).improve(this.files).register(this.files);
    var filename = identifier + CGD.Dependency.guessFileExtension(this.file.type);
    this.root = this.file.uri.slice(0, -filename.length);
    this.cd(CGD.Module.pathTo(identifier));
    this.id = this.file.id;
    this.uri = this.file.uri;
    this.continuation.id = this.id;
    var module = this;
    this.boundRequire = function(identifier, type) {return module.require(identifier, type);};
    this.boundRequire.main = this.main;
    this.firstTry();
  };

  CGD.Module.prototype = {
    path: '',
    root: '',
    files: {}, // typically shared by all instances
    constructor: CGD.Module,
    cd: function(path) {
      this.path += path;
    },
    under: function(path, f) {
      var m = this.beget();
      m.cd(path);
      try {
        f(m);
      } finally {
        this.queued += m.queued;
      }
    },
    beget: function() {
      var F = function(){this.queued = 0;};
      F.prototype = this;
      return new F();
    },
    onNotLoaded: function(identifier) {
      // could be overridden to change behavior.
      throw new CGD.Module.FileNotYetLoaded(identifier);
    },
    globals: function(target) {
      target.exports = this.file.exports;
      target.require = this.boundRequire;
      target.module = this;
      return this;
    },
    include: function(identifier, type) {
      new CGD.Dependency(this.absoluteIdentifier(identifier), type).include(type);
    },
    require: function(identifier, type) {
      return this.enqueue(identifier, type) || this.onNotLoaded(identifier);
    },
    enqueue: function(identifier, type) {
      var file = this.fileFromIdentifier(this.absoluteIdentifier(identifier), type);
      switch (file.status()) {
        case 'new':
        case 'aborted':
          file.register(this.files).include(type, this.continuation);
          this.queued++;
          return null;
        case 'pending':
          file.count = (file.count || 0) + 1;
          if (file.count > 20) {
            throw new CGD.Module.UnmetDependency(file.uri);
          }
          this.queued++;
          return null;
        case 'loaded':
          return file.exports;
        default: throw "unknown file status";
      }
    },
    fileFromIdentifier: function(identifier, type) {
      return new CGD.Dependency(identifier, type).under(this.root).improve(this.files);
    },
    absoluteIdentifier: function(identifier) {
      if (CGD.Dependency.relative(identifier)) {
        return this.path + identifier;
      } else {
        return identifier;
      }
    },
    tryDependencies: function() {
      this.queued = 0;
      if (this.block) {
        try {
          this.block(this, this.boundRequire, this.file.exports);
        } catch (e) {
          if (!(e instanceof CGD.Module.FileNotYetLoaded)) {
            throw e;
          }
        }
      }
      return this.queued < 1;
    },
    isComplete: function() {
      if (this.file.complete) {
        return 'complete';
      } else if (this.tryDependencies()) {
        this.file.complete = true;
        return 'finished';
      } else {
        return 'pending';
      }
    },
    firstTry: function() {
      if (this.isComplete() != 'pending') {
        this.file.loaded();
      } else {
        this.pending();
      }
    },
    reTry: function() {
      switch (this.isComplete()) {
        case 'complete':
          break;
        case 'finished':
          this.file.aborted();
          this.file.include();
          break;
        default:
        case 'pending':
          this.pending();
          break;
      }
    },
    pending: function() {
      var module = this;
      this.file.pending();
      setTimeout(this.continuation, 1000);
      throw new CGD.Module.DependenciesNotYetLoaded(this.id);
    },
    alreadyNamed: function(tag, attr) {
      var tags = document.getElementsByTagName(tag);
      for (var i = 0;i < tags.length;i++) {
        var fullPath = tags[i][attr];
        var relativePath = fullPath.replace(this.root, '');
        var identifier = relativePath.replace(/\.(\w*)$/, '');
        new CGD.Dependency(identifier, tags[i].type).
          canonically(fullPath).
          register(this.files).
          loaded();
      }
    }
  };

  CGD.Module.pathTo = function(identifier) {
    var slash = identifier.lastIndexOf('/');
    if (slash >= 1) {
      return identifier.slice(0, slash+1);
    } else {
      return '';
    }
  };

  CGD.Module.Exception = function(name, message) {
    var ex = function(filename) {
      if (filename) {this.message = filename + ': ' + this.message;}
    }.prototype;
    ex.name = name;
    ex.message = message;
    ex.toString = CGD.Module.Exception.prototype.toString;
    return CGD.Module[name] = ex.constructor;
  };
  CGD.Module.Exception.prototype.toString = function() {
    return this.name + ": " + this.message;
  };

  new CGD.Module.Exception('DependenciesNotYetLoaded',
    "Not all dependencies loaded; file will be retried later.");
  new CGD.Module.Exception('FileNotYetLoaded',
    "File not yet available; try again later.");
  new CGD.Module.Exception('UnmetDependency',
    "Could not be loaded.");

  var window_onerror = window.onerror || function() {return false;};
  window.onerror = CGD.Module.onerror = function(message, url, line)  {
    if (message.match && message.match('DependenciesNotYetLoaded')) {
      return true;
    } else {
      return window_onerror(message, url, line);
    }
  };

  CGD.Module.prototype.require.main =
  CGD.Module.prototype.main =
  CGD.main =
  new CGD.Module('Module', function(m){
    m.continuation = null;
    m.root = CGD.Module.pathTo(window.location.toString());
    m.alreadyNamed('link', 'href');
    m.alreadyNamed('script', 'src');
  });
}());
