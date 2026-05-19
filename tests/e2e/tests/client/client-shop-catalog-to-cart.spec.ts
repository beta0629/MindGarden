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
  loginClientWeb,
  skipWhenCiMissingE2eCredentials,
  skipWhenLocalBackend8080Down
} from '../../helpers/erpAuth';

const REACT_130_OR_INVALID_CHILD =
  /Minified React error #130|Objects are not valid as a React child|invariant=130/i;

function attachRuntimeErrorCollectors(page: Page, bucket: string[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      bucket.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    const stack = err.stack ? '\n' + err.stack : '';
    bucket.push('[pageerror] ' + err.message + stack);
  });
}

test.describe('내담자 쇼핑 PLP → 장바구니', () => {
  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    skipWhenCiMissingE2eCredentials();
    await skipWhenLocalBackend8080Down();
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginClientWeb(page, test.info());
  });

  test('첫 SKU 담기 후 장바구니 소계가 보인다', async ({ page }: { page: Page }) => {
    await page.goto('/client/shop', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/shop\/?$/, { timeout: 15_000 });

    const catalogPage = page.getByTestId('client-shop-catalog-page');
    await expect(catalogPage).toBeVisible({ timeout: 20_000 });

    const addFirst = page.getByTestId('shop-sku-add-first');
    await expect(
      addFirst,
      'PLP에 노출 SKU 없음 — 어드민 catalogVisible SKU·Flyway·API 확인'
    ).toBeVisible({ timeout: 20_000 });

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

    const severe = collectedErrors.filter((line) => !REACT_130_OR_INVALID_CHILD.test(line));
    expect(severe, `pageerror / console.error:\n${severe.join('\n---\n')}`).toEqual([]);
  });
});
