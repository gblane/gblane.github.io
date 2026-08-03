// Headless runner. Not shipped to users; test.html is the browser-facing page.
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = __dirname;
for (const f of ['../_data/chromophores.js', 'colorimetry.js', 'spectra.js', 'tests.js']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) vm.runInThisContext(fs.readFileSync(p, 'utf8'), { filename: f });
    else console.log(`(skipping ${f} - not created yet)`);
}
let pass = 0, fail = 0;
function report(ok, name, detail) {
    if (ok) { pass++; }
    else { fail++; console.log(`FAIL ${name}  ${detail}`); }
}
function check(name, actual, expected, tol = 1e-6, absolute = false) {
    const err = absolute ? Math.abs(actual - expected)
                         : Math.abs(actual - expected) / (Math.abs(expected) + 1e-300);
    report(err <= tol, name, `got=${actual} exp=${expected} err=${err.toExponential(2)}`);
}
function checkTrue(name, ok, detail) { report(!!ok, name, `got=${detail}`); }
registerTests(check, checkTrue);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
