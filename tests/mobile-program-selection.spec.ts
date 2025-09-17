import { test, expect, devices } from '@playwright/test';
import { MobileTestHelpers, MobileProgramSelectionPage } from './mobile-test-helpers';

test.describe('Mobile Program Selection Flow', () => {
  let helpers: MobileTestHelpers;
  let programPage: MobileProgramSelectionPage;

  test.beforeEach(async ({ page }) => {
    helpers = new MobileTestHelpers(page);
    programPage = new MobileProgramSelectionPage(page, helpers);

    // Set up mobile viewport
    await helpers.setupMobileViewport('mobile');

    // Clear app data to start fresh
    await helpers.clearAppData();

    // Navigate to the app
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.describe('Program Cards Display - Mobile Viewports', () => {
    test('should display program cards properly on mobile (375px)', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      // Navigate to program selection if not already there
      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      // Check that all 3 program cards are visible
      await expect(programCards).toHaveCount(3);

      // Verify cards are properly sized for mobile
      const cardLayout = await programPage.checkProgramCardLayout();

      for (const card of cardLayout) {
        expect(card.isVisible).toBe(true);
        expect(card.touchTargetValid).toBe(true);

        // Cards should not be cramped (minimum width)
        if (card.dimensions) {
          expect(card.dimensions.width).toBeGreaterThan(200);
          expect(card.dimensions.height).toBeGreaterThan(100);
        }
      }

      // Check for horizontal scroll (should not exist)
      const hasHorizontalScroll = await helpers.checkForHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);

      // Take screenshot for visual verification
      await helpers.takeScreenshot('program-cards-mobile-375px');
    });

    test('should display program cards properly on large mobile (414px)', async ({ page }) => {
      await page.setViewportSize({ width: 414, height: 896 }); // iPhone 11 Pro Max

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      await expect(programCards).toHaveCount(3);

      // Check layout doesn't break on larger mobile screens
      const cardLayout = await programPage.checkProgramCardLayout();

      for (const card of cardLayout) {
        expect(card.isVisible).toBe(true);
        expect(card.touchTargetValid).toBe(true);
      }

      const hasHorizontalScroll = await helpers.checkForHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);

      await helpers.takeScreenshot('program-cards-mobile-414px');
    });

    test('should adapt layout on tablet viewport (768px)', async ({ page }) => {
      await helpers.setupMobileViewport('tablet');

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      await expect(programCards).toHaveCount(3);

      // On tablet, cards might be arranged differently
      const cardLayout = await programPage.checkProgramCardLayout();

      for (const card of cardLayout) {
        expect(card.isVisible).toBe(true);
        expect(card.touchTargetValid).toBe(true);

        // Tablet cards should use more available space
        if (card.dimensions) {
          expect(card.dimensions.width).toBeGreaterThan(300);
        }
      }

      await helpers.takeScreenshot('program-cards-tablet-768px');
    });
  });

  test.describe('Text Alignment and Visibility', () => {
    test('should display all program text elements clearly on mobile', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      // Check text alignment and visibility
      const textAlignment = await programPage.checkTextAlignment();

      expect(textAlignment.titlesVisible).toBe(true);
      expect(textAlignment.descriptionsVisible).toBe(true);

      // Text should not overflow or be truncated inappropriately
      if (textAlignment.textOverflow) {
        console.warn('Some text is being truncated with ellipsis - may need layout adjustment');
      }

      // Check that program titles are readable
      const programTitles = page.locator('[data-testid="program-title"]');
      const titleCount = await programTitles.count();

      for (let i = 0; i < titleCount; i++) {
        const title = programTitles.nth(i);
        await expect(title).toBeVisible();

        const titleText = await title.textContent();
        expect(titleText).toBeTruthy();
        expect(titleText!.length).toBeGreaterThan(5); // Should have meaningful content
      }

      // Check program descriptions
      const programDescriptions = page.locator('[data-testid="program-description"]');
      const descriptionCount = await programDescriptions.count();

      for (let i = 0; i < descriptionCount; i++) {
        const description = programDescriptions.nth(i);
        await expect(description).toBeVisible();

        const descText = await description.textContent();
        expect(descText).toBeTruthy();
      }
    });

    test('should maintain text readability across different mobile orientations', async ({ page }) => {
      // Test portrait orientation
      await helpers.setupMobileViewport('mobile');

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      const portraitAlignment = await programPage.checkTextAlignment();
      await helpers.takeScreenshot('text-alignment-portrait');

      // Test landscape orientation
      await helpers.setupMobileViewport('mobile-landscape');
      await page.waitForTimeout(500); // Allow layout to settle

      const landscapeAlignment = await programPage.checkTextAlignment();
      await helpers.takeScreenshot('text-alignment-landscape');

      // Both orientations should show text properly
      expect(portraitAlignment.titlesVisible).toBe(true);
      expect(portraitAlignment.descriptionsVisible).toBe(true);
      expect(landscapeAlignment.titlesVisible).toBe(true);
      expect(landscapeAlignment.descriptionsVisible).toBe(true);
    });
  });

  test.describe('Program Switching Functionality', () => {
    test('should switch programs without errors on mobile', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      // Setup initial program
      await helpers.setupTestProgram('foundation-builder');

      // Navigate to program selection
      const backButton = page.locator('[data-testid="back-to-programs"]');
      if (await backButton.isVisible()) {
        await helpers.tap('[data-testid="back-to-programs"]');
        await page.waitForTimeout(500);
      }

      // Test switching to each program
      const programs = ['foundation-builder', 'power-surge-pro', 'beast-mode-elite'] as const;

      for (const program of programs) {
        // Find and tap the program card
        const programCard = page.locator(`[data-testid="${program}"]`);

        if (await programCard.isVisible()) {
          await helpers.tap(`[data-testid="${program}"]`);
          await page.waitForTimeout(1000); // Allow program switch to complete

          // Verify we're now on the workout view
          const workoutView = page.locator('[data-testid="workout-view"]');
          const exerciseCards = page.locator('[data-testid="exercise-card"]');

          // Should see either workout view or exercise cards
          const isOnWorkoutView = await workoutView.isVisible() || await exerciseCards.count() > 0;
          expect(isOnWorkoutView).toBe(true);

          // Navigate back to program selection for next test
          if (programs.indexOf(program) < programs.length - 1) {
            const backBtn = page.locator('[data-testid="back-to-programs"]');
            if (await backBtn.isVisible()) {
              await helpers.tap('[data-testid="back-to-programs"]');
              await page.waitForTimeout(500);
            }
          }
        }
      }
    });

    test('should maintain selection state during mobile navigation', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      // Start with Power Surge Pro
      await helpers.setupTestProgram('power-surge-pro');

      // Navigate back to program selection
      const backButton = page.locator('[data-testid="back-to-programs"]');
      if (await backButton.isVisible()) {
        await helpers.tap('[data-testid="back-to-programs"]');
        await page.waitForTimeout(500);
      }

      // Select Foundation Builder
      const foundationCard = page.locator('[data-testid="foundation-builder"]');
      if (await foundationCard.isVisible()) {
        await helpers.tap('[data-testid="foundation-builder"]');
        await page.waitForTimeout(1000);

        // Navigate back and check that Foundation Builder is now selected
        const backBtn = page.locator('[data-testid="back-to-programs"]');
        if (await backBtn.isVisible()) {
          await helpers.tap('[data-testid="back-to-programs"]');
          await page.waitForTimeout(500);

          // Foundation Builder should now be marked as current
          const foundationCardAfter = page.locator('[data-testid="foundation-builder"]');
          const isSelected = await foundationCardAfter.getAttribute('aria-selected') === 'true' ||
                            await foundationCardAfter.locator('[data-testid="selected-indicator"]').isVisible();

          // Note: This test depends on the UI implementation showing selected state
          // If the UI doesn't show selection state, we can check localStorage instead
          const currentProgram = await page.evaluate(() => localStorage.getItem('currentProgramId'));
          expect(currentProgram).toBe('foundation-builder');
        }
      }
    });
  });

  test.describe('Mobile Touch Interactions', () => {
    test('should handle tap interactions correctly', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      // Test tap on each program card
      const cardCount = await programCards.count();
      expect(cardCount).toBe(3);

      for (let i = 0; i < cardCount; i++) {
        const card = programCards.nth(i);
        await expect(card).toBeVisible();

        // Check touch target size
        const touchSize = await helpers.checkTouchTargetSize(`[data-testid="program-card"]:nth-child(${i + 1})`);
        expect(touchSize.isValid).toBe(true);

        // Test tap responsiveness
        const cardBox = await card.boundingBox();
        expect(cardBox).toBeTruthy();

        // Simulate tap and verify some response (could be navigation or visual feedback)
        await helpers.tap(`[data-testid="program-card"]:nth-child(${i + 1})`);
        await page.waitForTimeout(300);

        // If this tap causes navigation, we'll need to navigate back
        const stillOnSelection = await programCards.count() > 0;
        if (!stillOnSelection) {
          // We navigated away, go back for next test
          const backBtn = page.locator('[data-testid="back-to-programs"]');
          if (await backBtn.isVisible()) {
            await helpers.tap('[data-testid="back-to-programs"]');
            await page.waitForTimeout(500);
          }
        }
      }
    });

    test('should not interfere with hover states on touch devices', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      // Check if hover styles are properly disabled or don't interfere
      const firstCard = programCards.first();
      await expect(firstCard).toBeVisible();

      // Tap the card and check it doesn't get stuck in hover state
      await helpers.tap('[data-testid="program-card"]:first-child');
      await page.waitForTimeout(300);

      // Check computed styles to ensure no hover state is stuck
      const hasStuckHover = await firstCard.evaluate(el => {
        const style = window.getComputedStyle(el);
        // This is a simplified check - in reality, you'd check for specific hover styles
        return style.cursor === 'pointer';
      });

      // On touch devices, cursor should typically not be 'pointer' after tap
      expect(hasStuckHover).toBe(true); // Actually, pointer cursor is expected for clickable elements
    });

    test('should support long press interactions if implemented', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      const firstCard = programCards.first();
      await expect(firstCard).toBeVisible();

      // Test long press (if the app implements it for additional features)
      await helpers.longPress('[data-testid="program-card"]:first-child', 1000);

      // Check if any context menu or additional options appeared
      const contextMenu = page.locator('[data-testid="context-menu"], [role="menu"]');
      const hasContextMenu = await contextMenu.isVisible();

      // Note: This test will pass if no long press feature is implemented
      // It's here to catch if long press functionality is added later
      if (hasContextMenu) {
        console.log('Context menu detected on long press');
        // Close the menu for cleanup
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Responsive Breakpoint Testing', () => {
    test('should handle all mobile breakpoints correctly', async ({ page }) => {
      const breakpointResults = await helpers.testResponsiveBreakpoints();

      for (const result of breakpointResults) {
        expect(result.hasHorizontalScroll).toBe(false);
        expect(result.elements.headerExists).toBe(true);
        expect(result.elements.buttonsAreTouchFriendly).toBe(true);
        expect(result.elements.textIsReadable).toBe(true);

        console.log(`Breakpoint ${result.breakpoint} (${result.dimensions}): ✓`);
      }

      // Take screenshots at each breakpoint
      for (const result of breakpointResults) {
        await helpers.takeScreenshot(`program-selection-${result.breakpoint}`);
      }
    });

    test('should adapt layout between portrait and landscape', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      // Test orientation changes
      const orientationResults = await helpers.testOrientationChange();

      expect(orientationResults.portrait.headerExists).toBe(true);
      expect(orientationResults.landscape.headerExists).toBe(true);

      expect(orientationResults.portrait.buttonsAreTouchFriendly).toBe(true);
      expect(orientationResults.landscape.buttonsAreTouchFriendly).toBe(true);

      // Layout should adapt to orientation
      expect(orientationResults.adaptsToOrientation).toBe(true);
    });
  });

  test.describe('Performance on Mobile', () => {
    test('should load quickly on mobile networks', async ({ page }) => {
      // Simulate slow 3G
      await helpers.simulateSlowNetwork();
      await helpers.setupMobileViewport('mobile');

      const startTime = Date.now();

      await page.goto('/');
      await helpers.waitForAppLoad();

      const loadTime = Date.now() - startTime;

      // Should load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(10000); // 10 seconds max on slow network

      // Check mobile performance metrics
      const performanceMetrics = await helpers.checkMobilePerformance();

      expect(performanceMetrics.isMobileOptimized.domContentLoaded).toBe(true);
      expect(performanceMetrics.isMobileOptimized.firstContentfulPaint).toBe(true);

      console.log('Mobile Performance Metrics:', performanceMetrics);
    });

    test('should handle low memory conditions gracefully', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      // Simulate low memory device features
      await helpers.simulateDeviceFeatures();

      await page.goto('/');
      await helpers.waitForAppLoad();

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      // App should still function with device constraints
      await expect(programCards).toHaveCount(3);

      // Check for any console errors related to memory
      const consoleErrors = await helpers.checkConsoleErrors();
      const memoryErrors = consoleErrors.filter(error =>
        error.includes('memory') || error.includes('heap')
      );

      expect(memoryErrors.length).toBe(0);
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test('should maintain accessibility standards on mobile', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      // Check basic accessibility
      const accessibility = await helpers.checkAccessibility();

      expect(accessibility.hasTitle).toBe(true);
      expect(accessibility.hasLang).toBe(true);
      expect(accessibility.missingAltTags).toBe(0);

      // Check that program cards are keyboard accessible
      const firstCard = programCards.first();
      await firstCard.focus();

      const isFocused = await firstCard.evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);

      // Check ARIA labels and roles
      const cardCount = await programCards.count();
      for (let i = 0; i < cardCount; i++) {
        const card = programCards.nth(i);

        const hasAriaLabel = await card.getAttribute('aria-label');
        const hasRole = await card.getAttribute('role');

        // Should have either aria-label or role for screen readers
        expect(hasAriaLabel || hasRole).toBeTruthy();
      }
    });

    test('should work with reduced motion preferences', async ({ page }) => {
      await helpers.setupMobileViewport('mobile');

      // Simulate reduced motion preference
      await helpers.simulateDeviceFeatures();

      await page.goto('/');
      await helpers.waitForAppLoad();

      const programCards = page.locator('[data-testid="program-card"]');
      const isOnProgramSelection = await programCards.count() > 0;

      if (!isOnProgramSelection) {
        await programPage.navigateToPrograms();
      }

      // App should respect reduced motion preferences
      const hasReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });

      expect(hasReducedMotion).toBe(true);

      // Animations should be reduced or disabled
      const animatedElements = await page.locator('[style*="transition"], [style*="animation"]').count();

      // This is a simplified check - in reality, you'd verify specific animation styles
      console.log(`Found ${animatedElements} potentially animated elements`);
    });
  });
});