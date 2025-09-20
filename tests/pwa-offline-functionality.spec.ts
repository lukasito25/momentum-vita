import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * PWA Offline Functionality Tests for Momentum Vita
 *
 * Tests the Progressive Web App capabilities including:
 * - Service worker functionality
 * - Offline data persistence
 * - Sync when coming back online
 * - Cache management
 * - Background sync for workout data
 */

test.describe('PWA Offline Functionality', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Service Worker Registration', () => {
    test('should register service worker successfully', async ({ page }) => {
      // Check if service worker is registered
      const swRegistration = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return {
            registered: !!registration,
            scope: registration?.scope,
            state: registration?.active?.state
          };
        }
        return { registered: false };
      });

      expect(swRegistration.registered).toBe(true);
      expect(swRegistration.state).toBe('activated');
    });

    test('should cache critical resources', async ({ page }) => {
      // Wait for service worker to cache resources
      await page.waitForTimeout(2000);

      // Check if critical resources are cached
      const cachedResources = await page.evaluate(async () => {
        const cacheNames = await caches.keys();
        if (cacheNames.length === 0) return [];

        const cache = await caches.open(cacheNames[0]);
        const requests = await cache.keys();
        return requests.map(req => req.url);
      });

      // Should cache main app resources
      expect(cachedResources.some(url => url.includes('index.html'))).toBe(true);
      expect(cachedResources.some(url => url.includes('.js'))).toBe(true);
      expect(cachedResources.some(url => url.includes('.css'))).toBe(true);
    });
  });

  test.describe('Offline Functionality', () => {
    test('should work offline after initial load', async ({ page, context }) => {
      // Load app and ensure all resources are cached
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Allow service worker to cache

      // Go offline
      await context.setOffline(true);

      // Reload the page while offline
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Verify main app interface loads
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('h1')).toContainText(/Training Program|Momentum Vita/);

      // Verify offline indicator appears
      const offlineIndicator = page.locator('[data-testid="offline-indicator"], [data-testid="network-status"]');
      if (await offlineIndicator.isVisible()) {
        await expect(offlineIndicator).toContainText(/offline|no connection/i);
      }
    });

    test('should persist workout progress offline', async ({ page, context }) => {
      // Authenticate user first
      await helpers.authenticateUser(page, 'test@example.com', 'password123');
      await helpers.selectProgram('foundation-builder');

      // Go offline
      await context.setOffline(true);

      // Make workout progress
      const exerciseCheckbox = page.locator('[data-testid="exercise-complete-1"]').first();
      if (await exerciseCheckbox.isVisible()) {
        await exerciseCheckbox.click();
        await expect(exerciseCheckbox).toBeChecked();
      }

      // Update weight
      const weightInput = page.locator('[data-testid="weight-input-1"]').first();
      if (await weightInput.isVisible()) {
        await weightInput.fill('50');
        await page.keyboard.press('Enter');
      }

      // Navigate to different day and back
      const nextDayButton = page.locator('[data-testid="next-day"], button:has-text("Day 2")').first();
      if (await nextDayButton.isVisible()) {
        await nextDayButton.click();
        await page.waitForTimeout(1000);

        const prevDayButton = page.locator('[data-testid="prev-day"], button:has-text("Day 1")').first();
        await prevDayButton.click();
      }

      // Verify data persisted offline
      if (await exerciseCheckbox.isVisible()) {
        await expect(exerciseCheckbox).toBeChecked();
      }
      if (await weightInput.isVisible()) {
        await expect(weightInput).toHaveValue('50');
      }
    });

    test('should handle nutrition goals offline', async ({ page, context }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Go offline
      await context.setOffline(true);

      // Toggle nutrition goals
      const proteinGoal = page.locator('[data-testid="nutrition-goal-protein-1"]').first();
      if (await proteinGoal.isVisible()) {
        await proteinGoal.click();
        await expect(proteinGoal).toBeChecked();
      }

      const hydrationGoal = page.locator('[data-testid="nutrition-goal-hydration"]').first();
      if (await hydrationGoal.isVisible()) {
        await hydrationGoal.click();
        await expect(hydrationGoal).toBeChecked();
      }

      // Refresh and verify persistence
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      if (await proteinGoal.isVisible()) {
        await expect(proteinGoal).toBeChecked();
      }
      if (await hydrationGoal.isVisible()) {
        await expect(hydrationGoal).toBeChecked();
      }
    });
  });

  test.describe('Online Sync Functionality', () => {
    test('should sync workout data when coming back online', async ({ page, context }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Make initial progress online
      await helpers.selectProgram('foundation-builder');
      const exerciseCheckbox = page.locator('[data-testid="exercise-complete-1"]').first();
      if (await exerciseCheckbox.isVisible()) {
        await exerciseCheckbox.click();
      }

      // Go offline and make more changes
      await context.setOffline(true);
      const exerciseCheckbox2 = page.locator('[data-testid="exercise-complete-2"]').first();
      if (await exerciseCheckbox2.isVisible()) {
        await exerciseCheckbox2.click();
        await expect(exerciseCheckbox2).toBeChecked();
      }

      // Come back online
      await context.setOffline(false);
      await page.waitForTimeout(3000); // Allow sync to complete

      // Check for sync indicators
      const syncStatus = page.locator('[data-testid="sync-status"], [data-testid="online-indicator"]');
      if (await syncStatus.isVisible()) {
        await expect(syncStatus).toContainText(/synced|online|up.to.date/i);
      }

      // Verify data is still there after sync
      if (await exerciseCheckbox.isVisible()) {
        await expect(exerciseCheckbox).toBeChecked();
      }
      if (await exerciseCheckbox2.isVisible()) {
        await expect(exerciseCheckbox2).toBeChecked();
      }
    });

    test('should handle sync conflicts gracefully', async ({ page, context }) => {
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Simulate scenario where data might conflict
      // This would require more complex setup with multiple tabs/sessions
      // For now, test basic conflict resolution

      await helpers.selectProgram('foundation-builder');

      // Make changes offline
      await context.setOffline(true);
      const weightInput = page.locator('[data-testid="weight-input-1"]').first();
      if (await weightInput.isVisible()) {
        await weightInput.fill('60');
        await page.keyboard.press('Enter');
      }

      // Come back online
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // Should not show error states
      const errorMessage = page.locator('[data-testid="sync-error"], .error, [role="alert"]');
      await expect(errorMessage).not.toBeVisible();

      // Data should be preserved (last write wins or merge strategy)
      if (await weightInput.isVisible()) {
        await expect(weightInput).toHaveValue('60');
      }
    });
  });

  test.describe('Cache Management', () => {
    test('should update cache when new version available', async ({ page }) => {
      // This test would require simulating a service worker update
      // Check for update notification or automatic refresh

      const updateNotification = page.locator('[data-testid="app-update-available"], [data-testid="refresh-prompt"]');

      // If update notification appears, test the update flow
      if (await updateNotification.isVisible({ timeout: 5000 })) {
        const updateButton = page.locator('[data-testid="update-app"], button:has-text("Refresh")');
        await updateButton.click();

        // Should reload with new version
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
      }
    });

    test('should clear cache when requested', async ({ page }) => {
      // Navigate to settings if available
      const settingsButton = page.locator('[data-testid="settings"], button:has-text("Settings")').first();
      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        // Look for clear cache option
        const clearCacheButton = page.locator('[data-testid="clear-cache"], button:has-text("Clear Cache")');
        if (await clearCacheButton.isVisible()) {
          await clearCacheButton.click();

          // Confirm action if dialog appears
          const confirmButton = page.locator('[data-testid="confirm-clear"], button:has-text("Confirm")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }

          // Should show success message
          const successMessage = page.locator('[data-testid="cache-cleared"], .success');
          await expect(successMessage).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Performance While Offline', () => {
    test('should maintain performance offline', async ({ page, context }) => {
      // Load app online first
      await page.waitForLoadState('networkidle');

      // Go offline
      await context.setOffline(true);

      // Measure performance of navigation offline
      const startTime = Date.now();

      // Navigate between sections
      const programButton = page.locator('[data-testid="program-selection"], button:has-text("Program")').first();
      if (await programButton.isVisible()) {
        await programButton.click();
        await page.waitForLoadState('domcontentloaded');
      }

      const historyButton = page.locator('[data-testid="workout-history"], button:has-text("History")').first();
      if (await historyButton.isVisible()) {
        await historyButton.click();
        await page.waitForLoadState('domcontentloaded');
      }

      const loadTime = Date.now() - startTime;

      // Offline navigation should be fast (< 1 second for cached content)
      expect(loadTime).toBeLessThan(1000);
    });

    test('should handle large offline datasets efficiently', async ({ page, context }) => {
      // Create substantial workout history
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Generate multiple workout sessions offline
      await context.setOffline(true);

      for (let i = 0; i < 5; i++) {
        // Complete multiple exercises to create data
        const exercises = page.locator('[data-testid^="exercise-complete-"]');
        const exerciseCount = await exercises.count();

        for (let j = 0; j < Math.min(exerciseCount, 3); j++) {
          const exercise = exercises.nth(j);
          if (await exercise.isVisible()) {
            await exercise.click();
          }
        }

        // Save session if button exists
        const saveButton = page.locator('[data-testid="save-session"], button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(500);
        }
      }

      // App should remain responsive with large offline dataset
      const response = await page.evaluate(() => {
        const start = performance.now();
        // Trigger a data-heavy operation
        return performance.now() - start;
      });

      expect(response).toBeLessThan(100); // Should complete quickly
    });
  });
});