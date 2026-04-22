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

/** 상담사 통합 로그인 식별자(전화번호) — `.cursor/skills/core-solution-testing/SKILL.md` 와 동일 */
const DEFAULT_CONSULTANT_LOGIN_ID = '01042858570';

/** 내담자 통합 로그인 식별자(전화번호) — `.cursor/skills/core-solution-testing/SKILL.md` 와 동일 */
const DEFAULT_CLIENT_LOGIN_ID = '01086322121';

/**
 * OAuth(카카오·네이버) E2E 골격 — `tests/e2e/tests/auth/oauth-preregistered-kakao-naver.spec.ts`.
 * MindGarden 로그인 비밀번호가 아니라 **각 프로바이더 로그인**용 테스트 계정 값이다. CI에는 설정하지 않는 것을 권장(스펙 전부 skip).
 *
 * | 변수 | 용도 |
 * |------|------|
 * | `E2E_OAUTH_KAKAO_EMAIL` | 카카오 테스트 계정 식별(이메일 등). |
 * | `E2E_OAUTH_KAKAO_PASSWORD` | 위 계정의 카카오 로그인 비밀번호(시크릿, 커밋 금지). |
 * | `E2E_OAUTH_NAVER_EMAIL` | 네이버 테스트 계정 식별. |
 * | `E2E_OAUTH_NAVER_PASSWORD` | 위 계정의 네이버 로그인 비밀번호(시크릿, 커밋 금지). |
 *
 * 어드민에서 **사전등록**된 내담자·상담자와 동일 소셜 계정으로 무간편가입을 검증할 때 로컬에서만 위 변수를 주입한다.
 */

/**
 * UnifiedLogin 등 단일 식별자 입력란 (이메일·전화·레거시 name=username).
 * `frontend/src/components/auth/UnifiedLogin.js` 는 `name="email"` 사용.
 */
export const UNIFIED_LOGIN_IDENTIFIER_SELECTOR =
  'input[name="username"], input[type="email"], input[name="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]';

/**
 * `frontend/src/constants/loginDisplay.js` LOGIN_CREDENTIALS_MISMATCH_MESSAGE 에 포함되는 문구.
 * 화면에 이 문자열이 보이면 아이디·비밀번호 불일치로 간주한다.
 */
const CREDENTIAL_MISMATCH_BODY_SNIPPET = '비밀번호가 올바르지 않습니다';

function buildLoginNavigationFailureError(
  context: string,
  err: unknown,
  pageUrl: string,
  bodyText: string
): Error {
  const normalizedBody = bodyText.replace(/\s+/g, ' ').trim();
  const credentialsWrong = bodyText.includes(CREDENTIAL_MISMATCH_BODY_SNIPPET);
  const orig = err instanceof Error ? err.message : String(err);
  if (credentialsWrong) {
    return new Error(
      `${context}: 로그인이 거절되었습니다. 입력한 아이디(이메일·휴대폰) 또는 비밀번호가 해당 서버 계정과 일치하지 않습니다. ` +
        `E2E 자격 증명(환경 변수·erpAuth 기본값)을 확인하세요.\nURL=${pageUrl}`
    );
  }
  return new Error(
    `${context}: 로그인 후 화면 전환 대기 중 타임아웃입니다. 백엔드(API) 기동·BASE_URL·프록시를 확인하세요.\n` +
      `원래 오류: ${orig}\nURL=${pageUrl}\n본문 일부: ${normalizedBody.slice(0, 400)}`
  );
}

async function reportAndThrowLoginFailure(
  page: Page,
  testInfo: TestInfo | undefined,
  err: unknown,
  context: string
): Promise<never> {
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
  let bodyText = '';
  try {
    bodyText = await page.locator('body').innerText({ timeout: 3000 });
  } catch {
    bodyText = '';
  }
  const improved = buildLoginNavigationFailureError(context, err, url, bodyText);
  const summary = [
    improved.message,
    `original=${err instanceof Error ? err.message : String(err)}`,
    `url=${url}`,
    `alerts=${alertText.replace(/\s+/g, ' ').trim()}`,
    `body_snippet=${bodyText.replace(/\s+/g, ' ').trim().slice(0, 800)}`,
  ].join('\n');

  if (testInfo) {
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
  }
  throw improved;
}

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
function trimEnv(key: string): string | undefined {
  const v = process.env[key];
  if (v == null || String(v).trim() === '') return undefined;
  return String(v).trim();
}

export function getE2eCredentials(): { email: string; password: string } {
  const email =
    trimEnv('E2E_TEST_EMAIL') ||
    trimEnv('TEST_USERNAME') ||
    DEFAULT_E2E_EMAIL;
  const password =
    trimEnv('E2E_TEST_PASSWORD') ||
    trimEnv('TEST_PASSWORD') ||
    DEFAULT_E2E_PASSWORD;
  return { email, password };
}

