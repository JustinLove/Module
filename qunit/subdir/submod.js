CGD.test = CGD.test || {};
new CGD.Module('subdir/submod', function(m) {
  m.require('subchild');
});
equals(CGD.test.child, 'subchild', 'child should run first');
