// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { defineConfig, devices } from '@playwright/test';

const baseURL = (process as any).env.BASE_URL || 'http://localhost:3000';
const isLocalhost = (() => {
  try {
    return new URL(baseURL).hostname === 'localhost';
  } catch {
    return true;
  }
})();

/**
 * Playwright 설정
 * 화면 입력 없이 자동으로 E2E 테스트를 실행합니다.
 * BASE_URL이 localhost가 아닐 때(원격 개발 서버)는 webServer를 사용하지 않습니다.
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

  // localhost일 때만 webServer 사용. 원격 URL일 때는 기동하지 않음(Process exited early 방지).
  ...(isLocalhost
    ? {
        webServer: {
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120 * 1000,
        },
      }
    : {}),
});

