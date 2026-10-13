#!/usr/bin/env node
/**
 * .dev 전용 읽기 전용 화면 검증 수집기 (workflow_dispatch / PR / 로컬).
 *
 * - path × viewport 스크린샷·콘솔 에러·HTTP ≥400·응답시간 수집
 * - AUTH_MODE=authenticated 이면 로그인 후 수집 (자격 증명은 env만; 기본값 없음)
 * - AUTH_MODE=unauthenticated / SKIP_LOGIN=true / 자격 미설정 시 로그인 생략 후 공개 경로만 수집
 * - 호스트는 .dev allowlist만 허용 (프로덕션·localhost 거부)
 *
 * Env:
 *   BASE_URL | E2E_BASE_URL  — 대상 URL (입력 base_url 우선; 스크립트가 .dev 검증)
 *   ROLE                     — admin | counselor | client
 *   AUTH_MODE                — authenticated | unauthenticated
 *   SKIP_LOGIN               — true 이면 로그인 생략
 *   PATHS                    — 쉼표 구분 경로 (예: /login,/admin/dashboard)
 *   VIEWPORTS                — 쉼표 구분 너비 (예: 390,1440)
 *   WAIT_MS                  — 네비게이션 후 settle(ms), 기본 2000
 *   E2E_TENANT_ID            — 선택; /login?tenantId= 에 전달 (authenticated only)
 *   ARTIFACTS_DIR            — 기본 artifacts/dev-screen-verify (cwd 기준)
 *
 * 로그인 셀렉터는 helpers/erpAuth.ts UNIFIED_* 와 동일.
 *
 * SSOT: .cursor/skills/core-solution-testing/SKILL.md
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

/** .dev allowlist — 호스트 게이트 상수만 허용 (프로덕션·localhost 거부). §17 하드코딩 게이트 예외. */
const ALLOWED_DEV_HOST_EXACT = 'mindgarden.dev.core-solution.co.kr';
const ALLOWED_DEV_HOST_SUFFIX = '.dev.core-solution.co.kr';

const UNIFIED_LOGIN_IDENTIFIER_SELECTOR =
  'input[name="email"], input#email, input[name="username"], input[type="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]';

const UNIFIED_LOGIN_PASSWORD_SELECTOR =
  'input[name="password"], input#password, input[type="password"]';

const DEFAULT_PATHS = '/login,/admin/dashboard';
const DEFAULT_VIEWPORTS = '390,1440';
const DEFAULT_WAIT_MS = 2000;
const LOGIN_TIMEOUT_MS = 60_000;
const NAV_TIMEOUT_MS = 60_000;

/**
 * @param {string | undefined} key
 * @returns {string | undefined}
 */
function trimEnv(key) {
  const v = process.env[key];
  if (v == null || String(v).trim() === '') return undefined;
  return String(v).trim();
}

/**
 * @param {string} raw
 * @returns {URL}
 */
function assertDevOnlyBaseUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid BASE_URL: not a valid URL`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Rejected BASE_URL protocol: only http(s) allowed`);
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    throw new Error(`Rejected BASE_URL host: localhost is not allowed (dev-only)`);
  }
  const isExact = host === ALLOWED_DEV_HOST_EXACT;
  const isSuffix = host.endsWith(ALLOWED_DEV_HOST_SUFFIX);
  if (!isExact && !isSuffix) {
    throw new Error(
      `Rejected BASE_URL host: must be ${ALLOWED_DEV_HOST_EXACT} or *.${ALLOWED_DEV_HOST_SUFFIX.slice(1)} (got host rejected)`
    );
  }
  // Strip trailing slash for consistent joins
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  if (url.pathname === '/') {
    url.pathname = '';
  }
  return url;
}

/**
 * @param {string} role
 * @returns {{ username: string, password: string } | null}
 */
function tryResolveCredentials(role) {
  const normalized = String(role || 'admin').toLowerCase();

  if (normalized === 'admin') {
    const username =
      trimEnv('E2E_TEST_EMAIL') ||
      trimEnv('TEST_USERNAME') ||
      trimEnv('E2E_ADMIN_USERNAME');
    const password =
      trimEnv('E2E_TEST_PASSWORD') ||
      trimEnv('TEST_PASSWORD') ||
      trimEnv('E2E_ADMIN_PASSWORD');
    if (!username || !password) return null;
    return { username, password };
  }

  if (normalized === 'counselor' || normalized === 'consultant') {
    const username =
      trimEnv('E2E_CONSULTANT_LOGIN_ID') || trimEnv('CONSULTANT_USERNAME');
    const password =
      trimEnv('E2E_CONSULTANT_PASSWORD') || trimEnv('CONSULTANT_PASSWORD');
    if (!username || !password) return null;
    return { username, password };
  }

  if (normalized === 'client') {
    const username =
      trimEnv('E2E_CLIENT_LOGIN_ID') || trimEnv('TEST_CLIENT_USERNAME');
    const password =
      trimEnv('E2E_CLIENT_PASSWORD') || trimEnv('TEST_CLIENT_PASSWORD');
    if (!username || !password) return null;
    return { username, password };
  }

  throw new Error(`Unknown ROLE: ${role} (expected admin|counselor|client)`);
}

