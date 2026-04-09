// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import { loginErpUser } from '../../helpers/erp-login';

/**
 * 재무 관리 `/erp/financial` 거래 탭 본문(data-testid) 및 거래 카드 케밥 메뉴 E2E
 * — 거래 카드가 없는 테넌트/환경에서는 목록이 비어도 L1·KPI만으로 통과 (데이터 의존 분기).
 */
test.describe('ERP 재무 — 거래 탭', () => {
  test('거래 탭 L1·KPI 노출 및 거래 카드 메뉴(데이터 있을 때만)', async ({
    page,
  }: {
    page: Page;
  }) => {
    await loginErpUser(page);
    await page.goto('/erp/financial');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveURL(/\/erp\/financial/);

    await expect(page.getByTestId('erp-financial-transactions-l1')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId('erp-financial-kpi-strip')).toBeVisible({
      timeout: 15000,
    });

    const menuTriggers = page.getByTestId('erp-financial-tx-menu-trigger');
    const triggerCount = await menuTriggers.count();

    // 빈 목록: API에 거래가 없으면 케밥 트리거가 없음 → 메뉴 시나리오는 스킵(통과).
    // E2E가 특정 테넌트 데이터에 묶이지 않도록 함.
    if (triggerCount === 0) {
      return;
    }

    const firstTrigger = menuTriggers.first();
    await firstTrigger.click();
    await expect(
      page.getByRole('menuitem', { name: /수정|삭제/ }).first()
    ).toBeVisible({ timeout: 5000 });

    // 메뉴가 열린 경우에만: Escape로 닫힘 검증 (aria-expanded 기준)
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
  });
});
