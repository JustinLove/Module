CGD.test = CGD.test || {};
new CGD.Module('subdir/submod.js', function(m) {
  m.require('subchild.js');
});
equals(CGD.test.child, 'subchild', 'child should run first');