/**
 * @param {string} role
 * @returns {string}
 */
function requiredSecretNames(role) {
  const normalized = String(role || 'admin').toLowerCase();
  if (normalized === 'admin') {
    return 'E2E_TEST_EMAIL, E2E_TEST_PASSWORD (fallback: E2E_ADMIN_USERNAME, E2E_ADMIN_PASSWORD)';
  }
  if (normalized === 'counselor' || normalized === 'consultant') {
    return 'E2E_CONSULTANT_LOGIN_ID, E2E_CONSULTANT_PASSWORD (fallback: CONSULTANT_USERNAME, CONSULTANT_PASSWORD)';
  }
  if (normalized === 'client') {
    return 'E2E_CLIENT_LOGIN_ID, E2E_CLIENT_PASSWORD (fallback: TEST_CLIENT_USERNAME, TEST_CLIENT_PASSWORD)';
  }
  return 'unknown role';
}

/**
 * @param {string} csv
 * @param {string} fallback
 * @returns {string[]}
 */
function parseCsvList(csv, fallback) {
  const raw = (csv && String(csv).trim()) || fallback;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {string} p
 * @returns {string}
 */
function normalizePath(p) {
  const t = p.trim();
  if (!t) return '/';
  return t.startsWith('/') ? t : `/${t}`;
}

/**
 * @param {string} p
 * @returns {string}
 */
function safePathToken(p) {
  return normalizePath(p)
    .replace(/^\//, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'root';
}

/**
 * Strip query string (tokens) from URL for safe logging.
 * @param {string} url
 * @returns {string}
 */
function sanitizeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return String(url).split('?')[0];
  }
}

/**
 * @param {import('playwright').Page} page
 */
async function clickUnifiedLoginSubmit(page) {
  const primary = page.getByRole('button', { name: '로그인', exact: true });
  if ((await primary.count()) > 0) {
    await primary.click();
    return;
  }
  await page
    .locator('button[type="submit"], button:has-text("Login")')
    .first()
    .click();
}

/**
 * @param {URL} baseUrl
 * @returns {string}
 */
function buildLoginPath(baseUrl) {
  const tenantId = trimEnv('E2E_TENANT_ID');
  const loginPath = tenantId
    ? `/login?tenantId=${encodeURIComponent(tenantId)}`
    : '/login';
  return `${baseUrl.origin}${baseUrl.pathname}${loginPath}`;
}

/**
 * @param {{ role: string, hasUser: boolean, hasPass: boolean, authMode: string }} info
 */
function logCredentialPresence(info) {
  // Never print email/phone/password — presence only
  console.log(
    `[dev-screen-verify] role=${info.role} auth_mode=${info.authMode} credential_present=${info.hasUser && info.hasPass} (user=${info.hasUser} pass=${info.hasPass})`
  );
}

/**
 * @returns {boolean}
 */
function envRequestsSkipLogin() {
  const authMode = (trimEnv('AUTH_MODE') || '').toLowerCase();
  const skipLogin = (trimEnv('SKIP_LOGIN') || '').toLowerCase();
  return authMode === 'unauthenticated' || skipLogin === 'true' || skipLogin === '1';
}

/**
 * @param {object} summary
 * @returns {string}
 */
