/**
 * 내담자 쇼핑 PLP → 장바구니 스모크 (catalog-to-cart)
 *
 * SSOT: `docs/project-management/SHOP_P2_INTEGRATION_TEST_REPORT.md` §6.1
 * 자격 증명: `loginClientWeb()` — `tests/e2e/helpers/erpAuth.ts`
 *
 * 전제: Flyway P2 적용, 백엔드·API 가동, 활성 탭(상담 패키지)에 `catalogVisible=true` SKU ≥1
 * PG·checkout 결제는 범위 외.
 *
 * testid: `client-shop-catalog-page`, `shop-sku-add-first`, `client-shop-cart-page`, `client-shop-cart-subtotal`
 *
 * 전제 체크리스트 (R10): `tests/e2e/README.md` §「내담자 쇼핑 (CLIENT_SHOP)」
 * 로컬 검증 (2026-05-19): 8080 미기동 시 `skipWhenLocalBackend8080Down`으로 스킵.
 *   `cd tests/e2e && npx playwright test client-shop-catalog-to-cart --project=chromium`
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import {
  getE2eTenantId,
  loginClientWeb,
  skipWhenCiMissingE2eCredentials,
  skipWhenLocalBackend8080Down
} from '../../helpers/erpAuth';
import {
  REACT_130_OR_INVALID_CHILD,
  attachRuntimeErrorCollectors,
  filterSevereConsoleErrors
} from '../../helpers/react130ConsoleGate';

/** `ClientTenantComponentGate` — `PLATFORM_COMPONENT_CODES.CLIENT_SHOP` */
const CLIENT_SHOP_GATE_TEST_ID = 'client-tenant-component-gate--CLIENT_SHOP';
const CLIENT_SHOP_CATALOG_PAGE_TEST_ID = 'client-shop-catalog-page';
const CLIENT_SHOP_SESSION_LOADING_TEST_ID = 'client-shop-session-loading';
const CLIENT_SHOP_CATALOG_LOADING_TEST_ID = 'client-shop-catalog-loading';
const CLIENT_SHOP_CATALOG_EMPTY_TEST_ID = 'client-shop-catalog-empty';
const SHOP_SKU_ADD_FIRST_TEST_ID = 'shop-sku-add-first';

const PLP_READY_POLL_MS = 15_000;

async function isClientShopAddFirstReady(page: Page): Promise<boolean> {
  const sessionLoading = page.getByTestId(CLIENT_SHOP_SESSION_LOADING_TEST_ID);
  if (await sessionLoading.isVisible().catch(() => false)) {
    return false;
  }

  const catalogPage = page.getByTestId(CLIENT_SHOP_CATALOG_PAGE_TEST_ID);
  if (!(await catalogPage.isVisible().catch(() => false))) {
    return false;
  }

  const catalogLoading = page.getByTestId(CLIENT_SHOP_CATALOG_LOADING_TEST_ID);
  if (await catalogLoading.isVisible().catch(() => false)) {
    return false;
  }

  return page.getByTestId(SHOP_SKU_ADD_FIRST_TEST_ID).isVisible().catch(() => false);
}

test.describe('내담자 쇼핑 PLP → 장바구니', () => {
  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    skipWhenCiMissingE2eCredentials();
    await skipWhenLocalBackend8080Down();
    const tenantId = getE2eTenantId();
    if (!tenantId) {
      test.info().annotations.push({
        type: 'e2e-tenant-id',
        description:
          'E2E_TENANT_ID 미설정 — CLIENT_SHOP off·잘못된 테넌트 세션 가능. tests/e2e/README.md 참고.'
      });
    }
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginClientWeb(page, test.info());
    if (tenantId) {
      expect(tenantId, 'E2E_TENANT_ID는 비어 있지 않아야 함').toMatch(/\S+/);
    }
  });

  test('첫 SKU 담기 후 장바구니 소계가 보인다', async ({ page }: { page: Page }) => {
    await page.goto('/client/shop', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/shop\/?$/, { timeout: 15_000 });

    await page
      .waitForSelector(`[data-testid="${CLIENT_SHOP_SESSION_LOADING_TEST_ID}"]`, {
        state: 'detached',
        timeout: 30_000
      })
      .catch(() => undefined);

    const addFirst = page.getByTestId(SHOP_SKU_ADD_FIRST_TEST_ID);
    let addFirstReady = false;
    try {
      await expect
        .poll(async () => isClientShopAddFirstReady(page), {
          timeout: PLP_READY_POLL_MS,
          intervals: [200, 300, 500, 800, 1000]
        })
        .toBe(true);
      addFirstReady = true;
    } catch {
      addFirstReady = false;
    }

    const tenantHint = getE2eTenantId() ?? 'E2E_TENANT_ID 미설정';

    if (!addFirstReady) {
      const gate = page.getByTestId(CLIENT_SHOP_GATE_TEST_ID);
      if (await gate.isVisible().catch(() => false)) {
        test.skip(
          true,
          `CLIENT_SHOP 비활성 또는 테넌트 불일치 — tenantId=${tenantHint}. OPS activate + 내담자 계정이 동일 테넌트 소속인지 확인.`
        );
      }

      const catalogEmpty = page.getByTestId(CLIENT_SHOP_CATALOG_EMPTY_TEST_ID);
      if (await catalogEmpty.isVisible().catch(() => false)) {
        test.skip(
          true,
          `PLP 노출 SKU 없음 — tenantId=${tenantHint}. OPS: activate-shop-reward-tenant-components.sql + seed-shop-demo-catalog.sql(catalog_visible=1, CONSULTATION) 또는 어드민 PLP 노출 ON.`
        );
      }

      await expect(
        addFirst,
        'PLP에 노출 SKU 없음 — 어드민 catalogVisible SKU·Flyway·API 확인'
      ).toBeVisible({ timeout: 5_000 });
    }

    await expect(page.getByTestId(CLIENT_SHOP_CATALOG_PAGE_TEST_ID)).toBeVisible({
      timeout: 5_000
    });

    await addFirst.click();

    await expect(page).toHaveURL(/\/client\/shop\/cart/, { timeout: 25_000 });

    const cartPage = page.getByTestId('client-shop-cart-page');
    await expect(cartPage).toBeVisible({ timeout: 20_000 });

    const subtotal = page.getByTestId('client-shop-cart-subtotal');
    await expect(subtotal).toBeVisible({ timeout: 15_000 });
    await expect(subtotal).toContainText('합계');

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child:\n${reactHits.join('\n---\n')}\n전체:\n${collectedErrors.join('\n')}`
    ).toEqual([]);

    const severe = filterSevereConsoleErrors(collectedErrors);
    expect(severe, `pageerror / console.error:\n${severe.join('\n---\n')}`).toEqual([]);
  });
});
