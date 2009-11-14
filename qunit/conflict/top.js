CGD.test = CGD.test || {};
new CGD.Module('conflict/top.js', function(m) {
  CGD.JS.require('a.js');
  CGD.JS.require('b.js');
});
equals(CGD.test.a, 'a', 'top sees a');
equals(CGD.test.b, 'b', 'top sees b');
