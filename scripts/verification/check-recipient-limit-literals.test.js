'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-recipient-limit-literals.js');
const { scanJavaDto, scanFrontend, scanLocale } = require('./check-recipient-limit-literals');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recipient-limit-literals-'));
  Object.entries(files).forEach(([rel, text]) => write(path.join(dir, rel), text));
  return dir;
}

const DTO = 'src/main/java/com/x/dto/BulkSmsManualRequest.java';
const DTO_OTHER_TOPIC = 'src/main/java/com/x/dto/ScheduleRequest.java';
const NOT_DTO = 'src/main/java/com/x/service/ManualNotificationService.java';
const FE = 'frontend/src/api/admin/manualNotificationApi.js';
const LOCALE = 'frontend/src/locales/ko/admin.json';

const SIZE_LIST = '@Size(min = 1, max = 50, message = "1~50명")\n    private List<Long> userIds;\n';
const SIZE_LIST_MULTILINE = '@Size(\n        max = 500\n    )\n    @NotNull\n    private java.util.Set<String> phoneNumbers = new HashSet<>();\n';
const SIZE_STRING = '@Size(max = 1000)\n    private String content;\n';
const CUSTOM = '@WithinManualRecipientLimit\n    private List<Long> userIds;\n';
const SIZE_COMMENTED = '// @Size(max = 50)\n    @WithinManualRecipientLimit\n    private List<Long> userIds;\n';

const tests = {
  '알림·수동·일괄 DTO 목록 필드의 @Size(max = n) 는 위반': () => {
    assert.deepStrictEqual(scanJavaDto(DTO, SIZE_LIST), [`SIZE_MAX ${DTO} :: userIds max=50`]);
    assert.deepStrictEqual(scanJavaDto(DTO, SIZE_LIST_MULTILINE), [`SIZE_MAX ${DTO} :: phoneNumbers max=500`]);
  },
  '문자열 필드·공통 검증 어노테이션·주석·다른 주제·DTO 밖은 통과': () => {
    assert.deepStrictEqual(scanJavaDto(DTO, SIZE_STRING), []);
    assert.deepStrictEqual(scanJavaDto(DTO, CUSTOM), []);
    assert.deepStrictEqual(scanJavaDto(DTO, SIZE_COMMENTED), []);
    assert.deepStrictEqual(scanJavaDto(DTO_OTHER_TOPIC, SIZE_LIST), []);
    assert.deepStrictEqual(scanJavaDto(NOT_DTO, SIZE_LIST), []);
  },
  'FE *MAX_RECIPIENTS = n 은 위반, 주석·숫자 아닌 값은 통과': () => {
    assert.deepStrictEqual(scanFrontend(FE, 'export const MANUAL_NOTIFICATION_MAX_RECIPIENTS = 50;\n'),
      [`FE_MAX_RECIPIENTS ${FE} :: MANUAL_NOTIFICATION_MAX_RECIPIENTS=50`]);
    assert.deepStrictEqual(scanFrontend(FE, 'const MAX_RECIPIENTS=500;'), [`FE_MAX_RECIPIENTS ${FE} :: MAX_RECIPIENTS=500`]);
    assert.deepStrictEqual(scanFrontend(FE, '// MAX_RECIPIENTS = 50\nconst max = config.maxRecipients;\n'), []);
    assert.deepStrictEqual(scanFrontend(FE, 'const MAX_RECIPIENTS = serverLimit;\n'), []);
  },
  '다국어 「최대 N명」·「N명 상한」 은 위반, {{max}} 보간·다른 단위는 통과': () => {
    const json = JSON.stringify({
      manualNotification: {
        recipient: { title: '수신자 선택 (최대 50명)', ok: '수신자 선택 (최대 {{max}}명)' },
        phone: { limitReached: '전체 수신자 50명 상한에 도달했습니다.' },
        push: { titleMax: '최대 50자' }
      }
    });
    assert.deepStrictEqual(scanLocale(LOCALE, json), [
      `LOCALE_LIMIT ${LOCALE} :: manualNotification.recipient.title "최대 50명"`,
      `LOCALE_LIMIT ${LOCALE} :: manualNotification.phone.limitReached "50명 상한"`
    ]);
  },
  '허용 목록에 없으면 실패, 있으면 통과, 사라지면 실패': () => {
    const dir = fixture({
      [FE]: 'export const MANUAL_NOTIFICATION_FALLBACK_MAX_RECIPIENTS = 500;\n',
      [LOCALE]: JSON.stringify({ a: { b: '최대 {{max}}명' } })
    });
    const al = path.join(dir, 'allow.txt');
    write(al, '');
    const fail = run(['--root', dir, '--allowlist', al]);
    assert.strictEqual(fail.code, 1, fail.out);
    assert.ok(fail.out.includes('MANUAL_NOTIFICATION_FALLBACK_MAX_RECIPIENTS=500'), fail.out);

    const line = run(['--root', dir, '--list']).out.trim();
    write(al, `# 폴백\n${line}\n`);
    assert.strictEqual(run(['--root', dir, '--allowlist', al]).code, 0);

    write(path.join(dir, LOCALE), JSON.stringify({ a: { b: '최대 50명' } }));
    assert.strictEqual(run(['--root', dir, '--allowlist', al]).code, 1);

    write(path.join(dir, LOCALE), JSON.stringify({ a: { b: '최대 {{max}}명' } }));
    write(path.join(dir, FE), 'export const x = 1;\n');
    const stale = run(['--root', dir, '--allowlist', al]);
    assert.strictEqual(stale.code, 1, stale.out);
    assert.ok(stale.out.includes('허용 목록 정리 필요'), stale.out);
  },
  '저장소 현재 상태는 허용 목록과 일치': () => {
    const res = run(['--root', ROOT]);
    assert.strictEqual(res.code, 0, res.out);
  }
};

let failed = 0;
Object.entries(tests).forEach(([name, fn]) => {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`not ok - ${name}\n  ${e.message}`);
  }
});
if (failed > 0) {
  console.log(`${failed} failed`);
  process.exit(1);
}
console.log('check-recipient-limit-literals self-test: all passed');
