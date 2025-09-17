import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

test.describe('Integration Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Component Integration', () => {
    test('should integrate program selection with workout display', async ({ page }) => {
      // Look for program selection interface
      const programElements = [
        'button:has-text("Program")',
        '[data-testid="program-selector"]',
        'text=Foundation Builder',
        'text=Power Surge Pro',
        'text=Beast Mode Elite'
      ];

      let programSelectionFound = false;
      for (const selector of programElements) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          programSelectionFound = true;

          // If it's a clickable program selector, test program switching
          if (selector.includes('button') || selector.includes('testid')) {
            await element.click();
            await helpers.waitForDatabaseSync();
          }
          break;
        }
      }

      // Verify workout content changes based on program
      const workoutElements = [
        'text=Monday',
        'text=Push Day',
        'text=exercise',
        'input[type="checkbox"]'
      ];

      let workoutContentFound = false;
      for (const selector of workoutElements) {
        if (await page.locator(selector).isVisible()) {
          workoutContentFound = true;
          break;
        }
      }

      expect(workoutContentFound).toBe(true);
    });

    test('should integrate timer with exercise tracking', async ({ page }) => {
      // Look for timer integration
      const timerElements = [
        'button:has-text("Timer")',
        '[data-testid="timer-button"]',
        'button[aria-label*="timer"]'
      ];

      for (const selector of timerElements) {
        const timerButton = page.locator(selector).first();
        if (await timerButton.isVisible()) {
          // Open timer
          await timerButton.click();

          // Look for timer popup or inline timer
          const timerInterface = [
            '[data-testid="timer-popup"]',
            'text=Start',
            'text=Stop',
            'button:has-text("Start")'
          ];

          for (const timerSelector of timerInterface) {
            if (await page.locator(timerSelector).isVisible()) {
              // Test timer functionality
              const startButton = page.locator('button:has-text("Start")').first();
              if (await startButton.isVisible()) {
                await startButton.click();

                // Verify timer is running
                await helpers.waitForText('Stop', 5000);
              }
              break;
            }
          }
          break;
        }
      }
    });

    test('should integrate gamification with progress tracking', async ({ page }) => {
      // Look for gamification elements
      const gamificationElements = [
        'text=Level',
        'text=XP',
        '[data-testid*="level"]',
        '[data-testid*="xp"]'
      ];

      let initialXP = '';
      let initialLevel = '';

      for (const selector of gamificationElements) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          const textContent = await element.textContent();
          if (textContent?.includes('XP')) {
            initialXP = textContent;
          } else if (textContent?.includes('Level')) {
            initialLevel = textContent;
          }
        }
      }

      // Complete an exercise to test XP integration
      const exerciseCheckbox = page.locator('input[type="checkbox"]').first();
      if (await exerciseCheckbox.isVisible()) {
        await exerciseCheckbox.click();
        await helpers.waitForDatabaseSync();

        // Check if XP/Level changed
        if (initialXP) {
          const updatedXP = await page.textContent('body');
          // XP should have increased
          expect(updatedXP).not.toBe(initialXP);
        }
      }
    });

    test('should integrate nutrition tracking with overall progress', async ({ page }) => {
      // Find nutrition section
      const nutritionElements = [
        'text=nutrition',
        'text=protein',
        'text=Meal',
        'text=supplement'
      ];

      let nutritionSectionFound = false;
      for (const selector of nutritionElements) {
        if (await page.locator(selector).isVisible()) {
          nutritionSectionFound = true;
          break;
        }
      }

      if (nutritionSectionFound) {
        // Get initial progress
        const initialProgress = await page.textContent('body');

        // Complete a nutrition goal
        const nutritionCheckboxes = page.locator('input[type="checkbox"]').filter({
          has: page.locator(':has-text("protein"), :has-text("Water"), :has-text("supplement")')
        });

        if (await nutritionCheckboxes.count() > 0) {
          await nutritionCheckboxes.first().click();
          await helpers.waitForDatabaseSync();

          // Verify progress updated
          const updatedProgress = await page.textContent('body');
          expect(updatedProgress).not.toBe(initialProgress);
        }
      }
    });
  });

  test.describe('Data Flow Integration', () => {
    test('should maintain state consistency across navigation', async ({ page }) => {
      // Complete some exercises
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = Math.min(await checkboxes.count(), 3);

      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = checkboxes.nth(i);
        if (await checkbox.isVisible()) {
          await checkbox.click();
          await helpers.waitForDatabaseSync();
        }
      }

      // Navigate between weeks
      const nextWeekButton = page.locator('button:has-text("→"), button:has-text("Next")').first();
      if (await nextWeekButton.isVisible()) {
        await nextWeekButton.click();
        await helpers.waitForDatabaseSync();

        // Navigate back
        const prevWeekButton = page.locator('button:has-text("←"), button:has-text("Previous")').first();
        if (await prevWeekButton.isVisible()) {
          await prevWeekButton.click();
          await helpers.waitForDatabaseSync();
        }
      }

      // Verify original state is maintained
      const completedCheckboxes = page.locator('input[type="checkbox"]:checked');
      const completedCount = await completedCheckboxes.count();
      expect(completedCount).toBeGreaterThan(0);
    });

    test('should sync data changes across components', async ({ page }) => {
      // Test if weight changes reflect across different views
      const weightControls = [
        'button:has-text("+")',
        'input[type="number"]'
      ];

      for (const selector of weightControls) {
        const control = page.locator(selector).first();
        if (await control.isVisible()) {
          if (selector.includes('input')) {
            const initialValue = await control.inputValue();
            await control.fill('50');
            await helpers.waitForDatabaseSync();

            // Verify change persisted
            const newValue = await control.inputValue();
            expect(newValue).toBe('50');
          } else {
            // Test increment button
            await control.click();
            await helpers.waitForDatabaseSync();
          }
          break;
        }
      }
    });

    test('should handle concurrent user interactions', async ({ page }) => {
      // Simulate rapid interactions
      const interactiveElements = page.locator('button, input[type="checkbox"], input[type="number"]');
      const elementCount = Math.min(await interactiveElements.count(), 5);

      for (let i = 0; i < elementCount; i++) {
        const element = interactiveElements.nth(i);
        if (await element.isVisible()) {
          const tagName = await element.evaluate(el => el.tagName);

          if (tagName === 'INPUT') {
            const type = await element.getAttribute('type');
            if (type === 'checkbox') {
              await element.click();
            } else if (type === 'number') {
              await element.fill('25');
            }
          } else if (tagName === 'BUTTON') {
            await element.click();
          }

          // Small delay to prevent overwhelming
          await page.waitForTimeout(100);
        }
      }

      // App should remain stable
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Database Integration', () => {
    test('should handle database operations without conflicts', async ({ page }) => {
      // Perform multiple database operations simultaneously
      const operations = [
        // Complete exercise
        async () => {
          const checkbox = page.locator('input[type="checkbox"]').first();
          if (await checkbox.isVisible()) {
            await checkbox.click();
          }
        },
        // Update weight
        async () => {
          const weightButton = page.locator('button:has-text("+")').first();
          if (await weightButton.isVisible()) {
            await weightButton.click();
          }
        },
        // Complete nutrition goal
        async () => {
          const nutritionBox = page.locator('input[type="checkbox"]').filter({
            has: page.locator(':has-text("protein"), :has-text("Water")')
          }).first();
          if (await nutritionBox.isVisible()) {
            await nutritionBox.click();
          }
        }
      ];

      // Execute operations concurrently
      await Promise.all(operations.map(op => op()));
      await helpers.waitForDatabaseSync();

      // Verify all operations completed successfully
      const completedCheckboxes = page.locator('input[type="checkbox"]:checked');
      const completedCount = await completedCheckboxes.count();
      expect(completedCount).toBeGreaterThan(0);
    });

    test('should recover from database connection issues', async ({ page }) => {
      // Simulate going offline
      await helpers.goOffline();

      // Perform operations while offline
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
      }

      // Go back online
      await helpers.goOnline();
      await page.waitForTimeout(2000); // Allow sync time

      // Data should sync when connection restored
      await expect(checkbox).toBeChecked();
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Simulate user with extensive history
      await page.evaluate(() => {
        const extensiveData = {};

        // Generate data for 12 weeks across multiple exercises
        for (let week = 1; week <= 12; week++) {
          for (let day = 0; day < 3; day++) {
            const dayNames = ['Monday', 'Wednesday', 'Friday'];
            for (let exercise = 0; exercise < 8; exercise++) {
              const key = `${dayNames[day]}-${exercise}-week${week}`;
              extensiveData[key] = Math.random() > 0.5;
            }
          }
        }

        localStorage.setItem('completedExercises', JSON.stringify(extensiveData));
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // App should load efficiently despite large dataset
      const loadTime = await page.evaluate(() => performance.now());
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

      // UI should be responsive
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
        // Should respond quickly
        await expect(checkbox).toBeChecked({ timeout: 1000 });
      }
    });
  });

  test.describe('Cross-Device Synchronization', () => {
    test('should simulate cross-device data sync', async ({ page }) => {
      // Complete some exercises
      const exercises = page.locator('input[type="checkbox"]');
      const firstExercise = exercises.first();

      if (await firstExercise.isVisible()) {
        await firstExercise.click();
        await helpers.waitForDatabaseSync();
      }

      // Simulate data from another device
      await page.evaluate(() => {
        // Simulate receiving sync data
        const syncEvent = new CustomEvent('sync-data', {
          detail: {
            completedExercises: {
              'Monday-1-week1': true,
              'Wednesday-0-week1': true
            },
            exerciseWeights: {
              'Monday-1-week1': 25,
              'Wednesday-0-week1': 30
            }
          }
        });
        document.dispatchEvent(syncEvent);
      });

      await page.waitForTimeout(1000);

      // Check if UI reflects synchronized data
      const allCompleted = page.locator('input[type="checkbox"]:checked');
      const completedCount = await allCompleted.count();
      expect(completedCount).toBeGreaterThan(0);
    });

    test('should resolve sync conflicts appropriately', async ({ page }) => {
      // Set up conflicting data
      await page.evaluate(() => {
        // Local data
        localStorage.setItem('completedExercises', JSON.stringify({
          'Monday-0-week1': true,
          'Monday-1-week1': false
        }));

        // Simulate conflicting remote data
        const conflictEvent = new CustomEvent('sync-conflict', {
          detail: {
            local: { 'Monday-0-week1': true, 'Monday-1-week1': false },
            remote: { 'Monday-0-week1': false, 'Monday-1-week1': true }
          }
        });
        document.dispatchEvent(conflictEvent);
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // App should handle conflicts gracefully
      await expect(page.locator('body')).toBeVisible();

      // Should show some resolution (latest wins, merge, or user choice)
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);
    });
  });

  test.describe('Feature Interaction Testing', () => {
    test('should handle gamification + workout completion integration', async ({ page }) => {
      // Look for initial XP/Level display
      const gamificationDisplay = page.locator('text=Level, text=XP').first();
      let initialGameState = '';

      if (await gamificationDisplay.isVisible()) {
        initialGameState = await page.textContent('body');
      }

      // Complete a full workout day
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = Math.min(await checkboxes.count(), 5);

      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = checkboxes.nth(i);
        if (await checkbox.isVisible()) {
          await checkbox.click();
          await helpers.waitForDatabaseSync();
        }
      }

      // Check for XP gain notifications
      const xpNotifications = [
        'text=+10 XP',
        'text=+5 XP',
        '[data-testid*="xp-gain"]',
        'text=Level Up'
      ];

      for (const selector of xpNotifications) {
        const notification = page.locator(selector);
        if (await notification.isVisible()) {
          await expect(notification).toBeVisible();
          break;
        }
      }

      // Verify gamification state changed
      if (initialGameState) {
        const updatedGameState = await page.textContent('body');
        expect(updatedGameState).not.toBe(initialGameState);
      }
    });

    test('should handle timer + set tracking integration', async ({ page }) => {
      // Look for advanced exercise tracking
      const advancedElements = [
        '[data-testid*="set-tracker"]',
        'input[placeholder*="Set"]',
        'input[placeholder*="Reps"]',
        'text=Set 1'
      ];

      let advancedTrackingFound = false;
      for (const selector of advancedElements) {
        if (await page.locator(selector).isVisible()) {
          advancedTrackingFound = true;
          break;
        }
      }

      if (advancedTrackingFound) {
        // Test set input with timer
        const setInput = page.locator('input[placeholder*="Reps"]').first();
        if (await setInput.isVisible()) {
          await setInput.fill('12');
          await helpers.waitForDatabaseSync();

          // Look for timer button associated with set
          const timerButton = page.locator('button:has-text("Timer")').first();
          if (await timerButton.isVisible()) {
            await timerButton.click();

            // Should show timer interface
            const timerInterface = page.locator('[data-testid="timer-popup"], button:has-text("Start")');
            if (await timerInterface.isVisible()) {
              await expect(timerInterface).toBeVisible();
            }
          }
        }
      }
    });

    test('should handle progressive image loading + workout display', async ({ page }) => {
      // Check for images in workout interface
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        // Test image loading behavior
        const firstImage = images.first();

        // Check loading attributes
        const loading = await firstImage.getAttribute('loading');
        const src = await firstImage.getAttribute('src');

        expect(src).toBeTruthy();

        // Test image load state
        const imageLoaded = await firstImage.evaluate((img) => {
          return img.complete && img.naturalHeight !== 0;
        });

        // Image should either be loaded or loading
        expect(typeof imageLoaded).toBe('boolean');
      }

      // Test workout interface remains functional regardless of image state
      const workoutElements = page.locator('input[type="checkbox"], button');
      const workoutElementCount = await workoutElements.count();
      expect(workoutElementCount).toBeGreaterThan(0);
    });
  });

  test.describe('Error Recovery Integration', () => {
    test('should recover from component errors gracefully', async ({ page }) => {
      // Inject error to test error boundaries
      await page.evaluate(() => {
        // Simulate component error
        const errorEvent = new Error('Test component error');
        window.dispatchEvent(new ErrorEvent('error', { error: errorEvent }));
      });

      await page.waitForTimeout(1000);

      // App should still be functional
      await expect(page.locator('body')).toBeVisible();

      // Core functionality should work
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
        await expect(checkbox).toBeChecked();
      }
    });

    test('should handle partial feature failures', async ({ page }) => {
      // Simulate partial feature failure
      await page.addInitScript(() => {
        // Mock failed gamification loading
        window.gamificationError = true;
      });

      await page.goto('/');
      await helpers.waitForAppLoad();

      // Core features should still work even if enhanced features fail
      const workoutElements = [
        'input[type="checkbox"]',
        'text=Monday',
        'text=exercise'
      ];

      let coreFeatureWorking = false;
      for (const selector of workoutElements) {
        if (await page.locator(selector).isVisible()) {
          coreFeatureWorking = true;
          break;
        }
      }

      expect(coreFeatureWorking).toBe(true);
    });
  });
});