'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-prod-deploy-workflows.js');
const { scanText, diff } = require('./check-prod-deploy-workflows');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prod-deploy-wf-'));
  Object.entries(files).forEach(([rel, text]) => write(path.join(dir, rel), text));
  return dir;
}

const REL = '.github/workflows/deploy-x-prod.yml';
const kinds = (text) => scanText(REL, text).map((l) => l.split(' ')[0]);

const tests = {
  '|| true / || : 는 OR_TRUE': () => {
    assert.deepStrictEqual(kinds('  run: cp a b || true\n'), ['OR_TRUE']);
    assert.deepStrictEqual(kinds('  rm x || :\n'), ['OR_TRUE']);
  },
  '|| exit 1 은 통과': () => {
    assert.deepStrictEqual(kinds('  cp a b || exit 1\n'), []);
  },
  'continue-on-error: true 는 CONTINUE_ON_ERROR': () => {
    assert.deepStrictEqual(kinds('    continue-on-error: true\n'), ['CONTINUE_ON_ERROR']);
    assert.deepStrictEqual(kinds('    continue-on-error: false\n'), []);
  },
  'non-fatal 문구는 NON_FATAL': () => {
    assert.deepStrictEqual(kinds('  echo "step failed (non-fatal)"\n'), ['NON_FATAL']);
  },
  'mind_garden 참조는 MIND_GARDEN': () => {
    assert.deepStrictEqual(kinds('  mysql mind_garden < a.sql\n'), ['MIND_GARDEN']);
    assert.deepStrictEqual(kinds('  mind_garden_legacy_x)\n'), ['MIND_GARDEN']);
  },
  '주석은 무시': () => {
    assert.deepStrictEqual(kinds('# mind_garden || true non-fatal\n  run: ls # || true\n'), []);
  },
  '같은 줄 반복은 횟수로 비교': () => {
    const line = `OR_TRUE ${REL} :: a || true`;
    assert.deepStrictEqual(diff([line, line], [line]).added, [line]);
    assert.deepStrictEqual(diff([line], [line, line]).stale, [line]);
    assert.deepStrictEqual(diff([line], [line]), { added: [], stale: [] });
  },
  '운영 아닌 워크플로는 검사하지 않음': () => {
    const dir = fixture({ '.github/workflows/deploy-x-dev.yml': 'run: a || true\n' });
    assert.strictEqual(run(['--root', dir, '--list']).out.trim(), '');
  },
  '신규 항목은 실패, 허용 목록이면 통과': () => {
    const dir = fixture({ [REL]: 'run: a || true\n' });
    const al = path.join(dir, 'al.txt');
    write(al, '');
    assert.strictEqual(run(['--root', dir, '--allowlist', al]).code, 1);
    const line = run(['--root', dir, '--list']).out.trim();
    write(al, `# c\n${line}\n`);
    assert.strictEqual(run(['--root', dir, '--allowlist', al]).code, 0);
  },
  '고친 항목이 허용 목록에 남으면 실패': () => {
    const dir = fixture({ [REL]: 'run: a || exit 1\n' });
    const al = path.join(dir, 'al.txt');
    write(al, `OR_TRUE ${REL} :: run: a || true\n`);
    const res = run(['--root', dir, '--allowlist', al]);
    assert.strictEqual(res.code, 1);
    assert.ok(res.out.includes('허용 목록 정리 필요'));
  },
  '저장소 현재 상태는 허용 목록과 일치': () => {
    assert.strictEqual(run(['--root', ROOT]).code, 0);
  },
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
