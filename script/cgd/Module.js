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
    this.identifier = identifier;
    this.type = type || 'text/javascript';
    this.canonicalPath = identifier + CGD.Dependency.guessFileExtension(this.type);
    this.load = {status: 'new'};
    this.exports = {};
  };

  CGD.Dependency.prototype = {
    constructor: CGD.Dependency,
    canonically: function(fullPath) {
      this.canonicalPath = fullPath;
      return this;
    },
    under: function(root) {
      this.canonicalPath = root + this.canonicalPath;
      return this;
    },
    register: function(files) {
      files[this.identifier] = this;
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
    element: function(overrideType) {
      var type = overrideType || this.type;
      switch (type) {
        case 'text/javascript':
          var element = CGD.html.makeTag('script',
            {src: this.canonicalPath, type: type, language: 'javascript'});
          this.canonicalPath = element.src;
          return element;
        case 'text/css':
          var element = CGD.html.makeTag('link', 
            {href: this.canonicalPath, type: type, rel: 'stylesheet'});
          this.canonicalPath = element.href;
          return element;
        default:
          throw "Don't know how to include " + type;
      }
    },
    include: function(type) {
      CGD.html.addElementToHead(this.element(type));
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
    var path = CGD.Module.pathTo(identifier);
    var file = new CGD.Dependency(identifier);
    var filename = file.canonicalPath;
    var fullPath = CGD.html.findMe('script', 'src', filename);
    this.queued = 0;
    if (fullPath) {
      file = this.files[fullPath] || this.files[identifier] || file;
      this.root = fullPath.slice(0, -filename.length);
    }
    this.cd(path);
    this.id = file.identifier;
    this.uri = fullPath;
    window.exports = file.exports;
    window.require = function(identifier, type) {return module.require(identifier, type);};
    window.module = this;
    try {f(this);} catch (e) {
      if (e instanceof CGD.Module.UnmetDependency) {
        throw e;
      }
    };
    if (this.queued > 0) {
      file.aborted();
      setTimeout(function() {module.enqueue(identifier);}, 0);
      throw new CGD.Module.DependenciesNotYetLoaded(identifier);
    }
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
      f(m);
      this.queued += m.queued;
    },
    beget: function() {
      var F = function(){this.queued = 0;};
      F.prototype = this;
      return new F();
    },
    onNotLoaded: function(identifier) {
      throw new CGD.Module.FileNotYetLoaded(identifier);
    },
    include: function(identifier, type) {
      new CGD.Dependency(this.absoluteIdentifier(identifier), type).include(type);
    },
    require: function(identifier, type) {
      return this.enqueue(identifier, type) || this.onNotLoaded(identifier);
    },
    enqueue: function(identifier, type) {
      var x = this.fileFromIdentifier(this.absoluteIdentifier(identifier));
      switch (x.file.status()) {
        case 'new':
        case 'aborted':
          x.file.register(this.files);
          x.element.onload = x.element.onreadystatechange = x.file.onloadFactory();
          CGD.html.addElementToHead(x.element);
          this.queued++;
          return null;
        case 'pending':
          x.file.count = (x.file.count || 0) + 1;
          if (x.file.count > 20) {
            throw new CGD.Module.UnmetDependency(x.file.canonicalPath);
          }
          this.queued++;
          return null;
        case 'loaded': return x.file.exports;
        default: throw "unknown file status";
      }
    },
    fileFromIdentifier: function(identifier, type) {
      var file = this.files[identifier] ||
        new CGD.Dependency(identifier, type).under(this.root);
      var element = file.element(type);
      file = this.files[file.canonicalPath] || file;
      return {file: file, element: element};
    },
    absoluteIdentifier: function(identifier) {
      if (CGD.Dependency.relative(identifier)) {
        return this.path + identifier;
      } else {
        return identifier;
      }
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
    if (message.match('DependenciesNotYetLoaded')) {
      return true;
    } else {
      return window_onerror(message, url, line);
    }
  };

  CGD.mod = new CGD.Module('Module', function(m){
    m.root = CGD.Module.pathTo(window.location.toString());
    m.alreadyNamed('link', 'href');
    m.alreadyNamed('script', 'src');
  });
}());
