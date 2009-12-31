new CGD.Module('conflict/a', function(m) {
  m.require('./b');
});
CGD.test.a = 'a';
equals(CGD.test.b, 'b', 'a sees b');
