import type { Page } from '@playwright/test';

const LOGIN_WAIT_MS = 20_000;

function isStillOnLoginPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/login/');
}

/**
 * ERP E2E용 로그인. 제출 후 /login 이탈 또는 인증 후 흔한 경로 세그먼트를 기다린다.
 * (redirectToDynamicDashboard → /admin/dashboard, /consultant/dashboard, /academy 등 대응)
 */
export async function loginErpUser(page: Page): Promise<void> {
  const username =
    process.env.TEST_USERNAME ||
    process.env.E2E_TEST_EMAIL ||
    'superadmin@mindgarden.com';
  const password =
    process.env.TEST_PASSWORD ||
    process.env.E2E_TEST_PASSWORD ||
    'admin123';

  await page.goto('/login');
  await page.fill(
    'input[name="username"], input[type="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]',
    username
  );
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click(
    'button[type="submit"], button:has-text("로그인"), button:has-text("Login")'
  );

  try {
    // /login 이탈 = 성공 (동적 대시보드: /admin/..., /consultant/..., /academy 등)
    await page.waitForURL(
      (url) => {
        const p = url.pathname;
        return p !== '/login' && !p.startsWith('/login/');
      },
      { timeout: LOGIN_WAIT_MS }
    );
  } catch {
    const url = page.url();
    let pathname = '';
    try {
      pathname = new URL(url).pathname;
    } catch {
      pathname = '';
    }
    if (isStillOnLoginPath(pathname)) {
      throw new Error(
        'ERP E2E 로그인 실패: 제출 후에도 /login 에 머물렀습니다. ' +
          'BASE_URL, TEST_USERNAME·TEST_PASSWORD(또는 E2E_TEST_EMAIL·E2E_TEST_PASSWORD), ' +
          '백엔드·프론트 기동 및 테스트 계정을 확인하세요. ' +
          `현재 URL: ${url}`
      );
    }
    throw new Error(
      `ERP E2E 로그인 대기 타임아웃(${LOGIN_WAIT_MS}ms). ` +
        `현재 URL: ${url}`
    );
  }
}
