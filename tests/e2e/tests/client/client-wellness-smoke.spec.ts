/**
 * 내담자 웰니스·마음챙김 스모크: `/client/wellness`, `/client/mindfulness-guide`, `/client/wellness/:id`
 *
 * 자격 증명 SSOT: `loginClientWeb()` — 기본 `01086322121` / `godgod826!` (`.cursor/skills/core-solution-testing/SKILL.md`)
 *
 * testid:
 * - `WellnessNotificationList.js`: `client-wellness-list-page`
 * - `WellnessNotificationDetail.js`: `client-wellness-detail-page`
 * - `MindfulnessGuide.js`: `client-mindfulness-guide-page`
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import { loginClientWeb } from '../../helpers/erpAuth';

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

function assertNoSevereRuntimeErrors(collectedErrors: string[]) {
  const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
  expect(
    reactHits,
    `React #130 또는 invalid child:\n${reactHits.join('\n---\n')}\n전체:\n${collectedErrors.join('\n')}`
  ).toEqual([]);

  const severe = collectedErrors.filter((line) => !REACT_130_OR_INVALID_CHILD.test(line));
  expect(severe, `pageerror / console.error:\n${severe.join('\n---\n')}`).toEqual([]);
}

test.describe('내담자 웰니스·마음챙김 스모크', () => {
  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginClientWeb(page, test.info());
  });

  test('/client/wellness 에서 목록 페이지 testid가 보인다', async ({ page }: { page: Page }) => {
    await page.goto('/client/wellness', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/wellness$/, { timeout: 15_000 });

    const pageRoot = page.getByTestId('client-wellness-list-page');
    await expect(pageRoot).toBeVisible({ timeout: 20_000 });

    assertNoSevereRuntimeErrors(collectedErrors);
  });

  test('/client/mindfulness-guide 에서 가이드 페이지 testid가 보인다', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/client/mindfulness-guide', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/mindfulness-guide/, { timeout: 15_000 });

    const pageRoot = page.getByTestId('client-mindfulness-guide-page');
    await expect(pageRoot).toBeVisible({ timeout: 20_000 });

    assertNoSevereRuntimeErrors(collectedErrors);
  });

  test('웰니스 목록에 항목이 있으면 첫 카드 클릭 후 상세 testid·URL', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/client/wellness', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/wellness$/, { timeout: 15_000 });
    await expect(page.getByTestId('client-wellness-list-page')).toBeVisible({ timeout: 20_000 });

    const firstCard = page.locator('.wellness-notification-card').first();
    const cardCount = await page.locator('.wellness-notification-card').count();
    if (cardCount === 0) {
      test.skip(true, '웰니스 알림 목록에 클릭 가능한 항목이 없습니다.');
      return;
    }

    await firstCard.click();
    await expect(page).toHaveURL(/\/client\/wellness\/[^/]+/, { timeout: 15_000 });

    const detailRoot = page.getByTestId('client-wellness-detail-page');
    await expect(detailRoot).toBeVisible({ timeout: 20_000 });

    assertNoSevereRuntimeErrors(collectedErrors);
  });
});
