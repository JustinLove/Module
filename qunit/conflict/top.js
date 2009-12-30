CGD.test = CGD.test || {};
new CGD.Module('conflict/top', function(m) {
  m.require('a');
  m.require('b');
});
equals(CGD.test.a, 'a', 'top sees a');
equals(CGD.test.b, 'b', 'top sees b');
