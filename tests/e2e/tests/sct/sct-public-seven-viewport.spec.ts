/**
 * SCT 공개 응답 — 7폭 스모크 (API mock)
 *
 * 실행 예:
 *   cd tests/e2e && npx playwright test tests/sct/sct-public-seven-viewport.spec.ts
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { test, expect } from '@playwright/test';
import {
  SCT_VIEWPORTS,
  assertNoHorizontalOverflow,
  mockSctPublicApis
} from './sct-viewport-helper';

test.describe('SCT 공개 응답 7폭', () => {
  for (const vp of SCT_VIEWPORTS) {
    test(`진입 화면 ${vp.name} (${vp.width}x${vp.height}) overflow=0`, async({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await mockSctPublicApis(page);
      await page.goto('/public/sct/e2e-mock-token', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('sct-public-app')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('sct-thumb-bar')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
