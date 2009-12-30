CGD.test = CGD.test || {};
new CGD.Module('module', function(m) {
  m.require('child');
});
equals(CGD.test.child, 'child', 'child should run first');
