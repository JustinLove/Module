CGD.JS.require.within('a.js', function() {
  CGD.JS.require('b.js');
});
CGD.test.a = 'a';
equals(CGD.test.b, 'b', 'a sees b');
