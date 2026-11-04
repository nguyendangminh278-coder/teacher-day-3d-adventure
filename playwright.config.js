import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 60000, workers: 1, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:8124', viewport: { width: 1672, height: 941 },
    channel: process.platform === 'win32' ? 'chrome' : undefined },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:8124', reuseExistingServer: !process.env.CI },
});
