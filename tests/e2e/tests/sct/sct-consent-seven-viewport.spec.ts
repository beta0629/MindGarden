/**
 * SCT 공개 동의 단계 — 7폭 스모크 (API mock, ENV skip 금지)
 *
 * 실행 예:
 *   cd tests/e2e && npx playwright test tests/sct/sct-consent-seven-viewport.spec.ts
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { test, expect } from '@playwright/test';
import {
  SCT_VIEWPORTS,
  assertNoHorizontalOverflow,
  mockSctPublicApisThroughConsent
} from './sct-viewport-helper';

test.describe('SCT 동의 단계 7폭', () => {
  for (const vp of SCT_VIEWPORTS) {
    test(`동의 화면 ${vp.name} (${vp.width}x${vp.height}) overflow=0`, async({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await mockSctPublicApisThroughConsent(page);
      await page.goto('/public/sct/e2e-mock-token', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('sct-public-app')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: '시작하기' }).click();
      await expect(page.locator('#sct-phone')).toBeVisible({ timeout: 10000 });
      await page.locator('#sct-phone').fill('01012345678');
      await page.getByRole('button', { name: '확인' }).click();
      await expect(page.getByTestId('sct-consent-step')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('[필수] 민감정보(심리·건강 관련 정보) 처리 동의')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
