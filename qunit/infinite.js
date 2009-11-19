CGD.test = CGD.test || {};
CGD.test.infinite = (CGD.test.infinite || 0) + 1;
if (CGD.test.infinite > 30) {
  ok(false, "at least 30 reloads");
  throw "fail";
}
new CGD.Module('infinite.js', function(m) {
  m.require('nonexistent.js');
});
