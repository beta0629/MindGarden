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
  installSctPublicFullFlowMock
} from './sct-viewport-helper';

const PUBLIC_TOKEN_PATH = '/public/sct/e2e-flow-token';
const TEST_PHONE = '01012345678';

async function hardenPublicPageNetwork(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/*fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**/*fonts.gstatic.com/**', (route) => route.abort());
  await page.route('**/sockjs-node/**', (route) => route.abort());
  await page.route('**/*hot-update*', (route) => route.abort());
  await page.route('**//t1.daumcdn.net/**', (route) => route.abort());
  await page.route('**/*tosspayments.com/**', (route) => route.abort());
}

async function completeVerifyAndConsent(page: import('@playwright/test').Page): Promise<void> {
  const resumeBtn = page.getByRole('button', { name: '이어서 작성' });
  const startBtn = page.getByRole('button', { name: '시작하기' });
  if (await resumeBtn.isVisible().catch(() => false)) {
    await resumeBtn.click();
  } else {
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();
  }

  await page.locator('#sct-phone').fill(TEST_PHONE);
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/form') && res.request().method() === 'GET' && res.status() === 200,
      { timeout: 20000 }
    ),
    page.getByRole('button', { name: '확인' }).click()
  ]);

  const consentStep = page.getByTestId('sct-consent-step');
  if (await consentStep.isVisible({ timeout: 3000 }).catch(() => false)) {
    const checks = consentStep.locator('.mg-v2-sct-check button[role="checkbox"]');
    await checks.nth(0).click();
    await checks.nth(1).click();
    await page.getByLabel('본인 성명(서명)').fill('테스트');
    await page.getByRole('button', { name: '동의하고 시작' }).click();
    await page.waitForResponse(
      (res) => res.url().includes('/form') && res.request().method() === 'GET' && res.status() === 200,
      { timeout: 20000 }
    );
  }

  await assertPanelVisible(page, 'sct-public-app');
  await expect(page.locator('#sct-ans-1')).toBeVisible({ timeout: 20000 });
}

test.describe('SCT public flow (mocked)', () => {
  test.describe.configure({ timeout: 120_000 });

  test('meta → 동의 → 문항·임시저장 → 이어쓰기 → 제출 → 재접속 잠김', async({ page }) => {
    await hardenPublicPageNetwork(page);
    const commonCodes: string[] = [];
    const currentUserHits: string[] = [];
    await page.route('**/api/v1/common-codes**', async(route) => {
      commonCodes.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":[]}' });
    });
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/auth/current-user')) {
        currentUserHits.push(req.url());
      }
    });

    await installSctPublicFullFlowMock(page);

    await page.goto(PUBLIC_TOKEN_PATH, { waitUntil: 'commit', timeout: 60_000 });
    await assertPanelVisible(page, 'sct-public-app');
    await assertNoHorizontalOverflow(page);
    expect(commonCodes.length, '공개 SCT 진입 직후 common-codes 호출 0').toBe(0);
    expect(currentUserHits.length, '공개 SCT 진입 직후 current-user 호출 0').toBe(0);
    commonCodes.length = 0;

    await completeVerifyAndConsent(page);
    expect(currentUserHits.length, 'verify→form 구간 current-user 호출 0').toBe(0);

    await page.locator('#sct-ans-1').fill('차분한');
    await page.getByRole('button', { name: '임시 저장' }).click();
    await expect(page.getByText('저장됨', { exact: false })).toBeVisible({ timeout: 10000 });
    expect(commonCodes.length, '문항 단계에서 common-codes 호출 0').toBe(0);

    await page.goto(PUBLIC_TOKEN_PATH, { waitUntil: 'commit', timeout: 60_000 });
    await expect(page.getByText('이어서 작성', { exact: true })).toBeVisible({ timeout: 15000 });

    await completeVerifyAndConsent(page);
    await expect(page.locator('#sct-ans-1')).toHaveValue('차분한', { timeout: 10000 });

    await page.getByRole('button', { name: '제출하기' }).click();
    await expect(page.getByRole('heading', { name: '제출 확인' })).toBeVisible();
    await page.getByRole('button', { name: '제출하기' }).click();

    await expect(page.getByText('제출했습니다')).toBeVisible({ timeout: 15000 });

    await page.goto(PUBLIC_TOKEN_PATH, { waitUntil: 'commit', timeout: 60_000 });
    await expect(page.getByText('이미 제출한 질문지입니다')).toBeVisible({ timeout: 15000 });
    await assertNoHorizontalOverflow(page);
    expect(currentUserHits.length, '전체 공개 흐름 current-user 호출 0').toBe(0);
  });

  test('rotated meta 410 → 만료 화면', async({ page }) => {
    await hardenPublicPageNetwork(page);
    await page.route('**/api/v1/public/sct/**/meta**', async(route) => {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '링크가 만료되었거나 취소되었습니다.' })
      });
    });
    await page.goto('/public/sct/rotated-old-token', { waitUntil: 'commit', timeout: 60_000 });
    await expect(page.getByText('작성 기한이 지났습니다', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('새 링크가 필요하면 센터에 문의해 주세요.')).toBeVisible();
  });
});