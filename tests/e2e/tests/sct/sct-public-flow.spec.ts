/**
 * SCT 비로그인 공개 흐름 — mock API 스모크
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { test, expect } from '@playwright/test';
import {
  assertNoHorizontalOverflow,
  assertPanelVisible,
  mockSctPublicApisThroughConsent
} from './sct-viewport-helper';

test.describe('SCT public flow (mocked)', () => {
  test('meta → consent 단계, common-codes 없음', async({ page }) => {
  const commonCodes: string[] = [];
  await page.route('**/api/v1/common-codes**', async(route) => {
    commonCodes.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":[]}' });
  });
  await mockSctPublicApisThroughConsent(page);
  await page.goto('/public/sct/e2e-flow-token', { waitUntil: 'domcontentloaded' });
  await assertPanelVisible(page, 'sct-public-app');
  await assertNoHorizontalOverflow(page);
  expect(commonCodes.length, '공개 SCT에서 common-codes 호출 0').toBe(0);
  });
});