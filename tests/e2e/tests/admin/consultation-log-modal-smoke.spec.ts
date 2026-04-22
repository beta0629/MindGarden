// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import { getMindGardenWebLogin } from '../../helpers/erpAuth';

/**
 * 상담일지 모달(ConsultationLogModal) 스모크 — 어드민 ConsultationLogView 경로
 * - 목록 카드 클릭 시 UnifiedModal(dialog) 오픈
 * - 아코디언 트리거 id: consultation-log-accordion-profile-trigger, consultation-log-accordion-precautions-trigger
 *
 * 실행 예:
 *   cd tests/e2e && BASE_URL=http://localhost:3000 E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... \
 *     npx playwright test tests/admin/consultation-log-modal-smoke.spec.ts --project=chromium
 *   (또는 TEST_USERNAME / TEST_PASSWORD — 우선순위는 스펙 내 상수 참고, SSOT: `.cursor/skills/core-solution-testing/SKILL.md`)
 *
 * 목록에 일지가 없으면 페이지 로드만 검증하고 모달 단계는 주석(annotation) 후 종료합니다.
 *
 * 전제: 프론트(baseURL)뿐 아니라 로그인 API를 처리하는 **백엔드가 기동**돼 있어야 합니다.
 * 로컬에서만 webpack 켜진 상태이면 로그인 후에도 /login에 머물러 타임아웃납니다.
 */
async function adminLogin(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="username"], input[name="email"], input[type="email"]', username);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("로그인")');
  try {
    await page.waitForURL(/dashboard|admin|home|consultant/i, { timeout: 25000 });
  } catch {
    const url = page.url();
    if (url.includes('/login')) {
      throw new Error(
        '로그인 후에도 /login에 머무름 — 백엔드(API) 기동·TEST_USERNAME/TEST_PASSWORD·중복 로그인 모달 여부를 확인하세요.'
      );
    }
    throw new Error(`로그인 네비게이션 타임아웃 — 현재 URL: ${url}`);
  }
}

async function assertAccordionToggle(page: Page, triggerSelector: string) {
  const trigger = page.locator(triggerSelector);
  await expect(trigger).toBeVisible({ timeout: 15000 });
  const before = await trigger.getAttribute('aria-expanded');
  expect(before === 'true' || before === 'false').toBeTruthy();
  await trigger.click();
  await expect(trigger).toHaveAttribute(
    'aria-expanded',
    before === 'true' ? 'false' : 'true',
    { timeout: 5000 }
  );
}

/**
 * `frontend/src/utils/consultationLogLocalDraft.js` 의 KEY_PREFIX 및
 * `buildConsultationLogDraftStorageKey` 결과 키와 동일한 접두어.
 */
const CONSULTATION_LOG_LOCAL_DRAFT_KEY_PREFIX = 'mg.cl.localDraft';

async function pageHasConsultationLogLocalDraftKey(page: Page): Promise<boolean> {
  return page.evaluate((prefix) => {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k !== null && k.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }, CONSULTATION_LOG_LOCAL_DRAFT_KEY_PREFIX);
}

test.describe('관리자 — 상담일지 모달·아코디언 스모크', () => {
  const { username: TEST_USERNAME, password: TEST_PASSWORD } = getMindGardenWebLogin();

  test('상담일지 조회 페이지 로드 및(데이터 있을 때) 모달·아코디언 토글', async ({
    page,
  }: {
    page: Page;
  }) => {
    await adminLogin(page, TEST_USERNAME, TEST_PASSWORD);

    const resp = await page.goto('/admin/consultation-logs', { waitUntil: 'domcontentloaded' });
    if (resp?.status() === 403) {
      test.skip(true, 'HTTP 403 — 상담일지 조회 경로 접근 불가');
    }

    await expect(page.locator('.mg-v2-consultation-log-view')).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText('상담일지 조회', { exact: true })).toBeVisible({
      timeout: 30000,
    });

    const cards = page.locator('.mg-v2-consultation-log-list-block__card');
    const emptyTitle = page.locator('.mg-v2-consultation-log-list-block__empty-title');
    await expect(cards.or(emptyTitle).first()).toBeVisible({ timeout: 25000 });

    const cardCount = await cards.count();
    if (cardCount === 0) {
      test.info().annotations.push({
        type: 'note',
        description:
          '등록된 상담일지 카드가 없어 모달·아코디언 자동 검증 생략 — 시드 데이터로 재실행 권장',
      });
      return;
    }

    await cards.first().click();
    const dialog = page.getByRole('dialog', { name: /상담일지 작성/ });
    await expect(dialog).toBeVisible({ timeout: 25000 });
    await expect(dialog.locator('.mg-v2-consultation-log-modal')).toBeVisible();

    const clientCondition = dialog.locator('textarea[name="clientCondition"]');
    await expect(clientCondition).toBeVisible({ timeout: 25000 });
    await clientCondition.fill('e2e-phase1-local-draft');

    // CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS = 5000 — 폴링으로 대기(waitForTimeout 지양)
    await expect
      .poll(async () => pageHasConsultationLogLocalDraftKey(page), {
        timeout: 20_000,
        intervals: [400, 800, 1200, 1600],
      })
      .toBe(true);

    await assertAccordionToggle(
      page,
      '#consultation-log-accordion-profile-trigger'
    );
    await assertAccordionToggle(
      page,
      '#consultation-log-accordion-precautions-trigger'
    );

    await page.locator('.mg-modal__close[aria-label="닫기"]').first().click();
    const unsavedCloseDialog = page.getByRole('dialog', { name: /작성 중인 내용/ });
    try {
      await expect(unsavedCloseDialog).toBeVisible({ timeout: 3500 });
      await unsavedCloseDialog.getByRole('button', { name: '닫기', exact: true }).click();
    } catch {
      // 로컬 초안 flush 후 더티 없음이면 미저장 확인 없이 바로 닫힐 수 있음
    }
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});
