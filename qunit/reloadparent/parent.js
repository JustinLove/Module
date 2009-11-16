CGD.test = CGD.test || {};
new CGD.Module('reloadparent/parent.js', function(m) {
  m.require('child.js');
});
