CGD.test = CGD.test || {};
new CGD.Module('reloadparent/parent', function(m) {
  m.require('child');
});
