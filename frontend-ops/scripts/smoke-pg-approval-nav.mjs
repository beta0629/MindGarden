/**
 * frontend-ops nav SSOT 스모크 — 「PG 승인」 링크 존재 확인.
 * 실행: node frontend-ops/scripts/smoke-pg-approval-nav.mjs
 *
 * @author CoreSolution
 * @since 2026-09-07
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const layoutPath = path.join(__dirname, '../app/layout.tsx');
const pagePath = path.join(__dirname, '../app/pg-approval/page.tsx');

const layout = fs.readFileSync(layoutPath, 'utf8');
const page = fs.readFileSync(pagePath, 'utf8');

const checks = [
  { ok: layout.includes('href="/pg-approval"'), msg: 'layout nav href=/pg-approval' },
  { ok: layout.includes('PG 승인'), msg: 'layout nav label PG 승인' },
  { ok: fs.existsSync(pagePath), msg: 'pg-approval page exists' },
  { ok: page.includes('PG_APPROVAL_LABELS'), msg: 'page uses label constants' },
  { ok: !page.includes('테넌트'), msg: 'page user copy must not contain 테넌트' }
];

let failed = 0;
for (const check of checks) {
  if (!check.ok) {
    console.error(`FAIL: ${check.msg}`);
    failed += 1;
  } else {
    console.log(`OK: ${check.msg}`);
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log('smoke-pg-approval-nav: all checks passed');
