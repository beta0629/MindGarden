'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const { scanCss } = require('./check-reassign-mapping-css-tokens');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-reassign-mapping-css-tokens.js');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

const tests = {
  'is-selected 에 primary-main 이면 위반': () => {
    const css = '.schedule-reassign-mapping__item.is-selected {\n  border-color: var(--mg-v2-color-primary-main);\n}\n';
    const v = scanCss('x.css', css);
    assert.strictEqual(v.length, 1);
    assert.ok(v[0].includes('primary-main'));
  },
  'remaining/planned 에 primary-* 이면 위반': () => {
    const css = [
      '.schedule-reassign-mapping__cell--remaining { background: var(--mg-v2-color-primary-subtle); }',
      '.schedule-reassign-mapping__cell--planned { border-color: var(--mg-v2-color-primary-dark); }'
    ].join('\n');
    assert.strictEqual(scanCss('x.css', css).length, 2);
  },
  'ink/amber 토큰이면 통과': () => {
    const css = [
      '.schedule-reassign-mapping__item.is-selected { border-color: var(--mg-v2-color-neutral-900); background: var(--mg-v2-color-surface-active); }',
      '.schedule-reassign-mapping__cell--remaining { background: var(--mg-v2-color-surface-card); border-color: var(--mg-v2-color-border-strong); }',
      '.schedule-reassign-mapping__cell--planned { background: var(--mg-v2-color-semantic-warning-light); border-color: var(--mg-v2-color-semantic-warning); }',
      '.schedule-reassign-mapping__badge { background: var(--mg-v2-color-primary-subtle); }'
    ].join('\n');
    assert.deepStrictEqual(scanCss('x.css', css), []);
  },
  '저장소 현재 CSS 통과': () => {
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
console.log(`PASS ${Object.keys(tests).length} check-reassign-mapping-css-tokens tests`);
