/**
 * 내담자 메시지 화면 스모크: `/client/messages` 진입·목록/빈 상태·모달(E2E용 testid)
 *
 * 자격 증명 SSOT: `getClientWebLogin()` — 기본 `01086322121` / `godgod826!` (`.cursor/skills/core-solution-testing/SKILL.md`)
 *
 * 로컬 실행 예:
 *   cd tests/e2e && BASE_URL=http://localhost:3000 npm run test:client
 *
 * testid (`ClientMessageScreen.js`):
 * - `client-messages-page`, `client-messages-message-list`, `client-messages-message-item`
 * - `client-message-detail-modal`, `client-message-detail-close`, `client-message-reply-textarea`
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

test.describe('내담자 메시지 화면 스모크', () => {
  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginClientWeb(page, test.info());
  });

  test('/client/messages 에서 페이지 testid가 보이고, 메시지 유무에 따라 목록·모달 또는 빈 상태만 검증한다', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/client/messages', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/messages/, { timeout: 15_000 });

    const pageRoot = page.getByTestId('client-messages-page');
    await expect(pageRoot).toBeVisible({ timeout: 20_000 });

    const messageItems = page.getByTestId('client-messages-message-item');
    const itemCount = await messageItems.count();

    if (itemCount === 0) {
      await test.step('메시지 0건: 빈 상태 문구', async () => {
        await expect(page.getByText('받은 메시지가 없습니다')).toBeVisible({ timeout: 10_000 });
      });
    } else {
      await test.step('메시지 있음: 첫 행 클릭 → 상세 모달 → 닫기', async () => {
        await messageItems.first().click();
        const modal = page.getByTestId('client-message-detail-modal');
        await expect(modal).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId('client-message-reply-textarea')).toBeVisible();

        await page.getByTestId('client-message-detail-close').click();
        await expect(page.getByTestId('client-message-detail-modal')).toHaveCount(0);
      });
    }

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child:\n${reactHits.join('\n---\n')}\n전체:\n${collectedErrors.join('\n')}`
    ).toEqual([]);

    const severe = collectedErrors.filter((line) => !REACT_130_OR_INVALID_CHILD.test(line));
    expect(severe, `pageerror / console.error:\n${severe.join('\n---\n')}`).toEqual([]);
  });
});
