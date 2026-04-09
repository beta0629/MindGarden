// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect } from '@playwright/test';

/**
 * ERP 레거시 경로 → 정규 경로 리다이렉트 (로그인 불필요)
 * App.js: budgets→budget, inventory→items, tax→salary?tab=tax
 */
test.describe('ERP 레거시 경로 리다이렉트', () => {
  test('/erp/budgets → pathname /erp/budget', async ({ page }) => {
    await page.goto('/erp/budgets');
    await expect(page).toHaveURL(/\/erp\/budget(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/budget');
  });

  test('/erp/inventory → pathname /erp/items', async ({ page }) => {
    await page.goto('/erp/inventory');
    await expect(page).toHaveURL(/\/erp\/items(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/items');
  });

  test('/erp/tax → /erp/salary 및 tab=tax', async ({ page }) => {
    await page.goto('/erp/tax');
    await expect(page).toHaveURL(/\/erp\/salary/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/salary');
    expect(u.searchParams.get('tab')).toBe('tax');
  });
});
