new CGD.Module('distantmodule.js', function(m) {
  m.require('distantfile.js');
  m.under('distantsubdir/', function(m) {
    m.require('distantsubfile.js');
  });
});
ok(true, "distantmodule included");
