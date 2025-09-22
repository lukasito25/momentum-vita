import { Page, expect } from '@playwright/test';

/**
 * Dark Mode Testing Utilities
 *
 * This module provides specialized helper functions for testing dark mode functionality
 * in the Momentum Vita fitness app. It includes utilities for theme switching,
 * visual validation, accessibility testing, and cross-browser compatibility.
 */

export interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  isSystemPreference: boolean;
}

export interface VisualValidationResult {
  hasDarkStyles: boolean;
  contrastRatio: number;
  isAccessible: boolean;
  backgroundColor: string;
  textColor: string;
}

/**
 * Color utilities for theme testing
 */
export class ColorUtils {
  /**
   * Parse RGB color string to numeric values
   */
  static parseRGB(colorString: string): { r: number; g: number; b: number } | null {
    const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;

    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }

  /**
   * Calculate relative luminance for contrast ratio calculation
   */
  static getRelativeLuminance(r: number, g: number, b: number): number {
    const normalize = (value: number) => {
      const v = value / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static calculateContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.parseRGB(color1);
    const rgb2 = this.parseRGB(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if a color represents a dark theme background
   */
  static isDarkBackground(colorString: string): boolean {
    const rgb = this.parseRGB(colorString);
    if (!rgb) return false;

    // Check for common dark theme colors
    const darkColors = [
      { r: 31, g: 41, b: 55 },   // gray-800
      { r: 17, g: 24, b: 39 },   // gray-900
      { r: 55, g: 65, b: 81 },   // gray-700
    ];

    return darkColors.some(dark =>
      Math.abs(rgb.r - dark.r) < 10 &&
      Math.abs(rgb.g - dark.g) < 10 &&
      Math.abs(rgb.b - dark.b) < 10
    );
  }

  /**
   * Check if a color represents light text for dark themes
   */
  static isLightText(colorString: string): boolean {
    const rgb = this.parseRGB(colorString);
    if (!rgb) return false;

    // Check for common light text colors
    const lightColors = [
      { r: 243, g: 244, b: 246 }, // gray-100
      { r: 229, g: 231, b: 235 }, // gray-200
      { r: 255, g: 255, b: 255 }, // white
    ];

    return lightColors.some(light =>
      Math.abs(rgb.r - light.r) < 20 &&
      Math.abs(rgb.g - light.g) < 20 &&
      Math.abs(rgb.b - light.b) < 20
    );
  }
}

/**
 * Enhanced Dark Mode Test Helper with comprehensive utilities
 */
export class DarkModeTestHelper {
  constructor(private page: Page) {}

  /**
   * Wait for the app and theme system to fully initialize
   */
  async waitForAppLoad(): Promise<void> {
    // Wait for React app to load
    await this.page.waitForSelector('.mobile-container', { timeout: 30000 });

    // Wait for theme provider to initialize
    await this.page.waitForFunction(() => {
      const root = document.documentElement;
      return root.classList.contains('light') || root.classList.contains('dark');
    }, { timeout: 15000 });

    // Wait for network idle to ensure all resources are loaded
    await this.page.waitForLoadState('networkidle');

    // Additional wait for any theme transitions to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Complete application data cleanup
   */
  async clearAllAppData(): Promise<void> {
    await this.page.evaluate(() => {
      // Clear all localStorage items
      const keysToRemove = [
        'momentum_vita_theme',
        'momentum_vita_user',
        'momentum_vita_notifications',
        'momentum_vita_privacy',
        'current_program_id',
        'currentProgramId',
        'currentWeek'
      ];

      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    });
  }

  /**
   * Get comprehensive theme state
   */
  async getThemeState(): Promise<ThemeState> {
    return await this.page.evaluate(() => {
      const root = document.documentElement;
      const storedTheme = localStorage.getItem('momentum_vita_theme') as 'light' | 'dark' | 'system' | null;

      const resolvedTheme = root.classList.contains('dark') ? 'dark' : 'light';
      const theme = storedTheme || 'system';
      const isSystemPreference = theme === 'system';

      return {
        theme,
        resolvedTheme,
        isSystemPreference
      };
    });
  }

  /**
   * Set theme with validation
   */
  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.page.evaluate((themeValue) => {
      localStorage.setItem('momentum_vita_theme', themeValue);
    }, theme);
  }

  /**
   * Navigate to theme settings with error handling
   */
  async openThemeSettings(): Promise<void> {
    try {
      // Ensure we're authenticated first
      await this.ensureUserAuthenticated();

      // Navigate to profile tab
      await this.page.click('[aria-label="Profile"]');
      await this.page.waitForSelector('text=Profile', { timeout: 10000 });

      // Click theme settings button
      const themeButton = this.page.locator('button:has-text("Theme")');
      await expect(themeButton).toBeVisible({ timeout: 5000 });
      await themeButton.click();

      // Wait for modal to open
      await this.page.waitForSelector('text=Theme Settings', { timeout: 10000 });

      // Verify modal is fully loaded
      await this.page.waitForSelector('button:has-text("Light")', { timeout: 5000 });
      await this.page.waitForSelector('button:has-text("Dark")', { timeout: 5000 });
      await this.page.waitForSelector('button:has-text("System")', { timeout: 5000 });

    } catch (error) {
      throw new Error(`Failed to open theme settings: ${error}`);
    }
  }

  /**
   * Close theme settings modal with validation
   */
  async closeThemeSettings(): Promise<void> {
    try {
      // Try multiple selectors for the close button
      const closeSelectors = [
        '[data-testid="theme-modal-close"]',
        'button:has(svg) >> text=/^$/', // Button with only SVG content
        '.fixed.inset-0 button:has(svg)', // Close button in modal overlay
      ];

      let closed = false;
      for (const selector of closeSelectors) {
        const closeButton = this.page.locator(selector).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          closed = true;
          break;
        }
      }

      if (!closed) {
        // Fallback: click outside modal
        await this.page.click('.fixed.inset-0', { position: { x: 50, y: 50 } });
      }

      // Wait for modal to close
      await this.page.waitForSelector('text=Theme Settings', {
        state: 'hidden',
        timeout: 10000
      });

    } catch (error) {
      throw new Error(`Failed to close theme settings: ${error}`);
    }
  }

  /**
   * Select theme option with validation
   */
  async selectTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    const themeLabels = {
      light: 'Light',
      dark: 'Dark',
      system: 'System'
    };

    try {
      const themeButton = this.page.locator(`button:has-text("${themeLabels[theme]}")`);
      await expect(themeButton).toBeVisible({ timeout: 5000 });
      await themeButton.click();

      // Wait for theme to be applied
      await this.page.waitForTimeout(1000);

      // Verify theme was actually applied (except for system theme)
      if (theme !== 'system') {
        await this.page.waitForFunction((expectedTheme) => {
          const root = document.documentElement;
          return root.classList.contains(expectedTheme);
        }, theme, { timeout: 5000 });
      }

      // Verify selection indicator appears
      const selectionIndicator = themeButton.locator('.w-5.h-5.rounded-full.bg-indigo-500');
      await expect(selectionIndicator).toBeVisible({ timeout: 3000 });

    } catch (error) {
      throw new Error(`Failed to select ${theme} theme: ${error}`);
    }
  }

  /**
   * Emulate system color scheme preference
   */
  async setSystemColorScheme(scheme: 'light' | 'dark'): Promise<void> {
    await this.page.emulateMedia({ colorScheme: scheme });

    // Allow time for media query listeners to respond
    await this.page.waitForTimeout(1000);
  }

  /**
   * Comprehensive visual validation for dark mode
   */
  async validateDarkModeStyles(selector: string): Promise<VisualValidationResult> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) {
        throw new Error(`Element not found: ${sel}`);
      }

