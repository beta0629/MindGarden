// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import { loginConsultantWeb } from '../../helpers/erpAuth';

/**
 * 상담사 대시보드 테스트
 * 자격 증명 SSOT: `tests/e2e/helpers/erpAuth.ts` · `.cursor/skills/core-solution-testing/SKILL.md`
 */
test.describe('상담사 대시보드', () => {
  test('상담사 로그인 및 대시보드 접근', async ({ page }: { page: Page }) => {
    await loginConsultantWeb(page, test.info(), { timeoutMs: 20_000 });

    await expect(page).toHaveURL(/\/consultant\/dashboard/i, { timeout: 5000 });

    await expect(page.locator('text=/상담|Consultation|대시보드|Dashboard/i').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
