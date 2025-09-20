import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';
import { TestHelpers } from './test-helpers';

/**
 * Enhanced Performance and Accessibility Tests for Momentum Vita
 *
 * Comprehensive testing of:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Performance metrics and optimization
 * - WCAG 2.1 AA compliance
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast and visual accessibility
 * - Performance under load
 */

test.describe('Enhanced Performance and Accessibility', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Core Web Vitals', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');

      // Collect performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

            const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
            const fcp = entries.find(entry => entry.entryType === 'first-contentful-paint');

            resolve({
              lcp: lcp ? lcp.startTime : null,
              fcp: fcp ? fcp.startTime : null,
              domContentLoaded: navigationEntry ? navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart : null,
              loadComplete: navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.fetchStart : null,
              ttfb: navigationEntry ? navigationEntry.responseStart - navigationEntry.requestStart : null
            });
          });

          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-contentful-paint'] });

          // Fallback timeout
          setTimeout(() => resolve({
            lcp: null,
            fcp: null,
            domContentLoaded: null,
            loadComplete: null,
            ttfb: null
          }), 5000);
        });
      });

      const loadTime = Date.now() - startTime;

      // Core Web Vitals thresholds
      if (metrics.lcp) {
        expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s (good)
      }
      if (metrics.fcp) {
        expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s (good)
      }
      if (metrics.ttfb) {
        expect(metrics.ttfb).toBeLessThan(800); // TTFB < 800ms (good)
      }

      // Overall load time
      expect(loadTime).toBeLessThan(3000); // 3 second target
    });

    test('should minimize Cumulative Layout Shift (CLS)', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Measure layout shifts
      const clsScore = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });

          observer.observe({ entryTypes: ['layout-shift'] });

          // Wait for layout stabilization
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });

      // CLS should be minimal (< 0.1 is good)
      expect(clsScore).toBeLessThan(0.1);
    });

    test('should handle input responsiveness (FID simulation)', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Simulate user interaction and measure response time
      const exerciseCheckbox = page.locator('[data-testid="exercise-complete-1"]').first();

      if (await exerciseCheckbox.isVisible()) {
        const startTime = Date.now();
        await exerciseCheckbox.click();
        const endTime = Date.now();

        const inputDelay = endTime - startTime;

        // Input delay should be minimal (< 100ms is good)
        expect(inputDelay).toBeLessThan(100);

        // Verify interaction worked
        await expect(exerciseCheckbox).toBeChecked();
      }
    });
  });

  test.describe('Resource Loading Performance', () => {
    test('should optimize image loading', async ({ page }) => {
      await page.goto('/');

      // Monitor image loading performance
      const imageMetrics = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const imageData = images.map(img => ({
          src: img.src,
          loaded: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: img.offsetWidth,
          displayHeight: img.offsetHeight
        }));

        return {
          totalImages: images.length,
          loadedImages: images.filter(img => img.complete).length,
          imageData
        };
      });

      // All critical images should load
      expect(imageMetrics.loadedImages).toBeGreaterThan(0);

      // Check for properly sized images (not oversized)
      const oversizedImages = imageMetrics.imageData.filter(img =>
        img.naturalWidth > img.displayWidth * 2 ||
        img.naturalHeight > img.displayHeight * 2
      );

      expect(oversizedImages.length).toBeLessThan(imageMetrics.totalImages * 0.3); // Max 30% oversized
    });

    test('should efficiently load JavaScript bundles', async ({ page }) => {
      const jsResources: Array<{ url: string; size: number; loadTime: number }> = [];

      // Monitor JavaScript resource loading
      page.on('response', async (response) => {
        if (response.url().includes('.js') && response.status() === 200) {
          const timing = response.timing();
          const headers = response.headers();
          const contentLength = headers['content-length'];

          jsResources.push({
            url: response.url(),
            size: contentLength ? parseInt(contentLength) : 0,
            loadTime: timing.responseEnd - timing.responseStart
          });
        }
      });

      await page.goto('/');
      await helpers.waitForAppLoad();

      // Main bundle should be reasonably sized
      const mainBundle = jsResources.find(resource => resource.url.includes('index') || resource.url.includes('main'));
      if (mainBundle) {
        expect(mainBundle.size).toBeLessThan(500 * 1024); // < 500KB for main bundle
        expect(mainBundle.loadTime).toBeLessThan(2000); // < 2s load time
      }

      // Total JavaScript should be reasonable
      const totalJSSize = jsResources.reduce((sum, resource) => sum + resource.size, 0);
      expect(totalJSSize).toBeLessThan(1024 * 1024); // < 1MB total JS
    });

    test('should implement efficient caching strategies', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check for proper cache headers
      const staticResources = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources
          .filter(resource => resource.name.includes('.js') || resource.name.includes('.css') || resource.name.includes('.png'))
          .map(resource => ({
            url: resource.name,
            transferSize: resource.transferSize,
            encodedBodySize: resource.encodedBodySize,
            fromCache: resource.transferSize === 0
          }));
      });

      // On repeat visits, static resources should be cached
      if (staticResources.length > 0) {
        const cachedResources = staticResources.filter(resource => resource.fromCache);
        expect(cachedResources.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should pass automated accessibility checks', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();
      await injectAxe(page);

      // Run comprehensive accessibility audit
      await checkA11y(page, null, {
        rules: {
          // Enable all WCAG 2.1 AA rules
          'color-contrast': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'keyboard': { enabled: true },
          'label': { enabled: true },
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true },
          'skip-link': { enabled: true }
        }
      });
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check heading structure
      const headings = await page.evaluate(() => {
        const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headingElements.map(heading => ({
          level: parseInt(heading.tagName.charAt(1)),
          text: heading.textContent?.trim(),
          visible: heading.offsetParent !== null
        }));
      });

      // Should have exactly one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);

      // Heading levels should be logical (no skipping levels)
      let previousLevel = 0;
      for (const heading of headings.filter(h => h.visible)) {
        expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
        previousLevel = heading.level;
      }
    });

    test('should provide proper form labels and descriptions', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check all form inputs have proper labels
      const formInputs = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        return inputs.map(input => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null;

          return {
            type: input.tagName.toLowerCase(),
            hasLabel: !!(ariaLabel || ariaLabelledBy || associatedLabel),
            required: input.hasAttribute('required'),
            describedBy: input.getAttribute('aria-describedby')
          };
        });
      });

      // All form inputs should have labels
      const unlabeledInputs = formInputs.filter(input => !input.hasLabel);
      expect(unlabeledInputs.length).toBe(0);

      // Required fields should be properly indicated
      const requiredFields = formInputs.filter(input => input.required);
      if (requiredFields.length > 0) {
        // At least some should have aria-describedby for error handling
        expect(requiredFields.some(field => field.describedBy)).toBe(true);
      }
    });

    test('should support screen reader navigation', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check for proper landmarks
      const landmarks = await page.evaluate(() => {
        const landmarkRoles = ['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'region'];
        const landmarks = landmarkRoles.map(role => ({
          role,
          elements: document.querySelectorAll(`[role="${role}"], ${role === 'main' ? 'main' : ''}`).length
        }));
        return landmarks;
      });

      // Should have main landmark
      const mainLandmark = landmarks.find(l => l.role === 'main');
      expect(mainLandmark?.elements).toBeGreaterThan(0);

      // Check for skip links
      const skipLink = page.locator('a[href="#main"], a:has-text("Skip to content")').first();
      if (await skipLink.isVisible()) {
        await expect(skipLink).toHaveAttribute('href', '#main');
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support complete keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Tab through all interactive elements
      const interactiveElements: string[] = [];
      let tabCount = 0;
      const maxTabs = 50;

      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;

        const activeElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            type: (el as HTMLInputElement)?.type,
            role: el?.getAttribute('role'),
            ariaLabel: el?.getAttribute('aria-label'),
            textContent: el?.textContent?.trim().substring(0, 50)
          };
        });

        if (activeElement.tagName === 'BODY') {
          // Reached end of tab cycle
          break;
        }

        interactiveElements.push(`${activeElement.tagName}:${activeElement.type || activeElement.role}`);
      }

      // Should be able to reach all major interactive elements
      expect(interactiveElements.length).toBeGreaterThan(5);
      expect(tabCount).toBeLessThan(maxTabs); // Shouldn't infinite loop
    });

    test('should handle focus management in modals', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Try to open a modal (authentication, timer, etc.)
      const modalTrigger = page.locator('[data-testid="auth-button"], [data-testid="timer-button"], button:has-text("Sign In")').first();

      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();

        const modal = page.locator('[data-testid="auth-modal"], [data-testid="timer-modal"], [role="dialog"]');
        if (await modal.isVisible()) {
          // Focus should be trapped in modal
          await page.keyboard.press('Tab');

          const focusedElement = await page.evaluate(() => {
            const el = document.activeElement;
            return el?.closest('[role="dialog"]') !== null;
          });

          expect(focusedElement).toBe(true);

          // Escape should close modal
          await page.keyboard.press('Escape');
          await expect(modal).not.toBeVisible();
        }
      }
    });

    test('should provide visible focus indicators', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Tab to first interactive element
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Check for visible focus indicator
      const focusStyles = await focusedElement.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
          borderColor: styles.borderColor
        };
      });

      // Should have some form of focus indicator
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.borderColor !== 'rgba(0, 0, 0, 0)';

      expect(hasFocusIndicator).toBe(true);
    });
  });

  test.describe('Color and Visual Accessibility', () => {
    test('should meet color contrast requirements', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();
      await injectAxe(page);

      // Run color contrast specific check
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true } // AAA level
        }
      });
    });

    test('should not rely solely on color for information', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check exercise completion indicators
      const completedExercises = page.locator('[data-testid="exercise-complete"]:checked');
      const completedCount = await completedExercises.count();

      if (completedCount > 0) {
        // Should have text/icon indicators in addition to color
        const firstCompleted = completedExercises.first();
        const parentCard = firstCompleted.locator('..');

        // Should have checkmark icon or text indicator
        const hasIconIndicator = await parentCard.locator('svg[data-testid="check-icon"], .check-icon, :has-text("Complete")').count();
        expect(hasIconIndicator).toBeGreaterThan(0);
      }
    });

    test('should support high contrast mode', async ({ page }) => {
      // Simulate Windows high contrast mode
      await page.emulateMedia({ forcedColors: 'active' });

      await page.goto('/');
      await helpers.waitForAppLoad();

      // App should remain functional in high contrast mode
      await expect(page.locator('[data-testid="training-program"]')).toBeVisible();

      // Interactive elements should remain distinguishable
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await expect(firstButton).toBeVisible();

        // Should have proper border in high contrast mode
        const borderStyles = await firstButton.evaluate(el => {
          const styles = getComputedStyle(el);
          return {
            border: styles.border,
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        });

        expect(borderStyles.border).not.toBe('none');
      }
    });

    test('should support reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto('/');
      await helpers.waitForAppLoad();

      // Check that animations are disabled/reduced
      const animatedElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => {
          const styles = getComputedStyle(el);
          return styles.animationDuration !== '0s' || styles.transitionDuration !== '0s';
        }).length;
      });

      // Should have minimal or no animations
      expect(animatedElements).toBeLessThan(5);
    });
  });

  test.describe('Performance Under Load', () => {
    test('should maintain performance with large datasets', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Simulate user with extensive workout history
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Generate large dataset
      for (let i = 0; i < 20; i++) {
        const exerciseCheckboxes = page.locator('[data-testid^="exercise-complete-"]');
        const exerciseCount = await exerciseCheckboxes.count();

        for (let j = 0; j < Math.min(exerciseCount, 5); j++) {
          const checkbox = exerciseCheckboxes.nth(j);
          if (await checkbox.isVisible()) {
            await checkbox.click();
          }
        }

        // Save session
        const saveButton = page.locator('[data-testid="save-session"], button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(100);
        }
      }

      // Navigate to history view with large dataset
      const historyButton = page.locator('[data-testid="workout-history"], button:has-text("History")').first();
      if (await historyButton.isVisible()) {
        const startTime = Date.now();
        await historyButton.click();
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - startTime;

        // Should load quickly even with large dataset
        expect(loadTime).toBeLessThan(2000);

        // History should be visible
        const historyContent = page.locator('[data-testid="history-content"], [data-testid="session-list"]');
        await expect(historyContent).toBeVisible();
      }
    });

    test('should handle memory usage efficiently', async ({ page }) => {
      await page.goto('/');
      await helpers.waitForAppLoad();

      // Measure initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });

      // Perform intensive operations
      await helpers.authenticateUser(page, 'test@example.com', 'password123');

      // Navigate through multiple sections
      const sections = ['program-selection', 'workout-history', 'achievements'];
      for (const section of sections) {
        const sectionButton = page.locator(`[data-testid="${section}"], button:has-text("${section.replace('-', ' ')}")`, { hasText: new RegExp(section.replace('-', ' '), 'i') }).first();
        if (await sectionButton.isVisible()) {
          await sectionButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Measure memory after operations
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const percentageIncrease = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;

        // Memory usage shouldn't increase dramatically
        expect(percentageIncrease).toBeLessThan(200); // Less than 200% increase
      }
    });
  });
});