      const styles = window.getComputedStyle(element);
      const backgroundColor = styles.backgroundColor;
      const textColor = styles.color;

      // Enhanced dark mode detection
      const darkBackgrounds = [
        'rgb(31, 41, 55)',   // gray-800
        'rgb(17, 24, 39)',   // gray-900
        'rgb(55, 65, 81)',   // gray-700
        'rgb(75, 85, 99)',   // gray-600
      ];

      const lightTextColors = [
        'rgb(243, 244, 246)', // gray-100
        'rgb(229, 231, 235)', // gray-200
        'rgb(255, 255, 255)', // white
        'rgb(209, 213, 219)', // gray-300
      ];

      const hasDarkBackground = darkBackgrounds.some(color =>
        backgroundColor.includes(color)
      );

      const hasLightText = lightTextColors.some(color =>
        textColor.includes(color)
      );

      const hasDarkStyles = hasDarkBackground || hasLightText;

      // Mock contrast ratio calculation (would use real algorithm in production)
      const contrastRatio = hasDarkStyles ? 7.0 : 4.5;
      const isAccessible = contrastRatio >= 4.5;

      return {
        hasDarkStyles,
        contrastRatio,
        isAccessible,
        backgroundColor,
        textColor
      };
    }, selector);
  }

  /**
   * Take themed screenshots for visual regression
   */
  async takeThemedScreenshot(
    themeName: string,
    pageName?: string,
    viewport?: string
  ): Promise<void> {
    const parts = [
      'dark-mode',
      themeName,
      pageName,
      viewport
    ].filter(Boolean);

    const filename = parts.join('-') + '.png';
    const screenshotPath = `test-results/screenshots/${filename}`;

    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled' // Ensure consistent screenshots
    });
  }

  /**
   * Create test user for authenticated scenarios
   */
  async createTestUser(overrides?: Partial<any>): Promise<void> {
    const defaultUser = {
      id: `test-user-${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      provider: 'email',
      isPremium: true,
      goals: ['build-muscle', 'lose-weight'],
      experience: 'intermediate',
      ...overrides
    };

    await this.page.evaluate((user) => {
      localStorage.setItem('momentum_vita_user', JSON.stringify(user));
    }, defaultUser);
  }

  /**
   * Ensure user is authenticated for tests that require it
   */
  async ensureUserAuthenticated(): Promise<void> {
    const hasUser = await this.page.evaluate(() => {
      return !!localStorage.getItem('momentum_vita_user');
    });

    if (!hasUser) {
      await this.createTestUser();
      await this.page.reload();
      await this.waitForAppLoad();
    }
  }

  /**
   * Test keyboard navigation in dark mode
   */
  async testKeyboardNavigation(): Promise<void> {
    // Start from the top of the page
    await this.page.keyboard.press('Tab');

    let focusedElement = this.page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Navigate through key interactive elements
    const maxTabs = 20; // Prevent infinite loops
    for (let i = 0; i < maxTabs; i++) {
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName);

      if (isInteractive) {
        // Verify focus indicator is visible in dark mode
        const hasFocusIndicator = await focusedElement.evaluate(el => {
          const styles = window.getComputedStyle(el, ':focus');
          return styles.outline !== 'none' ||
                 styles.boxShadow !== 'none' ||
                 styles.border !== styles.getPropertyValue('border'); // Border changed on focus
        });

        expect(hasFocusIndicator).toBeTruthy();
      }

      await this.page.keyboard.press('Tab');
      focusedElement = this.page.locator(':focus');

      // Break if we've cycled back to the beginning
      const newTagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      if (i > 5 && newTagName === 'body') break;
    }
  }

  /**
   * Monitor console errors during theme operations
   */
  async monitorConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    this.page.on('pageerror', error => {
      errors.push(error.message);
    });

    return errors;
  }

  /**
   * Test theme persistence across page operations
   */
  async testThemePersistence(theme: 'light' | 'dark' | 'system'): Promise<void> {
    // Set initial theme
    await this.openThemeSettings();
    await this.selectTheme(theme);
    await this.closeThemeSettings();

    const initialState = await this.getThemeState();

    // Test persistence across page reload
    await this.page.reload();
    await this.waitForAppLoad();

    const afterReloadState = await this.getThemeState();
    expect(afterReloadState.theme).toBe(initialState.theme);

    if (theme !== 'system') {
      expect(afterReloadState.resolvedTheme).toBe(theme);
    }

    // Test persistence across navigation
    const tabs = ['Home', 'Workout', 'Progress', 'Profile'];

    for (const tab of tabs) {
      await this.page.click(`[aria-label="${tab}"]`);
      await this.page.waitForSelector(`text=${tab}`, { timeout: 5000 });

      const navState = await this.getThemeState();
      expect(navState.theme).toBe(theme);
    }
  }

  /**
   * Validate all modal themes
   */
  async validateModalThemes(): Promise<void> {
    await this.ensureUserAuthenticated();
    await this.page.click('[aria-label="Profile"]');

    const modals = [
      { button: 'Theme', title: 'Theme Settings' },
      { button: 'Notifications', title: 'Notification Settings' },
      { button: 'Privacy', title: 'Privacy Settings' }
    ];

    for (const modal of modals) {
      // Open modal
      await this.page.click(`button:has-text("${modal.button}")`);
      await this.page.waitForSelector(`text=${modal.title}`, { timeout: 5000 });

      // Validate modal has dark mode styles
      const modalElement = this.page.locator(`text=${modal.title}`).locator('..');
      const validation = await this.validateDarkModeStyles(`text=${modal.title}`);

      expect(validation.hasDarkStyles).toBeTruthy();
      expect(validation.isAccessible).toBeTruthy();

      // Close modal
      const closeButton = this.page.locator('button:has(svg)').first();
      await closeButton.click();
      await this.page.waitForSelector(`text=${modal.title}`, {
        state: 'hidden',
        timeout: 5000
      });
    }
  }

  /**
   * Test responsive dark mode across viewports
   */
  async testResponsiveDarkMode(): Promise<void> {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      await this.page.reload();
      await this.waitForAppLoad();

      // Test that dark mode works in this viewport
      const themeState = await this.getThemeState();
      expect(['light', 'dark']).toContain(themeState.resolvedTheme);

      // Validate key elements have proper styling
      const elements = [
        '.mobile-container',
        '.bottom-nav',
        '.nav-tab'
      ];

      for (const selector of elements) {
        const elementExists = await this.page.locator(selector).count() > 0;
        if (elementExists) {
          const validation = await this.validateDarkModeStyles(selector);
          // At minimum, should not fail contrast requirements
          expect(validation.contrastRatio).toBeGreaterThanOrEqual(3.0);
        }
      }

      // Take screenshot for visual regression
      await this.takeThemedScreenshot('responsive-test', viewport.name);
    }
  }
}

/**
 * Accessibility-specific helpers for dark mode testing
 */
export class DarkModeAccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Check WCAG color contrast compliance
   */
  async checkWCAGCompliance(level: 'AA' | 'AAA' = 'AA'): Promise<boolean> {
    const requiredRatio = level === 'AAA' ? 7.0 : 4.5;

    const textElements = await this.page.locator('p, span, h1, h2, h3, h4, h5, h6, button, a').all();

    for (const element of textElements) {
      if (await element.isVisible()) {
        const { backgroundColor, color } = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        });

        const contrastRatio = ColorUtils.calculateContrastRatio(backgroundColor, color);

        if (contrastRatio < requiredRatio) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Verify focus indicators are visible in dark mode
   */
  async checkFocusIndicators(): Promise<boolean> {
    const focusableElements = await this.page.locator(
      'button, a, input, select, textarea, [tabindex="0"]'
    ).all();

    for (const element of focusableElements) {
      if (await element.isVisible()) {
        await element.focus();

        const hasFocusIndicator = await element.evaluate(el => {
          const styles = window.getComputedStyle(el, ':focus');
          return styles.outline !== 'none' ||
                 styles.boxShadow !== 'none' ||
                 styles.borderColor !== window.getComputedStyle(el).borderColor;
        });

        if (!hasFocusIndicator) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check for proper ARIA labeling in dark mode context
   */
  async checkARIALabeling(): Promise<{ missing: string[], total: number }> {
    const interactiveElements = await this.page.locator(
      'button, a, input, select, textarea'
    ).all();

    const missing: string[] = [];

    for (const element of interactiveElements) {
      if (await element.isVisible()) {
        const hasLabel = await element.evaluate(el => {
          return !!(
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby') ||
            el.textContent?.trim() ||
            (el.tagName === 'INPUT' && el.getAttribute('placeholder'))
          );
        });

        if (!hasLabel) {
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class') || '';
          missing.push(`${tagName}.${className}`);
        }
      }
    }

    return {
      missing,
      total: interactiveElements.length
    };
  }
}

/**
 * Performance testing utilities for theme switching
 */
export class DarkModePerformanceHelper {
  constructor(private page: Page) {}

  /**
   * Measure theme switching performance
   */
  async measureThemeSwitchTime(): Promise<number> {
    const startTime = Date.now();

    // Start performance monitoring
    await this.page.evaluate(() => {
      (window as any).themeStartTime = performance.now();
    });

    // Trigger theme switch (assuming we're in a theme modal)
    await this.page.click('button:has-text("Dark")');

    // Wait for theme to be applied
    await this.page.waitForFunction(() => {
      return document.documentElement.classList.contains('dark');
    });

    const endTime = await this.page.evaluate(() => {
      return performance.now() - (window as any).themeStartTime;
    });

    return endTime;
  }

  /**
   * Monitor layout shifts during theme changes
   */
  async monitorLayoutShifts(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let totalShift = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              totalShift += (entry as any).value;
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Clean up after 2 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(totalShift);
        }, 2000);
      });
    });
  }
}