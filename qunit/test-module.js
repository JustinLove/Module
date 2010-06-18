QUnit.module("Module");

test("construct a module", function() {
  expect(1);
  new CGD.Module('subdir/subpass', function(m) {
    ok(m);
  });
});

test("includes a file", function() {
  expect(1);
  stop();
  CGD.main.include('pass');
  setTimeout(start, CGD.test.timeout);
});

test("includes a file twice", function() {
  expect(2);
  stop();
  CGD.main.include('pass');
  CGD.main.include('pass');
  setTimeout(start, CGD.test.timeout);
});

test("detects static script files", function() {
  for (var i in CGD.main.files) {
    if (CGD.main.files[i].uri.match(/qunit.js/)) {
      ok(true, 'found static file');
      return;
    }
  }
  ok(false, 'did not find static file');
});

test("has the proper type for static script files", function() {
  for (var i in CGD.main.files) {
    if (CGD.main.files[i].uri.match(/qunit.js/)) {
      equals(CGD.main.files[i].type, 'text/javascript');
      return;
    }
  }
});

test("detects static style files", function() {
  for (var i in CGD.main.files) {
    if (CGD.main.files[i].uri.match(/qunit.css/)) {
      ok(true, 'found static file');
      return;
    }
  }
  ok(false, 'did not find static file');
});

test("has the proper type for static style files", function() {
  for (var i in CGD.main.files) {
    if (CGD.main.files[i].uri.match(/qunit.css/)) {
      equals(CGD.main.files[i].type, 'text/css');
      return;
    }
  }
});

test("registers static files under identifier", function() {
  ok(CGD.main.files['qunit/qunit'], 'qunit/qunit is registered');
});

test("identifier conflicts resolve to js file", function() {
  equals(CGD.main.files['qunit/qunit'].type, 'text/javascript');
});

test("fileFromIdentifier gets proper file type", function() {
  equals(CGD.main.fileFromIdentifier('blarg', 'text/css').type, 'text/css');
});

test("fileFromIdentifier gets a file with proper extension", function() {
  equals(extension(CGD.main.fileFromIdentifier('blarg', 'text/css').uri), 'css');
});

test("require includes a file only once", function() {
  expect(0);
  stop();
  CGD.main.require('fail');
  setTimeout(start, CGD.test.timeout);
});

test("require avoids aliasing", function() {
  expect(1);
  stop();
  CGD.main.enqueue('alias');
  CGD.main.enqueue('subdir/../alias');
  setTimeout(start, CGD.test.timeout);
});

test("relative path context", function() {
  new CGD.Module("dummy", function(mod){
    ok(!mod.path.match('subdir'), 'subdir not previously in path');
    mod.under('subdir', function(m) {
      ok(m.path.match('subdir'), 'subdir now in path');
    });
    ok(!mod.path.match('subdir'), 'subdir not in path');
  });
});

test("relative path context doesn't double queued count", function() {
  expect(5);
  try {
    new CGD.Module("noop", function(mod) {
      equals(mod.queued, 0);
      mod.enqueue('dummychild');
      equals(mod.queued, 1);
      mod.under('subdir/', function(m) {
        equals(m.queued, 0);
        m.enqueue('./dummysubchild');
        equals(m.queued, 1);
      });
      equals(mod.queued, 2);
      throw "abort";
    });
  } catch(e) {
    if (e != "abort") {
      throw e;
    }
  }
  stop();
  setTimeout(start, CGD.test.timeout);
});

test("absolute path context", function() {
  ok(!CGD.main.path.match('subdir'), 'subdir not previously in path');
  new CGD.Module('subdir/subpass', function(m) {
    ok(m.path.match('subdir'), 'subdir now in path');
  });
  ok(!CGD.main.path.match('subdir'), 'subdir not in path');
});

test("doesn't get substrings", function() {
  new CGD.Module('ias', function(m) {
    ok(!m.root.match('al$'), m.root);
  });
});

test("exceptions don't corrupt context", function() {
  expect(1);
  stop();
  try {
    new CGD.Module('subdir/subpass', function() {
      throw "blarg";
    });
  }
  catch (s) {}
  CGD.main.enqueue("uncorrupted");
  setTimeout(start, CGD.test.timeout);
});

test("module can load dependencies before continuing", function() {
  expect(1);
  stop();
  CGD.main.enqueue('subdir/submod');
  setTimeout(start, CGD.test.timeout);
});

test("handles base directory module", function() {
  expect(1);
  stop();
  CGD.main.enqueue('module');
  setTimeout(start, CGD.test.timeout);
});

test("loaded files are known", function() {
  CGD.main.enqueue('loadme');
  
  ok(CGD.main.fileFromIdentifier('loadme'));
});

test("file state changes from unloaded to loaded", function() {
  CGD.main.enqueue('loadme');
  
  equals(CGD.main.files['loadme'].status(), 'pending');
  stop();
  setTimeout(function() {
    equals(CGD.main.files['loadme'].status(), 'loaded');
    start();
  }, CGD.test.timeout);
});

test("backup loaded status", function() {
  new CGD.Module('void');
  equals(CGD.main.files['void'].status(), 'loaded');
});

test("canceled load doesn't appear loaded", function() {
  CGD.main.enqueue('reloadparent/parent');
  
  expect(2);
  stop();
  setTimeout(function() {
    equals(CGD.main.files['reloadparent/parent'].status(), 'loaded');
    start();
  }, CGD.test.timeout);
});

test("out-of-order mutual dependencies", function() {
  expect(3);
  stop();
  CGD.main.enqueue('conflict/top');
  setTimeout(start, CGD.test.timeout);
});

test("distant modules", function() {
  expect(3);
  stop();
  CGD.main.enqueue('../distant/distantmodule');
  setTimeout(start, CGD.test.timeout);
});

test("prevents infinite reload", function() {
  expect(0);
  CGD.main.enqueue('infinite');
  stop();
  setTimeout(start, 1000);
});
