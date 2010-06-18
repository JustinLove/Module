QUnit.module("Dependency");

test("Can construct a dependency", function() {
  ok(new CGD.Dependency('pass'));
});

test("has id property", function()
{
  ok(new CGD.Dependency('pass').id);
});

test("has uri property", function()
{
  ok(new CGD.Dependency('pass').uri);
});

test("Can construct a dependency with a full path", function() {
  equals(new CGD.Dependency('pass').canonically('full/pass.js').uri, 'full/pass.js');
});

test("registers itself", function() {
  var files = {};
  var x = new CGD.Dependency('x').register(files);
  equals(files[x.id], x, 'id is registered');
  equals(files[x.uri], x, 'uri is registered');
});

test("can track whether it's loaded", function() {
  var x = new CGD.Dependency('x');
  equals(x.status(), 'new');
  x.loaded();
  equals(x.status(), 'loaded');
});

test("can track whether it's aborted", function() {
  var x = new CGD.Dependency('x');
  equals(x.status(), 'new');
  x.aborted();
  equals(x.status(), 'aborted');
});

test("remember file type", function() {
  equals(new CGD.Dependency('blarg', 'bleep').type, 'bleep');
});

test("defaults to script type", function() {
  equals(new CGD.Dependency('blarg').type, 'text/javascript');
});

test("infer file extension", function() {
  equals(extension(new CGD.Dependency('type', 'text/javascript').uri), 'js');
  equals(extension(new CGD.Dependency('type', 'text/css').uri), 'css');
});

test("makes matching element", function() {
  ok(new CGD.Dependency('el').element());
});

test("includes a file", function() {
  expect(1);
  stop();
  new CGD.Dependency('pass').include();
  setTimeout(start, CGD.test.timeout);
});

test("improves uri", function() {
  var file = new CGD.Dependency('subdir/../el');
  file.element();
  ok(!file.uri.match(/\.\./));
});

test("improves uri for non existing script", function() {
  var file = new CGD.Dependency('subdir/../el').improve({});
  ok(!file.uri.match(/\.\./));
});

test("improves uri for existing script", function() {
  var file = new CGD.Dependency('qunit/../qunit/qunit').improve({});
  ok(!file.uri.match(/\.\./));
});
