// Creative Commons Attribution-Share Alike 3.0 Unported Licence
// http://creativecommons.org/licenses/by-sa/3.0/

// The typical result of loading this file is that CGD.DEBUG.p (print) will be
//  bound to the storage backend; after DEBUG.load(), it stands a good chance
//  of being the div backend.

var CGD = window.CGD || {};
CGD.DEBUG = {};
CGD.DEBUG.BACKEND = {};
CGD.DEBUG.FILTER = {};

// Preference values run from 0 to 1.  It's basically a negotionation system
//  so that, eg, when running in dashboard the widget debug mode will
//  come in with a high priority (and very low otherwise)

// stub for debug disabled.
CGD.DEBUG.BACKEND.off = {
  p: function(str) {},
  preference: 0.1
};
// stand in until we define the wrapper.
CGD.DEBUG['p'] = CGD.DEBUG.BACKEND.off.p;
CGD.DEBUG['backendName'] = 'off';

// modal dialog box
CGD.DEBUG.BACKEND.alert = {
  // tried assigning 'alert' directly here, but got a type error;
  //   must be some weirdness with builtins.
  p: function(str) {alert(str);},
  preference: 0.2
};
CGD.DEBUG['default_backend'] = 'alert';

// Send a simple alert to Console when in Dashboard.
CGD.DEBUG.BACKEND.widget = {
  p: function(str) {alert(str);},
  preference: window['widget'] ? 0.9 : 0
};

// Write to a div when in a browser
CGD.DEBUG.BACKEND.div_factory = function(id) {
  var style = 'none';

  function debugDiv() {
    return document.getElementById(id);
  }
  
  function setDiv(s) {
    if (style != s) {
      debugDiv().style.display = s;
      style = s;
    }
  }

  return {
    p: function (str) {
      setDiv('block');
      var div = debugDiv();
      div.appendChild(document.createTextNode(str));
      div.appendChild(document.createElement("br"));
      div.scrollTop = div.scrollHeight;
    },
    disable: function() {
      setDiv('none');
    },
    load: function() {
      if (debugDiv()) {
        this.preference = 0.5;
      }
    },
    preference: 0.0
  };
};

// Default out to a standard debug div
CGD.DEBUG.BACKEND.div = CGD.DEBUG.BACKEND.div_factory('debugDiv');

// store in array, dump when switched out.
CGD.DEBUG.BACKEND.store_factory = function(max) {
  var buffer = [];
  return {
    buffer: buffer,
    p: function(str) {
      // force string conversion - otherwise we might keep a reference
      //  to a modifiable object.
      buffer.push(str + "");
      if (max && buffer.length > max) {
        buffer.shift();
      }
    },
    dump: function(D) {
      var n = buffer.length;
      for (var i = 0;i < n;i++) {
        D('*' + buffer.shift());
      }
    },
    disable: function() {
      if (CGD.DEBUG.backendName != 'off') {
        this.dump(CGD.DEBUG.p);
      }
    },
    preference: 0.4
  };
};

// once again, a default instance.
CGD.DEBUG.BACKEND.store = CGD.DEBUG.BACKEND.store_factory(1000);

CGD.DEBUG.FILTER.timestamp = function() {
  var startTime = new Date().getTime();
  function deltaTime() {
    return new Date().getTime() - startTime;
  }

  return {
    process: function(str){
      return [deltaTime(), str];
    },
    dt: deltaTime,
    from: startTime
  };
}();

CGD.DEBUG.FILTER.brackets = function() {
  return {
    process: function(str){
      if (str && // null is an object...
          typeof(str) == 'object' && 
          'constructor' in str &&
          str.constructor === Array) {
        var a = new Array(str.length);
        for (var i = 0; i < str.length;i++) {
          a[i] = CGD.DEBUG.FILTER.brackets.process(str[i]);
        }
        return '[' + a.join(',') + ']';
      } else {
        return str;
      }
    }
  };
}();

// closure wrapper for core DEBUG definitions
(function() {
  var backend;

  function publish(s) {
    CGD.DEBUG[s] = eval(s);
  }
  
  var filters = [];
  publish('filters');
  
  function addFilter(named) {
    // insert at the beginning; the new filter will run before the old ones
    CGD.DEBUG.filters.unshift(CGD.DEBUG.FILTER[named]);
  }
  publish('addFilter');
  
  function print(str) {
    for (var i = 0;i < filters.length;i++) {
      str = filters[i].process(str);
    }
    backend.p(str);
  }
  CGD.DEBUG['p'] = print;
  
  function header(str, mark) {
    var bar = mark + mark + mark;
    print(bar + ' ' + str + ' ' + bar);
  }
  CGD.DEBUG['header'] = header;
  
  function switchBackend(s_to) {
    // s_ string, o_ object
    var o_from = backend;
    var o_to = CGD.DEBUG.BACKEND[s_to];
    if (o_to !== o_from) {
      backend = o_to;
      this.backendName = s_to;
      if (o_to['enable']) {
        o_to.enable();
      }
      if (o_from && o_from['disable']) {
        o_from.disable();
      }
    }
  }
  publish('switchBackend');

  function on(which) {
    which = which || this.default_backend;
    this.switchBackend(which);
  }
  publish('on');

  function off() {
    this.switchBackend('off');
  }
  publish('off');

  function electBackend() {
    // run the negotiation; as of this writing, this will select either
    //  'div' or 'widget'
    var bes = CGD.DEBUG.BACKEND;
    for (var i in bes) {
      if (bes.hasOwnProperty(i) && 'preference' in bes[i]) {
        if (bes[i].preference > bes[this.default_backend].preference) {
          this.default_backend = i;
        }
      }
    }
    this.on();
  }
  publish('electBackend');

  function onload() {
    var bes = CGD.DEBUG.BACKEND;
    for (var i in bes) {
      if (bes.hasOwnProperty(i) && 'load' in bes[i]) {
        bes[i].load();
      }
    }
    this.electBackend();
  }
  publish('onload');

  function die(str) {
    if (Error) {
      throw Error(str);
    } else {
      throw str;
    }
  }
  publish('die');

  // shallow list of all propreties
  function dump(x) {
    print(x);
    for (var i in x) {
      try {
        if (typeof(x[i]) == 'function') {
          print([i, '*', 'function', x.hasOwnProperty(i)]);
        } else {
          print([i, x[i] + "", typeof(x[i]), x.hasOwnProperty(i)]);
        }
      } catch (e) {
        print(e);
      }
    }
  }
  publish('dump');
} ());

// current default backend should be 'store'
CGD.DEBUG.electBackend();
CGD.DEBUG.on();
CGD.DEBUG.addFilter('brackets');
