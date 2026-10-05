'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-fe-admin-list-paging.js');
const { scanFile, stripComments } = require('./check-fe-admin-list-paging');

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-list-paging-'));
  Object.entries(files).forEach(([rel, text]) => write(path.join(dir, rel), text));
  return dir;
}

const REL = 'frontend/src/components/admin/X.js';
const FETCH_ALL = "const r = await StandardizedApi.get(url, { page: 0, size: total });\n";
const NO_PAGING = 'const r = await StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PAYMENT);\n';
const PAGED = 'const r = await StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PAYMENT, { page: 0, size: 20 });\n';
const SUB_PATH = 'const r = await StandardizedApi.get(`${API_ENDPOINTS.ADMIN.CLIENTS.WITH_STATS}/${id}`);\n';
const LOCAL_CONST = "const PENDING = '/api/v1/admin/mappings/pending-deposit';\nconst r = StandardizedApi.get(PENDING);\n";
const COMMENT_ONLY = '// size: total 전체 조회 금지\n/* size=count */\nconst ok = 1;\n';

const tests = {
  'size: total 는 FETCH_ALL': () => {
    assert.ok(scanFile(REL, FETCH_ALL).some((l) => l.startsWith('FETCH_ALL')));
  },
  'page/size 없는 목록 호출은 NO_PAGING': () => {
    assert.ok(scanFile(REL, NO_PAGING).some((l) => l.startsWith('NO_PAGING')));
  },
  'page/size 있으면 통과': () => {
    assert.deepStrictEqual(scanFile(REL, PAGED), []);
  },
  '단건 하위 경로는 통과': () => {
    assert.deepStrictEqual(scanFile(REL, SUB_PATH), []);
  },
  '파일 내 경로 상수도 잡는다': () => {
    assert.ok(scanFile(REL, LOCAL_CONST).some((l) => l.includes('pending-deposit')));
  },
  '주석 속 문구는 무시': () => {
    assert.deepStrictEqual(scanFile(REL, COMMENT_ONLY), []);
    assert.strictEqual(stripComments("'// 문자열'").trim(), "'// 문자열'");
  },
  '신규 위반은 실패, 베이스라인이면 통과': () => {
    const dir = fixture({ [REL]: FETCH_ALL });
    const bl = path.join(dir, 'bl.txt');
    write(bl, '');
    assert.strictEqual(run(['--root', dir, '--baseline', bl]).code, 1);
    const line = run(['--root', dir, '--list']).out.trim();
    write(bl, `# c\n${line}\n`);
    assert.strictEqual(run(['--root', dir, '--baseline', bl]).code, 0);
  },
  '고친 항목이 베이스라인에 남으면 실패': () => {
    const dir = fixture({ [REL]: PAGED });
    const bl = path.join(dir, 'bl.txt');
    write(bl, `FETCH_ALL ${REL} :: size: total\n`);
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
