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

  CGD.Module = function(identifier, f) {
    var path = CGD.Module.pathTo(identifier);
    var filename = new CGD.Dependency(identifier).canonicalPath;
    var fullPath = CGD.html.findMe('script', 'src', filename);
    this.queued = 0;
    if (fullPath) {
      this.root = fullPath.slice(0, -filename.length);
    }
    this.cd(path);
    f(this);
    if (this.queued > 0) {
      this.files[fullPath] && this.files[fullPath].aborted();
      var m = this;
      setTimeout(function() {m.require(identifier.slice(path.length));}, 0);
      throw new CGD.Module.DependenciesNotYetLoaded;
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
    include: function(identifier, type) {
      new CGD.Dependency(identifier, type).include(type);
    },
    require: function(identifier, type) {
      var x = this.fileFromPath(this.path + identifier);
      switch (x.file.status()) {
        case 'new':
        case 'aborted':
          x.file.register(this.files);
          x.element.onload = x.element.onreadystatechange = x.file.onloadFactory();
          CGD.html.addElementToHead(x.element);
          this.queued++;
          break;
        case 'pending':
          x.file.count = (x.file.count || 0) + 1;
          if (x.file.count > 20) {
            throw new CGD.Module.UnmetDependency(x.file.canonicalPath);
          }
          this.queued++;
          break;
        case 'loaded': break;
        default: throw "unknown file status"; break;
      }
    },
    fileFromPath: function(path, type) {
      var file = this.files[path] ||
        new CGD.Dependency(path, type).under(this.root);
      var element = file.element(type);
      file = this.files[file.canonicalPath] || file;
      return {file: file, element: element};
    },
    alreadyNamed: function(tag, attr) {
      var tags = document.getElementsByTagName(tag);
      for (var i = 0;i < tags.length;i++) {
        var fullPath = tags[i][attr];
        if (fullPath.indexOf(this.root) == 0) {
          var relativePath = fullPath.substr(this.root.length);
          new CGD.Dependency(relativePath, tags[i].type).
            canonically(fullPath).
            register(this.files).
            loaded();
        }
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

  CGD.Module.DependenciesNotYetLoaded = function() {};
  var dnyl = CGD.Module.DependenciesNotYetLoaded.prototype;
  dnyl.name = "DependenciesNotYetLoaded";
  dnyl.message = "Not all dependencies loaded; file will be retried later.";
  dnyl.toString = function() {return this.name + ": " + this.message;};

  CGD.Module.UnmetDependency = function(filename) {this.message = filename + " could not be loaded";};
  var unmet = CGD.Module.UnmetDependency.prototype;
  unmet.name = "UnmetDependency";
  unmet.toString = function() {return this.name + ": " + this.message;};

  var window_onerror = window.onerror || function() {return false;};
  window.onerror = CGD.Module.onerror = function(message, url, line)  {
    if (message.match(dnyl.name)) {
      return true;
    } else {
      return window_onerror(message, url, line);
    }
  };

  CGD.mod = new CGD.Module('Module', function(m){
    m.root = CGD.Module.pathTo(window.location.toString());
    m.alreadyNamed('script', 'src');
    m.alreadyNamed('link', 'href');
  });
}());
