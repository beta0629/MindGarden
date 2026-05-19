/**
 * 어드민 쇼핑몰 — SKU 등록(전용 폼) 화면 스모크
 *
 * SSOT: `docs/project-management/SHOP_CATALOG_UX_MVP_PLUS_TEST_PLAN.md` §3.1
 * testid: `docs/project-management/SHOP_CATALOG_UX_MVP_PLUS_DESIGN_HANDOFF.md`
 *
 * 전제: 백엔드 8080 + 프론트 3000, ERP 어드민 자격, `E2E_TENANT_ID`, `ADMIN_SHOP_CATALOG` 활성.
 *
 * 로컬: `cd tests/e2e && npx playwright test admin-shop-catalog-sku-create-smoke --project=chromium`
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import {
  getE2eTenantId,
  loginErpUser,
  skipWhenCiMissingE2eCredentials,
  skipWhenLocalBackend8080Down
} from '../../helpers/erpAuth';

const CATALOG_PATH = '/admin/shop/catalog-skus';
const CATALOG_NEW_PATH = '/admin/shop/catalog-skus/new';
const CATALOG_PAGE_TEST_ID = 'admin-shop-catalog-page';
const FORM_PAGE_TEST_ID = 'admin-shop-sku-form-page';
/** `AdminTenantComponentGate` — `PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG` */
const GATE_TEST_ID = 'admin-tenant-component-gate--ADMIN_SHOP_CATALOG';
const FORM_LOADING_TEST_ID = 'admin-sku-form-loading';
const TITLE_INPUT_TEST_ID = 'admin-sku-title-input';
const IMAGE_UPLOAD_TEST_ID = 'admin-sku-image-upload';
const SAVE_BUTTON_TEST_ID = 'admin-sku-save-button';
const SKU_CODE_READONLY_TEST_ID = 'admin-sku-code-readonly';
const SKU_CODE_AUTO_PLACEHOLDER = '저장 후 자동 생성';

async function skipWhenAdminShopCatalogGate(page: Page): Promise<void> {
  const gate = page.getByTestId(GATE_TEST_ID);
  if (await gate.isVisible().catch(() => false)) {
    test.skip(
      true,
      'ADMIN_SHOP_CATALOG TenantComponent 비활성 — activate-shop-reward-tenant-components 등 활성화 후 재실행'
    );
  }
}

test.describe('관리자 — 쇼핑몰 카탈로그 SKU 등록 스모크', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    skipWhenCiMissingE2eCredentials();
    await skipWhenLocalBackend8080Down();
    const tenantId = getE2eTenantId();
    if (!tenantId) {
      test.info().annotations.push({
        type: 'e2e-tenant-id',
        description:
          'E2E_TENANT_ID 미설정 — ADMIN_SHOP_CATALOG off·잘못된 테넌트 세션 가능. tests/e2e/README.md 참고.'
      });
    }
    await loginErpUser(page, testInfo, { timeoutMs: 25_000 });
    if (tenantId) {
      expect(tenantId, 'E2E_TENANT_ID는 비어 있지 않아야 함').toMatch(/\S+/);
    }
  });

  test('목록 → 상품 등록 — 전용 폼 화면 진입', async ({ page }: { page: Page }) => {
    const resp = await page.goto(CATALOG_PATH, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);

    await skipWhenAdminShopCatalogGate(page);

    const catalogPage = page.getByTestId(CATALOG_PAGE_TEST_ID);
    await expect(catalogPage).toBeVisible({ timeout: 20_000 });

    await page.getByText('목록을 불러오는 중…').waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});

    const registerBtn = page.getByRole('button', { name: '상품 등록' });
    await expect(registerBtn).toBeVisible({ timeout: 10_000 });
    await registerBtn.click();

    await expect(page).toHaveURL(new RegExp(`${CATALOG_NEW_PATH.replace(/\//g, '\\/')}\\/?$`), {
      timeout: 15_000
    });

    await page
      .waitForSelector(`[data-testid="${FORM_LOADING_TEST_ID}"]`, {
        state: 'detached',
        timeout: 15_000
      })
      .catch(() => undefined);

    const formPage = page.getByTestId(FORM_PAGE_TEST_ID);
    await expect(formPage).toBeVisible({ timeout: 20_000 });

    await expect(page.getByTestId(TITLE_INPUT_TEST_ID)).toBeVisible();
    await expect(page.getByTestId(IMAGE_UPLOAD_TEST_ID)).toBeVisible();
    await expect(page.getByTestId(SAVE_BUTTON_TEST_ID)).toBeVisible();
    await expect(page.getByTestId(SKU_CODE_READONLY_TEST_ID)).toContainText(SKU_CODE_AUTO_PLACEHOLDER);
  });
});
