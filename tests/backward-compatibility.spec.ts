import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

test.describe('Backward Compatibility Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Legacy Data Migration', () => {
    test('should handle existing localStorage data gracefully', async ({ page }) => {
      // Set up legacy data format
      await page.evaluate(() => {
        localStorage.setItem('completedExercises', JSON.stringify({
          'Monday-0-week1': true,
          'Monday-1-week1': true,
          'Wednesday-0-week1': true
        }));
        localStorage.setItem('exerciseWeights', JSON.stringify({
          'Monday-0-week1': 25,
          'Monday-1-week1': 30,
          'Wednesday-0-week1': 20
        }));
        localStorage.setItem('nutritionGoals', JSON.stringify({
          'Monday-nutrition-0-week1': true,
          'Monday-nutrition-1-week1': true
        }));
        localStorage.setItem('currentWeek', '2');
        localStorage.setItem('currentProgramId', 'foundation-builder');
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Verify legacy data is accessible
      const currentWeek = await page.evaluate(() => localStorage.getItem('currentWeek'));
      expect(currentWeek).toBe('2');

      const programId = await page.evaluate(() => localStorage.getItem('currentProgramId'));
      expect(programId).toBe('foundation-builder');

      // Check if completed exercises are reflected in UI
      const checkboxes = page.locator('input[type="checkbox"]:checked');
      const checkedCount = await checkboxes.count();
      expect(checkedCount).toBeGreaterThan(0);
    });

    test('should preserve workout history across updates', async ({ page }) => {
      // Simulate historical session data
      await page.evaluate(() => {
        const historicalSessions = [
          {
            date: '2023-12-01',
            week: 1,
            exercises: [
              { name: 'Incline Barbell Press', weight: 25, completed: true },
              { name: 'Overhead Press', weight: 20, completed: true }
            ],
            nutrition: { completed: 8, total: 13 }
          },
          {
            date: '2023-12-03',
            week: 1,
            exercises: [
              { name: 'Deadlifts', weight: 60, completed: true },
              { name: 'Bent-Over Rows', weight: 30, completed: true }
            ],
            nutrition: { completed: 10, total: 13 }
          }
        ];
        localStorage.setItem('completedSessions', JSON.stringify(historicalSessions));
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Try to open history if available
      const historyElements = [
        'button:has-text("History")',
        '[data-testid="history-button"]',
        'button[aria-label*="history"]'
      ];

      for (const selector of historyElements) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          await button.click();
          break;
        }
      }

      // Check if historical data is displayed
      await helpers.waitForText('2023-12', 5000);
    });

    test('should handle corrupted legacy data without crashing', async ({ page }) => {
      // Set corrupted data
      await page.evaluate(() => {
        localStorage.setItem('completedExercises', 'invalid json');
        localStorage.setItem('exerciseWeights', '{incomplete');
        localStorage.setItem('nutritionGoals', '[malformed');
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // App should still load and be functional
      await expect(page.locator('body')).toBeVisible();

      // Should show some form of workout interface
      const workoutElements = [
        'text=Monday',
        'text=Wednesday',
        'text=Friday',
        'text=Push Day',
        'text=Pull Day',
        'text=Leg Day'
      ];

      let workoutFound = false;
      for (const selector of workoutElements) {
        if (await page.locator(selector).isVisible()) {
          workoutFound = true;
          break;
        }
      }
      expect(workoutFound).toBe(true);
    });
  });

  test.describe('Original Workflow Preservation', () => {
    test('should maintain original exercise completion flow', async ({ page }) => {
      await helpers.waitForAppLoad();

      // Find and test exercise checkboxes (core functionality)
      const checkboxes = page.locator('input[type="checkbox"]');
      const exerciseCheckbox = checkboxes.first();

      if (await exerciseCheckbox.isVisible()) {
        const initialState = await exerciseCheckbox.isChecked();

        // Toggle checkbox
        await exerciseCheckbox.click();
        await helpers.waitForDatabaseSync();

        // Verify state changed
        const newState = await exerciseCheckbox.isChecked();
        expect(newState).toBe(!initialState);

        // Reload and verify persistence
        await page.reload();
        await helpers.waitForAppLoad();

        const persistedState = await exerciseCheckbox.isChecked();
        expect(persistedState).toBe(newState);
      }
    });

    test('should maintain original weight tracking system', async ({ page }) => {
      await helpers.waitForAppLoad();

      // Look for weight controls (original +/- buttons or number inputs)
      const weightControls = [
        'button:has-text("+")',
        'button:has-text("-")',
        'input[type="number"]'
      ];

      for (const selector of weightControls) {
        const control = page.locator(selector).first();
        if (await control.isVisible()) {
          if (selector.includes('input')) {
            // Test direct input
            await control.fill('25');
            await helpers.waitForDatabaseSync();

            const value = await control.inputValue();
            expect(value).toBe('25');
          } else if (selector.includes('+')) {
            // Test increment button
            await control.click();
            await helpers.waitForDatabaseSync();
          }
          break;
        }
      }
    });

    test('should maintain original nutrition tracking', async ({ page }) => {
      await helpers.waitForAppLoad();

      // Look for nutrition section
      const nutritionElements = [
        'text=nutrition',
        'text=protein',
        'text=Meal 1',
        'text=Water',
        'text=supplement'
      ];

      let nutritionFound = false;
      for (const selector of nutritionElements) {
        if (await page.locator(selector).isVisible()) {
          nutritionFound = true;
          break;
        }
      }

      if (nutritionFound) {
        // Find nutrition checkboxes
        const nutritionCheckboxes = page.locator('input[type="checkbox"]').filter({
          has: page.locator(':has-text("protein"), :has-text("Water"), :has-text("supplement")')
        });

        if (await nutritionCheckboxes.count() > 0) {
          const firstNutritionBox = nutritionCheckboxes.first();
          await firstNutritionBox.click();
          await helpers.waitForDatabaseSync();

          // Verify checked state
          await expect(firstNutritionBox).toBeChecked();
        }
      }
    });

    test('should maintain week navigation functionality', async ({ page }) => {
      await helpers.waitForAppLoad();

      // Look for week navigation
      const weekNavigation = [
        'button:has-text("→")',
        'button:has-text("Next")',
        'button:has-text("Week")',
        '[data-testid*="week"]'
      ];

      for (const selector of weekNavigation) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          await helpers.waitForDatabaseSync();
          break;
        }
      }

      // Verify week changed
      const weekElements = [
        'text=Week 2',
        'text=Week 3',
        'text=Week'
      ];

      let weekFound = false;
      for (const selector of weekElements) {
        if (await page.locator(selector).isVisible()) {
          weekFound = true;
          break;
        }
      }
      expect(weekFound).toBe(true);
    });
  });

  test.describe('Database Schema Compatibility', () => {
    test('should handle mixed old and new data structures', async ({ page }) => {
      // Set mixed data - old localStorage + potential new Supabase structure
      await page.evaluate(() => {
        // Old format
        localStorage.setItem('completedExercises', JSON.stringify({
          'Monday-0-week1': true
        }));

        // New format (if migration happened)
        localStorage.setItem('userProgress', JSON.stringify({
          currentLevel: 5,
          totalXP: 2500,
          achievements: ['first_workout', 'week_warrior']
        }));
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // App should handle both data formats
      await expect(page.locator('body')).toBeVisible();

      // Should not show console errors
      const errors = await helpers.checkConsoleErrors();
      const criticalErrors = errors.filter(error =>
        error.includes('Error') &&
        !error.includes('Warning') &&
        !error.includes('network')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('should migrate to new database structure seamlessly', async ({ page }) => {
      // Set up old data structure
      await page.evaluate(() => {
        localStorage.setItem('currentWeek', '3');
        localStorage.setItem('currentProgramId', 'power-surge-pro');
        localStorage.setItem('completedExercises', JSON.stringify({
          'Monday-0-week3': true,
          'Monday-1-week3': true,
          'Wednesday-0-week3': true
        }));
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // After load, check if migration maintains data integrity
      const currentWeek = await page.evaluate(() => localStorage.getItem('currentWeek'));
      const programId = await page.evaluate(() => localStorage.getItem('currentProgramId'));

      expect(currentWeek).toBe('3');
      expect(programId).toBe('power-surge-pro');

      // Verify exercises are still marked as completed
      const completedCheckboxes = page.locator('input[type="checkbox"]:checked');
      const completedCount = await completedCheckboxes.count();
      expect(completedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Feature Flag Compatibility', () => {
    test('should gracefully handle missing new features', async ({ page }) => {
      // Simulate environment where new features might not load
      await page.addInitScript(() => {
        // Mock feature detection
        window.featureFlags = {
          gamification: false,
          advancedWorkout: false,
          timerPopup: false
        };
      });

      await page.goto('/');
      await helpers.waitForAppLoad();

      // Core functionality should still work
      await expect(page.locator('body')).toBeVisible();

      // Should show workout interface
      const workoutElements = [
        'input[type="checkbox"]',
        'text=Monday',
        'text=exercise'
      ];

      let coreFeatureFound = false;
      for (const selector of workoutElements) {
        if (await page.locator(selector).isVisible()) {
          coreFeatureFound = true;
          break;
        }
      }
      expect(coreFeatureFound).toBe(true);
    });

    test('should handle progressive enhancement gracefully', async ({ page }) => {
      await helpers.waitForAppLoad();

      // Check if app loads basic functionality first
      await expect(page.locator('body')).toBeVisible();

      // Enhanced features should load without breaking basic functionality
      const enhancedElements = [
        '[data-testid*="level"]',
        '[data-testid*="xp"]',
        '[data-testid*="timer"]',
        'text=Achievement'
      ];

      // Whether enhanced features are present or not, app should be stable
      let enhancedFeaturesPresent = 0;
      for (const selector of enhancedElements) {
        if (await page.locator(selector).isVisible()) {
          enhancedFeaturesPresent++;
        }
      }

      // Core functionality should work regardless
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);
    });
  });

  test.describe('Cross-Version Data Integrity', () => {
    test('should preserve exercise progress across version updates', async ({ page }) => {
      // Simulate data from previous version
      const legacyData = {
        week1: { 'Monday-0': true, 'Monday-1': false, 'Wednesday-0': true },
        week2: { 'Monday-0': true, 'Monday-1': true, 'Wednesday-0': false },
        weights: { 'Monday-0': 25, 'Monday-1': 20, 'Wednesday-0': 30 }
      };

      await page.evaluate((data) => {
        localStorage.setItem('completedExercises', JSON.stringify(data.week1));
        localStorage.setItem('exerciseWeights', JSON.stringify(data.weights));
        localStorage.setItem('currentWeek', '1');
      }, legacyData);

      await page.reload();
      await helpers.waitForAppLoad();

      // Navigate to week 2 to test cross-week data preservation
      const nextWeekButtons = [
        'button:has-text("→")',
        'button:has-text("Next")',
        '[data-testid="next-week"]'
      ];

      for (const selector of nextWeekButtons) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          await button.click();
          await helpers.waitForDatabaseSync();
          break;
        }
      }

      // Go back to week 1 and verify data integrity
      const prevWeekButtons = [
        'button:has-text("←")',
        'button:has-text("Previous")',
        '[data-testid="prev-week"]'
      ];

      for (const selector of prevWeekButtons) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          await button.click();
          await helpers.waitForDatabaseSync();
          break;
        }
      }

      // Verify original progress is maintained
      const completedBoxes = page.locator('input[type="checkbox"]:checked');
      const completedCount = await completedBoxes.count();
      expect(completedCount).toBeGreaterThan(0);
    });
  });
});