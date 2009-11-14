CGD.test = CGD.test || {};
new CGD.Module('conflict/top.js', function(m) {
  m.require('a.js');
  m.require('b.js');
});
equals(CGD.test.a, 'a', 'top sees a');
equals(CGD.test.b, 'b', 'top sees b');
