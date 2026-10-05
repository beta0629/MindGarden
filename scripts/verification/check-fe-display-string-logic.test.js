'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-fe-display-string-logic.js');
const { scanSource, scanLocale } = require('./check-fe-display-string-logic');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-display-logic-'));
  Object.entries(files).forEach(([rel, text]) => write(path.join(dir, rel), text));
  return dir;
}

const REL = 'frontend/src/components/schedule/X.js';
const LOCALE = 'frontend/src/locales/ko/x.json';
const BARE_DISPLAY = 'const ok = canCompleteScheduleNow({ date: d, startTime: displayData.startTime });\n';
const FORMATTED = 'hasScheduleSessionStarted({ date: d, startTime: formatTime(event.start) });\n';
const LOCALE_STRING = 'canCompleteScheduleNow({ date: d, startTime: start.toLocaleTimeString() });\n';
const KOREAN_LITERAL = "canCompleteScheduleNow({ date: d, startTime: '오후 01:30' });\n";
const API_FIRST = 'canCompleteScheduleNow({ date: d, startTime: displayData.apiStartTime ?? displayData.startTime });\n';
const WHOLE_OBJECT = 'hasScheduleSessionStarted(activeSchedule);\n';
const COMMENT_ONLY = '// canCompleteScheduleNow({ startTime: x.startTime })\nconst ok = 1;\n';

const tests = {
  '표시 필드 startTime 단독 전달은 DISPLAY_TIME_TO_LOGIC (일정 511 패턴)': () => {
    assert.deepStrictEqual(scanSource(REL, BARE_DISPLAY), [`DISPLAY_TIME_TO_LOGIC ${REL} :: canCompleteScheduleNow`]);
  },
  'formatTime·toLocaleTimeString·오전/오후 리터럴 전달도 잡는다': () => {
    [FORMATTED, LOCALE_STRING, KOREAN_LITERAL].forEach((src) => {
      assert.strictEqual(scanSource(REL, src).length, 1, src);
    });
  },
  'apiStartTime 우선·객체 통째 전달·주석은 통과': () => {
    assert.deepStrictEqual(scanSource(REL, API_FIRST), []);
    assert.deepStrictEqual(scanSource(REL, WHOLE_OBJECT), []);
    assert.deepStrictEqual(scanSource(REL, COMMENT_ONLY), []);
  },
  '다국어 ${...} 잔존은 I18N_RAW_TEMPLATE, {{name}} 은 통과': () => {
    const json = JSON.stringify({ A: { bad: '실패: ${error.message}', ok: '실패: {{message}}' } });
    assert.deepStrictEqual(scanLocale(LOCALE, json), [`I18N_RAW_TEMPLATE ${LOCALE} :: A.bad`]);
  },
  '신규 위반은 실패, 베이스라인이면 통과': () => {
    const dir = fixture({ [REL]: BARE_DISPLAY, [LOCALE]: '{"k":"${x}"}' });
    const bl = path.join(dir, 'bl.txt');
    write(bl, '');
    assert.strictEqual(run(['--root', dir, '--baseline', bl]).code, 1);
    const lines = run(['--root', dir, '--list']).out.trim();
    assert.strictEqual(lines.split('\n').length, 2);
    write(bl, `# c\n${lines}\n`);
    assert.strictEqual(run(['--root', dir, '--baseline', bl]).code, 0);
  },
  '고친 항목이 베이스라인에 남으면 실패': () => {
    const dir = fixture({ [REL]: API_FIRST });
    const bl = path.join(dir, 'bl.txt');
    write(bl, `DISPLAY_TIME_TO_LOGIC ${REL} :: canCompleteScheduleNow\n`);
    const res = run(['--root', dir, '--baseline', bl]);
    assert.strictEqual(res.code, 1);
    assert.ok(res.out.includes('베이스라인 정리 필요'));
  },
  '저장소 현재 상태는 베이스라인과 일치': () => {
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
