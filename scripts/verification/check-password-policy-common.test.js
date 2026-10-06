'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-password-policy-common.js');
const { scanFile } = require('./check-password-policy-common');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'password-policy-common-'));
  Object.entries(files).forEach(([rel, text]) => write(path.join(dir, rel), text));
  return dir;
}

const REL = 'frontend/src/components/X.js';
const IMPORT_SHARED = "import usePasswordPolicyField from '../hooks/usePasswordPolicyField';\n";
const RAW_INPUT = '<input type="password" name="password" value={v} onChange={c} />\n';
const RAW_TOGGLE = "<input\n  type={show ? 'text' : 'password'}\n  onChange={(e) => set(e.target.value)}\n/>\n";
const RAW_CUSTOM = '<MGInput type="password" value={v} />\n';
const CURRENT = '<input type="password" autoComplete="current-password" name="password" />\n';
const CURRENT_CONST = '<input type={show ? \'text\' : \'password\'} autoComplete={PASSWORD_AUTOCOMPLETE.CURRENT} />\n';
const POLICY_INPUT = '<PasswordPolicyInput field={passwordField} type="password" value={v} />\n';
const VALIDATE = 'if (!passwordField.validateCommitted(form.password).valid) return;\n';
const VALIDATE_LEGACY = 'if (!passwordField.validate(form.password)) return;\n';
const VALIDATE_ALIAS = 'const { validateCommitted: validatePassword } = passwordField;\nconst ok = validatePassword(a, b);\n';
const FIELD_CONFIG = "const fields = [{ name: 'pw', type: 'password' }];\n";
const PAYLOAD = "await StandardizedApi.post(URL, { email, password: form.password });\n";
const PAYLOAD_EMPTY = "const init = { password: '' };\nawait StandardizedApi.post(URL, { email });\n";
const IMPORT_POLICY_FN = "import { isLoginPasswordCompliant } from '../utils/loginPasswordPolicy';\n";
const OWN_VALIDATOR = 'export const validatePassword = (pw) => pw != null;\n';
const OWN_VALIDATOR_FN = 'function isValidPassword(pw) { return !!pw; }\n';
const DELEGATING_VALIDATOR = 'export const isValidPassword = (pw) => isLoginPasswordCompliant(pw);\n';
const REGEX_TEST = 'const ok = /[A-Z]/.test(form.password);\n';
const LOOKAHEAD = 'const RE = /^(?=.*[a-z])(?=.*\\d).{8,}$/;\n';
const LENGTH_RULE = 'if (newPassword.length < 8) return false;\n';
const NON_EMPTY = 'const filled = form.password.trim().length > 0;\n';
const HINT_SHOW_FALSE = '<PasswordPolicyInput field={f} showHint={false} />\nif (!f.validateCommitted(v).valid) return;\n';
const HINT_EXTERNAL_OK = '<PasswordPolicyInput field={f} hintExternal id="pw" />\n<PasswordPolicyHint field={f} id="pw" />\n'
  + 'if (!f.validateCommitted(v).valid) return;\n';
const HINT_EXTERNAL_MISSING = '<PasswordPolicyInput field={f} hintExternal id="pw" />\nif (!f.validateCommitted(v).valid) return;\n';
const HINT_CONDITIONAL = '<PasswordPolicyInput field={f} hintExternal id="pw" />\n'
  + '{!f.errorMessage ? <PasswordPolicyHint field={f} id="pw" /> : null}\nif (!f.validateCommitted(v).valid) return;\n';
const HINT_RAW = IMPORT_SHARED + '<PasswordPolicyInput field={f} hintExternal />\n<PasswordPolicyHint field={f} />\n'
  + '<small>{f.hint}</small>\nif (!f.validateCommitted(v).valid) return;\n';
const COMMENT_ONLY = '// <input type="password" />\n/* StandardizedApi.post(URL, { password: x }) */\nconst ok = 1;\n';

