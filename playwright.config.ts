import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.HUB_E2E_PORT ?? 4170)
// One real thenwise server for the whole run (e2e/setup.ts). Tests run one after another and keep to their own data.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/setup.ts',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
