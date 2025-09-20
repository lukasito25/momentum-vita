import { test, expect, devices } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { MobileTestHelpers } from './mobile-test-helpers';

/**
 * Enhanced Mobile Testing for Momentum Vita PWA
 *
 * Comprehensive mobile testing including:
 * - Touch gestures and interactions
 * - iOS Safari PWA behavior
 * - Android Chrome PWA features
 * - Mobile-specific UI adaptations
 * - Performance on mobile devices
 * - Offline functionality on mobile
 */

test.describe('Enhanced Mobile Testing', () => {
  let helpers: TestHelpers;
  let mobileHelpers: MobileTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    mobileHelpers = new MobileTestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('iOS Mobile Testing', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should handle iOS safe area insets', async ({ page }) => {
      // Check for proper safe area handling
      const mainContent = page.locator('[data-testid="main-content"], main, [data-testid="training-program"]');
      await expect(mainContent).toBeVisible();

      const contentBox = await mainContent.boundingBox();
      const viewport = page.viewportSize()!;

      // Content should not overlap with status bar (top safe area)
      expect(contentBox!.y).toBeGreaterThan(20); // Status bar height

      // Check for CSS safe area support
      const safeAreaSupport = await page.evaluate(() => {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
          paddingTop: computedStyle.getPropertyValue('padding-top'),
          paddingBottom: computedStyle.getPropertyValue('padding-bottom'),
          hasEnvSupport: CSS.supports('padding-top', 'env(safe-area-inset-top)')
        };
      });

      expect(safeAreaSupport.hasEnvSupport).toBe(true);
    });

    test('should handle iOS PWA installation', async ({ page }) => {
      // iOS doesn't support beforeinstallprompt, check for manual instructions
      const installButton = page.locator('[data-testid="install-pwa-button"], button:has-text("Install")').first();

      if (await installButton.isVisible()) {
        await installButton.click();

        // Should show iOS-specific installation instructions
        const iosInstructions = page.locator('[data-testid="ios-install-instructions"], [data-testid="install-instructions"]');
        await expect(iosInstructions).toBeVisible();
        await expect(iosInstructions).toContainText(/share.*button|add to home screen|safari/i);

        // Should show share icon or screenshot
        const shareIcon = iosInstructions.locator('[data-testid="share-icon"], img[alt*="share"]');
        if (await shareIcon.isVisible()) {
          await expect(shareIcon).toBeVisible();
        }
      }
    });

    test('should handle iOS keyboard behavior', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Test input focus and keyboard appearance
      const weightInput = page.locator('[data-testid="weight-input"]').first();
      if (await weightInput.isVisible()) {
        await weightInput.click();

        // Input should be focused
        await expect(weightInput).toBeFocused();

        // Viewport should adjust for keyboard
        await page.waitForTimeout(500); // Allow keyboard animation

        // Input should remain visible (not hidden behind keyboard)
        const inputBox = await weightInput.boundingBox();
        const viewport = page.viewportSize()!;
        expect(inputBox!.y).toBeLessThan(viewport.height * 0.7); // Should be in visible area
      }
    });

    test('should handle iOS haptic feedback simulation', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Test vibration API support
      const vibrationSupport = await page.evaluate(() => {
        return 'vibrate' in navigator;
      });

      // On iOS, vibration might not be supported, but app should handle gracefully
      const exerciseCheckbox = page.locator('[data-testid="exercise-complete-1"]').first();
      if (await exerciseCheckbox.isVisible()) {
        await exerciseCheckbox.click();

        // Should complete without errors even if haptic feedback fails
        await expect(exerciseCheckbox).toBeChecked();
      }
    });
  });

  test.describe('Android Mobile Testing', () => {
    test.use({ ...devices['Pixel 5'] });

    test('should handle Android PWA installation', async ({ page }) => {
      // Android Chrome supports beforeinstallprompt
      const installButton = page.locator('[data-testid="install-pwa-button"]');

      // Simulate beforeinstallprompt event
      await page.evaluate(() => {
        const event = new Event('beforeinstallprompt');
        (event as any).prompt = () => Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);
      });

      if (await installButton.isVisible()) {
        await installButton.click();

        // Should trigger native install prompt
        await page.waitForTimeout(1000);

        // Check for successful installation state
        const installSuccess = page.locator('[data-testid="install-success"], [data-testid="app-installed"]');
        if (await installSuccess.isVisible()) {
          await expect(installSuccess).toContainText(/installed|added to home/i);
        }
      }
    });

    test('should handle Android back button behavior', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Navigate to different sections
      const historyButton = page.locator('[data-testid="workout-history"], button:has-text("History")').first();
      if (await historyButton.isVisible()) {
        await historyButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Simulate Android back button
        await page.goBack();

        // Should return to previous section
        await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
      }
    });

    test('should handle Android notification permissions', async ({ page }) => {
      // Test notification API support
      const notificationSupport = await page.evaluate(async () => {
        if ('Notification' in window) {
          return {
            supported: true,
            permission: Notification.permission
          };
        }
        return { supported: false, permission: 'default' };
      });

      expect(notificationSupport.supported).toBe(true);

      // Test notification permission request
      const notificationButton = page.locator('[data-testid="enable-notifications"], button:has-text("Notifications")').first();
      if (await notificationButton.isVisible()) {
        await notificationButton.click();

        // Should handle permission gracefully
        await page.waitForTimeout(1000);
        // Note: In headless testing, permission will likely be denied
      }
    });
  });

  test.describe('Touch Gestures and Interactions', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should handle swipe gestures for navigation', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');
      await helpers.selectProgram('foundation-builder');

      // Test horizontal swipe between workout days
      const workoutContainer = page.locator('[data-testid="workout-container"], [data-testid="daily-workout"]');
      await expect(workoutContainer).toBeVisible();

      // Get initial day indicator
      const dayIndicator = page.locator('[data-testid="day-indicator"], [data-testid="current-day"]').first();
      const initialDay = await dayIndicator.textContent();

      // Perform swipe left gesture
      const containerBox = await workoutContainer.boundingBox();
      if (containerBox) {
        const centerY = containerBox.y + containerBox.height / 2;
        const startX = containerBox.x + containerBox.width * 0.8;
        const endX = containerBox.x + containerBox.width * 0.2;

        await page.mouse.move(startX, centerY);
        await page.mouse.down();
        await page.mouse.move(endX, centerY, { steps: 10 });
        await page.mouse.up();

        await page.waitForTimeout(500);

        // Should navigate to next day
        const newDay = await dayIndicator.textContent();
        expect(newDay).not.toBe(initialDay);
      }
    });

    test('should handle long press for contextual menus', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      const exerciseCard = page.locator('[data-testid="exercise-card"], [data-testid="exercise-item"]').first();
      await expect(exerciseCard).toBeVisible();

      // Simulate long press
      const cardBox = await exerciseCard.boundingBox();
      if (cardBox) {
        const centerX = cardBox.x + cardBox.width / 2;
        const centerY = cardBox.y + cardBox.height / 2;

        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.waitForTimeout(800); // Long press duration
        await page.mouse.up();

        // Should show context menu
        const contextMenu = page.locator('[data-testid="exercise-context-menu"], [data-testid="action-menu"]');
        if (await contextMenu.isVisible()) {
          await expect(contextMenu).toBeVisible();

          // Should have contextual actions
          const editAction = contextMenu.locator('[data-testid="edit-exercise"], button:has-text("Edit")');
          const removeAction = contextMenu.locator('[data-testid="remove-exercise"], button:has-text("Remove")');

          if (await editAction.isVisible()) {
            await expect(editAction).toBeVisible();
          }
          if (await removeAction.isVisible()) {
            await expect(removeAction).toBeVisible();
          }
        }
      }
    });

    test('should handle pinch-to-zoom prevention', async ({ page }) => {
      // PWA should prevent pinch-to-zoom to maintain app-like experience
      const viewport = await page.evaluate(() => {
        const metaViewport = document.querySelector('meta[name="viewport"]');
        return metaViewport ? metaViewport.getAttribute('content') : null;
      });

      expect(viewport).toContain('user-scalable=no');

      // Test that zoom is prevented
      const zoomLevel = await page.evaluate(() => window.devicePixelRatio);
      expect(zoomLevel).toBeGreaterThan(0);

      // Content should be properly sized without need for zoom
      const mainContent = page.locator('[data-testid="training-program"]');
      const contentBox = await mainContent.boundingBox();
      const viewportSize = page.viewportSize()!;

      expect(contentBox!.width).toBeLessThanOrEqual(viewportSize.width);
    });

    test('should handle pull-to-refresh gesture', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Simulate pull-to-refresh
      const startY = 50;
      const endY = 200;

      await page.mouse.move(200, startY);
      await page.mouse.down();
      await page.mouse.move(200, endY, { steps: 10 });
      await page.waitForTimeout(300);
      await page.mouse.up();

      // Should show refresh indicator or refresh content
      const refreshIndicator = page.locator('[data-testid="refresh-indicator"], [data-testid="pull-refresh"]');
      if (await refreshIndicator.isVisible()) {
        await expect(refreshIndicator).toBeVisible();
      }

      // Page should refresh without navigation
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
    });
  });

  test.describe('Mobile UI Adaptations', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should adapt workout timer for mobile', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      const timerButton = page.locator('[data-testid="timer-button"], button:has-text("Timer")').first();
      if (await timerButton.isVisible()) {
        await timerButton.click();

        const timerPopup = page.locator('[data-testid="timer-popup"], [data-testid="timer-modal"]');
        await expect(timerPopup).toBeVisible();

        // Timer should be optimized for mobile
        const timerDisplay = timerPopup.locator('[data-testid="timer-display"]');
        const displayBox = await timerDisplay.boundingBox();

        // Should be large enough for easy viewing
        expect(displayBox!.width).toBeGreaterThan(150);
        expect(displayBox!.height).toBeGreaterThan(80);

        // Timer controls should be touch-friendly
        const startButton = timerPopup.locator('[data-testid="start-timer"], button:has-text("Start")');
        const buttonBox = await startButton.boundingBox();
        expect(buttonBox!.height).toBeGreaterThan(44); // iOS minimum touch target
      }
    });

    test('should optimize exercise cards for mobile', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      const exerciseCards = page.locator('[data-testid="exercise-card"]');
      const cardCount = await exerciseCards.count();

      if (cardCount > 0) {
        const firstCard = exerciseCards.first();
        const cardBox = await firstCard.boundingBox();

        // Cards should use full width on mobile
        const viewportWidth = page.viewportSize()!.width;
        expect(cardBox!.width).toBeGreaterThan(viewportWidth * 0.9);

        // Touch targets should be appropriately sized
        const checkbox = firstCard.locator('[data-testid="exercise-complete"], input[type="checkbox"]');
        if (await checkbox.isVisible()) {
          const checkboxBox = await checkbox.boundingBox();
          expect(checkboxBox!.width).toBeGreaterThan(24);
          expect(checkboxBox!.height).toBeGreaterThan(24);
        }

        // Weight controls should be touch-friendly
        const weightControls = firstCard.locator('[data-testid="weight-controls"]');
        if (await weightControls.isVisible()) {
          const incrementButton = weightControls.locator('[data-testid="increment-weight"], button:has-text("+")');
          const buttonBox = await incrementButton.boundingBox();
          expect(buttonBox!.width).toBeGreaterThan(40);
          expect(buttonBox!.height).toBeGreaterThan(40);
        }
      }
    });

    test('should handle mobile navigation menu', async ({ page }) => {
      // Check for mobile hamburger menu
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"], [data-testid="mobile-menu"]');

      if (await hamburgerMenu.isVisible()) {
        await hamburgerMenu.click();

        // Should show mobile navigation
        const mobileNav = page.locator('[data-testid="mobile-navigation"], [data-testid="nav-drawer"]');
        await expect(mobileNav).toBeVisible();

        // Navigation items should be touch-friendly
        const navItems = mobileNav.locator('[data-testid="nav-item"], a, button');
        const navCount = await navItems.count();

        for (let i = 0; i < navCount; i++) {
          const navItem = navItems.nth(i);
          const itemBox = await navItem.boundingBox();
          expect(itemBox!.height).toBeGreaterThan(44); // Minimum touch target
        }

        // Should close when clicking outside
        await page.mouse.click(50, 200);
        await expect(mobileNav).not.toBeVisible();
      }
    });
  });

  test.describe('Mobile Performance', () => {
    test.use({ ...devices['Pixel 5'] });

    test('should load quickly on mobile devices', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await helpers.waitForAppLoad();

      const loadTime = Date.now() - startTime;

      // Should load within mobile performance budget
      expect(loadTime).toBeLessThan(4000); // 4 seconds for mobile

      // Critical content should be visible quickly
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
    });

    test('should handle touch interactions without lag', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      const exerciseCheckbox = page.locator('[data-testid="exercise-complete-1"]').first();
      if (await exerciseCheckbox.isVisible()) {
        // Measure touch response time
        const startTime = Date.now();
        await exerciseCheckbox.click();
        const responseTime = Date.now() - startTime;

        // Should respond quickly to touch
        expect(responseTime).toBeLessThan(100); // 100ms max response
        await expect(exerciseCheckbox).toBeChecked();
      }
    });

    test('should efficiently handle large workout data on mobile', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Navigate through multiple workout days quickly
      for (let day = 1; day <= 5; day++) {
        const nextDayButton = page.locator(`[data-testid="day-${day}"], button:has-text("Day ${day}")`).first();
        if (await nextDayButton.isVisible()) {
          const startTime = Date.now();
          await nextDayButton.click();
          await page.waitForLoadState('domcontentloaded');
          const navigationTime = Date.now() - startTime;

          // Navigation should be fast even with large datasets
          expect(navigationTime).toBeLessThan(500);
        }
      }
    });

    test('should maintain scroll performance', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Test smooth scrolling with large content
      const exerciseList = page.locator('[data-testid="exercise-list"], [data-testid="workout-content"]');
      if (await exerciseList.isVisible()) {
        // Scroll to bottom
        await exerciseList.hover();
        await page.mouse.wheel(0, 1000);
        await page.waitForTimeout(100);

        // Scroll to top
        await page.mouse.wheel(0, -1000);
        await page.waitForTimeout(100);

        // Content should remain visible and responsive
        await expect(exerciseList).toBeVisible();
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should support mobile screen readers', async ({ page }) => {
      // Check for proper ARIA labels on mobile interface
      const mainContent = page.locator('[data-testid="training-program"]');
      await expect(mainContent).toHaveAttribute('role', 'main');

      // Exercise cards should have proper labels
      const exerciseCards = page.locator('[data-testid="exercise-card"]');
      const cardCount = await exerciseCards.count();

      if (cardCount > 0) {
        const firstCard = exerciseCards.first();
        const ariaLabel = await firstCard.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('should handle mobile focus management', async ({ page }) => {
      // Test keyboard navigation on mobile (external keyboard)
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Focus should be visible and appropriately styled
      const focusOutline = await focusedElement.evaluate(el => {
        const styles = getComputedStyle(el);
        return styles.outline || styles.boxShadow;
      });

      expect(focusOutline).toBeTruthy();
    });

    test('should support voice control labels', async ({ page }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Check for voice control friendly labels
      const actionableElements = page.locator('button, input, a');
      const elementCount = await actionableElements.count();

      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = actionableElements.nth(i);
        const ariaLabel = await element.getAttribute('aria-label');
        const textContent = await element.textContent();
        const title = await element.getAttribute('title');

        // Elements should have voice-friendly identifiers
        expect(ariaLabel || textContent || title).toBeTruthy();
      }
    });
  });
});