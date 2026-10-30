import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const localChrome = process.platform === 'darwin'
  && existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');

export default defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.ts',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['json', {outputFile:'artifacts/browser-results.json'}], ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }]],
  outputDir: 'artifacts/browser-results',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    ...devices['Desktop Chrome'],
    colorScheme: 'light',
    locale: 'ko-KR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{name:'chromium',use:{browserName:'chromium',channel:process.env.PLAYWRIGHT_CHANNEL || (localChrome?'chrome':undefined)}}, ...(process.env.INCLUDE_WEBKIT==='1'?[{name:'webkit',use:{browserName:'webkit' as const,channel:undefined}}]:[])],
  webServer: {
    command: 'node server/index.mjs',
    url: 'http://127.0.0.1:5173/api/questions',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
