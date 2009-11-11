CGD.test = CGD.test || {};
CGD.JS.require.within('conflict/top.js', function() {
  CGD.JS.require('a.js');
  CGD.JS.require('b.js');
});
equals(CGD.test.a, 'a', 'top sees a');
equals(CGD.test.b, 'b', 'top sees b');
