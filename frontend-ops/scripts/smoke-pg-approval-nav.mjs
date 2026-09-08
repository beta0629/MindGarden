/**
 * frontend-ops PG 승인 — nav SSOT + confirm 게이트 스모크.
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
const constantsPath = path.join(__dirname, '../src/constants/pgApproval.ts');
const confirmModalPath = path.join(__dirname, '../src/components/ui/ConfirmModal.tsx');

const layout = fs.readFileSync(layoutPath, 'utf8');
const page = fs.readFileSync(pagePath, 'utf8');
const constants = fs.readFileSync(constantsPath, 'utf8');

const checks = [
  { ok: layout.includes('href="/pg-approval"'), msg: 'layout nav href=/pg-approval' },
  { ok: layout.includes('PG 승인'), msg: 'layout nav label PG 승인' },
  { ok: fs.existsSync(pagePath), msg: 'pg-approval page exists' },
  { ok: page.includes('PG_APPROVAL_LABELS'), msg: 'page uses label constants' },
  { ok: !page.includes('테넌트'), msg: 'page user copy must not contain 테넌트' },
  { ok: !page.includes('window.confirm'), msg: 'page must not use window.confirm' },
  { ok: page.includes('ConfirmModal'), msg: 'page uses ConfirmModal' },
  { ok: page.includes('setConfirmMode'), msg: 'page gates submit behind confirmMode' },
  { ok: fs.existsSync(confirmModalPath), msg: 'ConfirmModal component exists' },
  { ok: constants.includes('export const PG_APPROVAL_LABELS'), msg: 'PG_APPROVAL_LABELS export' },
  { ok: constants.includes('CONFIRM_APPROVE'), msg: 'CONFIRM_APPROVE label defined' },
  { ok: constants.includes('CONFIRM_REJECT'), msg: 'CONFIRM_REJECT label defined' },
  { ok: constants.includes('승인 확정'), msg: '승인 확정 label present' },
  { ok: constants.includes('승인 확정으로 진행'), msg: '승인 확정으로 진행 label present' },
  { ok: constants.includes('거부 확정'), msg: '거부 확정 label present' },
  { ok: constants.includes('사용중으로 전환'), msg: '사용중으로 전환 label present' },
  { ok: constants.includes('승인 검토'), msg: '승인 검토 label present' },
  { ok: constants.includes('연결 시험'), msg: '연결 시험 label present' },
  { ok: !constants.includes('TEST_CONNECTION: "연결 테스트"'), msg: '연결 테스트 CTA removed' },
  { ok: constants.includes('maskMerchantId'), msg: 'maskMerchantId helper present' },
  { ok: page.includes('maskMerchantId'), msg: 'page masks merchant id' },
  { ok: page.includes('RESULT_ACTIVE'), msg: 'page shows 사용중으로 전환' },
  { ok: page.includes('DETAIL'), msg: 'page has 상세보기 CTA' },
  { ok: page.includes('TEST_CONNECTION'), msg: 'page has 연결 시험 CTA' },
  { ok: !constants.includes('APPROVE: "승인"'), msg: 'immediate 승인 CTA removed' },
  {
    ok: constants.includes('SUBMIT_APPROVE: "승인 확정으로 진행"')
      && constants.includes('CONFIRM_APPROVE: "승인 확정"'),
    msg: 'form proceed vs final confirm labels split'
  },
  {
    ok: page.includes('setConfirmMode("approve")')
      && page.includes('handleConfirmAction')
      && page.includes('await approvePgConfiguration'),
    msg: 'approve gated: confirmMode then handleConfirmAction then API'
  },
  {
    ok: page.includes('setConfirmMode("reject")')
      && page.includes('handleConfirmAction')
      && page.includes('await rejectPgConfiguration'),
    msg: 'reject gated: confirmMode then handleConfirmAction then API'
  },
  {
    ok: page.includes('onConfirm={handleConfirmAction}')
      && !page.includes('onClick={() => runApprove')
      && !page.includes('onSubmit={runApprove}'),
    msg: 'approve API only via ConfirmModal onConfirm'
  }
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
