/**
 * SCT E2E — 7폭·horizontal overflow 검사 헬퍼
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { expect, Page } from '@playwright/test';

/** 공개·관리·상담 스모크용 뷰포트 7종 */
export const SCT_VIEWPORTS = [
  { name: 'iphone-375', width: 375, height: 812 },
  { name: 'iphone-414', width: 414, height: 896 },
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'ipad-landscape', width: 1180, height: 820 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 }
] as const;

/**
 * documentElement 기준 가로 오버플로가 0인지 검사한다.
 *
 * @param page Playwright page
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
    const clientW = doc.clientWidth;
    return scrollW - clientW;
  });
  expect(overflow, `horizontal overflow px=${overflow}`).toBe(0);
}

/**
 * SCT 공개 API를 고정 픽스처로 모킹한다.
 *
 * @param page Playwright page
 * @param overrides meta 응답 덮어쓰기
 */
export async function mockSctPublicApis(
  page: Page,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  await page.route('**/api/v1/public/sct/**/meta', async(route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          formType: 'ADULT',
          title: '문장완성 질문지',
          status: 'SENT',
          itemCount: 50,
          maskedPhoneHint: '010****1234',
          tokenExpiresAt: '2026-12-01T23:59:00',
          hasDraft: false,
          requiresGuardian: false,
          ...overrides
        }
      })
    });
  });

  await page.route('**/api/v1/sct/forms', async(route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ formType: 'ADULT', title: '성인용', itemCount: 50 }]
      })
    });
  });

  await page.route('**/api/v1/admin/sct-settings', async(route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          linkExpiryDays: 14,
          retentionDays: null,
          featureEnabled: true
        }
      })
    });
  });

  await page.route('**/api/v1/sct/clients/*/invitations', async(route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] })
    });
  });

  await page.route('**/api/v1/sct/session-view**', async(route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          status: 'SUBMITTED',
          formType: 'ADULT',
          submittedAt: '2026-11-21T10:00:00',
          answers: []
        }
      })
    });
  });
}
