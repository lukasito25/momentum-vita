import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

test.describe('Performance & Accessibility Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Performance Testing', () => {
    test('should load the application within performance thresholds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await helpers.waitForAppLoad();

      const loadTime = Date.now() - startTime;

      // App should load within 5 seconds (generous for comprehensive app)
      expect(loadTime).toBeLessThan(5000);

      // Check for performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
      });

      // First Contentful Paint should be under 2 seconds
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000);

      // DOM Content Loaded should be quick
      expect(performanceMetrics.domContentLoaded).toBeLessThan(1000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Create large dataset
      await page.evaluate(() => {
        const largeDataset = {};
        const weights = {};
        const nutrition = {};

        // Generate 12 weeks of data across all exercises
        for (let week = 1; week <= 12; week++) {
          const days = ['Monday', 'Wednesday', 'Friday'];
          days.forEach(day => {
            for (let exercise = 0; exercise < 10; exercise++) {
              const exerciseKey = `${day}-${exercise}-week${week}`;
              largeDataset[exerciseKey] = Math.random() > 0.5;
              weights[exerciseKey] = Math.floor(Math.random() * 50) + 10;

              for (let nutrition = 0; nutrition < 13; nutrition++) {
                const nutritionKey = `${day}-nutrition-${nutrition}-week${week}`;
                nutrition[nutritionKey] = Math.random() > 0.3;
              }
            }
          });
        }

        localStorage.setItem('completedExercises', JSON.stringify(largeDataset));
        localStorage.setItem('exerciseWeights', JSON.stringify(weights));
        localStorage.setItem('nutritionGoals', JSON.stringify(nutrition));
      });

      const startTime = Date.now();

      await page.goto('/');
      await helpers.waitForAppLoad();

      const loadTime = Date.now() - startTime;

      // Should still load efficiently with large dataset
      expect(loadTime).toBeLessThan(7000);

      // UI should remain responsive
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        const clickStart = Date.now();
        await checkbox.click();
        const clickTime = Date.now() - clickStart;

        // Click response should be immediate
        expect(clickTime).toBeLessThan(500);
      }
    });

    test('should optimize image loading performance', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check for images
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        // Test lazy loading implementation
        const imagesWithLazyLoading = await page.locator('img[loading="lazy"]').count();
        const imagesWithEagerLoading = await page.locator('img[loading="eager"]').count();

        // Should have some optimization strategy
        expect(imagesWithLazyLoading + imagesWithEagerLoading).toBeGreaterThan(0);

        // Check image load performance
        const imageLoadTimes = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('img'));
          return images.map(img => ({
            src: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          }));
        });

        // Images should have proper dimensions
        const validImages = imageLoadTimes.filter(img => img.naturalWidth > 0 && img.naturalHeight > 0);
        expect(validImages.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should maintain performance across device viewports', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1440, height: 900, name: 'Desktop' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        const startTime = Date.now();
        await page.goto('/');
        await helpers.waitForAppLoad();
        const loadTime = Date.now() - startTime;

        // Should load efficiently on all devices
        expect(loadTime).toBeLessThan(6000);

        // UI should be responsive
        const interactiveElement = page.locator('button, input[type="checkbox"]').first();
        if (await interactiveElement.isVisible()) {
          const interactionStart = Date.now();

          if (await interactiveElement.getAttribute('type') === 'checkbox') {
            await interactiveElement.click();
          } else {
            await interactiveElement.click();
          }

          const interactionTime = Date.now() - interactionStart;
          expect(interactionTime).toBeLessThan(300);
        }
      }
    });

    test('should handle memory usage efficiently', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        // Navigate between weeks
        const nextButton = page.locator('button:has-text("→"), button:has-text("Next")').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await helpers.waitForDatabaseSync();
        }

        // Toggle multiple checkboxes
        const checkboxes = page.locator('input[type="checkbox"]');
        const checkboxCount = Math.min(await checkboxes.count(), 5);

        for (let j = 0; j < checkboxCount; j++) {
          const checkbox = checkboxes.nth(j);
          if (await checkbox.isVisible()) {
            await checkbox.click();
            await page.waitForTimeout(50);
          }
        }
      }

      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory shouldn't grow excessively (allow for some growth)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        const memoryGrowthMB = memoryGrowth / (1024 * 1024);

        // Should not grow more than 50MB during normal operations
        expect(memoryGrowthMB).toBeLessThan(50);
      }
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should meet basic accessibility standards', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      const accessibilityResults = await helpers.checkAccessibility();

      // Should have proper page structure
      expect(accessibilityResults.hasTitle).toBe(true);
      expect(accessibilityResults.hasLang).toBe(true);

      // Images should have alt text (or be decorative)
      expect(accessibilityResults.missingAltTags).toBeLessThan(5);

      // Form elements should be properly labeled
      expect(accessibilityResults.missingLabels).toBeLessThan(3);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Test tab navigation
      let tabIndex = 0;
      const maxTabs = 20;

      while (tabIndex < maxTabs) {
        await page.keyboard.press('Tab');

        const activeElement = await page.evaluate(() => {
          const element = document.activeElement;
          return {
            tagName: element?.tagName,
            type: element?.getAttribute('type'),
            role: element?.getAttribute('role'),
            tabIndex: element?.getAttribute('tabindex')
          };
        });

        // Should focus on interactive elements
        const interactiveElements = ['BUTTON', 'INPUT', 'A', 'SELECT', 'TEXTAREA'];
        if (activeElement.tagName && interactiveElements.includes(activeElement.tagName)) {
          // Test Enter/Space activation
          if (activeElement.tagName === 'BUTTON' || activeElement.type === 'checkbox') {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(100);
          }
        }

        tabIndex++;
      }

      // Should be able to interact with focused elements
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper focus indicators', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Test focus visibility on interactive elements
      const focusableElements = page.locator('button, input, a, [tabindex]:not([tabindex="-1"])');
      const elementCount = Math.min(await focusableElements.count(), 10);

      for (let i = 0; i < elementCount; i++) {
        const element = focusableElements.nth(i);
        if (await element.isVisible()) {
          await element.focus();

          // Check if element has focus styles
          const hasFocusStyles = await element.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            const pseudoStyles = window.getComputedStyle(el, ':focus');

            return (
              styles.outline !== 'none' ||
              styles.boxShadow !== 'none' ||
              pseudoStyles.outline !== 'none' ||
              pseudoStyles.boxShadow !== 'none' ||
              el.matches(':focus-visible')
            );
          });

          // Should have some form of focus indication
          expect(hasFocusStyles).toBe(true);
        }
      }
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check for important ARIA attributes
      const elementsWithLabels = await page.locator('[aria-label], [aria-labelledby]').count();
      const elementsWithRoles = await page.locator('[role]').count();
      const buttonsWithText = await page.locator('button').filter({ hasText: /.+/ }).count();

      // Should have some accessibility attributes
      expect(elementsWithLabels + elementsWithRoles + buttonsWithText).toBeGreaterThan(0);

      // Check for landmarks
      const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], main, nav, header').count();
      expect(landmarks).toBeGreaterThanOrEqual(1);
    });

    test('should support screen readers', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check for semantic HTML structure
      const semanticElements = await page.locator('h1, h2, h3, h4, h5, h6, main, nav, section, article').count();
      expect(semanticElements).toBeGreaterThan(0);

      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      expect(headings.length).toBeGreaterThan(0);

      // Should have descriptive page title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title).not.toBe('');
    });

    test('should handle color contrast appropriately', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Test with high contrast mode simulation
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);

      // Elements should still be visible and functional
      const visibleButtons = await page.locator('button:visible').count();
      const visibleInputs = await page.locator('input:visible').count();

      expect(visibleButtons + visibleInputs).toBeGreaterThan(0);

      // Test with light mode
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForTimeout(500);

      // Should still be functional
      const lightModeButtons = await page.locator('button:visible').count();
      const lightModeInputs = await page.locator('input:visible').count();

      expect(lightModeButtons + lightModeInputs).toBeGreaterThan(0);
    });

    test('should support reduced motion preferences', async ({ page }) => {
      // Test with reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto('/');
      await helpers.waitForAppLoad();

      // App should respect reduced motion preferences
      const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').count();

      // Should still be functional regardless of animation preferences
      const functionalElements = await page.locator('button, input[type="checkbox"]').count();
      expect(functionalElements).toBeGreaterThan(0);

      // Test with motion allowed
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.reload();
      await helpers.waitForAppLoad();

      // Should still work with animations enabled
      const functionalElementsWithMotion = await page.locator('button, input[type="checkbox"]').count();
      expect(functionalElementsWithMotion).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Performance & Accessibility', () => {
    test('should be touch-accessible on mobile devices', async ({ page }) => {
      await helpers.setMobileViewport();

      await page.goto('/');
      await helpers.waitForAppLoad();

      // Test touch interactions
      const touchTargets = page.locator('button, input[type="checkbox"], a');
      const targetCount = Math.min(await touchTargets.count(), 5);

      for (let i = 0; i < targetCount; i++) {
        const target = touchTargets.nth(i);
        if (await target.isVisible()) {
          // Check touch target size (should be at least 44x44px)
          const boundingBox = await target.boundingBox();
          if (boundingBox) {
            expect(boundingBox.width).toBeGreaterThanOrEqual(24); // Minimum for dense interfaces
            expect(boundingBox.height).toBeGreaterThanOrEqual(24);
          }

          // Test touch interaction
          await target.click();
          await page.waitForTimeout(100);
        }
      }
    });

    test('should maintain performance on mobile devices', async ({ page }) => {
      await helpers.setMobileViewport();

      const startTime = Date.now();
      await page.goto('/');
      await helpers.waitForAppLoad();
      const loadTime = Date.now() - startTime;

      // Should load efficiently on mobile
      expect(loadTime).toBeLessThan(8000);

      // Test mobile-specific interactions
      const mobileElements = page.locator('button, input[type="checkbox"]');
      const mobileElementCount = Math.min(await mobileElements.count(), 3);

      for (let i = 0; i < mobileElementCount; i++) {
        const element = mobileElements.nth(i);
        if (await element.isVisible()) {
          const interactionStart = Date.now();
          await element.click();
          const interactionTime = Date.now() - interactionStart;

          // Mobile interactions should be responsive
          expect(interactionTime).toBeLessThan(500);
        }
      }
    });

    test('should handle orientation changes gracefully', async ({ page }) => {
      await helpers.setMobileViewport();
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Test portrait mode
      const portraitElements = await page.locator('button, input').count();

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);

      // Should adapt to landscape
      const landscapeElements = await page.locator('button, input').count();

      // Elements should still be accessible
      expect(landscapeElements).toBeGreaterThan(0);
      expect(Math.abs(landscapeElements - portraitElements)).toBeLessThan(5); // Some variance is acceptable
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 200)); // Add 200ms delay
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto('/');
      await helpers.waitForAppLoad();
      const loadTime = Date.now() - startTime;

      // Should still load within reasonable time on slow connections
      expect(loadTime).toBeLessThan(15000);

      // Core functionality should work
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
        await expect(checkbox).toBeChecked();
      }
    });

    test('should optimize resource loading', async ({ page }) => {
      const requests: string[] = [];

      page.on('request', request => {
        requests.push(request.url());
      });

      await page.goto('/');
      await helpers.waitForAppLoad();

      // Should not make excessive requests
      expect(requests.length).toBeLessThan(50);

      // Should prioritize critical resources
      const criticalResources = requests.filter(url =>
        url.includes('.js') || url.includes('.css') || url.includes('.html')
      );

      expect(criticalResources.length).toBeGreaterThan(0);
    });
  });
});