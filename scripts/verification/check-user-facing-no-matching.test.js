'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-user-facing-no-matching.js');
const {
  scanUserFacingReassignMessages,
  scanRequestMessages,
  scanAdminControllerReassign
} = require('./check-user-facing-no-matching');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

const tests = {
  'MSG_REASSIGN_* 리터럴에 매칭이면 위반': () => {
    const src = [
      'public static final String MSG_OTHER = "매칭";',
      'public static final String MSG_REASSIGN_MAPPING_TARGET_NOT_FOUND =',
      '        "대상 매칭을 찾을 수 없습니다.";'
    ].join('\n');
    const v = scanUserFacingReassignMessages('X.java', src);
    assert.strictEqual(v.length, 1);
    assert.ok(v[0].includes('대상 매칭'));
  },
  'MSG_REASSIGN_* 에 배정만 있으면 통과': () => {
    const src = 'public static final String MSG_REASSIGN_MAPPING_SAME_TARGET = "이미 해당 배정에 배정된 일정입니다.";';
    assert.deepStrictEqual(scanUserFacingReassignMessages('X.java', src), []);
  },
  'Request message= 매칭이면 위반': () => {
    const src = '@NotNull(message = "대상 매칭 ID는 필수입니다.")\nprivate Long targetMappingId;';
    assert.strictEqual(scanRequestMessages('Req.java', src).length, 1);
  },
  'AdminController reassign 블록 매칭이면 위반': () => {
    const src = [
      '@PostMapping("/schedules/{id}/reassign-mapping")',
      'public void preview() {',
      '  throw new IllegalArgumentException("대상 매칭 ID는 필수입니다.");',
      '}',
      '// 스케줄 자동 완료',
      'public void auto() {}'
    ].join('\n');
    assert.strictEqual(scanAdminControllerReassign('AdminController.java', src).length, 1);
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
console.log(`PASS ${Object.keys(tests).length} check-user-facing-no-matching tests`);