const tests = {
  '공통 컴포넌트 없는 비밀번호 입력은 위반': () => {
    assert.deepStrictEqual(scanFile(REL, RAW_INPUT), [`RAW_PASSWORD_INPUT ${REL} x1`]);
    assert.deepStrictEqual(scanFile(REL, RAW_TOGGLE), [`RAW_PASSWORD_INPUT ${REL} x1`]);
    assert.deepStrictEqual(scanFile(REL, RAW_CUSTOM), [`RAW_PASSWORD_INPUT ${REL} x1`]);
  },
  '현재 비밀번호(로그인·본인 확인) 입력은 통과': () => {
    assert.deepStrictEqual(scanFile(REL, CURRENT), []);
    assert.deepStrictEqual(scanFile(REL, CURRENT_CONST), []);
    assert.deepStrictEqual(scanFile(REL, CURRENT + PAYLOAD), []);
  },
  'PasswordPolicyInput 은 validateCommitted 를 불러야 통과(제출 시점 값 확정)': () => {
    assert.deepStrictEqual(scanFile(REL, POLICY_INPUT), [`POLICY_INPUT_NO_VALIDATE ${REL}`]);
    assert.deepStrictEqual(scanFile(REL, POLICY_INPUT + VALIDATE_LEGACY), [`POLICY_INPUT_NO_VALIDATE ${REL}`]);
    assert.deepStrictEqual(scanFile(REL, POLICY_INPUT + VALIDATE), []);
    assert.deepStrictEqual(scanFile(REL, POLICY_INPUT + VALIDATE_ALIAS), []);
  },
  '폼 설정 type: password 는 위반': () => {
    assert.deepStrictEqual(scanFile(REL, FIELD_CONFIG), [`PASSWORD_FIELD_CONFIG ${REL} x1`]);
  },
  '공통 모듈 없이 비밀번호를 보내면 위반, import 하면 통과': () => {
    assert.deepStrictEqual(scanFile(REL, PAYLOAD), [`PASSWORD_PAYLOAD_NO_POLICY ${REL}`]);
    assert.deepStrictEqual(scanFile(REL, IMPORT_SHARED + PAYLOAD), []);
    assert.deepStrictEqual(scanFile(REL, PAYLOAD_EMPTY), []);
  },
  '공통 정책 함수 없이 만든 비밀번호 검증 함수는 위반, 위임하면 통과': () => {
    assert.deepStrictEqual(scanFile(REL, OWN_VALIDATOR), [`PASSWORD_VALIDATOR_DEF ${REL} x1`]);
    assert.deepStrictEqual(scanFile(REL, OWN_VALIDATOR_FN), [`PASSWORD_VALIDATOR_DEF ${REL} x1`]);
    assert.deepStrictEqual(scanFile(REL, IMPORT_SHARED + OWN_VALIDATOR), [`PASSWORD_VALIDATOR_DEF ${REL} x1`]);
    assert.deepStrictEqual(scanFile(REL, IMPORT_POLICY_FN + DELEGATING_VALIDATOR), []);
    assert.deepStrictEqual(scanFile(REL, VALIDATE_ALIAS), []);
  },
  '공통 모듈 밖 비밀번호 정규식·길이 규칙은 위반(공통 함수를 import 해도)': () => {
    assert.deepStrictEqual(scanFile(REL, REGEX_TEST), [`PASSWORD_RULE_LITERAL ${REL} x1`]);
    assert.deepStrictEqual(scanFile(REL, LOOKAHEAD), [`PASSWORD_RULE_LITERAL ${REL} x1`]);
    assert.deepStrictEqual(scanFile(REL, IMPORT_POLICY_FN + LENGTH_RULE), [`PASSWORD_RULE_LITERAL ${REL} x1`]);
    assert.deepStrictEqual(scanFile(REL, NON_EMPTY), []);
    assert.deepStrictEqual(scanFile('frontend/src/utils/loginPasswordPolicy.js', REGEX_TEST + LOOKAHEAD), []);
  },
  '정책 힌트를 숨기는 코드는 위반, 외부 힌트 컴포넌트를 항상 그리면 통과': () => {
    assert.deepStrictEqual(scanFile(REL, HINT_SHOW_FALSE), [`POLICY_HINT_HIDDEN ${REL}`]);
    assert.deepStrictEqual(scanFile(REL, HINT_EXTERNAL_MISSING), [`POLICY_HINT_HIDDEN ${REL}`]);
    assert.deepStrictEqual(scanFile(REL, HINT_CONDITIONAL), [`POLICY_HINT_HIDDEN ${REL}`]);
    assert.deepStrictEqual(scanFile(REL, HINT_RAW), [`POLICY_HINT_HIDDEN ${REL}`]);
    assert.deepStrictEqual(scanFile(REL, HINT_EXTERNAL_OK), []);
    assert.deepStrictEqual(scanFile(REL, POLICY_INPUT + VALIDATE), []);
  },
  '주석·공통 모듈 파일은 통과': () => {
    assert.deepStrictEqual(scanFile(REL, COMMENT_ONLY), []);
    assert.deepStrictEqual(scanFile('frontend/src/components/common/PasswordPolicyInput.js', RAW_TOGGLE), []);
  },
  '같은 파일에 하나 더 늘면 개수가 바뀐다': () => {
    assert.deepStrictEqual(scanFile(REL, RAW_INPUT + RAW_INPUT), [`RAW_PASSWORD_INPUT ${REL} x2`]);
  },
  '신규 위반은 실패, 사유 있는 허용 목록이면 통과, 늘면 실패': () => {
    const dir = fixture({ [REL]: RAW_INPUT });
    const al = path.join(dir, 'al.txt');
    write(al, '');
    assert.strictEqual(run(['--root', dir, '--allowlist', al]).code, 1);
    const line = run(['--root', dir, '--list']).out.trim();
    write(al, `# c\n${line} :: 테스트 사유\n`);
    assert.strictEqual(run(['--root', dir, '--allowlist', al]).code, 0);
    write(path.join(dir, REL), RAW_INPUT + RAW_INPUT);
    assert.strictEqual(run(['--root', dir, '--allowlist', al]).code, 1);
  },
  '사유 없는 허용 항목은 실패': () => {
    const dir = fixture({ [REL]: RAW_INPUT });
    const al = path.join(dir, 'al.txt');
    write(al, `RAW_PASSWORD_INPUT ${REL} x1\n`);
    const res = run(['--root', dir, '--allowlist', al]);
    assert.strictEqual(res.code, 1);
    assert.ok(res.out.includes('사유 누락'));
  },
  '고친 항목이 허용 목록에 남으면 실패': () => {
    const dir = fixture({ [REL]: CURRENT });
    const al = path.join(dir, 'al.txt');
    write(al, `RAW_PASSWORD_INPUT ${REL} x1 :: 예전 사유\n`);
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
