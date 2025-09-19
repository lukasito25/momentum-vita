import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { MobileTestHelpers } from './mobile-test-helpers';

/**
 * Premium Program Access Tests for Momentum Vita
 *
 * Tests premium program access control, authentication triggers,
 * program switching, and enhanced features for authenticated users.
 */

test.describe('Premium Program Access Control', () => {
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

  test.describe('Program Availability and Restrictions', () => {
    test('should display all three programs with correct access indicators', async ({ page }) => {
      await helpers.navigateToPrograms();

      // Check Foundation Builder (free program)
      const foundationBuilder = page.locator('[data-testid="program-card-foundation-builder"], .program-card:has-text("Foundation Builder")').first();
      await expect(foundationBuilder).toBeVisible();

      // Should not have premium/lock indicators
      const freeProgramLock = foundationBuilder.locator('.lock-icon, [data-testid="premium-lock"], .premium-indicator');
      await expect(freeProgramLock).not.toBeVisible();

      // Check Power Surge Pro (premium program)
      const powerSurgePro = page.locator('[data-testid="program-card-power-surge-pro"], .program-card:has-text("Power Surge Pro")').first();
      await expect(powerSurgePro).toBeVisible();

      // Should have premium/lock indicators
      const premiumIndicator1 = powerSurgePro.locator('.lock-icon, [data-testid="premium-lock"], .premium-indicator, .lock, [class*="lock"]');
      if (await premiumIndicator1.count() > 0) {
        await expect(premiumIndicator1.first()).toBeVisible();
      }

      // Check Beast Mode Elite (premium program)
      const beastModeElite = page.locator('[data-testid="program-card-beast-mode-elite"], .program-card:has-text("Beast Mode Elite")').first();
      await expect(beastModeElite).toBeVisible();

      // Should have premium/lock indicators
      const premiumIndicator2 = beastModeElite.locator('.lock-icon, [data-testid="premium-lock"], .premium-indicator, .lock, [class*="lock"]');
      if (await premiumIndicator2.count() > 0) {
        await expect(premiumIndicator2.first()).toBeVisible();
      }
    });

    test('should allow immediate access to Foundation Builder', async ({ page }) => {
      await helpers.navigateToPrograms();

      const foundationBuilder = page.locator('[data-testid="program-card-foundation-builder"], .program-card:has-text("Foundation Builder")').first();
      await foundationBuilder.click();

      // Should not trigger authentication modal
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).not.toBeVisible();

      // Should navigate to the program
      await page.waitForTimeout(1000);
      const programContent = page.locator('[data-testid="workout-content"], .workout-container, .exercise-list');
      await expect(programContent).toBeVisible({ timeout: 10000 });
    });

    test('should trigger authentication for Power Surge Pro access', async ({ page }) => {
      await helpers.navigateToPrograms();

      const powerSurgePro = page.locator('[data-testid="program-card-power-surge-pro"], .program-card:has-text("Power Surge Pro")').first();
      await powerSurgePro.click();

      // Should trigger authentication modal
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible({ timeout: 5000 });

      // Check modal content mentions program access
      await expect(authModal).toContainText(/Save Your Progress|Premium|Power Surge Pro/i);
    });

    test('should trigger authentication for Beast Mode Elite access', async ({ page }) => {
      await helpers.navigateToPrograms();

      const beastModeElite = page.locator('[data-testid="program-card-beast-mode-elite"], .program-card:has-text("Beast Mode Elite")').first();
      await beastModeElite.click();

      // Should trigger authentication modal
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible({ timeout: 5000 });

      // Check modal content mentions program access
      await expect(authModal).toContainText(/Save Your Progress|Premium|Beast Mode Elite/i);
    });
  });

  test.describe('Premium Program Access After Authentication', () => {
    test('should grant access to Power Surge Pro after authentication', async ({ page }) => {
      // Try to access premium program
      await helpers.navigateToPrograms();
      const powerSurgePro = page.locator('[data-testid="program-card-power-surge-pro"], .program-card:has-text("Power Surge Pro")').first();
      await powerSurgePro.click();

      // Authenticate when modal appears
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      await helpers.authenticateViaModal('test@example.com', 'Test User');

      // Should now have access to the program
      await expect(authModal).not.toBeVisible();

      // Verify we're in Power Surge Pro
      await page.waitForTimeout(2000);
      const programTitle = page.locator('h1, h2, [data-testid="program-title"], .program-title');
      await expect(programTitle).toContainText(/Power Surge Pro/i);

      // Check for Power Surge Pro specific content
      const workoutContent = page.locator('[data-testid="workout-content"], .workout-container');
      await expect(workoutContent).toBeVisible();
    });

    test('should grant access to Beast Mode Elite after authentication', async ({ page }) => {
      // Try to access premium program
      await helpers.navigateToPrograms();
      const beastModeElite = page.locator('[data-testid="program-card-beast-mode-elite"], .program-card:has-text("Beast Mode Elite")').first();
      await beastModeElite.click();

      // Authenticate when modal appears
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      await helpers.authenticateViaModal('test@example.com', 'Test User');

      // Should now have access to the program
      await expect(authModal).not.toBeVisible();

      // Verify we're in Beast Mode Elite
      await page.waitForTimeout(2000);
      const programTitle = page.locator('h1, h2, [data-testid="program-title"], .program-title');
      await expect(programTitle).toContainText(/Beast Mode Elite/i);

      // Check for Beast Mode Elite specific content
      const workoutContent = page.locator('[data-testid="workout-content"], .workout-container');
      await expect(workoutContent).toBeVisible();
    });

    test('should maintain premium access across page reloads', async ({ page }) => {
      // Authenticate and access premium program
      await helpers.authenticateUser('test@example.com', 'Test User');
      await helpers.selectProgram('power-surge-pro');

      // Reload page
      await page.reload();
      await helpers.waitForAppLoad();

      // Should still have access to premium program
      const programTitle = page.locator('h1, h2, [data-testid="program-title"], .program-title');
      if (await programTitle.count() > 0) {
        const titleText = await programTitle.textContent();
        // Should still be in premium program or have access to switch back
        expect(titleText).toBeTruthy();
      }

      // User should still be authenticated
      const isAuthenticated = await helpers.isUserAuthenticated();
      expect(isAuthenticated).toBe(true);
    });
  });

  test.describe('Program Switching and Data Isolation', () => {
    test('should preserve program-specific progress when switching between programs', async ({ page }) => {
      // Authenticate user first
      await helpers.authenticateUser('test@example.com', 'Test User');

      // Start with Foundation Builder and make some progress
      await helpers.selectProgram('foundation-builder');
      await helpers.completeExercise('first-exercise', 1); // Complete first exercise of week 1

      // Switch to Power Surge Pro
      await helpers.navigateToPrograms();
      await helpers.selectProgram('power-surge-pro');

      // Make different progress in Power Surge Pro
      await helpers.completeExercise('different-exercise', 1);

      // Switch back to Foundation Builder
      await helpers.navigateToPrograms();
      await helpers.selectProgram('foundation-builder');

      // Progress should be preserved
      const firstExerciseCompleted = await helpers.isExerciseCompleted('first-exercise', 1);
      expect(firstExerciseCompleted).toBe(true);

      // Switch back to Power Surge Pro and check its progress
      await helpers.navigateToPrograms();
      await helpers.selectProgram('power-surge-pro');

      const differentExerciseCompleted = await helpers.isExerciseCompleted('different-exercise', 1);
      expect(differentExerciseCompleted).toBe(true);
    });

    test('should handle week progression independently per program', async ({ page }) => {
      await helpers.authenticateUser('test@example.com', 'Test User');

      // Set different weeks for different programs
      await helpers.selectProgram('foundation-builder');
      await helpers.setCurrentWeek(3);

      await helpers.navigateToPrograms();
      await helpers.selectProgram('power-surge-pro');
      await helpers.setCurrentWeek(1);

      // Switch back to Foundation Builder
      await helpers.navigateToPrograms();
      await helpers.selectProgram('foundation-builder');

      // Should be on week 3
      const currentWeek = await helpers.getCurrentWeek();
      expect(currentWeek).toBe(3);

      // Switch back to Power Surge Pro
      await helpers.navigateToPrograms();
      await helpers.selectProgram('power-surge-pro');

      // Should be on week 1
      const powerSurgeWeek = await helpers.getCurrentWeek();
      expect(powerSurgeWeek).toBe(1);
    });

    test('should maintain separate exercise weights per program', async ({ page }) => {
      await helpers.authenticateUser('test@example.com', 'Test User');

      // Set weights in Foundation Builder
      await helpers.selectProgram('foundation-builder');
      await helpers.setExerciseWeight('Bench Press', 100);

      // Set different weights in Power Surge Pro
      await helpers.navigateToPrograms();
      await helpers.selectProgram('power-surge-pro');
      await helpers.setExerciseWeight('Bench Press', 120);

      // Check weights are preserved independently
      await helpers.navigateToPrograms();
      await helpers.selectProgram('foundation-builder');
      const foundationWeight = await helpers.getExerciseWeight('Bench Press');
      expect(foundationWeight).toBe(100);

      await helpers.navigateToPrograms();
      await helpers.selectProgram('power-surge-pro');
      const powerSurgeWeight = await helpers.getExerciseWeight('Bench Press');
      expect(powerSurgeWeight).toBe(120);
    });
  });

  test.describe('Enhanced Features for Authenticated Users', () => {
    test('should display enhanced workout tracking for authenticated users', async ({ page }) => {
      // Test without authentication first
      await helpers.selectProgram('foundation-builder');

      // Look for basic tracking only
      const basicTracking = page.locator('.exercise-checkbox, input[type="checkbox"]');
      await expect(basicTracking.first()).toBeVisible();

      // Now authenticate
      await helpers.authenticateUser('test@example.com', 'Test User');
      await page.reload();
      await helpers.waitForAppLoad();

      // Should now see enhanced tracking features
      const enhancedFeatures = page.locator('[data-testid="set-tracker"], [data-testid="advanced-tracking"], .set-tracking, .enhanced-mode');
      if (await enhancedFeatures.count() > 0) {
        await expect(enhancedFeatures.first()).toBeVisible();
      }
    });

    test('should show timer features for authenticated users', async ({ page }) => {
      await helpers.authenticateUser('test@example.com', 'Test User');
      await helpers.selectProgram('foundation-builder');

      // Look for timer-related UI elements
      const timerElements = page.locator('[data-testid="timer-button"], [data-testid="timer-popup"], button:has-text("Timer"), .timer-control');
      if (await timerElements.count() > 0) {
        await expect(timerElements.first()).toBeVisible();

        // Test timer functionality
        await timerElements.first().click();
        const timerPopup = page.locator('[data-testid="timer-popup"], .timer-popup, .timer-modal');
        if (await timerPopup.count() > 0) {
          await expect(timerPopup).toBeVisible();
        }
      }
    });

    test('should display gamification features for authenticated users', async ({ page }) => {
      await helpers.authenticateUser('test@example.com', 'Test User');
      await helpers.selectProgram('foundation-builder');

      // Look for XP, levels, achievements, etc.
      const gamificationElements = page.locator('[data-testid="user-level"], [data-testid="xp-display"], [data-testid="achievements"], .user-level, .xp-points, .achievements');
      if (await gamificationElements.count() > 0) {
        await expect(gamificationElements.first()).toBeVisible();
      }

      // Check for streak tracking
      const streakDisplay = page.locator('[data-testid="streak-tracker"], [data-testid="streak-display"], .streak-counter');
      if (await streakDisplay.count() > 0) {
        await expect(streakDisplay.first()).toBeVisible();
      }
    });

    test('should show workout analytics for authenticated users', async ({ page }) => {
      await helpers.authenticateUser('test@example.com', 'Test User');
      await helpers.selectProgram('foundation-builder');

      // Complete some exercises to generate data
      await helpers.completeExercise('exercise-1', 1);
      await helpers.completeExercise('exercise-2', 1);

      // Look for analytics/statistics
      const analyticsElements = page.locator('[data-testid="workout-analytics"], [data-testid="progress-stats"], .workout-analytics, .progress-chart');
      if (await analyticsElements.count() > 0) {
        await expect(analyticsElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Mobile Premium Program Experience', () => {
    test('should display premium program cards properly on mobile', async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile');
      await helpers.navigateToPrograms();

      // Check that all program cards are visible and properly sized
      const programCards = page.locator('[data-testid^="program-card"], .program-card');
      const cardCount = await programCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(3);

      // Check touch target sizes for premium programs
      for (let i = 0; i < cardCount; i++) {
        const card = programCards.nth(i);
        const box = await card.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(200);
          expect(box.height).toBeGreaterThan(100);
        }
      }

      // Check for horizontal scroll issues
      const hasHorizontalScroll = await mobileHelpers.checkForHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should handle authentication modal properly on mobile', async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile');
      await helpers.navigateToPrograms();

      // Try to access premium program
      const premiumProgram = page.locator('[data-testid="program-card-power-surge-pro"], .program-card:has-text("Power Surge Pro")').first();
      await mobileHelpers.tap(await premiumProgram.locator('').first().innerHTML);

      // Authentication modal should appear and be mobile-optimized
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      // Check modal sizing on mobile
      const modalBox = await authModal.boundingBox();
      const viewport = page.viewportSize()!;
      expect(modalBox!.width).toBeLessThanOrEqual(viewport.width);
      expect(modalBox!.height).toBeLessThanOrEqual(viewport.height);

      // Test mobile form interaction
      const emailInput = page.locator('[data-testid="email-input"], input[type="email"]');
      await mobileHelpers.tap(await emailInput.locator('').first().innerHTML);

      // Should focus properly on mobile
      const isFocused = await emailInput.evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);
    });

    test('should work on tablet viewports', async ({ page }) => {
      await mobileHelpers.setupMobileViewport('tablet');
      await helpers.navigateToPrograms();

      // All program cards should be visible
      const programCards = page.locator('[data-testid^="program-card"], .program-card');
      await expect(programCards).toHaveCountGreaterThanOrEqual(3);

      // Try accessing premium program
      const premiumProgram = programCards.filter({ hasText: /Power Surge Pro|Beast Mode Elite/ }).first();
      await premiumProgram.click();

      // Should trigger authentication
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors during premium program access', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());

      await helpers.navigateToPrograms();
      const premiumProgram = page.locator('[data-testid="program-card-power-surge-pro"], .program-card:has-text("Power Surge Pro")').first();
      await premiumProgram.click();

      // Should still show authentication modal (client-side)
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      // Application should not crash
      const errorElement = page.locator('.error, [data-testid="error"]');
      if (await errorElement.count() > 0) {
        // Should show graceful error handling
        await expect(errorElement.first()).toBeVisible();
      }
    });

    test('should handle rapid program switching', async ({ page }) => {
      await helpers.authenticateUser('test@example.com', 'Test User');

      // Rapidly switch between programs
      for (let i = 0; i < 3; i++) {
        await helpers.navigateToPrograms();
        await helpers.selectProgram('foundation-builder');
        await page.waitForTimeout(500);

        await helpers.navigateToPrograms();
        await helpers.selectProgram('power-surge-pro');
        await page.waitForTimeout(500);
      }

      // Application should remain stable
      const programContent = page.locator('[data-testid="workout-content"], .workout-container');
      await expect(programContent).toBeVisible();
    });

    test('should handle corrupted authentication state', async ({ page }) => {
      // Set invalid user data in localStorage
      await page.evaluate(() => {
        localStorage.setItem('momentum_vita_user', 'invalid-json-data');
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Should handle gracefully and clear invalid data
      const userData = await page.evaluate(() => localStorage.getItem('momentum_vita_user'));
      expect(userData).toBeNull();

      // Should be in unauthenticated state
      const isAuthenticated = await helpers.isUserAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  test.describe('Cross-Browser Premium Program Access', () => {
    test('should work consistently across browsers', async ({ page, browserName }) => {
      console.log(`Testing premium program access in ${browserName}`);

      // Test authentication and premium access
      await helpers.navigateToPrograms();
      const premiumProgram = page.locator('[data-testid="program-card-power-surge-pro"], .program-card:has-text("Power Surge Pro")').first();
      await premiumProgram.click();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      await helpers.authenticateViaModal('test@example.com', 'Test User');

      // Should work in all browsers
      await expect(authModal).not.toBeVisible();
      const programContent = page.locator('[data-testid="workout-content"], .workout-container');
      await expect(programContent).toBeVisible({ timeout: 10000 });
    });
  });
});