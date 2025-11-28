// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정
 * 화면 입력 없이 자동으로 E2E 테스트를 실행합니다
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
    baseURL: ((process as any).env.BASE_URL || 'http://localhost:3000') as string,
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

  webServer: {
    command: 'echo "서버가 실행 중이어야 합니다. ./scripts/start-all.sh 실행 후 테스트하세요."',
    url: 'http://localhost:3000',
    reuseExistingServer: !(process as any).env.CI,
    timeout: 120 * 1000,
  },
});

