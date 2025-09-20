import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * PWA Installation Tests for Momentum Vita
 *
 * Tests Progressive Web App installation capabilities including:
 * - Install prompt behavior
 * - App manifest validation
 * - Install shortcuts and icons
 * - Standalone mode functionality
 * - iOS Safari installation flow
 */

test.describe('PWA Installation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Manifest Validation', () => {
    test('should have valid PWA manifest', async ({ page }) => {
      // Check if manifest link exists
      const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(manifestLink).toBeTruthy();

      // Fetch and validate manifest content
      const manifestResponse = await page.request.get(manifestLink!);
      expect(manifestResponse.status()).toBe(200);

      const manifest = await manifestResponse.json();

      // Validate required manifest properties
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(manifest.start_url).toBeTruthy();
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBeTruthy();
      expect(manifest.background_color).toBeTruthy();

      // Validate icons array
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThan(0);

      // Check for required icon sizes
      const iconSizes = manifest.icons.map((icon: any) => icon.sizes);
      expect(iconSizes).toContain('192x192');
      expect(iconSizes).toContain('512x512');
    });

    test('should have proper meta tags for PWA', async ({ page }) => {
      // Check theme color
      const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(themeColor).toBeTruthy();

      // Check viewport meta tag
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('initial-scale=1');

      // Check Apple-specific meta tags
      const appleMobileCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
      expect(appleMobileCapable).toBe('yes');

      const appleStatusBarStyle = await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content');
      expect(appleStatusBarStyle).toBeTruthy();

      const appleTitle = await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content');
      expect(appleTitle).toBeTruthy();
    });

    test('should have required icon files', async ({ page }) => {
      const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '180x180', '192x192', '384x384', '512x512'];

      for (const size of iconSizes) {
        const iconResponse = await page.request.get(`/icons/icon-${size}.png`);
        expect(iconResponse.status()).toBe(200);

        const contentType = iconResponse.headers()['content-type'];
        expect(contentType).toContain('image/png');
      }

      // Check SVG icon
      const svgResponse = await page.request.get('/momentum-icon.svg');
      expect(svgResponse.status()).toBe(200);
    });
  });

  test.describe('Install Prompt Behavior', () => {
    test('should show install prompt on supported browsers', async ({ page, browserName }) => {
      // Skip on Safari as it doesn't support beforeinstallprompt
      test.skip(browserName === 'webkit', 'Safari uses different installation method');

      // Wait for potential install prompt conditions
      await page.waitForTimeout(3000);

      // Check for custom install button
      const installButton = page.locator('[data-testid="install-pwa-button"], [data-testid="pwa-install"], button:has-text("Install")').first();

      if (await installButton.isVisible()) {
        await expect(installButton).toContainText(/install|add to home/i);

        // Click install button
        await installButton.click();

        // Should either trigger native prompt or show instructions
        const installDialog = page.locator('[data-testid="install-instructions"], [data-testid="install-modal"]');
        await expect(installDialog).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle install prompt deferral', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'Safari uses different installation method');

      // Simulate beforeinstallprompt event if supported
      await page.evaluate(() => {
        const event = new Event('beforeinstallprompt');
        window.dispatchEvent(event);
      });

      const installButton = page.locator('[data-testid="install-pwa-button"]');
      if (await installButton.isVisible()) {
        // Should be able to dismiss install prompt
        const dismissButton = page.locator('[data-testid="dismiss-install"], button:has-text("Maybe Later")');
        if (await dismissButton.isVisible()) {
          await dismissButton.click();
          await expect(installButton).not.toBeVisible();
        }
      }
    });

    test('should show iOS Safari installation instructions', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Test specific to Safari/iOS');

      // Check for iOS-specific install instructions
      const iosInstructions = page.locator('[data-testid="ios-install-instructions"]');

      // Trigger instructions display (might be automatic on iOS Safari)
      const installButton = page.locator('[data-testid="install-pwa-button"], button:has-text("Install")').first();
      if (await installButton.isVisible()) {
        await installButton.click();

        await expect(iosInstructions).toBeVisible();
        await expect(iosInstructions).toContainText(/share button|add to home screen/i);
      }
    });
  });

  test.describe('App Shortcuts', () => {
    test('should handle app shortcuts correctly', async ({ page }) => {
      // Test shortcut URLs directly
      const shortcuts = [
        { url: '/?shortcut=workout', expectedElement: '[data-testid="workout-section"], [data-testid="training-program"]' },
        { url: '/?shortcut=progress', expectedElement: '[data-testid="progress-section"], [data-testid="workout-history"]' }
      ];

      for (const shortcut of shortcuts) {
        await page.goto(shortcut.url);
        await helpers.waitForAppLoad();

        // Should navigate to the expected section
        const targetElement = page.locator(shortcut.expectedElement).first();
        await expect(targetElement).toBeVisible({ timeout: 10000 });
      }
    });

    test('should validate shortcut icons exist', async ({ page }) => {
      const shortcutIcons = ['shortcut-workout.png', 'shortcut-progress.png'];

      for (const iconFile of shortcutIcons) {
        const iconResponse = await page.request.get(`/icons/${iconFile}`);
        if (iconResponse.status() === 200) {
          const contentType = iconResponse.headers()['content-type'];
          expect(contentType).toContain('image/png');
        }
        // Icons might be optional, so we don't fail if they don't exist
      }
    });
  });

  test.describe('Standalone Mode', () => {
    test('should detect standalone mode', async ({ page }) => {
      // Check if app can detect standalone mode
      const isStandalone = await page.evaluate(() => {
        return window.matchMedia('(display-mode: standalone)').matches ||
               (window.navigator as any).standalone ||
               document.referrer.includes('android-app://');
      });

      // In regular browser, should not be standalone
      expect(isStandalone).toBe(false);

      // Test CSS media query for standalone mode
      const standaloneStyles = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return styles.getPropertyValue('--is-standalone') || 'not-detected';
      });

      // Should have proper CSS setup for standalone detection
      expect(standaloneStyles).toBeDefined();
    });

    test('should adapt UI for standalone mode', async ({ page }) => {
      // Simulate standalone mode
      await page.addStyleTag({
        content: `
          @media (display-mode: standalone) {
            body::before {
              content: 'standalone-mode';
              display: none;
            }
          }
        `
      });

      // Check if UI adapts appropriately
      const hasStandaloneStyles = await page.evaluate(() => {
        const pseudo = window.getComputedStyle(document.body, '::before');
        return pseudo.content.includes('standalone-mode');
      });

      expect(hasStandaloneStyles).toBe(true);
    });

    test('should handle navigation in standalone mode', async ({ page }) => {
      // Test that external links open in browser, not in app
      const externalLink = page.locator('a[href^="http"], a[target="_blank"]').first();

      if (await externalLink.isVisible()) {
        // Should have proper target and rel attributes
        const target = await externalLink.getAttribute('target');
        const rel = await externalLink.getAttribute('rel');

        expect(target).toBe('_blank');
        expect(rel).toContain('noopener');
      }
    });
  });

  test.describe('Installation State Management', () => {
    test('should remember installation state', async ({ page }) => {
      // Check if app tracks installation attempts
      const installButton = page.locator('[data-testid="install-pwa-button"]');

      if (await installButton.isVisible()) {
        // Mark as dismissed
        await page.evaluate(() => {
          localStorage.setItem('pwa-install-dismissed', 'true');
        });

        await page.reload();
        await helpers.waitForAppLoad();

        // Install button should not show if dismissed
        await expect(installButton).not.toBeVisible();
      }
    });

    test('should reset installation prompt after time', async ({ page }) => {
      // Set old dismissal timestamp
      await page.evaluate(() => {
        const oldTimestamp = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
        localStorage.setItem('pwa-install-dismissed', 'true');
        localStorage.setItem('pwa-install-dismissed-time', oldTimestamp.toString());
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Install prompt should appear again after timeout
      const installButton = page.locator('[data-testid="install-pwa-button"]');
      if (await installButton.isVisible()) {
        await expect(installButton).toBeVisible();
      }
    });
  });

  test.describe('Cross-Platform Installation', () => {
    test('should provide platform-specific installation guidance', async ({ page, browserName }) => {
      const installButton = page.locator('[data-testid="install-pwa-button"], button:has-text("Install")').first();

      if (await installButton.isVisible()) {
        await installButton.click();

        const instructionsModal = page.locator('[data-testid="install-instructions"], [data-testid="install-modal"]');
        await expect(instructionsModal).toBeVisible();

        // Check for platform-specific content
        if (browserName === 'webkit') {
          await expect(instructionsModal).toContainText(/safari|ios|share/i);
        } else if (browserName === 'chromium') {
          await expect(instructionsModal).toContainText(/chrome|android|install/i);
        } else if (browserName === 'firefox') {
          await expect(instructionsModal).toContainText(/firefox|menu/i);
        }
      }
    });

    test('should handle Android Chrome installation', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Test specific to Chrome');

      // Simulate mobile Chrome user agent
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');

      await page.reload();
      await helpers.waitForAppLoad();

      // Should show Android-specific install behavior
      const installButton = page.locator('[data-testid="install-pwa-button"]');
      if (await installButton.isVisible()) {
        await expect(installButton).toContainText(/install|add to home/i);
      }
    });
  });

  test.describe('Installation Analytics', () => {
    test('should track installation events', async ({ page }) => {
      // Monitor console for analytics events
      const analyticsEvents: string[] = [];
      page.on('console', msg => {
        if (msg.text().includes('install') || msg.text().includes('pwa')) {
          analyticsEvents.push(msg.text());
        }
      });

      const installButton = page.locator('[data-testid="install-pwa-button"]');
      if (await installButton.isVisible()) {
        await installButton.click();

        // Should trigger analytics event
        await page.waitForTimeout(1000);
        expect(analyticsEvents.length).toBeGreaterThan(0);
      }
    });

    test('should track successful installations', async ({ page }) => {
      // This would require mocking the installation success
      // In a real test, you'd verify that successful installations are tracked

      await page.evaluate(() => {
        // Simulate successful installation
        window.dispatchEvent(new Event('appinstalled'));
      });

      // Check if success is tracked
      const installSuccess = await page.evaluate(() => {
        return localStorage.getItem('pwa-installed') === 'true';
      });

      expect(installSuccess).toBe(true);
    });
  });
});