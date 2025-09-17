import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the app and perform any necessary setup
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5175');

    // Wait for the app to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Clear any existing data for clean testing
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('Global setup completed successfully');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;