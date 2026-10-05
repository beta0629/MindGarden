/**
 * frontend-ops PG 승인 — LNB shell SSOT + confirm 게이트 스모크.
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
const opsLnbPath = path.join(__dirname, '../src/components/shell/OpsLnb.tsx');
const opsShellConstantsPath = path.join(__dirname, '../src/constants/opsShell.ts');
const opsNavPath = path.join(__dirname, '../src/constants/opsNav.ts');
const pagePath = path.join(__dirname, '../app/pg-approval/page.tsx');
const constantsPath = path.join(__dirname, '../src/constants/pgApproval.ts');
const confirmModalPath = path.join(__dirname, '../src/components/ui/ConfirmModal.tsx');
const dashboardPath = path.join(__dirname, '../app/dashboard/page.tsx');
const homePath = path.join(__dirname, '../app/page.tsx');

const layout = fs.readFileSync(layoutPath, 'utf8');
const opsLnb = fs.readFileSync(opsLnbPath, 'utf8');
const opsShell = fs.readFileSync(opsShellConstantsPath, 'utf8');
const opsNav = fs.readFileSync(opsNavPath, 'utf8');
const page = fs.readFileSync(pagePath, 'utf8');
const constants = fs.readFileSync(constantsPath, 'utf8');
const dashboard = fs.readFileSync(dashboardPath, 'utf8');
const home = fs.readFileSync(homePath, 'utf8');

function navLabelKeys(src) {
  return [...src.matchAll(/label: OPS_NAV_COPY\.([A-Z0-9_]+)/g)].map((match) => match[1]);
}

function OPS_NAV_LEAF_COUNT_OK(src) {
  return (src.match(/href: OPS_NAV_PATH\./g) || []).length === 21;
}

/** 현황 → 온보딩 → 테넌트 → 결제·청구(요금제, PG 승인) */
function OPS_NAV_ORDER_OK(src) {
  const keys = navLabelKeys(src);
  const overview = keys.indexOf('OVERVIEW');
  const onboarding = keys.indexOf('ONBOARDING');
  const list = keys.indexOf('ONBOARDING_LIST');
  const tenants = keys.indexOf('TENANTS');
  const billing = keys.indexOf('BILLING');
  const plans = keys.indexOf('BILLING_PLANS');
  const pg = keys.indexOf('PG_APPROVAL');
  return (
    overview === 0 &&
    onboarding > overview &&
    list > onboarding &&
    tenants > list &&
    billing > tenants &&
    plans > billing &&
    pg > plans
  );
}

const checks = [
  { ok: layout.includes('OpsLnb'), msg: 'layout uses OpsLnb shell' },
  { ok: layout.includes('OPS_SHELL_BRAND'), msg: 'layout shows Ops brand' },
  { ok: layout.includes('ops-shell__gnb'), msg: 'layout has ops-shell__gnb' },
  { ok: layout.includes('ops-shell__env'), msg: 'layout shows env pill' },
  { ok: !layout.includes('layout__nav'), msg: 'layout top horizontal nav removed' },
  { ok: !layout.includes('layout__header'), msg: 'layout sticky top header removed' },
  { ok: opsLnb.includes('OPS_NAV_TREE'), msg: 'OpsLnb maps the nav tree' },
  { ok: opsLnb.includes('mg-v2-desktop-lnb'), msg: 'OpsLnb uses DesktopLnb twin class' },
  { ok: opsShell.includes("OPS_SHELL_PRODUCT_COPY = 'ops · 테넌트 격리'"), msg: 'product copy ops · 테넌트 격리' },
  { ok: opsNav.includes('OVERVIEW: "/dashboard"'), msg: 'LNB 현황 path' },
  { ok: opsNav.includes('PG_APPROVAL: "/pg-approval"'), msg: 'LNB PG 승인 path' },
  { ok: opsNav.includes('TENANT_LIST: "/tenants"'), msg: 'LNB 테넌트 목록 path' },
  { ok: opsNav.includes('ONBOARDING_LIST: "/onboarding"'), msg: 'LNB 신청 목록 path' },
  { ok: OPS_NAV_ORDER_OK(opsNav), msg: 'LNB order overview → onboarding → tenants → billing' },
  { ok: opsNav.includes('PG_APPROVAL: "PG 승인"'), msg: 'LNB label PG 승인' },
  { ok: opsNav.includes('TENANTS: "테넌트"'), msg: 'LNB label 테넌트' },
  { ok: opsNav.includes('ONBOARDING_LIST: "신청 목록"'), msg: 'LNB includes 신청 목록' },
  { ok: opsNav.includes('BILLING_PLANS: "요금제"'), msg: 'LNB includes 요금제' },
  { ok: !opsNav.includes('Feature Flag'), msg: 'LNB excludes Feature Flag' },
  { ok: OPS_NAV_LEAF_COUNT_OK(opsNav), msg: 'LNB has 21 leaves' },
  { ok: home.includes('OPS_SHELL_PATHS.TENANTS'), msg: 'root redirects to /tenants' },
  { ok: !home.includes('"/dashboard"'), msg: 'root no longer hard-redirects to dashboard' },
  { ok: fs.existsSync(pagePath), msg: 'pg-approval page exists' },
  { ok: page.includes('PG_APPROVAL_LABELS'), msg: 'page uses label constants' },
  { ok: page.includes('OpsQuietHeader'), msg: 'page uses quiet header' },
  { ok: page.includes('ops-approval__stage'), msg: 'page uses paper stage' },
  { ok: page.includes('outlineWarn'), msg: 'page reject CTA uses outlineWarn' },
  { ok: page.includes('variant="primary"'), msg: 'page approve CTA uses primary teal' },
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
  { ok: constants.includes('거부 검토'), msg: '거부 검토 label present' },
  { ok: !constants.includes('REJECT: "거부"'), msg: 'list REJECT is not bare 거부' },
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
  },
  { ok: dashboard.includes('ops-shell__stage'), msg: '현황 uses paper stage' },
  { ok: dashboard.includes('OPS_OVERVIEW_COPY'), msg: '현황 uses overview copy' },
  { ok: !dashboard.includes('metric-grid'), msg: '현황 full KPI grid removed' },
  { ok: !dashboard.includes('운영 대시보드'), msg: '현황 legacy dashboard title removed' }
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
