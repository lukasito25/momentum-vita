import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for app to load completely
   */
  async waitForAppLoad() {
    // Wait for the main app container
    await this.page.waitForSelector('[data-testid="training-program"]', { timeout: 30000 });

    // Wait for any loading screens to disappear
    await this.page.waitForFunction(() => {
      const loadingScreen = document.querySelector('[data-testid="loading-screen"]');
      return !loadingScreen || loadingScreen.style.display === 'none';
    }, { timeout: 30000 });

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear all application data
   */
  async clearAppData() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await this.page.reload();
    await this.waitForAppLoad();
  }

  /**
   * Set up test data for a specific program
   */
  async setupTestProgram(programId: string) {
    await this.page.evaluate((id) => {
      localStorage.setItem('currentProgramId', id);
      localStorage.setItem('currentWeek', '1');
    }, programId);
    await this.page.reload();
    await this.waitForAppLoad();
  }

  /**
   * Wait for timer popup to appear
   */
  async waitForTimerPopup() {
    await this.page.waitForSelector('[data-testid="timer-popup"]', { timeout: 10000 });
  }

  /**
   * Close timer popup if open
   */
  async closeTimerPopup() {
    const timerPopup = this.page.locator('[data-testid="timer-popup"]');
    if (await timerPopup.isVisible()) {
      await this.page.click('[data-testid="timer-close"]');
      await timerPopup.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Check if element has specific classes
   */
  async hasClasses(selector: string, classes: string[]) {
    const element = this.page.locator(selector);
    const className = await element.getAttribute('class');
    return classes.every(cls => className?.includes(cls));
  }

  /**
   * Get element text content safely
   */
  async getTextContent(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    return await element.textContent() || '';
  }

  /**
   * Wait for database sync (simulate network delay)
   */
  async waitForDatabaseSync() {
    await this.page.waitForTimeout(1000); // Allow time for database operations
  }

  /**
   * Check for console errors
   */
  async checkConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  /**
   * Simulate mobile viewport
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Simulate tablet viewport
   */
  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  /**
   * Simulate desktop viewport
   */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1440, height: 900 });
  }

  /**
   * Check if network requests are being made
   */
  async monitorNetworkRequests() {
    const requests: string[] = [];
    this.page.on('request', request => {
      requests.push(request.url());
    });
    return requests;
  }

  /**
   * Simulate offline mode
   */
  async goOffline() {
    await this.page.context().setOffline(true);
  }

  /**
   * Restore online mode
   */
  async goOnline() {
    await this.page.context().setOffline(false);
  }

  /**
   * Wait for specific text to appear
   */
  async waitForText(text: string, timeout = 10000) {
    await this.page.waitForFunction(
      (searchText) => document.body.textContent?.includes(searchText),
      text,
      { timeout }
    );
  }

  /**
   * Check accessibility violations
   */
  async checkAccessibility() {
    // This would require @axe-core/playwright integration
    // For now, we'll do basic checks
    const missingAltTags = await this.page.locator('img:not([alt])').count();
    const missingLabels = await this.page.locator('input:not([aria-label]):not([aria-labelledby])').count();

    return {
      missingAltTags,
      missingLabels,
      hasTitle: await this.page.title() !== '',
      hasLang: await this.page.locator('html[lang]').count() > 0
    };
  }
}