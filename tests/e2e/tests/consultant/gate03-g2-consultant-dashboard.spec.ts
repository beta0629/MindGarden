/**
 * GATE-03 G2 — Consultant Dashboard V2 dev UI 검증 (ROLE-02 · #548 ENHANCED)
 *
 * env: BASE_URL=https://mindgarden.dev.core-solution.co.kr
 * bundle: main.2d20a7a4.js (EXPECTED_FE_BUNDLE_HASH)
 * credentials: erpAuth SSOT — CONSULTANT 01042858570
 *
 * 실행:
 *   cd tests/e2e && BASE_URL=https://mindgarden.dev.core-solution.co.kr \
 *     EXPECTED_FE_BUNDLE_HASH=2d20a7a4 \
 *     npx playwright test tests/consultant/gate03-g2-consultant-dashboard.spec.ts \
 *     --config=playwright.manual.config.ts --project=chromium
 */
// @ts-ignore
import path from 'node:path';
import fs from 'node:fs';
import { test, expect, Page, TestInfo } from '@playwright/test';
import { loginConsultantWeb } from '../../helpers/erpAuth';
import {
  attachRuntimeErrorCollectors,
  filterSevereConsoleErrors,
  REACT_130_OR_INVALID_CHILD
} from '../../helpers/react130ConsoleGate';

const EXPECTED_BUNDLE_HASH =
  (process as any).env.EXPECTED_FE_BUNDLE_HASH?.trim() || '2d20a7a4';
const EXPECTED_BUNDLE_FILE = `main.${EXPECTED_BUNDLE_HASH}.js`;

const EVIDENCE_DIR = path.resolve(
  __dirname,
  '../../../../docs/guides/testing/evidence/gate03-g2-20260708'
);

async function assertFeBundle(page: Page): Promise<string> {
  const bundleSrc = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const main = scripts
      .map((s) => s.getAttribute('src') || '')
      .find((src) => /\/static\/js\/main\.[a-f0-9]+\.js/.test(src));
    return main || '';
  });
  expect(bundleSrc, `FE bundle must include ${EXPECTED_BUNDLE_FILE}`).toContain(
    EXPECTED_BUNDLE_FILE
  );
  return bundleSrc;
}

async function attachEvidenceScreenshot(
  page: Page,
  testInfo: TestInfo,
  filename: string
): Promise<void> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const filePath = path.join(EVIDENCE_DIR, filename);
  const buffer = await page.screenshot({ fullPage: true });
  fs.writeFileSync(filePath, buffer);
  await testInfo.attach(filename, { body: buffer, contentType: 'image/png' });
}

async function waitForDashboardReady(
  page: Page,
  options: { waitNetworkIdle?: boolean } = {}
): Promise<void> {
  if (options.waitNetworkIdle !== false) {
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  }
  await expect(page.getByTestId('consultant-dashboard-v2-page')).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByTestId('consultant-dashboard-kpi-section')).toBeVisible({
    timeout: 15_000
  });
}

test.describe('GATE-03 G2 — Consultant Dashboard V2 (dev)', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    attachRuntimeErrorCollectors(page, consoleErrors);
    await loginConsultantWeb(page, test.info(), { timeoutMs: 35_000 });
    await expect(page).toHaveURL(/\/consultant\/dashboard/i);
    await waitForDashboardReady(page);
  });

  test('G2-1 — B0KlA ContentKpiRow·QuickActionBar·AdminCommonLayout', async ({
    page
  }: {
    page: Page;
  }) => {
    const bundleSrc = await assertFeBundle(page);

    await expect(page.locator('.mg-v2-dashboard-layout, .mg-admin-layout').first()).toBeVisible();
    await expect(page.getByTestId('consultant-dashboard-quick-action-bar')).toBeVisible();
    await expect(page.getByRole('button', { name: '일정 등록' })).toBeVisible();
    await expect(page.getByRole('button', { name: '메시지 작성' })).toBeVisible();
    await expect(page.getByRole('button', { name: '내담자 추가' })).toBeVisible();

    const kpiCards = page.locator('.mg-v2-content-kpi-card');
    await expect(kpiCards).toHaveCount(4);

    const kpiZone = page.getByTestId('consultant-dashboard-kpi-section');
    const kpiBox = await kpiZone.boundingBox();
    expect(kpiBox?.width ?? 0).toBeGreaterThan(600);

    await attachEvidenceScreenshot(page, test.info(), 'G2-1-kpi-quickaction-1280.png');

    test.info().annotations.push({
      type: 'evidence',
      description: `G2-1 PASS — bundle ${bundleSrc} · KPI 4-grid · QuickActionBar 3 CTA`
    });
  });

  test('G2-2 — P0-6 polish: ListTableView·messages·chart (#548 ENHANCED)', async ({
    page
  }: {
    page: Page;
  }) => {
    await assertFeBundle(page);

    await expect(page.getByTestId('consultant-dashboard-recent-messages')).toBeVisible();
    const messagesSection = page.getByTestId('consultant-dashboard-recent-messages');
    await expect(messagesSection).toContainText(/메시지|최근 메시지/i);

    const listTables = page.locator('table.mg-v2-list-block__table');
    await expect(listTables.first()).toBeVisible({ timeout: 15_000 });
    const tableCount = await listTables.count();
    expect(tableCount).toBeGreaterThanOrEqual(1);

    const chartSection = page.getByTestId('consultant-dashboard-weekly-chart');
    await expect(chartSection).toBeVisible();
    const chartCanvas = chartSection.locator('canvas');
    const chartEmpty = chartSection.locator('.consultant-dashboard-v2__chart-empty');
    await expect(chartCanvas.or(chartEmpty)).toBeVisible({ timeout: 15_000 });

    await attachEvidenceScreenshot(page, test.info(), 'G2-2-messages-chart-listtable.png');

    test.info().annotations.push({
      type: 'evidence',
      description: `G2-2 PASS — messages section · ListTableView×${tableCount} · chart area visible`
    });
  });

  test('G2-3 — 1280/414 반응형 회귀 0', async ({ page }: { page: Page }) => {
    test.setTimeout(120_000);
    await assertFeBundle(page);

    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForDashboardReady(page, { waitNetworkIdle: false });
    const kpi1280 = page.getByTestId('consultant-dashboard-kpi-section');
    await expect(kpi1280).toBeVisible();
    const overflow1280 = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 2;
    });
    expect(overflow1280, '1280px horizontal overflow').toBe(false);
    await attachEvidenceScreenshot(page, test.info(), 'G2-3-viewport-1280.png');

    await page.setViewportSize({ width: 414, height: 896 });
    await waitForDashboardReady(page, { waitNetworkIdle: false });
    await expect(page.getByTestId('consultant-dashboard-v2-page')).toBeVisible();
    await expect(page.getByTestId('consultant-dashboard-kpi-section')).toBeVisible();
    await expect(page.getByTestId('consultant-dashboard-quick-action-bar')).toBeVisible();
    const overflow414 = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 2;
    });
    expect(overflow414, '414px horizontal overflow').toBe(false);
    await attachEvidenceScreenshot(page, test.info(), 'G2-3-viewport-414.png');

    const react130Hits = consoleErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(react130Hits, 'React #130 must be 0').toHaveLength(0);

    const severe = filterSevereConsoleErrors(consoleErrors);
    expect(severe, `blocking console errors: ${severe.join('; ')}`).toHaveLength(0);

    test.info().annotations.push({
      type: 'evidence',
      description: 'G2-3 PASS — 1280/414 no horizontal overflow · React #130 0'
    });
  });
});
