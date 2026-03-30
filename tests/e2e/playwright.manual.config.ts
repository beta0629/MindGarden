// @ts-ignore - 서버는 미리 띄워 둔 상태에서 테스트만 실행 (webServer 없음)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'test-reports/playwright-report' }]],
  use: {
    baseURL: (process as any).env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  timeout: 60000,
});
