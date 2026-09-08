/**
 * frontend-ops 테넌트 본문 Clinic-OS 스모크.
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
  card: path.join(root, 'src/components/tenants/TenantCenterCard.tsx'),
  strip: path.join(root, 'src/components/tenants/TenantSummaryStrip.tsx'),
  overflow: path.join(root, 'src/components/tenants/TenantOverflowMenu.tsx'),
  css: path.join(root, 'styles/ops-tenants.css'),
  tokens: path.join(root, 'styles/clinic-os-tokens.css'),
  api: path.join(root, 'src/constants/api.ts'),
  service: path.join(root, 'src/services/tenantOpsService.ts'),
  controller: path.join(
    root,
    '../src/main/java/com/coresolution/core/controller/ops/TenantOpsController.java'
  ),
  opsService: path.join(
    root,
    '../src/main/java/com/coresolution/core/service/ops/TenantOpsService.java'
  )
};

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

const page = read(files.page);
const constants = read(files.constants);
const shell = read(files.shell);
const card = read(files.card);
const strip = read(files.strip);
const overflow = read(files.overflow);
const css = read(files.css);
const tokens = read(files.tokens);
const api = read(files.api);
const service = read(files.service);
const controller = read(files.controller);
const opsService = read(files.opsService);

const checks = [
  { ok: constants.includes("TITLE: '테넌트'"), msg: 'quiet header title 테넌트' },
  {
    ok: constants.includes("TOPBAR_PRODUCT: 'ops · 테넌트 격리'")
      || shell.includes("OPS_SHELL_PRODUCT_COPY = 'ops · 테넌트 격리'"),
    msg: 'product copy ops · 테넌트 격리'
  },
  { ok: constants.includes("STRIP_ALL: '전체'"), msg: 'strip 전체' },
  { ok: constants.includes("STRIP_ACTIVE: '운영중'"), msg: 'strip 운영중' },
  { ok: constants.includes("STRIP_SUSPENDED: '정지'"), msg: 'strip 정지' },
  { ok: constants.includes("ENTER_CENTER: '센터 들어가기'"), msg: 'CTA 센터 들어가기' },
  { ok: constants.includes("ISOLATION_BADGE: '격리'"), msg: 'quiet 격리 badge' },
  { ok: constants.includes("MENU_DETAIL: '상세'"), msg: 'menu 상세' },
  { ok: constants.includes("MENU_SUSPEND: '정지'"), msg: 'menu 정지' },
  { ok: constants.includes("MENU_RESUME: '재개'"), msg: 'menu 재개' },
  { ok: !constants.includes('삭제'), msg: 'constants have no 삭제' },
  { ok: !page.includes('삭제'), msg: 'page has no 삭제' },
  { ok: !overflow.includes('삭제'), msg: 'overflow has no 삭제' },
  { ok: page.includes('OpsQuietHeader'), msg: 'page quiet header' },
  { ok: page.includes('TenantSummaryStrip'), msg: 'page strip3' },
  { ok: page.includes('TenantCenterCard'), msg: 'page center cards' },
  { ok: page.includes('ConfirmModal'), msg: 'page ConfirmModal twin' },
  { ok: page.includes('outlineWarn'), msg: 'suspend confirm outlineWarn' },
  { ok: !page.includes('window.confirm'), msg: 'no window.confirm' },
  { ok: !page.includes('tenant-card__header'), msg: 'legacy accordion header removed' },
  { ok: card.includes('ENTER_CENTER'), msg: 'card enter CTA' },
  { ok: card.includes('ISOLATION_BADGE'), msg: 'card isolation badge' },
  { ok: card.includes('buildCenterEnterUrl'), msg: 'card center enter url helper' },
  { ok: strip.includes('STRIP_ALL'), msg: 'strip uses ALL filter' },
  { ok: overflow.includes('MENU_DETAIL'), msg: 'overflow detail' },
  { ok: overflow.includes('showSuspend'), msg: 'overflow suspend gated by ACTIVE' },
  { ok: overflow.includes('showResume'), msg: 'overflow resume gated by SUSPENDED' },
  { ok: css.includes('--mg-v2-space-9'), msg: 'CTA height uses --mg-v2-space-9' },
  { ok: tokens.includes('--mg-v2-space-9'), msg: 'token --mg-v2-space-9 defined' },
  { ok: !css.includes('#'), msg: 'ops-tenants.css no raw hex' },
  { ok: api.includes('SUSPEND'), msg: 'API SUSPEND path' },
  { ok: api.includes('RESUME'), msg: 'API RESUME path' },
  { ok: service.includes('suspendOpsTenant'), msg: 'FE suspend service' },
  { ok: service.includes('resumeOpsTenant'), msg: 'FE resume service' },
  { ok: controller.includes('/suspend'), msg: 'BE suspend endpoint' },
  { ok: controller.includes('/resume'), msg: 'BE resume endpoint' },
  { ok: opsService.includes('subdomain'), msg: 'BE list includes subdomain' },
  { ok: opsService.includes('TenantStatus.SUSPENDED'), msg: 'BE uses TenantStatus enum' },
  {
    ok: !page.includes('TITLE') || !/\btenantId\b/.test(
      page.match(/OPS_TENANT_LABELS\.TITLE[\s\S]{0,80}/)?.[0] || ''
    ),
    msg: 'page title is not tenantId'
  },
  {
    ok: card.includes('tenant.name') && !card.includes('>{tenant.tenantId}<'),
    msg: 'card title uses name not tenantId'
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
console.log('smoke-ops-tenants: all checks passed');