/**
 * MindGarden 웹 로그인 폼용(아이디 필드에 이메일 입력).
 * `superadmin@mindgarden.com` 등 레거시 폴백 없음 — SSOT는 `getE2eCredentials()`와 동일.
 */
export function getMindGardenWebLogin(): { username: string; password: string } {
  const { email, password } = getE2eCredentials();
  return { username: email, password };
}

/**
 * 상담사 웹 로그인 (`/login` — username 필드에 전화번호 또는 이메일).
 * 우선순위: `CONSULTANT_USERNAME` → `E2E_CONSULTANT_LOGIN_ID` → 기본 `01042858570`.
 * 비밀번호: `CONSULTANT_PASSWORD` → `E2E_CONSULTANT_PASSWORD` → 관리자 E2E와 동일 기본값 `godgod826!`.
 */
export function getConsultantWebLogin(): { username: string; password: string } {
  const username =
    trimEnv('CONSULTANT_USERNAME') ||
    trimEnv('E2E_CONSULTANT_LOGIN_ID') ||
    DEFAULT_CONSULTANT_LOGIN_ID;
  const password =
    trimEnv('CONSULTANT_PASSWORD') ||
    trimEnv('E2E_CONSULTANT_PASSWORD') ||
    DEFAULT_E2E_PASSWORD;
  return { username, password };
}

/**
 * 내담자 웹 로그인 (`/login` — 아이디에 전화번호 또는 이메일).
 * 우선순위: `TEST_CLIENT_USERNAME` → `E2E_CLIENT_LOGIN_ID` → 기본 `01086322121`.
 * 비밀번호: `TEST_CLIENT_PASSWORD` → `E2E_CLIENT_PASSWORD` → 통합 E2E 비밀번호 `godgod826!`.
 */
export function getClientWebLogin(): { username: string; password: string } {
  const username =
    trimEnv('TEST_CLIENT_USERNAME') ||
    trimEnv('E2E_CLIENT_LOGIN_ID') ||
    DEFAULT_CLIENT_LOGIN_ID;
  const password =
    trimEnv('TEST_CLIENT_PASSWORD') ||
    trimEnv('E2E_CLIENT_PASSWORD') ||
    DEFAULT_E2E_PASSWORD;
  return { username, password };
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
  await page.fill(UNIFIED_LOGIN_IDENTIFIER_SELECTOR, email);
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
    await reportAndThrowLoginFailure(page, testInfo, err, 'ERP/관리자 웹 로그인');
  }

  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

const UNIFIED_LOGIN_SUBMIT_SELECTOR =
  'button[type="submit"], button:has-text("로그인"), button:has-text("Login")';

/**
 * 내담자 `/login` → `/client/dashboard`. 실패 시 자격 증명 불일치 UI가 있으면 명시적으로 안내한다.
 */
export async function loginClientWeb(
  page: Page,
  testInfo?: TestInfo,
  options?: { timeoutMs?: number }
): Promise<void> {
  const { username, password } = getClientWebLogin();
  const timeoutMs = options?.timeoutMs ?? 20_000;

  await page.goto('/login');
  await page.fill(UNIFIED_LOGIN_IDENTIFIER_SELECTOR, username);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click(UNIFIED_LOGIN_SUBMIT_SELECTOR);

  try {
    await page.waitForURL((u) => /\/client\/dashboard/.test(u.pathname), {
      timeout: timeoutMs,
      waitUntil: 'domcontentloaded',
    });
  } catch (err) {
    await reportAndThrowLoginFailure(page, testInfo, err, '내담자 웹 로그인');
  }

  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/**
 * 상담사 `/login` → `/consultant/dashboard`. 실패 시 자격 증명 불일치 UI가 있으면 명시적으로 안내한다.
 */
export async function loginConsultantWeb(
  page: Page,
  testInfo?: TestInfo,
  options?: { timeoutMs?: number }
): Promise<void> {
  const { username, password } = getConsultantWebLogin();
  const timeoutMs = options?.timeoutMs ?? 20_000;

  await page.goto('/login');
  await page.fill(UNIFIED_LOGIN_IDENTIFIER_SELECTOR, username);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click(UNIFIED_LOGIN_SUBMIT_SELECTOR);

  try {
    await page.waitForURL((u) => /\/consultant\/dashboard/i.test(u.pathname), {
      timeout: timeoutMs,
      waitUntil: 'domcontentloaded',
    });
  } catch (err) {
    await reportAndThrowLoginFailure(page, testInfo, err, '상담사 웹 로그인');
  }

  await page.waitForLoadState('domcontentloaded').catch(() => {});
}
