/**
 * SCT 관리자·상담사·설정 — 7폭 실렌더 (ENV 로그인 skip 금지)
 *
 * syntheticAdmin/Consultant storageState + API mock으로 실제 React 트리 검증.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import { buildSyntheticAdminStorageState } from '../../helpers/syntheticAdminStorageState';
import {
  buildSyntheticConsultantStorageState,
  getSyntheticConsultantUser
} from '../../helpers/syntheticConsultantStorageState';
import {
  SCT_VIEWPORTS,
  SCT_VIEWPORT_ARTIFACT_DIR,
  assertNoHorizontalOverflow,
  assertPanelVisible,
  ensureSctViewportArtifactDir,
  installSctShellMocks,
  writeSctViewportMeasurements
} from './sct-viewport-helper';

const ADMIN_USER = {
  id: 99999001,
  email: 'e2e-erp-redirect-admin@local',
  name: 'E2E ERP Redirect Admin',
  role: 'ADMIN',
  permissionGroupCodes: [] as string[],
  tenantId: 'e2e-local'
};

async function measureOverflow(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
    return scrollW - doc.clientWidth;
  });
}

/** CRA HMR/웹소켓·폰트가 goto 를 붙잡는 경우 완화 */
async function hardenPageNetwork(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/*fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**/*fonts.gstatic.com/**', (route) => route.abort());
  await page.route('**/sockjs-node/**', (route) => route.abort());
  await page.route('**/ws', (route) => route.abort());
  await page.route('**/*hot-update*', (route) => route.abort());
}

async function gotoSettled(
  page: import('@playwright/test').Page,
  url: string
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      return;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}

test.describe('SCT 관리자 질문지 탭 7폭', () => {
  test.use({ storageState: buildSyntheticAdminStorageState() });
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    ensureSctViewportArtifactDir();
  });

  test.beforeEach(async({ page }) => {
    await hardenPageNetwork(page);
    await installSctShellMocks(page, ADMIN_USER);
  });

  for (const vp of SCT_VIEWPORTS) {
    test(`관리자 ClientSidePeek 질문지 @${vp.name} (${vp.width}x${vp.height})`, async({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoSettled(page, '/e2e-sct-viewport?panel=admin');
      await expect(page.getByTestId('sct-viewport-harness')).toBeVisible({ timeout: 20000 });

      const tab = page.getByRole('tab', { name: '질문지' });
      await expect(tab).toBeVisible({ timeout: 15000 });
      await tab.click();
      await assertPanelVisible(page, 'sct-admin-tab');
      await assertNoHorizontalOverflow(page);

      const overflowPx = await measureOverflow(page);
      await page.screenshot({
        path: path.join(SCT_VIEWPORT_ARTIFACT_DIR, `admin-questionnaire-${vp.width}.png`),
        fullPage: false
      });
      writeSctViewportMeasurements([{
        panel: 'admin-questionnaire',
        name: vp.name,
        width: vp.width,
        height: vp.height,
        overflowPx,
        visible: true
      }]);
    });
  }
});

test.describe('SCT 상담사 세션 패널 7폭', () => {
  test.use({ storageState: buildSyntheticConsultantStorageState() });
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    ensureSctViewportArtifactDir();
  });

  test.beforeEach(async({ page }) => {
    await hardenPageNetwork(page);
    await installSctShellMocks(page, getSyntheticConsultantUser());
  });

  for (const vp of SCT_VIEWPORTS) {
    test(`상담사 SctSessionPanel @${vp.name} (${vp.width}x${vp.height})`, async({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoSettled(page, '/e2e-sct-viewport?panel=session');
      await assertPanelVisible(page, 'sct-session-panel');
      await expect(page.getByText('영역별')).toBeVisible({ timeout: 15000 });
      await assertNoHorizontalOverflow(page);

      const overflowPx = await measureOverflow(page);
      await page.screenshot({
        path: path.join(SCT_VIEWPORT_ARTIFACT_DIR, `consultant-session-${vp.width}.png`),
        fullPage: false
      });
      writeSctViewportMeasurements([{
        panel: 'consultant-session',
        name: vp.name,
        width: vp.width,
        height: vp.height,
        overflowPx,
        visible: true
      }]);
    });
  }
});

test.describe('SCT 설정 섹션 — system-config 7폭 (1440·375 포함)', () => {
  test.use({ storageState: buildSyntheticAdminStorageState() });
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    ensureSctViewportArtifactDir();
  });

  test.beforeEach(async({ page }) => {
    await hardenPageNetwork(page);
    await installSctShellMocks(page, ADMIN_USER);
  });

  for (const vp of SCT_VIEWPORTS) {
    test(`system-config 질문지 섹션 @${vp.name} (${vp.width}x${vp.height})`, async({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoSettled(page, '/e2e-sct-viewport?panel=settings');
      await assertPanelVisible(page, 'sct-settings-section');
      await expect(page.getByLabel('링크 만료(일)')).toBeVisible({ timeout: 15000 });
      await assertNoHorizontalOverflow(page);

      const overflowPx = await measureOverflow(page);
      await page.screenshot({
        path: path.join(SCT_VIEWPORT_ARTIFACT_DIR, `settings-system-config-${vp.width}.png`),
        fullPage: false
      });
      writeSctViewportMeasurements([{
        panel: 'settings-system-config',
        name: vp.name,
        width: vp.width,
        height: vp.height,
        overflowPx,
        visible: true
      }]);
    });
  }
});
