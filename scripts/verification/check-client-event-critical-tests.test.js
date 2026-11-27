'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-client-event-critical-tests.js');
const {
  antPatternToRegExp,
  parseCriticalPatterns,
  matchesAnyPattern,
  checkClientEventCriticalRegistration
} = require('./check-client-event-critical-tests');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

const tests = {
  'ant **/X.java matches nested path': () => {
    const re = antPatternToRegExp('**/ClientEventWriteRollbackIntegrationTest.java');
    assert.ok(
      re.test(
        'com/coresolution/consultation/integration/ClientEventWriteRollbackIntegrationTest.java'
      )
    );
  },
  'ant *Payment*Test matches ClientEvent payment hook': () => {
    assert.ok(
      matchesAnyPattern(
        'com/coresolution/consultation/service/impl/PaymentServiceImplClientEventHookTest.java',
        ['**/*Payment*Test.java']
      )
    );
  },
  'parseCriticalPatterns ignores comments and blanks': () => {
    const patterns = parseCriticalPatterns('# c\n\n**/A.java\n  \n**/B.java\n');
    assert.deepStrictEqual(patterns, ['**/A.java', '**/B.java']);
  },
  'fixture missing registration fails': () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-critical-'));
    write(
      path.join(tmp, 'src/test/resources/ci/backend-critical-tests.txt'),
      '**/*Payment*Test.java\n'
    );
    write(
      path.join(
        tmp,
        'src/test/java/com/coresolution/consultation/integration/ClientEventWriteRollbackIntegrationTest.java'
      ),
      'class ClientEventWriteRollbackIntegrationTest {}'
    );
    const result = checkClientEventCriticalRegistration({ root: tmp });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.missing.length, 1);
  },
  'fixture with explicit pattern passes': () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-critical-ok-'));
    write(
      path.join(tmp, 'src/test/resources/ci/backend-critical-tests.txt'),
      '**/ClientEvent*IntegrationTest.java\n'
    );
    write(
      path.join(
        tmp,
        'src/test/java/com/coresolution/consultation/integration/ClientEventWriteRollbackIntegrationTest.java'
      ),
      'class ClientEventWriteRollbackIntegrationTest {}'
    );
    const result = checkClientEventCriticalRegistration({ root: tmp });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.matched.length, 1);
  },
  '저장소 현재 상태 통과': () => {
    const res = run(['--root', ROOT]);
    assert.strictEqual(res.code, 0, res.out);
  }
};

let failed = 0;
Object.entries(tests).forEach(([name, fn]) => {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
});

if (failed > 0) {
  process.exit(1);
}
console.log(`PASS ${Object.keys(tests).length} check-client-event-critical-tests tests`);
