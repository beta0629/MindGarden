'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-login-redirect-bypass.js');
const { scanFile } = require('./check-login-redirect-bypass');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'login-redirect-bypass-'));
  Object.entries(files).forEach(([rel, text]) => write(path.join(dir, rel), text));
  return dir;
}

const REL = 'frontend/src/components/X.js';
const NAVIGATE = "if (res.status === 401) navigate('/login', { replace: true });\n";
const NAVIGATE_QUERY = 'navigate(`/login?redirect=${encodeURIComponent(path)}`);\n';
const HREF = 'window.location.href = `${window.location.origin}/login`;\n';
const REPLACE = "window.location.replace('/login?x=1');\n";
const JSX = '<Navigate to="/login" replace />\n';
const JSX_EXPR = '<Navigate to={`/login?redirect=${t}`} replace />\n';
const SHARED = "redirectToLoginPageOnce({ returnUrl: '/consultant/schedule' });\n";
const OTHER_PATH = "navigate('/login-help'); navigate('/admin/login-logs'); navigate('/dashboard');\n";
const USER_CLICK = "<button onClick={() => navigate('/login')}>로그인</button>\n";
const COMMENT_ONLY = "// navigate('/login') 금지\n/* window.location.href = '/login' */\nconst ok = 1;\n";

const tests = {
  'navigate(/login) 는 위반': () => {
    assert.deepStrictEqual(scanFile(REL, NAVIGATE), [`LOGIN_NAV ${REL} :: navigate x1`]);
    assert.deepStrictEqual(scanFile(REL, NAVIGATE_QUERY), [`LOGIN_NAV ${REL} :: navigate x1`]);
  },
  'location.href 대입·replace 는 위반': () => {
    assert.deepStrictEqual(scanFile(REL, HREF), [`LOGIN_NAV ${REL} :: location.href= x1`]);
    assert.deepStrictEqual(scanFile(REL, REPLACE), [`LOGIN_NAV ${REL} :: location.replace x1`]);
  },
  '<Navigate to=/login> 는 위반': () => {
    assert.deepStrictEqual(scanFile(REL, JSX), [`LOGIN_NAV ${REL} :: <Navigate> x1`]);
    assert.deepStrictEqual(scanFile(REL, JSX_EXPR), [`LOGIN_NAV ${REL} :: <Navigate> x1`]);
  },
  '공용 처리 호출·공용 처리 파일은 통과': () => {
    assert.deepStrictEqual(scanFile(REL, SHARED), []);
    assert.deepStrictEqual(scanFile('frontend/src/utils/sessionRedirect.js', HREF), []);
  },
  '다른 경로·사용자 클릭·주석은 통과': () => {
    assert.deepStrictEqual(scanFile(REL, OTHER_PATH), []);
    assert.deepStrictEqual(scanFile(REL, USER_CLICK), []);
    assert.deepStrictEqual(scanFile(REL, COMMENT_ONLY), []);
  },
  '같은 파일에 하나 더 늘면 개수가 바뀐다': () => {
    assert.deepStrictEqual(scanFile(REL, NAVIGATE + NAVIGATE), [`LOGIN_NAV ${REL} :: navigate x2`]);
  },
  '신규 위반은 실패, 베이스라인이면 통과, 늘면 실패': () => {
    const dir = fixture({ [REL]: NAVIGATE });
    const bl = path.join(dir, 'bl.txt');
    write(bl, '');
    assert.strictEqual(run(['--root', dir, '--baseline', bl]).code, 1);
    const line = run(['--root', dir, '--list']).out.trim();
    write(bl, `# c\n${line}\n`);
    assert.strictEqual(run(['--root', dir, '--baseline', bl]).code, 0);
    write(path.join(dir, REL), NAVIGATE + NAVIGATE);
    assert.strictEqual(run(['--root', dir, '--baseline', bl]).code, 1);
  },
  '고친 항목이 베이스라인에 남으면 실패': () => {
    const dir = fixture({ [REL]: SHARED });
    const bl = path.join(dir, 'bl.txt');
    write(bl, `LOGIN_NAV ${REL} :: navigate x1\n`);
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
