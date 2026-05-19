/**
 * 어드민 쇼핑몰 — 카탈로그 SKU 페이지 스모크
 *
 * Maestro는 Expo 앱 전용. 어드민 React 웹은 Playwright 사용.
 * SSOT: `docs/project-management/SHOP_P2_INTEGRATION_TEST_REPORT.md`
 *
 * 전제: 백엔드 8080 + 프론트 3000, ERP 어드민 자격, TenantComponent `ADMIN_SHOP_CATALOG` 활성.
 * testid: `admin-shop-catalog-page` (비활성 시 `admin-tenant-component-gate--ADMIN_SHOP_CATALOG`)
 *
 * 로컬: `cd tests/e2e && npx playwright test admin-shop-catalog-skus-smoke --project=chromium`
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import {
  loginErpUser,
  skipWhenCiMissingE2eCredentials,
  skipWhenLocalBackend8080Down
} from '../../helpers/erpAuth';

const CATALOG_PATH = '/admin/shop/catalog-skus';
const PAGE_TEST_ID = 'admin-shop-catalog-page';
/** `AdminTenantComponentGate` — `PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG` */
const GATE_TEST_ID = 'admin-tenant-component-gate--ADMIN_SHOP_CATALOG';
/** `scripts/ops/seed-shop-demo-catalog.sql` 시드 SKU */
const SEED_SKU_CODE = 'DEV-CONSULT-DEMO-01';
const CATALOG_TABLE_SELECTOR = 'table.mg-v2-list-block__table';

test.describe('관리자 — 쇼핑몰 카탈로그 SKU 스모크', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    skipWhenCiMissingE2eCredentials();
    await skipWhenLocalBackend8080Down();
    await loginErpUser(page, testInfo, { timeoutMs: 25_000 });
  });

  test('catalog-skus 진입 — 페이지 셸·빈 목록 허용', async ({ page }: { page: Page }) => {
    const resp = await page.goto(CATALOG_PATH, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);

    const gate = page.getByTestId(GATE_TEST_ID);
    if (await gate.isVisible().catch(() => false)) {
      test.skip(
        true,
        'ADMIN_SHOP_CATALOG TenantComponent 비활성 — activate-shop-reward-tenant-components 등 활성화 후 재실행'
      );
    }

    const catalogPage = page.getByTestId(PAGE_TEST_ID);
    await expect(catalogPage).toBeVisible({ timeout: 20_000 });

    await expect(page.locator('#admin-shop-catalog-skus-title')).toContainText('상품(SKU) 관리', {
      timeout: 10_000
    });

    await page.getByText('목록을 불러오는 중…').waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});

    const registerBtn = page.getByRole('button', { name: '상품 등록' });
    await expect(registerBtn).toBeVisible({ timeout: 10_000 });

    const emptyState = catalogPage.getByText('등록된 상품이 없습니다.');
    const seedSku = catalogPage.getByText(SEED_SKU_CODE);
    const catalogTable = catalogPage.locator(CATALOG_TABLE_SELECTOR);
    await expect(
      seedSku.or(emptyState).or(catalogTable.first()),
      `SKU 목록 — 시드(${SEED_SKU_CODE})·빈 상태·테이블 중 하나가 ${PAGE_TEST_ID} 안에 보여야 함`
    ).toBeVisible({ timeout: 20_000 });
  });
});
