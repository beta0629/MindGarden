// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import type { Page, TestInfo } from '@playwright/test';

/**
 * 로그인 후 허용 경로 prefix (frontend/src/App.js, frontend/src/utils/dashboardUtils.js).
 * /login·인증 콜백 등은 제외.
 */
const POST_LOGIN_PATH_PREFIXES: string[] = [
  '/dashboard',
  '/client/dashboard',
  '/consultant/dashboard',
  '/admin/dashboard',
  '/super_admin/dashboard',
  '/erp',
  '/academy',
  '/mypage',
  '/settings',
  '/notifications',
  '/tenant',
  '/consultation-history',
  '/schedule',
  '/help',
  '/system-notifications',
  '/admin',
  '/consultant',
  '/client',
  '/super_admin',
  '/branch_super_admin',
  '/branch_manager',
];

const DEFAULT_E2E_EMAIL = 'agisunny@daum.net';
const DEFAULT_E2E_PASSWORD = 'godgod826!';

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * 로그인 직후 리다이렉트로 올 수 있는 URL인지 판별한다.
 *
 * @param url 현재 페이지 URL
 * @returns 로그인 성공 후 앱 내 경로이면 true
 */
export function isPostLoginPath(url: URL): boolean {
  const p = url.pathname;
  if (p === '/login' || p.startsWith('/login/')) {
    return false;
  }
  if (p === '/register' || p.startsWith('/register/')) {
    return false;
  }
  if (p.startsWith('/forgot-password') || p.startsWith('/reset-password')) {
    return false;
  }
  if (p.startsWith('/auth/oauth2')) {
    return false;
  }
  return POST_LOGIN_PATH_PREFIXES.some((prefix) => matchesPathPrefix(p, prefix));
}

/**
 * E2E 자격 증명 (.cursor/skills/core-solution-testing/SKILL.md).
 * 우선순위: E2E_TEST_EMAIL / E2E_TEST_PASSWORD → 레거시 TEST_USERNAME / TEST_PASSWORD → 스킬 기본값.
 */
export function getE2eCredentials(): { email: string; password: string } {
  const email =
    process.env.E2E_TEST_EMAIL ||
    process.env.TEST_USERNAME ||
    DEFAULT_E2E_EMAIL;
  const password =
    process.env.E2E_TEST_PASSWORD ||
    process.env.TEST_PASSWORD ||
    DEFAULT_E2E_PASSWORD;
  return { email, password };
}

/**
 * ERP E2E용 로그인. 실패 시 URL·알림 텍스트·스크린샷을 testInfo에 첨부한다.
 *
 * @param page 페이지
 * @param testInfo Playwright TestInfo
 * @param options.timeoutMs post-login URL 대기 시간(ms)
 */
export async function loginErpUser(
  page: Page,
  testInfo: TestInfo,
  options?: { timeoutMs?: number }
): Promise<void> {
  const { email, password } = getE2eCredentials();
  const timeoutMs = options?.timeoutMs ?? 25_000;

  await page.goto('/login');
  await page.fill(
    'input[name="username"], input[type="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]',
    email
  );
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click(
    'button[type="submit"], button:has-text("로그인"), button:has-text("Login")'
  );

  try {
    await page.waitForURL(isPostLoginPath, {
      timeout: timeoutMs,
      waitUntil: 'domcontentloaded',
    });
  } catch (err) {
    const url = page.url();
    let alertText = '';
    try {
      alertText = await page
        .locator(
          '[role="alert"], .alert-danger, .text-danger, [class*="notification"], .toast, [class*="error"]'
        )
        .first()
        .innerText({ timeout: 3000 });
    } catch {
      alertText = '';
    }
    const bodySnippet = (await page.locator('body').innerText({ timeout: 3000 }).catch(() => '')).slice(
      0,
      800
    );
    const summary = [
      `message=${err instanceof Error ? err.message : String(err)}`,
      `url=${url}`,
      `alerts=${alertText.replace(/\s+/g, ' ').trim()}`,
      `body_snippet=${bodySnippet.replace(/\s+/g, ' ').trim()}`,
    ].join('\n');

    testInfo.annotations.push({
      type: 'login-failure',
      description: `url=${url}`,
    });
    await testInfo.attach('login-failure-summary.txt', {
      body: summary,
      contentType: 'text/plain',
    });
    try {
      if (!page.isClosed()) {
        await testInfo.attach('login-failure-screenshot.png', {
          body: await page.screenshot({ fullPage: false }),
          contentType: 'image/png',
        });
      }
    } catch {
      // 테스트 타임아웃 등으로 페이지가 이미 닫힌 경우 무시
    }
    throw err;
  }

  await page.waitForLoadState('domcontentloaded').catch(() => {});
}
