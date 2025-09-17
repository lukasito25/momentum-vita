import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Cleanup any test data or resources
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the app for cleanup
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5175');

    // Clean up any test data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('Global teardown completed successfully');
  } catch (error) {
    console.error('Global teardown failed:', error);
  } finally {
    await browser.close();
  }
}

export default globalTeardown;