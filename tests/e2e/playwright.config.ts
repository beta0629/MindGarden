// localhost, 127.0.0.1, ::1 은 로컬 개발으로 간주하여 BASE_URL이 이들일 때 webServer(npm start)를 켭니다.
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const frontendRoot = path.resolve(__dirname, '../../frontend');

const LOCAL_DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const baseURL = (process as any).env.BASE_URL || 'http://localhost:3000';
const isLocalhost = (() => {
  try {
    return LOCAL_DEV_HOSTNAMES.has(new URL(baseURL).hostname);
  } catch {
    return true;
  }
})();

/**
 * Playwright 설정
 * 화면 입력 없이 자동으로 E2E 테스트를 실행합니다.
 * BASE_URL 호스트가 localhost / 127.0.0.1 / ::1 이 아닐 때(원격 개발 서버)는 webServer를 사용하지 않습니다.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!(process as any).env.CI,
  retries: (process as any).env.CI ? 2 : 0,
  workers: (process as any).env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-reports/playwright-report' }],
    ['json', { outputFile: 'test-reports/playwright-results.json' }],
    ['list']
  ],
  use: {
    baseURL: baseURL as string,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // 로컬 호스트(localhost·127.0.0.1·::1)일 때만 webServer 사용. 원격 URL일 때는 기동하지 않음(Process exited early 방지).
  ...(isLocalhost
    ? {
        webServer: {
          command: 'npm start',
          cwd: frontendRoot,
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120 * 1000,
        },
      }
    : {}),
});

