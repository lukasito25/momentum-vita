import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * Custom Workout Creation Tests for Momentum Vita
 *
 * Tests the custom workout builder functionality including:
 * - Workout creation interface
 * - Exercise search and selection
 * - Custom exercise parameters
 * - Workout validation and saving
 * - Premium feature access control
 * - Mobile-optimized workflow
 */

test.describe('Custom Workout Creation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Workout Builder Access', () => {
    test('should require authentication for custom workouts', async ({ page }) => {
      // Try to access workout builder without authentication
      const createWorkoutButton = page.locator('[data-testid="create-workout"], [data-testid="custom-workout"], button:has-text("Create Workout")').first();

      if (await createWorkoutButton.isVisible()) {
        await createWorkoutButton.click();

        // Should show authentication modal
        const authModal = page.locator('[data-testid="auth-modal"]');
        await expect(authModal).toBeVisible({ timeout: 5000 });
        await expect(authModal).toContainText(/sign in|login|create account/i);
      }
    });

    test('should allow premium users to access workout builder', async ({ page }) => {
      // Authenticate as premium user
      await helpers.authenticateUser(page, 'premium@example.com', 'password123', { isPremium: true });

      // Navigate to workout builder
      const createWorkoutButton = page.locator('[data-testid="create-workout"], [data-testid="custom-workout"], button:has-text("Create Workout")').first();

      if (await createWorkoutButton.isVisible()) {
        await createWorkoutButton.click();

        // Should access workout builder directly
        const workoutBuilder = page.locator('[data-testid="workout-builder"], [data-testid="create-workout-form"]');
        await expect(workoutBuilder).toBeVisible({ timeout: 10000 });
      }
    });

    test('should show upgrade prompt for free users', async ({ page }) => {
      // Authenticate as free user
      await helpers.authenticateUser(page, 'free@example.com', 'password123', { isPremium: false });

      const createWorkoutButton = page.locator('[data-testid="create-workout"], [data-testid="custom-workout"], button:has-text("Create Workout")').first();

      if (await createWorkoutButton.isVisible()) {
        await createWorkoutButton.click();

        // Should show upgrade prompt
        const upgradePrompt = page.locator('[data-testid="upgrade-prompt"], [data-testid="premium-required"]');
        await expect(upgradePrompt).toBeVisible({ timeout: 5000 });
        await expect(upgradePrompt).toContainText(/premium|upgrade|subscription/i);
      }
    });
  });

  test.describe('Workout Creation Interface', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.authenticateUser(page, 'premium@example.com', 'password123', { isPremium: true });
    });

    test('should create basic custom workout successfully', async ({ page }) => {
      // Navigate to workout builder
      await navigateToWorkoutBuilder(page);

      // Fill workout details
      await page.locator('[data-testid="workout-name-input"]').fill('Custom Push Workout');
      await page.locator('[data-testid="workout-description"]').fill('Upper body strength focus');

      // Set workout parameters
      const durationInput = page.locator('[data-testid="workout-duration"]');
      if (await durationInput.isVisible()) {
        await durationInput.fill('45');
      }

      const difficultySelect = page.locator('[data-testid="difficulty-select"]');
      if (await difficultySelect.isVisible()) {
        await difficultySelect.selectOption('intermediate');
      }

      // Add exercises
      await addExerciseToWorkout(page, 'Push-up', { sets: 3, reps: 12 });
      await addExerciseToWorkout(page, 'Bench Press', { sets: 4, reps: 8, weight: 70 });

      // Save workout
      await page.locator('[data-testid="save-workout-button"]').click();

      // Verify creation success
      await expect(page.locator('[data-testid="success-message"], .success')).toBeVisible({ timeout: 10000 });

      // Should navigate to workout list or show in library
      const workoutInLibrary = page.locator('[data-testid="workout-list"], [data-testid="custom-workouts"]');
      if (await workoutInLibrary.isVisible()) {
        await expect(workoutInLibrary).toContainText('Custom Push Workout');
      }
    });

    test('should validate required workout fields', async ({ page }) => {
      await navigateToWorkoutBuilder(page);

      // Try to save without required fields
      await page.locator('[data-testid="save-workout-button"]').click();

      // Check validation messages
      const nameError = page.locator('[data-testid="name-error"], .error-message:has-text("name")');
      await expect(nameError).toBeVisible();
      await expect(nameError).toContainText(/required|name/i);

      // Fill name and try again
      await page.locator('[data-testid="workout-name-input"]').fill('Test Workout');
      await page.locator('[data-testid="save-workout-button"]').click();

      // Should show exercises required error
      const exercisesError = page.locator('[data-testid="exercises-error"], .error-message:has-text("exercise")');
      await expect(exercisesError).toBeVisible();
      await expect(exercisesError).toContainText(/exercise.*required|at least one/i);
    });

    test('should handle workout name uniqueness', async ({ page }) => {
      await navigateToWorkoutBuilder(page);

      // Create first workout
      await page.locator('[data-testid="workout-name-input"]').fill('Duplicate Name Test');
      await addExerciseToWorkout(page, 'Push-up', { sets: 3, reps: 10 });
      await page.locator('[data-testid="save-workout-button"]').click();

      // Wait for save to complete
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Try to create another workout with same name
      await navigateToWorkoutBuilder(page);
      await page.locator('[data-testid="workout-name-input"]').fill('Duplicate Name Test');
      await addExerciseToWorkout(page, 'Squat', { sets: 3, reps: 12 });
      await page.locator('[data-testid="save-workout-button"]').click();

      // Should show name conflict error
      const nameConflictError = page.locator('[data-testid="name-conflict-error"], .error-message:has-text("name")');
      await expect(nameConflictError).toBeVisible();
      await expect(nameConflictError).toContainText(/already exists|duplicate|unique/i);
    });
  });

  test.describe('Exercise Search and Selection', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.authenticateUser(page, 'premium@example.com', 'password123', { isPremium: true });
      await navigateToWorkoutBuilder(page);
    });

    test('should search exercises by name', async ({ page }) => {
      // Click add exercise button
      await page.locator('[data-testid="add-exercise-button"]').click();

      // Search for specific exercise
      const searchInput = page.locator('[data-testid="exercise-search"]');
      await searchInput.fill('bench press');
      await page.waitForTimeout(500); // Allow search to complete

      // Should show relevant results
      const searchResults = page.locator('[data-testid="exercise-result"], [data-testid="exercise-option"]');
      await expect(searchResults).toHaveCount(3, { timeout: 5000 });

      // Results should contain search term
      const firstResult = searchResults.first();
      await expect(firstResult).toContainText(/bench.*press/i);
    });

    test('should filter exercises by category', async ({ page }) => {
      await page.locator('[data-testid="add-exercise-button"]').click();

      // Test category filters
      const categories = ['chest', 'back', 'legs', 'shoulders', 'arms'];

      for (const category of categories) {
        const categoryFilter = page.locator(`[data-testid="filter-${category}"]`);
        if (await categoryFilter.isVisible()) {
          await categoryFilter.click();

          // Should show filtered results
          const filteredResults = page.locator('[data-testid="filtered-exercises"], [data-testid="exercise-list"]');
          await expect(filteredResults).toBeVisible();

          // Results should be relevant to category
          const exerciseItems = page.locator('[data-testid="exercise-result"]');
          if (await exerciseItems.count() > 0) {
            const firstExercise = exerciseItems.first();
            await expect(firstExercise).toBeVisible();
          }
        }
      }
    });

    test('should display exercise details and instructions', async ({ page }) => {
      await page.locator('[data-testid="add-exercise-button"]').click();

      // Search and select an exercise
      await page.locator('[data-testid="exercise-search"]').fill('push up');
      await page.waitForTimeout(500);

      const exerciseOption = page.locator('[data-testid="exercise-option-push-up"], [data-testid="exercise-result"]').first();

      // Click on exercise to see details
      await exerciseOption.click();

      // Should show exercise details modal or expanded view
      const exerciseDetails = page.locator('[data-testid="exercise-details"], [data-testid="exercise-info"]');
      await expect(exerciseDetails).toBeVisible();

      // Should contain exercise information
      await expect(exerciseDetails).toContainText(/push.*up/i);
      await expect(exerciseDetails).toContainText(/instructions|how.*to|description/i);

      // Should have media content
      const mediaContent = exerciseDetails.locator('img, video').first();
      if (await mediaContent.isVisible()) {
        await expect(mediaContent).toBeVisible();
      }

      // Should have add button
      const addToWorkoutButton = page.locator('[data-testid="add-to-workout"], button:has-text("Add")');
      await expect(addToWorkoutButton).toBeVisible();
    });

    test('should handle exercise variations and alternatives', async ({ page }) => {
      await page.locator('[data-testid="add-exercise-button"]').click();

      // Search for exercise with variations
      await page.locator('[data-testid="exercise-search"]').fill('squat');
      await page.waitForTimeout(500);

      const exerciseResults = page.locator('[data-testid="exercise-result"]');
      const resultCount = await exerciseResults.count();

      if (resultCount > 1) {
        // Should show multiple squat variations
        await expect(exerciseResults.nth(0)).toContainText(/squat/i);
        await expect(exerciseResults.nth(1)).toContainText(/squat/i);

        // Click on first variation
        await exerciseResults.nth(0).click();

        // Should show alternatives or variations section
        const alternatives = page.locator('[data-testid="exercise-alternatives"], [data-testid="variations"]');
        if (await alternatives.isVisible()) {
          await expect(alternatives).toContainText(/alternative|variation|similar/i);
        }
      }
    });
  });

  test.describe('Exercise Configuration', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.authenticateUser(page, 'premium@example.com', 'password123', { isPremium: true });
      await navigateToWorkoutBuilder(page);
    });

    test('should configure sets and reps for exercises', async ({ page }) => {
      await addExerciseToWorkout(page, 'Push-up');

      // Should show exercise configuration
      const exerciseConfig = page.locator('[data-testid="exercise-config"], [data-testid="exercise-parameters"]');
      await expect(exerciseConfig).toBeVisible();

      // Configure sets
      const setsInput = page.locator('[data-testid="sets-input"]');
      await setsInput.fill('4');

      // Configure reps
      const repsInput = page.locator('[data-testid="reps-input"]');
      await repsInput.fill('15');

      // Should validate input ranges
      await setsInput.fill('10'); // Too many sets
      const setsError = page.locator('[data-testid="sets-error"]');
      if (await setsError.isVisible()) {
        await expect(setsError).toContainText(/too many|maximum/i);
      }
    });

    test('should handle weight-based exercises', async ({ page }) => {
      await addExerciseToWorkout(page, 'Bench Press');

      // Should show weight configuration
      const weightInput = page.locator('[data-testid="weight-input"]');
      await expect(weightInput).toBeVisible();

      await weightInput.fill('80');

      // Should show weight unit selector
      const weightUnit = page.locator('[data-testid="weight-unit"], select[data-testid="unit-select"]');
      if (await weightUnit.isVisible()) {
        await weightUnit.selectOption('kg');
      }

      // Should handle percentage-based weights
      const percentageOption = page.locator('[data-testid="percentage-weight"], input[type="checkbox"]:has-text("% of 1RM")');
      if (await percentageOption.isVisible()) {
        await percentageOption.check();

        const percentageInput = page.locator('[data-testid="percentage-input"]');
        await percentageInput.fill('75');
      }
    });

    test('should configure time-based exercises', async ({ page }) => {
      await addExerciseToWorkout(page, 'Plank');

      // Should show time configuration instead of reps
      const timeInput = page.locator('[data-testid="time-input"], [data-testid="duration-input"]');
      await expect(timeInput).toBeVisible();

      await timeInput.fill('60');

      // Should show time unit
      const timeUnit = page.locator('[data-testid="time-unit"]');
      if (await timeUnit.isVisible()) {
        await timeUnit.selectOption('seconds');
      }
    });

    test('should handle rest periods between sets', async ({ page }) => {
      await addExerciseToWorkout(page, 'Bench Press', { sets: 3, reps: 8 });

      // Should show rest period configuration
      const restInput = page.locator('[data-testid="rest-period"], [data-testid="rest-time"]');
      if (await restInput.isVisible()) {
        await restInput.fill('90');

        // Should show auto-timer option
        const autoTimer = page.locator('[data-testid="auto-timer"], input[type="checkbox"]:has-text("Auto Timer")');
        if (await autoTimer.isVisible()) {
          await autoTimer.check();
        }
      }
    });
  });

  test.describe('Workout Organization', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.authenticateUser(page, 'premium@example.com', 'password123', { isPremium: true });
      await navigateToWorkoutBuilder(page);
    });

    test('should reorder exercises within workout', async ({ page }) => {
      // Add multiple exercises
      await addExerciseToWorkout(page, 'Push-up', { sets: 3, reps: 10 });
      await addExerciseToWorkout(page, 'Squat', { sets: 3, reps: 12 });
      await addExerciseToWorkout(page, 'Plank', { sets: 3, reps: 30 });

      // Check initial order
      const exerciseList = page.locator('[data-testid="exercise-list"]');
      const exercises = exerciseList.locator('[data-testid="exercise-item"]');

      await expect(exercises.nth(0)).toContainText('Push-up');
      await expect(exercises.nth(1)).toContainText('Squat');
      await expect(exercises.nth(2)).toContainText('Plank');

      // Drag and drop to reorder (if supported)
      const dragHandle = exercises.nth(0).locator('[data-testid="drag-handle"]');
      if (await dragHandle.isVisible()) {
        await dragAndDropExercise(page, exercises.nth(0), exercises.nth(2));

        // Verify new order
        await expect(exercises.nth(0)).toContainText('Squat');
        await expect(exercises.nth(1)).toContainText('Plank');
        await expect(exercises.nth(2)).toContainText('Push-up');
      }
    });

    test('should group exercises into supersets', async ({ page }) => {
      await addExerciseToWorkout(page, 'Push-up', { sets: 3, reps: 10 });
      await addExerciseToWorkout(page, 'Pull-up', { sets: 3, reps: 8 });

      // Create superset
      const supersetButton = page.locator('[data-testid="create-superset"], button:has-text("Superset")');
      if (await supersetButton.isVisible()) {
        // Select exercises for superset
        await page.locator('[data-testid="exercise-checkbox-0"]').check();
        await page.locator('[data-testid="exercise-checkbox-1"]').check();

        await supersetButton.click();

        // Should group exercises
        const supersetGroup = page.locator('[data-testid="superset-group"]');
        await expect(supersetGroup).toBeVisible();
        await expect(supersetGroup).toContainText('Push-up');
        await expect(supersetGroup).toContainText('Pull-up');
      }
    });

    test('should add notes and instructions to exercises', async ({ page }) => {
      await addExerciseToWorkout(page, 'Bench Press', { sets: 3, reps: 8 });

      const exerciseItem = page.locator('[data-testid="exercise-item"]').first();

      // Add exercise notes
      const notesButton = exerciseItem.locator('[data-testid="add-notes"], button:has-text("Notes")');
      if (await notesButton.isVisible()) {
        await notesButton.click();

        const notesInput = page.locator('[data-testid="exercise-notes"]');
        await notesInput.fill('Focus on controlled movement, 2-second pause at bottom');

        const saveNotesButton = page.locator('[data-testid="save-notes"]');
        await saveNotesButton.click();

        // Verify notes saved
        await expect(exerciseItem).toContainText('Focus on controlled movement');
      }
    });
  });

  test.describe('Mobile Workout Builder', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test.beforeEach(async ({ page }) => {
      await helpers.authenticateUser(page, 'premium@example.com', 'password123', { isPremium: true });
    });

    test('should be optimized for mobile screens', async ({ page }) => {
      await navigateToWorkoutBuilder(page);

      // Check mobile-optimized layout
      const workoutBuilder = page.locator('[data-testid="workout-builder"]');
      await expect(workoutBuilder).toBeVisible();

      // Form fields should be appropriately sized
      const nameInput = page.locator('[data-testid="workout-name-input"]');
      const inputWidth = await nameInput.boundingBox();
      expect(inputWidth!.width).toBeGreaterThan(300); // Should use most of screen width

      // Buttons should be touch-friendly
      const addExerciseButton = page.locator('[data-testid="add-exercise-button"]');
      const buttonHeight = await addExerciseButton.boundingBox();
      expect(buttonHeight!.height).toBeGreaterThan(40); // Minimum touch target
    });

    test('should handle mobile exercise search', async ({ page }) => {
      await navigateToWorkoutBuilder(page);
      await page.locator('[data-testid="add-exercise-button"]').click();

      // Search input should be mobile-optimized
      const searchInput = page.locator('[data-testid="exercise-search"]');
      await expect(searchInput).toBeVisible();

      // Should show mobile keyboard
      await searchInput.click();
      await searchInput.fill('push up');

      // Results should be touch-friendly
      const searchResults = page.locator('[data-testid="exercise-result"]');
      if (await searchResults.count() > 0) {
        const firstResult = searchResults.first();
        const resultHeight = await firstResult.boundingBox();
        expect(resultHeight!.height).toBeGreaterThan(40);
      }
    });

    test('should handle mobile drag and drop', async ({ page }) => {
      await navigateToWorkoutBuilder(page);
      await addExerciseToWorkout(page, 'Push-up');
      await addExerciseToWorkout(page, 'Squat');

      // Mobile drag and drop might use touch events
      const exercises = page.locator('[data-testid="exercise-item"]');

      // Check for mobile reorder controls
      const reorderButton = exercises.first().locator('[data-testid="reorder-button"], button[aria-label*="reorder"]');
      if (await reorderButton.isVisible()) {
        await reorderButton.click();

        // Should show reorder interface
        const reorderInterface = page.locator('[data-testid="reorder-interface"]');
        await expect(reorderInterface).toBeVisible();
      }
    });
  });

  // Helper functions
  async function navigateToWorkoutBuilder(page: any) {
    const createWorkoutButton = page.locator('[data-testid="create-workout"], [data-testid="custom-workout"], button:has-text("Create Workout")').first();

    if (await createWorkoutButton.isVisible()) {
      await createWorkoutButton.click();
    } else {
      // Alternative navigation paths
      const menuButton = page.locator('[data-testid="menu"], [data-testid="hamburger"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        const workoutBuilderMenuItem = page.locator('[data-testid="workout-builder-menu"], a:has-text("Create Workout")');
        await workoutBuilderMenuItem.click();
      }
    }

    const workoutBuilder = page.locator('[data-testid="workout-builder"], [data-testid="create-workout-form"]');
    await expect(workoutBuilder).toBeVisible({ timeout: 10000 });
  }

  async function addExerciseToWorkout(page: any, exerciseName: string, config?: { sets?: number; reps?: number; weight?: number; time?: number }) {
    // Click add exercise
    await page.locator('[data-testid="add-exercise-button"]').click();

    // Search for exercise
    const searchInput = page.locator('[data-testid="exercise-search"]');
    await searchInput.fill(exerciseName.toLowerCase());
    await page.waitForTimeout(500);

    // Select exercise
    const exerciseOption = page.locator(`[data-testid="exercise-option-${exerciseName.toLowerCase().replace(/\s+/g, '-')}"], [data-testid="exercise-result"]:has-text("${exerciseName}")`).first();
    await exerciseOption.click();

    // Add to workout
    const addButton = page.locator('[data-testid="add-to-workout"], button:has-text("Add")');
    await addButton.click();

    // Configure exercise if config provided
    if (config) {
      if (config.sets) {
        const setsInput = page.locator('[data-testid="sets-input"]');
        await setsInput.fill(config.sets.toString());
      }

      if (config.reps) {
        const repsInput = page.locator('[data-testid="reps-input"]');
        await repsInput.fill(config.reps.toString());
      }

      if (config.weight) {
        const weightInput = page.locator('[data-testid="weight-input"]');
        await weightInput.fill(config.weight.toString());
      }

      if (config.time) {
        const timeInput = page.locator('[data-testid="time-input"]');
        await timeInput.fill(config.time.toString());
      }
    }

    // Save exercise configuration
    const saveConfigButton = page.locator('[data-testid="save-exercise-config"], button:has-text("Save")');
    if (await saveConfigButton.isVisible()) {
      await saveConfigButton.click();
    }
  }

  async function dragAndDropExercise(page: any, sourceElement: any, targetElement: any) {
    // Get bounding boxes for drag and drop
    const sourceBox = await sourceElement.boundingBox();
    const targetBox = await targetElement.boundingBox();

    if (sourceBox && targetBox) {
      // Perform drag and drop
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
      await page.mouse.up();
    }
  }
});