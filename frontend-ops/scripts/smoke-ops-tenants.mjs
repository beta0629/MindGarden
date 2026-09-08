/**
 * frontend-ops 테넌트 Phase 1 empty/coming 스모크.
 * 실행: node frontend-ops/scripts/smoke-ops-tenants.mjs
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const files = {
  page: path.join(root, 'app/tenants/page.tsx'),
  constants: path.join(root, 'src/constants/opsTenants.ts'),
  shell: path.join(root, 'src/constants/opsShell.ts'),
  emptyState: path.join(root, 'src/components/ui/EmptyState.tsx'),
  css: path.join(root, 'styles/ops-tenants.css'),
  card: path.join(root, 'src/components/tenants/TenantCenterCard.tsx'),
  strip: path.join(root, 'src/components/tenants/TenantSummaryStrip.tsx'),
  overflow: path.join(root, 'src/components/tenants/TenantOverflowMenu.tsx'),
  service: path.join(root, 'src/services/tenantOpsService.ts')
};

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function exists(p) {
  return fs.existsSync(p);
}

const page = read(files.page);
const constants = read(files.constants);
const shell = read(files.shell);
const emptyState = read(files.emptyState);
const css = read(files.css);
const service = exists(files.service) ? read(files.service) : '';

const checks = [
  { ok: constants.includes("TITLE: '테넌트'"), msg: 'quiet header title 테넌트' },
  {
    ok:
      constants.includes("TOPBAR_PRODUCT: 'ops · 테넌트 격리'") ||
      shell.includes("OPS_SHELL_PRODUCT_COPY = 'ops · 테넌트 격리'"),
    msg: 'product copy ops · 테넌트 격리'
  },
  {
    ok: constants.includes("EMPTY_TITLE: '테넌트 관리를 준비 중입니다'"),
    msg: 'empty title 카피'
  },
  {
    ok: constants.includes(
      "EMPTY_DESCRIPTION: '센터 목록과 운영 도구는 이후 단계에서 제공됩니다.'"
    ),
    msg: 'empty supporting 카피'
  },
  { ok: page.includes('OpsQuietHeader'), msg: 'page quiet header' },
  { ok: page.includes('EmptyState'), msg: 'page EmptyState twin' },
  { ok: page.includes('ops-shell__stage'), msg: 'page paper stage' },
  { ok: page.includes('OPS_TENANT_LABELS.EMPTY_TITLE'), msg: 'page uses empty title' },
  {
    ok: page.includes('OPS_TENANT_LABELS.EMPTY_DESCRIPTION'),
    msg: 'page uses empty supporting'
  },
  { ok: !page.includes('TenantSummaryStrip'), msg: 'page has no strip3' },
  { ok: !page.includes('TenantCenterCard'), msg: 'page has no center cards' },
  { ok: !page.includes('TenantOverflowMenu'), msg: 'page has no overflow menu' },
  { ok: !page.includes('ConfirmModal'), msg: 'page has no ConfirmModal' },
  { ok: !page.includes('센터 들어가기'), msg: 'page has no 들어가기 CTA' },
  { ok: !page.includes('fetchOpsTenants'), msg: 'page has no list fetch' },
  { ok: !page.includes('suspendOpsTenant'), msg: 'page has no suspend call' },
  { ok: !page.includes('resumeOpsTenant'), msg: 'page has no resume call' },
  { ok: !page.includes('window.confirm'), msg: 'no window.confirm' },
  { ok: !page.includes('삭제'), msg: 'page has no 삭제' },
  { ok: !constants.includes('삭제'), msg: 'constants have no 삭제' },
  { ok: !exists(files.card), msg: 'TenantCenterCard removed' },
  { ok: !exists(files.strip), msg: 'TenantSummaryStrip removed' },
  { ok: !exists(files.overflow), msg: 'TenantOverflowMenu removed' },
  { ok: emptyState.includes('mg-v2-empty-state'), msg: 'EmptyState twin class' },
  { ok: css.includes('--mg-v2-font-size-h2'), msg: 'empty title uses h2 token' },
  { ok: css.includes('--mg-v2-color-text-secondary'), msg: 'empty desc secondary token' },
  { ok: !css.includes('#'), msg: 'ops-tenants.css no raw hex' },
  { ok: !css.includes('ops-tenants-card'), msg: 'css has no card grid' },
  { ok: !css.includes('ops-tenants-summary'), msg: 'css has no strip3' },
  {
    ok: !page.includes('Coming soon') && !constants.includes('Coming soon'),
    msg: 'no English Coming soon stub'
  },
  {
    ok: !/\btenantId\b/.test(
      page.match(/OPS_TENANT_LABELS\.TITLE[\s\S]{0,80}/)?.[0] || ''
    ),
    msg: 'page title is not tenantId'
  },
  {
    ok: shell.includes("label: OPS_SHELL_LNB_LABELS.TENANTS"),
    msg: 'LNB keeps 테넌트 slot'
  }
];

// FE service may remain for later phases; page must not call it.
if (service) {
  checks.push({
    ok: !page.includes('tenantOpsService'),
    msg: 'page does not import tenantOpsService'
  });
}

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
console.log('smoke-ops-tenants: all checks passed');
