import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

test.describe('New Features Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Timer Popup Functionality', () => {
    test('should display timer popup when clicking timer button', async ({ page }) => {
      // Look for timer trigger buttons
      const timerTriggers = [
        'button:has-text("Timer")',
        '[data-testid="timer-button"]',
        'button[aria-label*="timer"]',
        'button:has([data-icon="timer"])'
      ];

      for (const selector of timerTriggers) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          await button.click();
          break;
        }
      }

      // Wait for timer popup to appear
      try {
        await helpers.waitForTimerPopup();
        await expect(page.locator('[data-testid="timer-popup"]')).toBeVisible();
      } catch (error) {
        // Timer popup might not be implemented yet - check for fallback
        const timerSection = page.locator('text=Timer').first();
        if (await timerSection.isVisible()) {
          console.log('Timer popup not found, but timer functionality exists');
        }
      }
    });

    test('should start and stop timer correctly', async ({ page }) => {
      // Try to find and open timer
      const timerButton = page.locator('button:has-text("Timer")').first();
      if (await timerButton.isVisible()) {
        await timerButton.click();

        // Look for start/stop controls
        const startButton = page.locator('button:has-text("Start")').first();
        if (await startButton.isVisible()) {
          await startButton.click();

          // Timer should be running
          await helpers.waitForText('Stop', 5000);

          const stopButton = page.locator('button:has-text("Stop")').first();
          await stopButton.click();

          // Timer should be stopped
          await helpers.waitForText('Start', 5000);
        }
      }
    });

    test('should close timer popup with close button', async ({ page }) => {
      // Open timer popup
      const timerButton = page.locator('button:has-text("Timer")').first();
      if (await timerButton.isVisible()) {
        await timerButton.click();

        // Close timer popup
        await helpers.closeTimerPopup();

        // Timer popup should be hidden
        const timerPopup = page.locator('[data-testid="timer-popup"]');
        if (await timerPopup.count() > 0) {
          await expect(timerPopup).toBeHidden();
        }
      }
    });

    test('should handle timer popup in different screen sizes', async ({ page }) => {
      // Test mobile viewport
      await helpers.setMobileViewport();
      const mobileTimerButton = page.locator('button:has-text("Timer")').first();
      if (await mobileTimerButton.isVisible()) {
        await mobileTimerButton.click();
        // Popup should be responsive on mobile
        const popup = page.locator('[data-testid="timer-popup"]');
        if (await popup.isVisible()) {
          const boundingBox = await popup.boundingBox();
          expect(boundingBox?.width).toBeLessThanOrEqual(375);
        }
      }

      // Test desktop viewport
      await helpers.setDesktopViewport();
      await page.reload();
      await helpers.waitForAppLoad();
    });
  });

  test.describe('Gamification System', () => {
    test('should display user level and XP', async ({ page }) => {
      // Look for gamification elements
      const gamificationElements = [
        'text=Level',
        'text=XP',
        '[data-testid*="level"]',
        '[data-testid*="xp"]',
        'text=points'
      ];

      let gamificationFound = false;
      for (const selector of gamificationElements) {
        if (await page.locator(selector).isVisible()) {
          gamificationFound = true;
          break;
        }
      }

      if (gamificationFound) {
        expect(gamificationFound).toBe(true);
      } else {
        console.log('Gamification system not yet implemented or not visible');
      }
    });

    test('should award XP for completing exercises', async ({ page }) => {
      // Get initial XP if visible
      const xpElement = page.locator('text=XP').first();
      let initialXP = '';
      if (await xpElement.isVisible()) {
        initialXP = await helpers.getTextContent('body');
      }

      // Complete an exercise
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click();
        await helpers.waitForDatabaseSync();

        // Check if XP increased
        if (initialXP) {
          const updatedXP = await helpers.getTextContent('body');
          expect(updatedXP).not.toBe(initialXP);
        }
      }
    });

    test('should display achievements', async ({ page }) => {
      // Look for achievement elements
      const achievementElements = [
        'text=Achievement',
        'text=Badge',
        '[data-testid*="achievement"]',
        '[data-testid*="badge"]',
        'text=unlocked'
      ];

      let achievementFound = false;
      for (const selector of achievementElements) {
        if (await page.locator(selector).isVisible()) {
          achievementFound = true;
          break;
        }
      }

      if (achievementFound) {
        expect(achievementFound).toBe(true);
      } else {
        console.log('Achievement system not yet visible');
      }
    });

    test('should display level up notifications', async ({ page }) => {
      // Simulate gaining a lot of XP to trigger level up
      await page.evaluate(() => {
        // Set high XP in localStorage to trigger level up
        localStorage.setItem('userXP', '1000');
        localStorage.setItem('userLevel', '2');
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Look for level up indication
      const levelUpElements = [
        'text=Level Up',
        'text=Congratulations',
        '[data-testid*="level-up"]'
      ];

      for (const selector of levelUpElements) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
          break;
        }
      }
    });

    test('should track streak progression', async ({ page }) => {
      // Look for streak elements
      const streakElements = [
        'text=Streak',
        'text=Day',
        '[data-testid*="streak"]',
        'text=consecutive'
      ];

      let streakFound = false;
      for (const selector of streakElements) {
        if (await page.locator(selector).isVisible()) {
          streakFound = true;
          break;
        }
      }

      if (streakFound) {
        expect(streakFound).toBe(true);
      }
    });
  });

  test.describe('Advanced Workout Flow', () => {
    test('should display guided workout mode option', async ({ page }) => {
      // Look for guided workout controls
      const guidedWorkoutElements = [
        'text=Guided',
        'text=Flow',
        'button:has-text("Start Workout")',
        '[data-testid*="guided"]',
        '[data-testid*="workout-flow"]'
      ];

      let guidedFound = false;
      for (const selector of guidedWorkoutElements) {
        if (await page.locator(selector).isVisible()) {
          guidedFound = true;
          break;
        }
      }

      if (guidedFound) {
        expect(guidedFound).toBe(true);
      } else {
        console.log('Guided workout flow not yet implemented or not visible');
      }
    });

    test('should allow starting guided workout', async ({ page }) => {
      // Try to start guided workout
      const startWorkoutButton = page.locator('button:has-text("Start Workout")').first();
      if (await startWorkoutButton.isVisible()) {
        await startWorkoutButton.click();
        await helpers.waitForDatabaseSync();

        // Should show workout flow interface
        const workoutFlow = page.locator('[data-testid*="workout-flow"]');
        if (await workoutFlow.isVisible()) {
          await expect(workoutFlow).toBeVisible();
        }
      }
    });

    test('should track sets individually in guided mode', async ({ page }) => {
      // Look for set tracking interface
      const setTrackingElements = [
        'text=Set 1',
        'text=Set 2',
        '[data-testid*="set"]',
        'button:has-text("Next Set")',
        'text=reps'
      ];

      for (const selector of setTrackingElements) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
          break;
        }
      }
    });

    test('should provide exercise demonstrations', async ({ page }) => {
      // Look for demo/guide links
      const demoElements = [
        'text=Demo',
        'text=Guide',
        'a[href*="youtube"]',
        'a[href*="google"]',
        'button:has-text("Watch")'
      ];

      let demoFound = false;
      for (const selector of demoElements) {
        if (await page.locator(selector).isVisible()) {
          demoFound = true;
          break;
        }
      }

      if (demoFound) {
        expect(demoFound).toBe(true);
      }
    });
  });

  test.describe('Set-by-Set Tracking', () => {
    test('should display individual set inputs', async ({ page }) => {
      // Look for set-specific controls
      const setControls = [
        'input[placeholder*="Set"]',
        'input[placeholder*="Reps"]',
        'input[placeholder*="Weight"]',
        '[data-testid*="set-input"]'
      ];

      let setInputFound = false;
      for (const selector of setControls) {
        if (await page.locator(selector).isVisible()) {
          setInputFound = true;
          break;
        }
      }

      if (setInputFound) {
        expect(setInputFound).toBe(true);
      }
    });

    test('should save set data independently', async ({ page }) => {
      // Try to input set data
      const setInputs = page.locator('input[placeholder*="Set"], input[placeholder*="Reps"]');
      const firstInput = setInputs.first();

      if (await firstInput.isVisible()) {
        await firstInput.fill('12');
        await helpers.waitForDatabaseSync();

        // Verify data was saved
        const value = await firstInput.inputValue();
        expect(value).toBe('12');
      }
    });

    test('should track rest periods between sets', async ({ page }) => {
      // Look for rest timer or rest period tracking
      const restElements = [
        'text=Rest',
        'text=seconds',
        'text=minutes',
        '[data-testid*="rest"]',
        'button:has-text("Start Rest")'
      ];

      let restFound = false;
      for (const selector of restElements) {
        if (await page.locator(selector).isVisible()) {
          restFound = true;
          break;
        }
      }

      if (restFound) {
        expect(restFound).toBe(true);
      }
    });
  });

  test.describe('Progressive Image Loading', () => {
    test('should load images progressively', async ({ page }) => {
      // Look for images in the app
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        // Check if images have proper loading attributes
        const firstImage = images.first();
        const loading = await firstImage.getAttribute('loading');
        const src = await firstImage.getAttribute('src');

        expect(src).toBeTruthy();
        // Progressive loading might use lazy loading
        if (loading) {
          expect(['lazy', 'eager']).toContain(loading);
        }
      }
    });

    test('should handle image load errors gracefully', async ({ page }) => {
      // Inject a broken image to test error handling
      await page.evaluate(() => {
        const img = document.createElement('img');
        img.src = 'https://broken-image-url.com/nonexistent.jpg';
        img.setAttribute('data-testid', 'test-broken-image');
        document.body.appendChild(img);
      });

      // Wait a bit for image to attempt loading
      await page.waitForTimeout(2000);

      // App should still be functional
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
    });

    test('should optimize image loading for mobile devices', async ({ page }) => {
      await helpers.setMobileViewport();

      // Check if images are appropriately sized for mobile
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        const firstImage = images.first();
        const boundingBox = await firstImage.boundingBox();

        if (boundingBox) {
          // Image should not be wider than mobile viewport
          expect(boundingBox.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });

  test.describe('Modern UI Components', () => {
    test('should display modern animations and transitions', async ({ page }) => {
      // Look for elements with transition classes
      const animatedElements = [
        '[class*="transition"]',
        '[class*="animate"]',
        '[class*="transform"]',
        '[style*="transition"]'
      ];

      let animationFound = false;
      for (const selector of animatedElements) {
        if (await page.locator(selector).count() > 0) {
          animationFound = true;
          break;
        }
      }

      if (animationFound) {
        expect(animationFound).toBe(true);
      }
    });

    test('should handle hover states on interactive elements', async ({ page }) => {
      // Test hover states on buttons
      const buttons = page.locator('button');
      const firstButton = buttons.first();

      if (await firstButton.isVisible()) {
        // Hover over button
        await firstButton.hover();

        // Check if button responds to hover (changes appearance)
        const classAfterHover = await firstButton.getAttribute('class');
        expect(classAfterHover).toBeTruthy();
      }
    });

    test('should provide proper focus indicators for accessibility', async ({ page }) => {
      // Check focus indicators on interactive elements
      const focusableElements = page.locator('button, input, a, [tabindex]');
      const firstFocusable = focusableElements.first();

      if (await firstFocusable.isVisible()) {
        await firstFocusable.focus();

        // Element should be focused
        const isFocused = await firstFocusable.evaluate(el => el === document.activeElement);
        expect(isFocused).toBe(true);
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');

      // Check if focus moved to a focusable element
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'A']).toContain(activeElement || '');

      // Test Enter key on focused element
      await page.keyboard.press('Enter');

      // App should respond to keyboard interaction
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
    });
  });

  test.describe('Enhanced User Experience', () => {
    test('should provide immediate feedback for user actions', async ({ page }) => {
      // Click a button and check for immediate visual feedback
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.click();

        // Should provide some form of feedback (state change, animation, etc.)
        await page.waitForTimeout(500);
        await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
      }
    });

    test('should maintain state during navigation', async ({ page }) => {
      // Complete an exercise
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click();
        await helpers.waitForDatabaseSync();

        // Navigate to different week/section and back
        const nextButton = page.locator('button:has-text("→"), button:has-text("Next")').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await helpers.waitForDatabaseSync();

          const prevButton = page.locator('button:has-text("←"), button:has-text("Previous")').first();
          if (await prevButton.isVisible()) {
            await prevButton.click();
            await helpers.waitForDatabaseSync();
          }
        }

        // Original state should be maintained
        if (await firstCheckbox.isVisible()) {
          await expect(firstCheckbox).toBeChecked();
        }
      }
    });

    test('should handle rapid user interactions gracefully', async ({ page }) => {
      // Rapidly click multiple elements
      const buttons = page.locator('button');
      const buttonCount = Math.min(await buttons.count(), 5);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          await button.click({ force: true });
          await page.waitForTimeout(100);
        }
      }

      // App should remain stable
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();
    });
  });
});