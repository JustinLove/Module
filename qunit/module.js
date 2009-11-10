CGD.test = CGD.test || {};
CGD.JS.require.within('module.js', function() {
  CGD.JS.require('child.js');
});
equals(CGD.test.child, 'child', 'child should run first');
