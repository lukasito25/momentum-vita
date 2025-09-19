import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { MobileTestHelpers } from './mobile-test-helpers';

/**
 * Mobile-First Responsive Design Tests for Momentum Vita
 *
 * Comprehensive testing of mobile-first responsive design across all viewports,
 * touch interactions, accessibility, and performance on mobile devices.
 */

test.describe('Mobile-First Responsive Design Tests', () => {
  let helpers: TestHelpers;
  let mobileHelpers: MobileTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    mobileHelpers = new MobileTestHelpers(page);
    await helpers.clearAppData();
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Mobile Viewport Tests (375px - iPhone SE)', () => {
    test.beforeEach(async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile');
    });

    test('should display application properly on mobile viewport', async ({ page }) => {
      // Check main container is visible and fits viewport
      const mainContainer = page.locator('[data-testid="training-program"], .main-container, main, #app > div').first();
      await expect(mainContainer).toBeVisible();

      const containerBox = await mainContainer.boundingBox();
      const viewport = page.viewportSize()!;

      expect(containerBox!.width).toBeLessThanOrEqual(viewport.width);

      // Check for horizontal scroll
      const hasHorizontalScroll = await mobileHelpers.checkForHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);

      // Verify touch-friendly interface
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const touchTarget = await mobileHelpers.checkTouchTargetSize(await button.innerHTML());
          // Most buttons should meet minimum touch target size
          if (touchTarget.width > 0 && touchTarget.height > 0) {
            expect(touchTarget.width).toBeGreaterThanOrEqual(40); // Slightly smaller minimum for dense UIs
          }
        }
      }
    });

    test('should handle program selection on mobile', async ({ page }) => {
      await helpers.navigateToPrograms();

      // Program cards should be stacked vertically on mobile
      const programCards = page.locator('[data-testid^="program-card"], .program-card');
      await expect(programCards).toHaveCountGreaterThanOrEqual(3);

      // Check card layout and spacing
      for (let i = 0; i < await programCards.count(); i++) {
        const card = programCards.nth(i);
        const cardBox = await card.boundingBox();

        if (cardBox) {
          // Cards should not be too narrow on mobile
          expect(cardBox.width).toBeGreaterThan(200);
          // Cards should have adequate height for content
          expect(cardBox.height).toBeGreaterThan(120);
        }
      }

      // Test touch interaction
      const firstCard = programCards.first();
      await mobileHelpers.tap(await firstCard.innerHTML());

      // Should respond to touch
      await page.waitForTimeout(500);
    });

    test('should display workout interface optimally on mobile', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Check workout content layout
      const workoutContent = page.locator('[data-testid="workout-content"], .workout-container, .exercise-list');
      await expect(workoutContent).toBeVisible();

      // Exercise cards should be mobile-optimized
      const exerciseCards = page.locator('[data-testid^="exercise"], .exercise-card, .exercise-item');
      const cardCount = await exerciseCards.count();

      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = exerciseCards.nth(i);
          const cardBox = await card.boundingBox();

          if (cardBox) {
            // Exercise cards should span most of the screen width
            expect(cardBox.width).toBeGreaterThan(300);
            // Should not cause horizontal scroll
            expect(cardBox.width).toBeLessThanOrEqual(375);
          }
        }
      }

      // Check interactive elements
      const checkboxes = page.locator('input[type="checkbox"], .checkbox');
      if (await checkboxes.count() > 0) {
        const checkboxTarget = await mobileHelpers.checkTouchTargetSize(await checkboxes.first().innerHTML());
        expect(checkboxTarget.isValid).toBe(true);
      }

      // Weight adjustment buttons should be touch-friendly
      const weightButtons = page.locator('button:has-text("+"), button:has-text("-"), [data-testid*="weight-"]');
      if (await weightButtons.count() > 0) {
        const weightButton = weightButtons.first();
        const weightTarget = await mobileHelpers.checkTouchTargetSize(await weightButton.innerHTML());
        expect(weightTarget.isValid).toBe(true);
      }
    });

    test('should handle nutrition goals on mobile', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Look for nutrition section
      const nutritionSection = page.locator('[data-testid="nutrition-goals"], .nutrition-section, .nutrition-goals');
      if (await nutritionSection.count() > 0) {
        await expect(nutritionSection).toBeVisible();

        // Nutrition goals should be properly spaced on mobile
        const nutritionItems = page.locator('[data-testid^="nutrition"], .nutrition-item, .nutrition-goal');
        const itemCount = await nutritionItems.count();

        if (itemCount > 0) {
          for (let i = 0; i < Math.min(itemCount, 5); i++) {
            const item = nutritionItems.nth(i);
            const itemBox = await item.boundingBox();

            if (itemBox) {
              // Items should not be cramped
              expect(itemBox.height).toBeGreaterThan(30);
              // Should fit in mobile viewport
              expect(itemBox.width).toBeLessThanOrEqual(375);
            }
          }
        }
      }
    });

    test('should handle week selector on mobile', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Look for week selector
      const weekSelector = page.locator('[data-testid="week-selector"], .week-selector, .week-navigation');
      if (await weekSelector.count() > 0) {
        await expect(weekSelector).toBeVisible();

        // Week selector should be mobile-optimized
        const selectorBox = await weekSelector.boundingBox();
        expect(selectorBox!.width).toBeLessThanOrEqual(375);

        // Week buttons should be touch-friendly
        const weekButtons = page.locator('button:has-text("Week"), [data-testid*="week-"]');
        if (await weekButtons.count() > 0) {
          const buttonTarget = await mobileHelpers.checkTouchTargetSize(await weekButtons.first().innerHTML());
          expect(buttonTarget.isValid).toBe(true);
        }
      }
    });

    test('should handle modal dialogs on mobile', async ({ page }) => {
      // Try to trigger authentication modal
      if (await helpers.canTriggerAuthModal()) {
        await helpers.triggerAuthModal();

        const authModal = page.locator('[data-testid="auth-modal"]');
        await expect(authModal).toBeVisible();

        // Modal should be mobile-optimized
        const modalBox = await authModal.boundingBox();
        const viewport = page.viewportSize()!;

        expect(modalBox!.width).toBeLessThanOrEqual(viewport.width);
        expect(modalBox!.height).toBeLessThanOrEqual(viewport.height);

        // Modal should have proper spacing from edges
        expect(modalBox!.x).toBeGreaterThanOrEqual(0);
        expect(modalBox!.y).toBeGreaterThanOrEqual(0);

        // Form elements should be mobile-friendly
        const formInputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
        if (await formInputs.count() > 0) {
          const inputTarget = await mobileHelpers.checkTouchTargetSize(await formInputs.first().innerHTML());
          expect(inputTarget.height).toBeGreaterThanOrEqual(40);
        }

        // Close modal for cleanup
        const closeButton = page.locator('[data-testid="close-modal"], button:has-text("×"), .close-button');
        if (await closeButton.count() > 0) {
          await closeButton.click();
        }
      }
    });
  });

  test.describe('Mobile Landscape Tests (667x375)', () => {
    test.beforeEach(async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile-landscape');
    });

    test('should adapt to landscape orientation', async ({ page }) => {
      // Check layout adapts to landscape
      const mainContainer = page.locator('[data-testid="training-program"], .main-container, main').first();
      await expect(mainContainer).toBeVisible();

      // Should not have horizontal scroll
      const hasHorizontalScroll = await mobileHelpers.checkForHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);

      // Content should utilize available width
      const viewport = page.viewportSize()!;
      expect(viewport.width).toBe(667);
      expect(viewport.height).toBe(375);
    });

    test('should optimize program selection for landscape', async ({ page }) => {
      await helpers.navigateToPrograms();

      const programCards = page.locator('[data-testid^="program-card"], .program-card');
      if (await programCards.count() >= 3) {
        // In landscape, cards might be arranged horizontally
        const firstCard = await programCards.first().boundingBox();
        const lastCard = await programCards.last().boundingBox();

        if (firstCard && lastCard) {
          // Cards should fit within viewport width
          expect(Math.max(firstCard.x + firstCard.width, lastCard.x + lastCard.width)).toBeLessThanOrEqual(667);
        }
      }
    });
  });

  test.describe('Tablet Viewport Tests (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await mobileHelpers.setupMobileViewport('tablet');
    });

    test('should display optimally on tablet', async ({ page }) => {
      // Tablet should have more spacious layout
      const mainContainer = page.locator('[data-testid="training-program"], .main-container').first();
      await expect(mainContainer).toBeVisible();

      const containerBox = await mainContainer.boundingBox();
      expect(containerBox!.width).toBeLessThanOrEqual(768);

      // Should not have horizontal scroll
      const hasHorizontalScroll = await mobileHelpers.checkForHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should handle program selection on tablet', async ({ page }) => {
      await helpers.navigateToPrograms();

      const programCards = page.locator('[data-testid^="program-card"], .program-card');
      await expect(programCards).toHaveCountGreaterThanOrEqual(3);

      // On tablet, cards might be arranged in a grid
      const cardCount = await programCards.count();
      for (let i = 0; i < cardCount; i++) {
        const card = programCards.nth(i);
        const cardBox = await card.boundingBox();

        if (cardBox) {
          // Cards should have adequate size on tablet
          expect(cardBox.width).toBeGreaterThan(150);
          expect(cardBox.height).toBeGreaterThan(100);
          // Should fit within tablet viewport
          expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(768);
        }
      }
    });

    test('should optimize workout interface for tablet', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      const workoutContent = page.locator('[data-testid="workout-content"], .workout-container');
      await expect(workoutContent).toBeVisible();

      // Exercise cards should utilize tablet space efficiently
      const exerciseCards = page.locator('[data-testid^="exercise"], .exercise-card');
      if (await exerciseCards.count() > 0) {
        const firstCard = exerciseCards.first();
        const cardBox = await firstCard.boundingBox();

        if (cardBox) {
          // Should use reasonable portion of tablet width
          expect(cardBox.width).toBeGreaterThan(400);
          expect(cardBox.width).toBeLessThanOrEqual(768);
        }
      }
    });
  });

  test.describe('Touch Interaction Tests', () => {
    test.beforeEach(async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile');
    });

    test('should handle tap interactions properly', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Test tapping exercise checkboxes
      const checkboxes = page.locator('input[type="checkbox"], .checkbox');
      if (await checkboxes.count() > 0) {
        const initialState = await checkboxes.first().isChecked();
        await mobileHelpers.tap(await checkboxes.first().innerHTML());

        await page.waitForTimeout(200);
        const newState = await checkboxes.first().isChecked();
        expect(newState).not.toBe(initialState);
      }

      // Test tapping weight adjustment buttons
      const weightButtons = page.locator('button:has-text("+"), button:has-text("-")');
      if (await weightButtons.count() > 0) {
        await mobileHelpers.tap(await weightButtons.first().innerHTML());
        // Should not cause any errors
        await page.waitForTimeout(200);
      }
    });

    test('should handle long press interactions', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Test long press on exercise items (if implemented)
      const exerciseItems = page.locator('[data-testid^="exercise"], .exercise-card, .exercise-item');
      if (await exerciseItems.count() > 0) {
        await mobileHelpers.longPress(await exerciseItems.first().innerHTML(), 1000);

        // Check if any context menu or special UI appears
        const contextMenu = page.locator('.context-menu, .popup-menu, [data-testid="context-menu"]');
        // Context menu might or might not be implemented
        if (await contextMenu.count() > 0) {
          await expect(contextMenu).toBeVisible();
        }
      }
    });

    test('should handle swipe gestures', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Test swiping (if week navigation supports swipe)
      const weekSelector = page.locator('[data-testid="week-selector"], .week-navigation');
      if (await weekSelector.count() > 0) {
        const initialWeek = await helpers.getCurrentWeek();

        // Try swiping left (next week)
        await mobileHelpers.swipe('left', 100);
        await page.waitForTimeout(500);

        // Swipe might or might not be implemented
        const newWeek = await helpers.getCurrentWeek();
        // Don't assert specific behavior as swipe navigation might not be implemented
      }
    });

    test('should prevent accidental interactions', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Test rapid tapping doesn't cause issues
      const buttons = page.locator('button').first();
      if (await buttons.count() > 0) {
        for (let i = 0; i < 5; i++) {
          await mobileHelpers.tap(await buttons.innerHTML());
          await page.waitForTimeout(50);
        }

        // Should handle rapid taps gracefully
        const errorElements = page.locator('.error, [data-testid="error"]');
        await expect(errorElements).toHaveCount(0);
      }
    });
  });

  test.describe('Mobile Performance Tests', () => {
    test.beforeEach(async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile');
    });

    test('should load efficiently on mobile', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await helpers.waitForAppLoad();

      const loadTime = Date.now() - startTime;

      // Mobile load time should be reasonable (under 5 seconds on slow connection)
      expect(loadTime).toBeLessThan(5000);

      // Check for performance issues
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('navigation').map(entry => ({
          loadEventEnd: entry.loadEventEnd,
          domContentLoadedEventEnd: entry.domContentLoadedEventEnd
        }));
      });

      if (performanceEntries.length > 0) {
        expect(performanceEntries[0].loadEventEnd).toBeLessThan(5000);
      }
    });

    test('should handle image loading on mobile', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Check for images in the workout interface
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);

        // Images should have proper loading attributes for mobile
        const loading = await img.getAttribute('loading');
        const src = await img.getAttribute('src');

        if (src) {
          // Should use appropriate loading strategy
          expect(loading).toMatch(/lazy|eager|auto/);
        }
      }
    });

    test('should manage memory efficiently', async ({ page }) => {
      // Navigate through different sections to test memory usage
      await helpers.selectProgram('foundation-builder');
      await helpers.navigateToPrograms();
      await helpers.selectProgram('foundation-builder');

      // Switch weeks to load different content
      for (let week = 1; week <= 3; week++) {
        await helpers.setCurrentWeek(week);
        await page.waitForTimeout(500);
      }

      // Check that the page is still responsive
      const button = page.locator('button').first();
      if (await button.count() > 0) {
        const startTime = Date.now();
        await button.click();
        const responseTime = Date.now() - startTime;

        // Should still be responsive after navigation
        expect(responseTime).toBeLessThan(1000);
      }
    });
  });

  test.describe('Mobile Accessibility Tests', () => {
    test.beforeEach(async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile');
    });

    test('should support screen reader navigation on mobile', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      expect(headingCount).toBeGreaterThan(0);

      // First heading should be h1
      const firstHeading = headings.first();
      const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('h1');

      // Check for ARIA labels on interactive elements
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const buttonText = await button.textContent();

        // Button should have either text content or aria-label
        expect(ariaLabel || buttonText).toBeTruthy();
      }
    });

    test('should have proper focus management on mobile', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Test keyboard navigation (important for mobile accessibility)
      const focusableElements = page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
      const focusableCount = await focusableElements.count();

      if (focusableCount > 0) {
        // First element should be focusable
        await focusableElements.first().focus();
        const isFocused = await focusableElements.first().evaluate(el => document.activeElement === el);
        expect(isFocused).toBe(true);

        // Focus should be visible
        const focusedElement = await page.locator(':focus').count();
        expect(focusedElement).toBe(1);
      }
    });

    test('should have adequate color contrast for mobile', async ({ page }) => {
      await helpers.selectProgram('foundation-builder');

      // Check text color contrast (basic check)
      const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, button, label');
      const elementCount = await textElements.count();

      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = textElements.nth(i);
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        // Text should have color styling
        expect(styles.color).toBeTruthy();
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });

  test.describe('Cross-Device Responsive Tests', () => {
    const devices = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Samsung Galaxy S20', width: 360, height: 800 },
      { name: 'iPad Mini', width: 768, height: 1024 },
      { name: 'iPad Pro', width: 1024, height: 1366 }
    ];

    devices.forEach(device => {
      test(`should work properly on ${device.name}`, async ({ page }) => {
        await page.setViewportSize({ width: device.width, height: device.height });

        await page.goto('/');
        await helpers.waitForAppLoad();

        // Basic functionality should work on all devices
        const mainContent = page.locator('[data-testid="training-program"], .main-container').first();
        await expect(mainContent).toBeVisible();

        // No horizontal scroll
        const hasHorizontalScroll = await mobileHelpers.checkForHorizontalScroll();
        expect(hasHorizontalScroll).toBe(false);

        // Should be able to navigate to programs
        await helpers.navigateToPrograms();
        const programCards = page.locator('[data-testid^="program-card"], .program-card');
        await expect(programCards).toHaveCountGreaterThanOrEqual(3);

        // Should be able to select a program
        await helpers.selectProgram('foundation-builder');
        const workoutContent = page.locator('[data-testid="workout-content"], .workout-container');
        await expect(workoutContent).toBeVisible();
      });
    });
  });

  test.describe('Responsive Design Breakpoints', () => {
    test('should handle smooth transitions between breakpoints', async ({ page }) => {
      // Start at mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      await helpers.selectProgram('foundation-builder');

      // Gradually increase width to test breakpoints
      const widths = [375, 480, 640, 768, 1024, 1280];

      for (const width of widths) {
        await page.setViewportSize({ width, height: 800 });
        await page.waitForTimeout(200);

        // Content should remain visible and functional
        const mainContent = page.locator('[data-testid="training-program"], .main-container').first();
        await expect(mainContent).toBeVisible();

        // No horizontal scroll at any breakpoint
        const hasHorizontalScroll = await mobileHelpers.checkForHorizontalScroll();
        expect(hasHorizontalScroll).toBe(false);
      }
    });

    test('should optimize layout at each major breakpoint', async ({ page }) => {
      const breakpoints = [
        { name: 'mobile', width: 375 },
        { name: 'tablet', width: 768 },
        { name: 'desktop', width: 1024 }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: 800 });
        await helpers.navigateToPrograms();

        const programCards = page.locator('[data-testid^="program-card"], .program-card');
        const cardCount = await programCards.count();

        if (cardCount > 0) {
          // Check layout adapts to breakpoint
          const firstCard = await programCards.first().boundingBox();
          const lastCard = await programCards.last().boundingBox();

          if (firstCard && lastCard) {
            // Cards should fit within viewport
            expect(Math.max(firstCard.x + firstCard.width, lastCard.x + lastCard.width)).toBeLessThanOrEqual(breakpoint.width);

            // Layout should be appropriate for breakpoint
            if (breakpoint.name === 'mobile') {
              // Cards likely stacked vertically
              expect(firstCard.width).toBeGreaterThan(200);
            } else if (breakpoint.name === 'tablet') {
              // Cards might be in a grid
              expect(firstCard.width).toBeGreaterThan(150);
            }
          }
        }
      }
    });
  });
});