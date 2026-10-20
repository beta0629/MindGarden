'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/print-be-critical-time-test-results.js');
const {
  REQUIRED_TIME_TESTS,
  parseTxtSummary,
  parseXmlSummary,
  run
} = require('./print-be-critical-time-test-results');

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function runCli(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function fixtureDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-critical-time-surefire-'));
  Object.entries(files).forEach(([rel, text]) => write(path.join(dir, rel), text));
  return dir;
}

function xmlFor(fqcn, { tests = 2, failures = 0, errors = 0, skipped = 0 } = {}) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<testsuite name="${fqcn}" time="0.1" tests="${tests}" errors="${errors}" ` +
    `skipped="${skipped}" failures="${failures}">\n</testsuite>\n`
  );
}

function txtFor(fqcn, { tests = 2, failures = 0, errors = 0, skipped = 0 } = {}) {
  return (
    `-------------------------------------------------------------------------------\n` +
    `Test set: ${fqcn}\n` +
    `-------------------------------------------------------------------------------\n` +
    `Tests run: ${tests}, Failures: ${failures}, Errors: ${errors}, Skipped: ${skipped}, ` +
    `Time elapsed: 0.1 s -- in ${fqcn}\n`
  );
}

const allXmlPass = () => {
  const files = {};
  REQUIRED_TIME_TESTS.forEach(({ fqcn }) => {
    files[`TEST-${fqcn}.xml`] = xmlFor(fqcn, { tests: 3 });
  });
  return files;
};

const tests = {
  'parseTxtSummary 는 Tests run 줄을 파싱한다': () => {
    const s = parseTxtSummary(txtFor('a.b.C', { tests: 4, failures: 1, errors: 2, skipped: 1 }));
    assert.deepStrictEqual(s, { tests: 4, failures: 1, errors: 2, skipped: 1 });
  },
  'parseXmlSummary 는 testsuite 속성을 파싱한다': () => {
    const fqcn = 'com.example.FooTest';
    const s = parseXmlSummary(xmlFor(fqcn, { tests: 5, failures: 0, errors: 1, skipped: 0 }), fqcn);
    assert.deepStrictEqual(s, { tests: 5, failures: 0, errors: 1, skipped: 0 });
  },
  '세 클래스 XML 모두 통과면 exit 0': () => {
    const dir = fixtureDir(allXmlPass());
    const result = run({ reportsDir: dir });
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.lines.some((l) => l.includes('SystemTimeControllerTest: Tests run: 3')));
    assert.ok(result.lines.some((l) => l.includes('OK:')));
    const cli = runCli(['--reports-dir', dir]);
    assert.strictEqual(cli.code, 0);
    assert.ok(cli.out.includes('=== CI-required time tests (#1718) ==='));
  },
  '클래스 하나 없으면 exit 1': () => {
    const files = allXmlPass();
    delete files[`TEST-${REQUIRED_TIME_TESTS[0].fqcn}.xml`];
    const dir = fixtureDir(files);
    const result = run({ reportsDir: dir });
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.lines.some((l) => l.includes('SystemTimeControllerTest: MISSING')));
  },
  'tests run == 0 이면 exit 1': () => {
    const files = allXmlPass();
    const fqcn = REQUIRED_TIME_TESTS[1].fqcn;
    files[`TEST-${fqcn}.xml`] = xmlFor(fqcn, { tests: 0 });
    const dir = fixtureDir(files);
    const result = run({ reportsDir: dir });
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.lines.some((l) => l.includes('tests run == 0')));
  },
  'failures > 0 이면 exit 1': () => {
    const files = allXmlPass();
    const fqcn = REQUIRED_TIME_TESTS[2].fqcn;
    files[`TEST-${fqcn}.xml`] = xmlFor(fqcn, { tests: 2, failures: 1 });
    const dir = fixtureDir(files);
    const result = run({ reportsDir: dir });
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.lines.some((l) => l.includes('failures/errors')));
  },
  'txt 리포트만 있어도 통과': () => {
    const files = {};
    REQUIRED_TIME_TESTS.forEach(({ fqcn }) => {
      files[`${fqcn}.txt`] = txtFor(fqcn, { tests: 1 });
    });
    const dir = fixtureDir(files);
    assert.strictEqual(run({ reportsDir: dir }).exitCode, 0);
  },
  '리포트 디렉터리 없으면 exit 1': () => {
    const missing = path.join(os.tmpdir(), `no-surefire-${Date.now()}`);
    const result = run({ reportsDir: missing });
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.lines.some((l) => l.includes('surefire reports directory missing')));
  }
};

let failed = 0;
Object.entries(tests).forEach(([name, fn]) => {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`not ok - ${name}: ${e.message}`);
  }
});
process.exit(failed ? 1 : 0);
