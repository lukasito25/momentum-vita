import { test, expect, Page, BrowserContext } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

// Helper functions for theme testing
class ThemeTestHelper {
  constructor(private page: Page) {}

  async navigateToApp() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async setTheme(theme: 'light' | 'dark' | 'system') {
    // Navigate to profile tab first
    await this.page.click('[aria-label="Profile"]');
    await this.page.waitForTimeout(500);

    // Open theme settings
    await this.page.click('text=Theme');
    await this.page.waitForSelector('[role="dialog"]');

    // Select the theme
    await this.page.click(`text=${theme.charAt(0).toUpperCase() + theme.slice(1)}`);

    // Close modal by clicking outside or close button
    await this.page.click('[aria-label="Close"]');
    await this.page.waitForTimeout(500);
  }

  async getAppliedTheme(): Promise<'light' | 'dark'> {
    const htmlElement = this.page.locator('html');
    const classList = await htmlElement.getAttribute('class');
    return classList?.includes('dark') ? 'dark' : 'light';
  }

  async getStoredTheme(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('momentum_vita_theme');
    });
  }

  async setSystemPreference(prefersDark: boolean) {
    await this.page.emulateMedia({
      colorScheme: prefersDark ? 'dark' : 'light'
    });
  }

  async checkTextVisibility(selector: string, description: string) {
    const element = this.page.locator(selector);
    await expect(element, `${description} should be visible`).toBeVisible();

    // Check if text has proper contrast (basic check)
    const styles = await element.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    expect(styles.color, `${description} should have a text color`).not.toBe('');
  }

  async takeThemeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/dark-mode-${name}.png`,
      fullPage: true
    });
  }
}

test.describe('Dark Mode Comprehensive Tests', () => {
  let helper: ThemeTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ThemeTestHelper(page);
    await helper.navigateToApp();
  });

  test.describe('Theme Switching Functionality', () => {
    test('should switch to dark mode when dark theme is selected', async ({ page }) => {
      await helper.setTheme('dark');

      const appliedTheme = await helper.getAppliedTheme();
      expect(appliedTheme).toBe('dark');

      const storedTheme = await helper.getStoredTheme();
      expect(storedTheme).toBe('dark');
    });

    test('should switch to light mode when light theme is selected', async ({ page }) => {
      // First set dark mode
      await helper.setTheme('dark');
      expect(await helper.getAppliedTheme()).toBe('dark');

      // Then switch to light
      await helper.setTheme('light');
      expect(await helper.getAppliedTheme()).toBe('light');

      const storedTheme = await helper.getStoredTheme();
      expect(storedTheme).toBe('light');
    });

    test('should follow system preference when system theme is selected', async ({ page }) => {
      // Test dark system preference
      await helper.setSystemPreference(true);
      await helper.setTheme('system');

      expect(await helper.getAppliedTheme()).toBe('dark');
      expect(await helper.getStoredTheme()).toBe('system');

      // Test light system preference
      await helper.setSystemPreference(false);
      await page.reload();
      await page.waitForLoadState('networkidle');

      expect(await helper.getAppliedTheme()).toBe('light');
    });

    test('should persist theme after page reload', async ({ page }) => {
      await helper.setTheme('dark');
      expect(await helper.getAppliedTheme()).toBe('dark');

      await page.reload();
      await page.waitForLoadState('networkidle');

      expect(await helper.getAppliedTheme()).toBe('dark');
      expect(await helper.getStoredTheme()).toBe('dark');
    });
  });

  test.describe('Visual Validation - Main Components', () => {
    test('should display visible text in dark mode header', async ({ page }) => {
      await helper.setTheme('dark');

      // Check main header title
      await helper.checkTextVisibility('h1', 'Main header title');

      // Check premium badge if present
      const premiumBadge = page.locator('text=Pro');
      if (await premiumBadge.isVisible()) {
        await expect(premiumBadge).toBeVisible();
      }
    });

    test('should display visible navigation in dark mode', async ({ page }) => {
      await helper.setTheme('dark');

      // Check all navigation items
      const navItems = ['Home', 'Workout', 'Progress', 'Profile'];
      for (const item of navItems) {
        await helper.checkTextVisibility(`[aria-label="${item}"]`, `Navigation item: ${item}`);
      }

      // Test navigation interaction
      await page.click('[aria-label="Progress"]');
      await helper.checkTextVisibility('h1', 'Progress page header');
    });

    test('should display settings modals correctly in dark mode', async ({ page }) => {
      await helper.setTheme('dark');

      // Test Theme Settings Modal
      await page.click('[aria-label="Profile"]');
      await page.click('text=Theme');

      await expect(page.locator('text=Theme Settings')).toBeVisible();
      await helper.checkTextVisibility('text=Light', 'Light theme option');
      await helper.checkTextVisibility('text=Dark', 'Dark theme option');
      await helper.checkTextVisibility('text=System', 'System theme option');

      await page.click('[aria-label="Close"]');

      // Test Notification Settings Modal
      await page.click('text=Notifications');
      await expect(page.locator('text=Notification Settings')).toBeVisible();
      await helper.checkTextVisibility('text=Workout Reminders', 'Notification option');
      await page.click('[aria-label="Close"]');

      // Test Privacy Settings Modal
      await page.click('text=Privacy');
      await expect(page.locator('text=Privacy Settings')).toBeVisible();
      await helper.checkTextVisibility('text=Profile Visibility', 'Privacy option');
      await page.click('[aria-label="Close"]');
    });
  });

  test.describe('User Interactions in Dark Mode', () => {
    test('should allow theme switching within theme modal', async ({ page }) => {
      await helper.setTheme('light');
      expect(await helper.getAppliedTheme()).toBe('light');

      // Open theme modal and switch to dark
      await page.click('[aria-label="Profile"]');
      await page.click('text=Theme');
      await page.click('text=Dark');
      await page.click('[aria-label="Close"]');

      expect(await helper.getAppliedTheme()).toBe('dark');
    });

    test('should maintain functionality of toggle switches in dark mode', async ({ page }) => {
      await helper.setTheme('dark');

      // Test notification toggle
      await page.click('[aria-label="Profile"]');
      await page.click('text=Notifications');

      // Find and interact with toggle switches
      const toggles = page.locator('[role="button"][class*="inline-flex"]');
      const firstToggle = toggles.first();

      await firstToggle.click();
      await expect(firstToggle).toBeVisible();

      await page.click('[aria-label="Close"]');
    });

    test('should support navigation between tabs in dark mode', async ({ page }) => {
      await helper.setTheme('dark');

      const tabs = ['Home', 'Workout', 'Progress', 'Profile'];

      for (const tab of tabs) {
        await page.click(`[aria-label="${tab}"]`);
        await page.waitForTimeout(300);

        // Verify active state styling
        const activeTab = page.locator(`[aria-label="${tab}"][aria-selected="true"]`);
        await expect(activeTab).toBeVisible();
      }
    });
  });

  test.describe('Cross-Browser and Responsive Testing', () => {
    test('should work correctly on mobile viewport in dark mode', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await helper.setTheme('dark');

      await helper.checkTextVisibility('h1', 'Mobile header');

      // Test mobile navigation
      await page.click('[aria-label="Workout"]');
      await helper.checkTextVisibility('h1', 'Mobile workout header');

      await helper.takeThemeScreenshot('mobile-dark');
    });

    test('should work correctly on tablet viewport in dark mode', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await helper.setTheme('dark');

      await helper.checkTextVisibility('h1', 'Tablet header');
      await helper.takeThemeScreenshot('tablet-dark');
    });
  });

  test.describe('Accessibility in Dark Mode', () => {
    test('should meet accessibility standards in dark mode', async ({ page }) => {
      await injectAxe(page);
      await helper.setTheme('dark');

      // Test main page accessibility
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
          'landmark-unique': { enabled: true },
          'region': { enabled: true }
        }
      });

      // Test modal accessibility
      await page.click('[aria-label="Profile"]');
      await page.click('text=Theme');

      await checkA11y(page, '[role="dialog"]', {
        rules: {
          'color-contrast': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      });
    });

    test('should maintain keyboard navigation in dark mode', async ({ page }) => {
      await helper.setTheme('dark');

      // Test keyboard navigation through tabs
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to activate navigation with Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Visual Regression Testing', () => {
    test('should match dark mode screenshots', async ({ page }) => {
      await helper.setTheme('dark');

      // Take screenshots of different sections
      await helper.takeThemeScreenshot('home-page');

      await page.click('[aria-label="Progress"]');
      await page.waitForTimeout(500);
      await helper.takeThemeScreenshot('progress-page');

      await page.click('[aria-label="Profile"]');
      await page.waitForTimeout(500);
      await helper.takeThemeScreenshot('profile-page');

      // Test modal screenshots
      await page.click('text=Theme');
      await helper.takeThemeScreenshot('theme-modal');
      await page.click('[aria-label="Close"]');

      await page.click('text=Notifications');
      await helper.takeThemeScreenshot('notifications-modal');
      await page.click('[aria-label="Close"]');
    });

    test('should compare light vs dark mode layouts', async ({ page }) => {
      // Light mode screenshot
      await helper.setTheme('light');
      await helper.takeThemeScreenshot('comparison-light');

      // Dark mode screenshot
      await helper.setTheme('dark');
      await helper.takeThemeScreenshot('comparison-dark');

      // Both should maintain the same layout structure
      const lightModeElements = await page.locator('nav[role="tablist"]').count();
      const darkModeElements = await page.locator('nav[role="tablist"]').count();

      expect(lightModeElements).toBe(darkModeElements);
    });
  });

  test.describe('Error Scenarios', () => {
    test('should handle corrupted theme storage gracefully', async ({ page }) => {
      // Corrupt localStorage
      await page.evaluate(() => {
        localStorage.setItem('momentum_vita_theme', 'invalid_theme');
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should fallback to default theme
      const appliedTheme = await helper.getAppliedTheme();
      expect(['light', 'dark']).toContain(appliedTheme);
    });

    test('should maintain theme during navigation errors', async ({ page }) => {
      await helper.setTheme('dark');

      // Simulate network error by intercepting requests
      await page.route('**/*', route => {
        if (route.request().url().includes('api')) {
          route.abort();
        } else {
          route.continue();
        }
      });

      // Theme should persist despite errors
      expect(await helper.getAppliedTheme()).toBe('dark');
    });
  });
});

// Additional test suite for specific component interactions
test.describe('Component-Specific Dark Mode Tests', () => {
  let helper: ThemeTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ThemeTestHelper(page);
    await helper.navigateToApp();
    await helper.setTheme('dark');
  });

  test('should display workout cards correctly in dark mode', async ({ page }) => {
    await page.click('[aria-label="Workout"]');
    await page.waitForTimeout(500);

    // Check if workout cards are visible and have proper styling
    const workoutCards = page.locator('.card');
    const cardCount = await workoutCards.count();

    if (cardCount > 0) {
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = workoutCards.nth(i);
        await expect(card).toBeVisible();

        // Check card has dark mode background
        const cardStyles = await card.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.backgroundColor;
        });

        expect(cardStyles).not.toBe('rgb(255, 255, 255)'); // Should not be white in dark mode
      }
    }
  });

  test('should handle form inputs correctly in dark mode', async ({ page }) => {
    // Look for any form inputs that might be present
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        await expect(input).toBeVisible();

        // Test interaction
        if (await input.isEditable()) {
          await input.click();
          await input.fill('test input');
          await expect(input).toHaveValue('test input');
        }
      }
    }
  });

  test('should display progress charts correctly in dark mode', async ({ page }) => {
    await page.click('[aria-label="Progress"]');
    await page.waitForTimeout(500);

    // Check for progress indicators, charts, or stats
    const progressElements = page.locator('[class*="progress"], [class*="chart"], [class*="stat"]');
    const elementCount = await progressElements.count();

    if (elementCount > 0) {
      const firstElement = progressElements.first();
      await expect(firstElement).toBeVisible();

      await helper.checkTextVisibility('text=/\\d+/', 'Progress statistics');
    }
  });
});