CGD.test = CGD.test || {};
new CGD.Module('module.js', function(m) {
  m.require('child.js');
});
equals(CGD.test.child, 'child', 'child should run first');
