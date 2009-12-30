new CGD.Module('distantmodule', function(m) {
  m.require('distantfile');
  m.under('distantsubdir/', function(m) {
    m.require('distantsubfile');
  });
});
ok(true, "distantmodule included");
