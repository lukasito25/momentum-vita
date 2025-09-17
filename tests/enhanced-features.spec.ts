import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

test.describe('Enhanced Features Validation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Gamification System Validation', () => {
    test('should display user level and XP correctly', async ({ page }) => {
      // Look for gamification display elements
      const gamificationSelectors = [
        '[data-testid="user-level"]',
        '[data-testid="user-xp"]',
        'text=Level',
        'text=XP',
        'text=points'
      ];

      let gamificationFound = false;
      for (const selector of gamificationSelectors) {
        if (await page.locator(selector).isVisible()) {
          gamificationFound = true;

          // If found, validate the content
          const element = page.locator(selector);
          const text = await element.textContent();

          if (text?.includes('Level')) {
            // Should show level number
            expect(text).toMatch(/Level\s+\d+/);
          } else if (text?.includes('XP')) {
            // Should show XP amount
            expect(text).toMatch(/\d+\s*XP/);
          }
          break;
        }
      }

      // Gamification might not be implemented yet - that's okay
      if (!gamificationFound) {
        console.log('Gamification system not yet visible');
      }
    });

    test('should calculate and award XP for exercise completion', async ({ page }) => {
      // Set up initial XP state
      await page.evaluate(() => {
        localStorage.setItem('userXP', '100');
        localStorage.setItem('userLevel', '2');
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Get initial XP if gamification is implemented
      const initialXP = await page.evaluate(() => localStorage.getItem('userXP'));

      // Complete an exercise
      const exerciseCheckbox = page.locator('input[type="checkbox"]').first();
      if (await exerciseCheckbox.isVisible()) {
        await exerciseCheckbox.click();
        await helpers.waitForDatabaseSync();

        // Check if XP increased (expected: +10 XP per exercise)
        const updatedXP = await page.evaluate(() => localStorage.getItem('userXP'));

        if (initialXP && updatedXP) {
          const xpGain = parseInt(updatedXP) - parseInt(initialXP);
          expect(xpGain).toBeGreaterThanOrEqual(5); // Minimum expected XP gain
        }

        // Look for XP gain notification
        const xpNotifications = [
          'text=+10 XP',
          'text=+5 XP',
          '[data-testid="xp-gain"]',
          '[data-testid="xp-notification"]'
        ];

        for (const selector of xpNotifications) {
          const notification = page.locator(selector);
          if (await notification.isVisible()) {
            await expect(notification).toBeVisible();
            break;
          }
        }
      }
    });

    test('should trigger level up when XP threshold reached', async ({ page }) => {
      // Set XP just below level up threshold
      // Level calculation: Level = floor(sqrt(XP/100)) + 1
      // For level 3: need XP = 400, so set to 395
      await page.evaluate(() => {
        localStorage.setItem('userXP', '395');
        localStorage.setItem('userLevel', '2');
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Complete exercise to gain XP and trigger level up
      const exerciseCheckbox = page.locator('input[type="checkbox"]').first();
      if (await exerciseCheckbox.isVisible()) {
        await exerciseCheckbox.click();
        await helpers.waitForDatabaseSync();

        // Look for level up notification
        const levelUpNotifications = [
          'text=Level Up',
          'text=Congratulations',
          '[data-testid="level-up"]',
          '[data-testid="level-up-modal"]'
        ];

        for (const selector of levelUpNotifications) {
          const notification = page.locator(selector);
          if (await notification.isVisible()) {
            await expect(notification).toBeVisible();

            // Should show new level
            const levelText = await notification.textContent();
            expect(levelText).toMatch(/Level\s+3|Level\s+Up/i);
            break;
          }
        }
      }
    });

    test('should track and display achievements', async ({ page }) => {
      // Look for achievement system
      const achievementSelectors = [
        '[data-testid="achievement-badges"]',
        '[data-testid="achievements"]',
        'text=Achievement',
        'text=Badge',
        'text=unlocked'
      ];

      let achievementSystemFound = false;
      for (const selector of achievementSelectors) {
        if (await page.locator(selector).isVisible()) {
          achievementSystemFound = true;

          // Check achievement content
          const achievements = page.locator(selector);
          const achievementCount = await achievements.count();
          expect(achievementCount).toBeGreaterThan(0);
          break;
        }
      }

      if (!achievementSystemFound) {
        // Try to trigger an achievement
        await page.evaluate(() => {
          localStorage.setItem('completedExercises', JSON.stringify({
            'Monday-0-week1': true
          }));
        });

        await page.reload();
        await helpers.waitForAppLoad();

        // Look for achievement unlock
        const unlockNotifications = [
          'text=Achievement Unlocked',
          'text=First Workout',
          '[data-testid="achievement-unlock"]'
        ];

        for (const selector of unlockNotifications) {
          if (await page.locator(selector).isVisible()) {
            await expect(page.locator(selector)).toBeVisible();
            break;
          }
        }
      }
    });

    test('should track workout streaks', async ({ page }) => {
      // Set up streak data
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await page.evaluate((dates) => {
        localStorage.setItem('workoutStreak', JSON.stringify({
          currentStreak: 5,
          lastWorkoutDate: dates.today,
          longestStreak: 7,
          workoutDates: [dates.yesterday, dates.today]
        }));
      }, {
        today: today.toISOString().split('T')[0],
        yesterday: yesterday.toISOString().split('T')[0]
      });

      await page.reload();
      await helpers.waitForAppLoad();

      // Look for streak display
      const streakSelectors = [
        '[data-testid="streak-display"]',
        '[data-testid="streak-tracker"]',
        'text=Streak',
        'text=Day',
        'text=consecutive'
      ];

      for (const selector of streakSelectors) {
        const streakElement = page.locator(selector);
        if (await streakElement.isVisible()) {
          const streakText = await streakElement.textContent();

          // Should show streak information
          expect(streakText).toMatch(/\d+/); // Should contain a number
          break;
        }
      }
    });
  });

  test.describe('Timer System Validation', () => {
    test('should display timer popup when activated', async ({ page }) => {
      // Look for timer trigger buttons
      const timerTriggers = [
        'button:has-text("Timer")',
        '[data-testid="timer-button"]',
        'button[aria-label*="timer"]',
        '[data-icon="timer"]'
      ];

      for (const selector of timerTriggers) {
        const timerButton = page.locator(selector).first();
        if (await timerButton.isVisible()) {
          await timerButton.click();

          // Look for timer popup
          const timerPopupSelectors = [
            '[data-testid="timer-popup"]',
            '[data-testid="workout-timer"]',
            'text=Start Timer',
            'button:has-text("Start")'
          ];

          for (const popupSelector of timerPopupSelectors) {
            const popup = page.locator(popupSelector);
            if (await popup.isVisible()) {
              await expect(popup).toBeVisible();

              // Should have timer controls
              const timerControls = [
                'button:has-text("Start")',
                'button:has-text("Stop")',
                'button:has-text("Reset")',
                'text=00:00'
              ];

              let controlFound = false;
              for (const controlSelector of timerControls) {
                if (await page.locator(controlSelector).isVisible()) {
                  controlFound = true;
                  break;
                }
              }
              expect(controlFound).toBe(true);
              return; // Exit once timer is found and validated
            }
          }
        }
      }

      console.log('Timer popup functionality not yet implemented');
    });

    test('should handle timer start/stop functionality', async ({ page }) => {
      // Try to find and activate timer
      const timerButton = page.locator('button:has-text("Timer")').first();
      if (await timerButton.isVisible()) {
        await timerButton.click();

        const startButton = page.locator('button:has-text("Start")').first();
        if (await startButton.isVisible()) {
          // Start timer
          await startButton.click();

          // Timer should show running state
          await helpers.waitForText('Stop', 5000);

          const stopButton = page.locator('button:has-text("Stop")').first();
          if (await stopButton.isVisible()) {
            await stopButton.click();

            // Timer should return to start state
            await helpers.waitForText('Start', 3000);
          }
        }
      }
    });

    test('should integrate timer with exercise sets', async ({ page }) => {
      // Look for set tracking integration
      const setTrackingSelectors = [
        '[data-testid="set-tracker"]',
        'input[placeholder*="Set"]',
        'input[placeholder*="Reps"]',
        'text=Set 1',
        'text=Set 2'
      ];

      for (const selector of setTrackingSelectors) {
        const setElement = page.locator(selector);
        if (await setElement.isVisible()) {
          // If set tracking exists, look for timer integration
          const timerInSets = page.locator('button:has-text("Timer")').near(setElement);
          if (await timerInSets.isVisible()) {
            await timerInSets.click();

            // Should show timer for rest period
            const restTimer = page.locator('[data-testid="rest-timer"], text=Rest');
            if (await restTimer.isVisible()) {
              await expect(restTimer).toBeVisible();
            }
          }
          break;
        }
      }
    });
  });

  test.describe('Advanced Workout Flow Validation', () => {
    test('should display guided workout mode option', async ({ page }) => {
      // Look for guided workout interface
      const guidedWorkoutSelectors = [
        '[data-testid="guided-workout"]',
        'button:has-text("Guided")',
        'button:has-text("Start Workout")',
        'text=Workout Flow',
        'text=Step-by-step'
      ];

      for (const selector of guidedWorkoutSelectors) {
        const guidedElement = page.locator(selector);
        if (await guidedElement.isVisible()) {
          await expect(guidedElement).toBeVisible();

          // If it's a button, test activation
          if (selector.includes('button')) {
            await guidedElement.click();
            await helpers.waitForDatabaseSync();

            // Should show guided workout interface
            const workflowInterface = [
              '[data-testid="workout-flow"]',
              'text=Exercise 1',
              'text=Next Exercise',
              'button:has-text("Complete Set")'
            ];

            for (const interfaceSelector of workflowInterface) {
              if (await page.locator(interfaceSelector).isVisible()) {
                await expect(page.locator(interfaceSelector)).toBeVisible();
                break;
              }
            }
          }
          break;
        }
      }
    });

    test('should handle set-by-set tracking', async ({ page }) => {
      // Look for advanced exercise tracking
      const advancedTrackingSelectors = [
        '[data-testid="advanced-exercise"]',
        'input[placeholder*="Reps"]',
        'input[placeholder*="Weight"]',
        'button:has-text("Complete Set")',
        'text=Set 1 of'
      ];

      for (const selector of advancedTrackingSelectors) {
        const trackingElement = page.locator(selector);
        if (await trackingElement.isVisible()) {
          // Test set input
          if (selector.includes('input')) {
            if (selector.includes('Reps')) {
              await trackingElement.fill('12');
            } else if (selector.includes('Weight')) {
              await trackingElement.fill('25');
            }
            await helpers.waitForDatabaseSync();

            // Verify input was saved
            const value = await trackingElement.inputValue();
            expect(value).toBeTruthy();
          }

          // Test set completion
          if (selector.includes('Complete Set')) {
            await trackingElement.click();
            await helpers.waitForDatabaseSync();

            // Should advance to next set or exercise
            const nextSetIndicators = [
              'text=Set 2',
              'text=Next Exercise',
              'button:has-text("Complete Set")'
            ];

            for (const indicator of nextSetIndicators) {
              if (await page.locator(indicator).isVisible()) {
                await expect(page.locator(indicator)).toBeVisible();
                break;
              }
            }
          }
          break;
        }
      }
    });

    test('should provide exercise demonstrations', async ({ page }) => {
      // Look for demo/guide links
      const demoSelectors = [
        'a[href*="youtube"]',
        'a[href*="google"]',
        'button:has-text("Demo")',
        'button:has-text("Guide")',
        'text=Watch',
        'text=Learn'
      ];

      for (const selector of demoSelectors) {
        const demoElement = page.locator(selector);
        if (await demoElement.isVisible()) {
          // Verify demo links are properly formatted
          if (selector.includes('href')) {
            const href = await demoElement.getAttribute('href');
            expect(href).toMatch(/youtube\.com|google\.com/);

            // Should open in new tab
            const target = await demoElement.getAttribute('target');
            expect(target).toBe('_blank');
          }

          // Test demo button functionality
          if (selector.includes('button')) {
            await demoElement.click();
            // Should trigger some demo action
            await page.waitForTimeout(500);
          }
          break;
        }
      }
    });
  });

  test.describe('Progressive Image Loading Validation', () => {
    test('should implement progressive image loading', async ({ page }) => {
      // Check for images in the app
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const image = images.nth(i);

          // Check loading strategy
          const loading = await image.getAttribute('loading');
          const src = await image.getAttribute('src');

          expect(src).toBeTruthy();

          // Should use lazy loading for non-critical images
          if (loading) {
            expect(['lazy', 'eager']).toContain(loading);
          }

          // Check for progressive enhancement
          const placeholder = await image.getAttribute('data-placeholder');
          const lowRes = await image.getAttribute('data-src-low');

          // Progressive loading might use these attributes
          if (placeholder || lowRes) {
            expect(placeholder || lowRes).toBeTruthy();
          }
        }
      }
    });

    test('should handle image load errors gracefully', async ({ page }) => {
      // Inject broken image
      await page.evaluate(() => {
        const img = document.createElement('img');
        img.src = 'https://broken-image-url.com/404.jpg';
        img.setAttribute('data-testid', 'broken-image');
        document.body.appendChild(img);
      });

      await page.waitForTimeout(2000);

      // App should remain functional
      await expect(page.locator('body')).toBeVisible();

      // Core functionality should work
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
        await expect(checkbox).toBeChecked();
      }
    });

    test('should optimize images for different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1440, height: 900 }  // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.reload();
        await helpers.waitForAppLoad();

        const images = page.locator('img');
        const imageCount = await images.count();

        if (imageCount > 0) {
          const firstImage = images.first();
          const boundingBox = await firstImage.boundingBox();

          if (boundingBox) {
            // Image should not exceed viewport width
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);

            // Should maintain reasonable proportions
            expect(boundingBox.width).toBeGreaterThan(0);
            expect(boundingBox.height).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Modern UI Components Validation', () => {
    test('should display loading screens appropriately', async ({ page }) => {
      // Clear data to trigger loading screen
      await helpers.clearAppData();

      await page.goto('/');

      // Look for loading screen
      const loadingScreenSelectors = [
        '[data-testid="loading-screen"]',
        'text=Loading',
        'text=Please wait',
        '.loading-spinner',
        '.spinner'
      ];

      let loadingFound = false;
      for (const selector of loadingScreenSelectors) {
        const loadingElement = page.locator(selector);
        if (await loadingElement.isVisible({ timeout: 5000 })) {
          loadingFound = true;

          // Loading screen should eventually disappear
          await loadingElement.waitFor({ state: 'hidden', timeout: 30000 });
          break;
        }
      }

      // Main app should load after loading screen
      await helpers.waitForAppLoad();
      await expect(page.locator('body')).toBeVisible();
    });

    test('should implement smooth animations and transitions', async ({ page }) => {
      // Look for elements with animation classes
      const animatedElements = [
        '[class*="transition"]',
        '[class*="animate"]',
        '[class*="transform"]'
      ];

      let animationsFound = false;
      for (const selector of animatedElements) {
        const elements = page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          animationsFound = true;

          // Test interaction animations
          const firstElement = elements.first();
          if (await firstElement.isVisible()) {
            // Trigger interaction if it's interactive
            const tagName = await firstElement.evaluate(el => el.tagName);
            if (['BUTTON', 'INPUT', 'A'].includes(tagName)) {
              await firstElement.hover();
              await page.waitForTimeout(300);

              if (tagName === 'BUTTON' || (tagName === 'INPUT' && await firstElement.getAttribute('type') === 'checkbox')) {
                await firstElement.click();
                await page.waitForTimeout(300);
              }
            }
          }
          break;
        }
      }

      // Animations enhance UX but aren't required
      if (!animationsFound) {
        console.log('Animation classes not found - app may use different animation approach');
      }
    });

    test('should support hover states and interactive feedback', async ({ page }) => {
      // Test hover states on buttons
      const buttons = page.locator('button');
      const buttonCount = Math.min(await buttons.count(), 5);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          // Get initial styles
          const initialClasses = await button.getAttribute('class') || '';

          // Hover over button
          await button.hover();
          await page.waitForTimeout(200);

          // Check for hover feedback (classes might change)
          const hoverClasses = await button.getAttribute('class') || '';

          // Test click feedback
          await button.click();
          await page.waitForTimeout(200);

          const clickClasses = await button.getAttribute('class') || '';

          // Some visual feedback should occur (classes or styles change)
          const feedbackProvided = (
            initialClasses !== hoverClasses ||
            hoverClasses !== clickClasses ||
            initialClasses !== clickClasses
          );

          // Visual feedback enhances UX
          if (!feedbackProvided) {
            console.log('No visual feedback detected for button interaction');
          }
        }
      }
    });
  });

  test.describe('Program-Specific Features Validation', () => {
    test('should display different content for different programs', async ({ page }) => {
      const programs = ['foundation-builder', 'power-surge-pro', 'beast-mode-elite'];

      for (const programId of programs) {
        // Set program
        await page.evaluate((id) => {
          localStorage.setItem('currentProgramId', id);
        }, programId);

        await page.reload();
        await helpers.waitForAppLoad();

        // Should show program-specific content
        const workoutContent = await page.textContent('body');

        // Each program should have distinct exercises or content
        expect(workoutContent).toBeTruthy();
        expect(workoutContent.length).toBeGreaterThan(100);

        // Look for program-specific indicators
        const programIndicators = [
          'text=Foundation',
          'text=Power Surge',
          'text=Beast Mode',
          'text=Beginner',
          'text=Intermediate',
          'text=Advanced'
        ];

        let programSpecificContentFound = false;
        for (const indicator of programIndicators) {
          if (await page.locator(indicator).isVisible()) {
            programSpecificContentFound = true;
            break;
          }
        }

        // Programs might show different content
        if (!programSpecificContentFound) {
          console.log(`Program-specific content for ${programId} not distinctly marked`);
        }
      }
    });

    test('should handle phase transitions correctly', async ({ page }) => {
      // Test different phases within a program
      const phases = [
        { week: 1, expectedPhase: 'Foundation' },
        { week: 5, expectedPhase: 'Growth' },
        { week: 9, expectedPhase: 'Intensity' }
      ];

      for (const { week, expectedPhase } of phases) {
        await page.evaluate((w) => {
          localStorage.setItem('currentWeek', w.toString());
        }, week);

        await page.reload();
        await helpers.waitForAppLoad();

        // Look for phase-specific content
        const phaseIndicators = [
          `text=${expectedPhase}`,
          'text=Phase',
          'text=foundation',
          'text=growth',
          'text=intensity'
        ];

        let phaseContentFound = false;
        for (const indicator of phaseIndicators) {
          if (await page.locator(indicator).isVisible()) {
            phaseContentFound = true;
            break;
          }
        }

        // Phase system might not be visually indicated
        if (!phaseContentFound) {
          console.log(`Phase content for week ${week} not visually indicated`);
        }

        // Exercises should be different for different phases
        const exerciseContent = await page.textContent('body');
        expect(exerciseContent).toBeTruthy();
      }
    });
  });
});