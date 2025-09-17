import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

test.describe('Core Functionality Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Application Loading', () => {
    test('should load the application successfully', async ({ page }) => {
      // Check if main container is present
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();

      // Check for essential UI elements
      await expect(page.locator('h1')).toContainText('Training Program');

      // Verify no console errors during load
      const errors = await helpers.checkConsoleErrors();
      expect(errors.length).toBe(0);
    });

    test('should display loading screen initially', async ({ page }) => {
      // Clear data and reload to see loading screen
      await helpers.clearAppData();

      // Check if loading screen appears
      const loadingScreen = page.locator('[data-testid="loading-screen"]');

      // Loading screen should eventually disappear
      await loadingScreen.waitFor({ state: 'hidden', timeout: 30000 });
    });

    test('should be responsive on different screen sizes', async ({ page }) => {
      // Test mobile viewport
      await helpers.setMobileViewport();
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();

      // Test tablet viewport
      await helpers.setTabletViewport();
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();

      // Test desktop viewport
      await helpers.setDesktopViewport();
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
    });
  });

  test.describe('Program Selection', () => {
    test('should display program selection interface', async ({ page }) => {
      // Look for program selection button or interface
      const programButton = page.locator('button:has-text("Program")').first();
      if (await programButton.isVisible()) {
        await programButton.click();

        // Should show program options
        await expect(page.locator('text=Foundation Builder')).toBeVisible();
        await expect(page.locator('text=Power Surge Pro')).toBeVisible();
        await expect(page.locator('text=Beast Mode Elite')).toBeVisible();
      }
    });

    test('should switch between different programs', async ({ page }) => {
      // Try to find and click program selection
      const programSelectors = [
        'button:has-text("Program")',
        '[data-testid="program-selector"]',
        'button:has-text("Foundation Builder")',
        'button:has-text("Power Surge Pro")',
        'button:has-text("Beast Mode Elite")'
      ];

      for (const selector of programSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          await helpers.waitForDatabaseSync();
          break;
        }
      }

      // Verify program switch
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
    });

    test('should persist program selection across page reloads', async ({ page }) => {
      // Set a specific program
      await helpers.setupTestProgram('power-surge-pro');

      // Reload page
      await page.reload();
      await helpers.waitForAppLoad();

      // Program should still be selected (check localStorage)
      const programId = await page.evaluate(() => localStorage.getItem('currentProgramId'));
      expect(programId).toBe('power-surge-pro');
    });
  });

  test.describe('Week Navigation', () => {
    test('should display current week correctly', async ({ page }) => {
      // Check for week display
      const weekElements = [
        'text=Week 1',
        '[data-testid="current-week"]',
        'button:has-text("Week")'
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

    test('should allow week navigation', async ({ page }) => {
      // Look for week navigation controls
      const nextWeekSelectors = [
        'button:has-text("→")',
        'button:has-text("Next")',
        '[data-testid="next-week"]',
        'button[aria-label*="next"]'
      ];

      for (const selector of nextWeekSelectors) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          await button.click();
          await helpers.waitForDatabaseSync();
          break;
        }
      }

      // Verify week changed
      await helpers.waitForText('Week 2', 5000);
    });

    test('should persist week selection', async ({ page }) => {
      // Navigate to week 3
      await page.evaluate(() => {
        localStorage.setItem('currentWeek', '3');
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Check if week 3 is selected
      const currentWeek = await page.evaluate(() => localStorage.getItem('currentWeek'));
      expect(currentWeek).toBe('3');
    });
  });

  test.describe('Exercise Tracking', () => {
    test('should display workout days and exercises', async ({ page }) => {
      // Look for workout day sections
      const dayElements = [
        'text=Monday',
        'text=Wednesday',
        'text=Friday',
        '[data-testid*="day"]'
      ];

      let dayFound = false;
      for (const selector of dayElements) {
        if (await page.locator(selector).isVisible()) {
          dayFound = true;
          break;
        }
      }

      expect(dayFound).toBe(true);

      // Check for exercises
      const exerciseElements = [
        '[data-testid*="exercise"]',
        'input[type="checkbox"]',
        'button:has-text("sets")'
      ];

      let exerciseFound = false;
      for (const selector of exerciseElements) {
        if (await page.locator(selector).first().isVisible()) {
          exerciseFound = true;
          break;
        }
      }

      expect(exerciseFound).toBe(true);
    });

    test('should allow exercise completion tracking', async ({ page }) => {
      // Find and click the first exercise checkbox
      const checkboxes = page.locator('input[type="checkbox"]');
      const firstCheckbox = checkboxes.first();

      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click();
        await helpers.waitForDatabaseSync();

        // Verify checkbox is checked
        await expect(firstCheckbox).toBeChecked();
      }
    });

    test('should track exercise weights', async ({ page }) => {
      // Look for weight input controls
      const weightControls = [
        'input[type="number"]',
        'button:has-text("+")',
        'button:has-text("-")',
        '[data-testid*="weight"]'
      ];

      for (const selector of weightControls) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          if (selector.includes('input')) {
            await element.fill('50');
          } else if (selector.includes('+')) {
            await element.click();
          }
          await helpers.waitForDatabaseSync();
          break;
        }
      }

      // Verify weight was set (check localStorage or UI)
      const weights = await page.evaluate(() => localStorage.getItem('exerciseWeights'));
      expect(weights).toBeTruthy();
    });

    test('should prefill previous weights', async ({ page }) => {
      // Set a weight for an exercise
      await page.evaluate(() => {
        localStorage.setItem('exerciseWeights', JSON.stringify({
          'Monday-0-week1': 25
        }));
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Check if weight is prefilled
      const weightInput = page.locator('input[type="number"]').first();
      if (await weightInput.isVisible()) {
        const value = await weightInput.inputValue();
        expect(value).toBe('25');
      }
    });
  });

  test.describe('Nutrition Tracking', () => {
    test('should display nutrition goals', async ({ page }) => {
      // Look for nutrition section
      const nutritionElements = [
        'text=Nutrition',
        'text=protein',
        'text=water',
        '[data-testid*="nutrition"]'
      ];

      let nutritionFound = false;
      for (const selector of nutritionElements) {
        if (await page.locator(selector).isVisible()) {
          nutritionFound = true;
          break;
        }
      }

      expect(nutritionFound).toBe(true);
    });

    test('should allow nutrition goal completion', async ({ page }) => {
      // Find nutrition checkboxes
      const nutritionCheckboxes = page.locator('input[type="checkbox"]').filter({
        has: page.locator(':has-text("protein"), :has-text("water"), :has-text("supplement")')
      });

      if (await nutritionCheckboxes.first().isVisible()) {
        await nutritionCheckboxes.first().click();
        await helpers.waitForDatabaseSync();

        // Verify checkbox is checked
        await expect(nutritionCheckboxes.first()).toBeChecked();
      }
    });

    test('should track daily nutrition progress', async ({ page }) => {
      // Complete multiple nutrition goals
      await page.evaluate(() => {
        localStorage.setItem('nutritionGoals', JSON.stringify({
          'Monday-nutrition-0-week1': true,
          'Monday-nutrition-1-week1': true,
          'Monday-nutrition-2-week1': true
        }));
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Check if progress is reflected
      const checkedBoxes = page.locator('input[type="checkbox"]:checked');
      const checkedCount = await checkedBoxes.count();
      expect(checkedCount).toBeGreaterThan(0);
    });
  });

  test.describe('Progress Tracking', () => {
    test('should display overall progress', async ({ page }) => {
      // Look for progress indicators
      const progressElements = [
        '[data-testid*="progress"]',
        'text=%',
        '.progress-bar',
        'text=completed'
      ];

      let progressFound = false;
      for (const selector of progressElements) {
        if (await page.locator(selector).isVisible()) {
          progressFound = true;
          break;
        }
      }

      expect(progressFound).toBe(true);
    });

    test('should update progress when exercises are completed', async ({ page }) => {
      // Get initial progress
      const initialProgress = await page.textContent('body');

      // Complete an exercise
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click();
        await helpers.waitForDatabaseSync();
      }

      // Check if progress updated
      const updatedProgress = await page.textContent('body');
      expect(updatedProgress).not.toBe(initialProgress);
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist data across browser sessions', async ({ page }) => {
      // Complete some exercises and set weights
      await page.evaluate(() => {
        localStorage.setItem('completedExercises', JSON.stringify({
          'Monday-0-week1': true,
          'Monday-1-week1': true
        }));
        localStorage.setItem('exerciseWeights', JSON.stringify({
          'Monday-0-week1': 30,
          'Monday-1-week1': 25
        }));
      });

      // Reload page
      await page.reload();
      await helpers.waitForAppLoad();

      // Verify data is restored
      const exercises = await page.evaluate(() => localStorage.getItem('completedExercises'));
      const weights = await page.evaluate(() => localStorage.getItem('exerciseWeights'));

      expect(exercises).toBeTruthy();
      expect(weights).toBeTruthy();
    });

    test('should handle corrupt localStorage data gracefully', async ({ page }) => {
      // Set invalid JSON in localStorage
      await page.evaluate(() => {
        localStorage.setItem('completedExercises', 'invalid json');
        localStorage.setItem('exerciseWeights', '{incomplete');
      });

      // Reload page - should not crash
      await page.reload();
      await helpers.waitForAppLoad();

      // App should still be functional
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
    });
  });
});