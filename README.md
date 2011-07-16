# Module

## An experimental Javascript loader

This is a toy javascript loader that has not had the benefit of extensive browser testing.  Since it was begun, several better options have appeared.

## Major Flaws

- Lacks extensive testing (although it has a test suite that passes on several browers).
- Misnamed; not an actual module system; just handles dependent file loading.
- Still placed in my personal company 'CGD' namespace.
- Internal exceptions leak to the console in several browsers.
- Require explicitly naming the module the same as the file.

## Goals

- Express file-level dependencies - e.g. if I depend on A, I shouldn't have to care that it depends on B.
- Load javascript by script-tag insertion.
- Load existing javascript with minimal modification (e.g. no function wrapping)
- Express dependencies on distant paths (not at the same directory level or below)
- It supports a sub-directory grouping to reduce the length of typed out paths.
- Support parallel loading.
- Partial CommonJS compatibility.
- Load CSS files.

## Contributions

Most this should be pretty standard.  The two novel features are:

- The notation "new Module" which attempts to go with the JS grain.
- The exception-reload technique

### Exception-Reload

Files should contain a header to express dependancies.  'leaf' modules require no modification.  The header takes the form of "new Module" with the module name  (which must match the file name) and a function which imperitively sets the dependencies.

  new CGD.Module('module', function(m) {
    m.enqueue('./child');
  });

If the 'child' module is not yet available, script loading will be aborted by raising an exception.  If the browser supports the `onerror` event, this exception will be filtered out before reaching the console.

The failed module function will be retried by one of two means:

- all child dependencies complete
- timeout

If the module function runs without error the first time (e.g. executing the file), it will simply allow the file to continue.  If it runs without error on a retry, a new script tag will be inserted to-run the file.