function buildMarkdownSummary(summary) {
  const lines = [
    '# Dev screen verify summary',
    '',
    `- **base_url**: \`${summary.baseUrl}\``,
    `- **role**: \`${summary.role}\``,
    `- **auth_mode**: \`${summary.authMode}\``,
    `- **viewports**: ${summary.viewports.join(', ')}`,
    `- **paths**: ${summary.paths.join(', ')}`,
    `- **wait_ms**: ${summary.waitMs}`,
    `- **started_at**: ${summary.startedAt}`,
    `- **finished_at**: ${summary.finishedAt}`,
    `- **ok**: ${summary.ok ? 'yes' : 'no'}`,
    '',
  ];

  if (summary.authMode === 'unauthenticated') {
    lines.push(
      '> Login skipped (missing E2E secrets or AUTH_MODE=unauthenticated). Screenshots are unauthenticated page states.',
      ''
    );
  }

  lines.push(
    '| Role | Viewport | Path | Status | Nav ms | Console errors | HTTP ≥400 | Screenshot |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'
  );

  for (const row of summary.results) {
    const shot = row.screenshot ? path.basename(row.screenshot) : '—';
    lines.push(
      `| ${row.role} | ${row.viewport} | ${row.path} | ${row.status} | ${row.navMs ?? '—'} | ${row.consoleErrors.length} | ${row.failedResponses.length} | ${shot} |`
    );
  }

  const failures = summary.results.filter((r) => r.status !== 'ok');
  if (failures.length > 0) {
    lines.push('', '## Failures', '');
    for (const f of failures) {
      lines.push(`- **${f.path}** @ ${f.viewport}px: ${f.error || f.status}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * @param {import('playwright').Page} page
 * @param {{ username: string, password: string }} credentials
 * @param {URL} baseUrl
 * @param {string} role
 * @param {string} screenshotsDir
 */
async function performLogin(page, credentials, baseUrl, role, screenshotsDir) {
  const loginUrl = buildLoginPath(baseUrl);
  console.log(`[dev-screen-verify] login goto=${sanitizeUrl(loginUrl)}`);
  await page.goto(loginUrl, {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT_MS,
  });

  const idField = page.locator(UNIFIED_LOGIN_IDENTIFIER_SELECTOR).first();
  await idField.waitFor({ state: 'visible', timeout: 15_000 });
  await idField.fill(credentials.username);
  const pwField = page.locator(UNIFIED_LOGIN_PASSWORD_SELECTOR).first();
  await pwField.waitFor({ state: 'visible', timeout: 10_000 });
  await pwField.fill(credentials.password);
  await clickUnifiedLoginSubmit(page);

  // 중복 로그인 확인 모달(있으면 확인/계속) — auth.spec / psych-assessments 와 동일 패턴
  try {
    const dup = page
      .locator('button:has-text("확인"), button:has-text("계속")')
      .first();
    await dup.waitFor({ state: 'visible', timeout: 3_000 });
    await dup.click();
  } catch {
    // 모달 없음 — 정상
  }

  try {
    await page.waitForURL(
      (u) => {
        try {
          const pathname = typeof u === 'string' ? new URL(u).pathname : u.pathname;
          return pathname !== '/login' && !pathname.startsWith('/login/');
        } catch {
          return false;
        }
      },
      { timeout: LOGIN_TIMEOUT_MS, waitUntil: 'domcontentloaded' }
    );
  } catch (err) {
    const shot = path.join(screenshotsDir, `${role}-login-failure.png`);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    throw new Error(
      `Login failed or timed out (left /login not observed). Screenshot: ${path.basename(shot)}. ` +
        `Original: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

async function main() {
  const role = (trimEnv('ROLE') || 'admin').toLowerCase();
  const rawBase =
    trimEnv('BASE_URL') ||
    trimEnv('E2E_BASE_URL') ||
    `https://${ALLOWED_DEV_HOST_EXACT}`;
  const baseUrl = assertDevOnlyBaseUrl(rawBase);

  const paths = parseCsvList(trimEnv('PATHS'), DEFAULT_PATHS).map(normalizePath);
  const viewports = parseCsvList(trimEnv('VIEWPORTS'), DEFAULT_VIEWPORTS).map(
    (w) => {
      const n = Number.parseInt(w, 10);
      if (!Number.isFinite(n) || n < 320 || n > 4000) {
        throw new Error(`Invalid viewport width: ${w}`);
      }
      return n;
    }
  );
  const waitMs = Number.parseInt(trimEnv('WAIT_MS') || String(DEFAULT_WAIT_MS), 10);

  const credentials = tryResolveCredentials(role);
  const forceUnauth = envRequestsSkipLogin();
  /** @type {'authenticated' | 'unauthenticated'} */
  let authMode = 'authenticated';
  if (forceUnauth || !credentials) {
    authMode = 'unauthenticated';
  }

  logCredentialPresence({
    role,
    hasUser: Boolean(credentials?.username),
    hasPass: Boolean(credentials?.password),
    authMode,
  });

  if (authMode === 'unauthenticated') {
    console.log(
      `[dev-screen-verify] login skipped (missing credentials or AUTH_MODE/SKIP_LOGIN). ` +
        `Configure secrets: ${requiredSecretNames(role)}`
    );
  }

  const artifactsDir =
    trimEnv('ARTIFACTS_DIR') ||
    path.join(process.cwd(), 'artifacts', 'dev-screen-verify');
  const screenshotsDir = path.join(artifactsDir, 'screenshots');
  await mkdir(screenshotsDir, { recursive: true });

  const startedAt = new Date().toISOString();
  /** @type {object[]} */
  const results = [];
  let overallOk = true;

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: false,
      viewport: { width: viewports[0], height: 900 },
    });
    const page = await context.newPage();

    if (authMode === 'authenticated' && credentials) {
      await performLogin(page, credentials, baseUrl, role, screenshotsDir);
      console.log(
        `[dev-screen-verify] logged in; collecting ${paths.length} path(s) × ${viewports.length} viewport(s)`
      );
    } else {
      console.log(
        `[dev-screen-verify] unauthenticated collect; ${paths.length} path(s) × ${viewports.length} viewport(s)`
      );
    }

    for (const width of viewports) {
      await page.setViewportSize({ width, height: Math.max(720, Math.round(width * 1.8)) });

      for (const pagePath of paths) {
        /** @type {string[]} */
        const consoleErrors = [];
        /** @type {{ url: string, status: number, method: string }[]} */
        const failedResponses = [];

        const onConsole = (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            // Avoid leaking cookies/auth from noisy console dumps
            if (/password|authorization|cookie|Bearer\s+/i.test(text)) {
              consoleErrors.push('[redacted console error]');
            } else {
              consoleErrors.push(text.slice(0, 500));
            }
          }
        };
        const onResponse = (res) => {
          const status = res.status();
          if (status >= 400) {
            failedResponses.push({
              url: sanitizeUrl(res.url()),
              status,
              method: res.request().method(),
            });
          }
        };

        page.on('console', onConsole);
        page.on('response', onResponse);

        const target = `${baseUrl.origin}${baseUrl.pathname}${pagePath}`;
        const safeName = `${role}-${width}-${safePathToken(pagePath)}.png`;
        const screenshotPath = path.join(screenshotsDir, safeName);
        let status = 'ok';
        let errorMsg = '';
        let navMs = null;

        try {
          console.log(
            `[dev-screen-verify] goto path=${pagePath} viewport=${width} url=${sanitizeUrl(target)}`
          );
          const t0 = Date.now();
          await page.goto(target, {
            waitUntil: 'load',
            timeout: NAV_TIMEOUT_MS,
          });
          try {
            await page.waitForLoadState('networkidle', { timeout: 15_000 });
          } catch {
            // networkidle may not settle on SPA; load + wait_ms is enough
          }
          if (waitMs > 0) {
            await page.waitForTimeout(waitMs);
          }
          navMs = Date.now() - t0;
          await page.screenshot({ path: screenshotPath, fullPage: true });
        } catch (err) {
          overallOk = false;
          status = 'error';
          errorMsg = err instanceof Error ? err.message : String(err);
          await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        } finally {
          page.off('console', onConsole);
          page.off('response', onResponse);
        }

        results.push({
          role,
          viewport: width,
          path: pagePath,
          status,
          error: errorMsg || undefined,
          navMs,
          consoleErrors,
          failedResponses,
          screenshot: path.relative(artifactsDir, screenshotPath),
          finalUrl: sanitizeUrl(page.url()),
        });
      }
    }

    await context.close();
  } finally {
    await browser.close();
  }

  const finishedAt = new Date().toISOString();
  const summary = {
    baseUrl: sanitizeUrl(baseUrl.toString()),
    role,
    authMode,
    paths,
    viewports,
    waitMs,
    startedAt,
    finishedAt,
    ok: overallOk,
    results,
  };

  const summaryJsonPath = path.join(artifactsDir, 'summary.json');
  const summaryMdPath = path.join(artifactsDir, 'summary.md');
  const md = buildMarkdownSummary(summary);
  await writeFile(summaryJsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(summaryMdPath, md, 'utf8');

  console.log(`[dev-screen-verify] wrote ${summaryJsonPath}`);
  console.log(`[dev-screen-verify] wrote ${summaryMdPath}`);
  console.log(
    `[dev-screen-verify] ok=${overallOk} auth_mode=${authMode} results=${results.length}`
  );

  if (!overallOk) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  // Never echo credential-like substrings
  console.error(`[dev-screen-verify] FATAL: ${msg}`);
  process.exitCode = 1;
});
