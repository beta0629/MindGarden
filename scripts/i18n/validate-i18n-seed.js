#!/usr/bin/env node
/**
 * i18n 시드 가드 (D5 P4 i18n hotfix · 2026-05-26)
 *
 * 검사 항목:
 *   1) 자기참조 — value 가 leaf key 와 동일 또는 ns:full.path 형태로 동일
 *   2) 빈값 — value 가 빈 문자열 또는 공백만 포함
 *   3) (정보용) 키-사용 미스매치는 audit 모드에서만 출력 — ERROR 가드 X
 *      (전수 사용처 스캔은 false positive 발생 빈도 高, 본 가드는 시드 자체만)
 *
 * 사용:
 *   node scripts/i18n/validate-i18n-seed.js              # ERROR 시 exit 1
 *   node scripts/i18n/validate-i18n-seed.js --report     # 출력만, exit 0
 *
 * D5 P4 i18n Phase 2 인벤토리에서 발견된 회귀 매개체 (자기참조 2 + 빈값 2 = 4건)
 * 차단 목적. 후속 어떤 시드 PR 에서도 동일 결함 재진입 차단.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '../../frontend/src/locales/ko');
const REPORT_ONLY = process.argv.includes('--report');

const issues = { selfRef: [], empty: [] };

function walk(node, pathParts, file) {
  if (node === null || node === undefined) {
    return;
  }
  if (typeof node === 'string') {
    const fullKey = pathParts.join('.');
    const leafKey = pathParts[pathParts.length - 1] || '';
    const ns = path.basename(file, '.json');
    const value = node;
    const trimmed = value.trim();

    if (trimmed === '') {
      issues.empty.push({ file: path.relative(process.cwd(), file), key: fullKey, value });
      return;
    }
    if (value === leafKey || value === fullKey || value === `${ns}:${fullKey}`) {
      issues.selfRef.push({ file: path.relative(process.cwd(), file), key: fullKey, value });
    }
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      walk(node[i], pathParts.concat(String(i)), file);
    }
    return;
  }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) {
      walk(node[k], pathParts.concat(k), file);
    }
  }
}

function main() {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`[validate-i18n-seed] LOCALES_DIR not found: ${LOCALES_DIR}`);
    process.exit(2);
  }

  const files = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(LOCALES_DIR, f));

  let parseFail = 0;
  for (const file of files) {
    let json;
    try {
      json = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      parseFail += 1;
      console.error(`[validate-i18n-seed] JSON parse 실패: ${file} — ${err.message}`);
      continue;
    }
    walk(json, [], file);
  }

  const total = issues.selfRef.length + issues.empty.length;

  if (issues.selfRef.length > 0) {
    console.error(`\n=== 자기참조 시드 (${issues.selfRef.length}) ===`);
    for (const it of issues.selfRef) {
      console.error(`  ${it.file} :: ${it.key} = ${JSON.stringify(it.value)}`);
    }
  }
  if (issues.empty.length > 0) {
    console.error(`\n=== 빈값 시드 (${issues.empty.length}) ===`);
    for (const it of issues.empty) {
      console.error(`  ${it.file} :: ${it.key} = ${JSON.stringify(it.value)}`);
    }
  }

  if (parseFail > 0) {
    console.error(`\n[validate-i18n-seed] JSON parse 실패 파일: ${parseFail} 건`);
    if (!REPORT_ONLY) {
      process.exit(1);
    }
  }

  if (total === 0) {
    console.log(`[validate-i18n-seed] PASS — ${files.length} 파일 시드 정상 (자기참조 0 / 빈값 0).`);
    process.exit(0);
  }

  if (REPORT_ONLY) {
    console.warn(`\n[validate-i18n-seed] REPORT-ONLY 모드 — 총 ${total} 건 (CI 차단 비활성).`);
    process.exit(0);
  }

  console.error(`\n[validate-i18n-seed] FAIL — 총 ${total} 건 (자기참조 ${issues.selfRef.length} / 빈값 ${issues.empty.length}).`);
  console.error('운영 노출 회귀 차단 — 의미 있는 한국어 값으로 교체하거나, 의도된 placeholder 라면 별도 운영 정책 명세 후 가드 예외 등록.');
  process.exit(1);
}

main();
