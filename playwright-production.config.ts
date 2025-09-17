import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for testing the live production deployment
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/production',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/production-html' }],
    ['json', { outputFile: 'test-results/production-results.json' }],
    ['junit', { outputFile: 'test-results/production-junit.xml' }],
    ['line']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://momentum-vita.vercel.app',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Global test timeout */
    actionTimeout: 30000,
    navigationTimeout: 60000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    /* Test against mobile viewports. */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    /* Test against tablet viewports */
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },
    /* High DPI displays */
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: './tests/production/global-setup.ts',
  globalTeardown: './tests/production/global-teardown.ts',

  /* Test timeout */
  timeout: 120000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 30000
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/production-artifacts'
});