QUnit.module("html");

test("makes elements", function() {
  ok(CGD.html.makeTag('foo', {bar: 'bar'}));
});

test("adds an element to head", function() {
  CGD.html.addElementToHead(CGD.html.makeTag('foo', {bar: 'bar'}));
  equals(document.getElementsByTagName('foo').length, 1);
});
