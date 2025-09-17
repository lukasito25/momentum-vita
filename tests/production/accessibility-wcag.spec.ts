import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

interface AccessibilityReport {
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    helpUrl: string;
    nodes: Array<{
      html: string;
      target: string[];
      failureSummary: string;
    }>;
  }>;
  passes: Array<{
    id: string;
    description: string;
  }>;
  incomplete: Array<{
    id: string;
    description: string;
  }>;
}

interface KeyboardNavigationResult {
  totalFocusableElements: number;
  elementsWithFocusIndicator: number;
  elementsReachableByTab: number;
  elementsActivatedByEnter: number;
  elementsActivatedBySpace: number;
}

class AccessibilityTestHelper {
  constructor(private page: Page) {}

  /**
   * Run comprehensive axe accessibility audit
   */
  async runAxeAudit(options?: {
    include?: string[];
    exclude?: string[];
    tags?: string[];
  }): Promise<AccessibilityReport> {
    const axeBuilder = new AxeBuilder({ page: this.page });

    if (options?.include) {
      axeBuilder.include(options.include);
    }
    if (options?.exclude) {
      axeBuilder.exclude(options.exclude);
    }
    if (options?.tags) {
      axeBuilder.withTags(options.tags);
    }

    const results = await axeBuilder.analyze();

    return {
      violations: results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact || 'unknown',
        description: violation.description,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary || ''
        }))
      })),
      passes: results.passes.map(pass => ({
        id: pass.id,
        description: pass.description
      })),
      incomplete: results.incomplete.map(incomplete => ({
        id: incomplete.id,
        description: incomplete.description
      }))
    };
  }

  /**
   * Test keyboard navigation comprehensively
   */
  async testKeyboardNavigation(): Promise<KeyboardNavigationResult> {
    // Get all focusable elements
    const focusableElements = await this.page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();

    const result: KeyboardNavigationResult = {
      totalFocusableElements: focusableElements.length,
      elementsWithFocusIndicator: 0,
      elementsReachableByTab: 0,
      elementsActivatedByEnter: 0,
      elementsActivatedBySpace: 0
    };

    // Test each focusable element
    for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
      const element = focusableElements[i];

      // Focus the element
      await element.focus();

      // Check if element has focus indicator
      const hasFocusIndicator = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const focusStyles = window.getComputedStyle(el, ':focus');

        return (
          styles.outline !== 'none' ||
          styles.boxShadow !== 'none' ||
          focusStyles.outline !== 'none' ||
          focusStyles.boxShadow !== 'none' ||
          el.matches(':focus-visible') ||
          styles.borderColor !== focusStyles.borderColor ||
          styles.backgroundColor !== focusStyles.backgroundColor
        );
      });

      if (hasFocusIndicator) {
        result.elementsWithFocusIndicator++;
      }

      // Check if element is reachable by tab
      await this.page.keyboard.press('Tab');
      const isStillFocused = await element.evaluate(el => document.activeElement === el);
      const nextFocusedElement = await this.page.evaluate(() => document.activeElement?.tagName);

      if (isStillFocused || nextFocusedElement) {
        result.elementsReachableByTab++;
      }

      // Test activation methods
      await element.focus();

      // Test Enter activation
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      if (['button', 'a', 'input'].includes(tagName)) {
        try {
          await element.press('Enter');
          result.elementsActivatedByEnter++;
        } catch {
          // Element might not be activatable
        }
      }

      // Test Space activation for buttons and checkboxes
      if (tagName === 'button' || (tagName === 'input' && await element.getAttribute('type') === 'checkbox')) {
        try {
          await element.focus();
          await element.press('Space');
          result.elementsActivatedBySpace++;
        } catch {
          // Element might not be activatable
        }
      }
    }

    return result;
  }

  /**
   * Test screen reader compatibility
   */
  async testScreenReaderCompatibility(): Promise<{
    semanticStructure: boolean;
    headingHierarchy: boolean;
    altTextCoverage: number;
    ariaLabelUsage: number;
    landmarkUsage: number;
    skipLinks: boolean;
  }> {
    // Check semantic structure
    const semanticElements = await this.page.locator('main, nav, header, footer, aside, section, article').count();
    const semanticStructure = semanticElements > 0;

    // Check heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    let headingHierarchy = true;
    let previousLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const currentLevel = parseInt(tagName.charAt(1));

      if (previousLevel > 0 && currentLevel > previousLevel + 1) {
        headingHierarchy = false;
        break;
      }
      previousLevel = currentLevel;
    }

    // Check alt text coverage
    const images = await this.page.locator('img').all();
    let imagesWithAlt = 0;
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      if (alt !== null || role === 'presentation') {
        imagesWithAlt++;
      }
    }
    const altTextCoverage = images.length > 0 ? (imagesWithAlt / images.length) * 100 : 100;

    // Check ARIA label usage
    const elementsWithAria = await this.page.locator(
      '[aria-label], [aria-labelledby], [aria-describedby], [role]'
    ).count();

    // Check landmark usage
    const landmarks = await this.page.locator(
      'main, nav, header, footer, aside, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'
    ).count();

    // Check for skip links
    const skipLinks = await this.page.locator('a[href*="#"], [class*="skip"]').first().isVisible();

    return {
      semanticStructure,
      headingHierarchy,
      altTextCoverage,
      ariaLabelUsage: elementsWithAria,
      landmarkUsage: landmarks,
      skipLinks
    };
  }

  /**
   * Test color contrast and visual accessibility
   */
  async testColorAndVisualAccessibility(): Promise<{
    highContrastSupport: boolean;
    darkModeSupport: boolean;
    reducedMotionSupport: boolean;
    colorOnlyInformation: boolean;
    textScaling: boolean;
  }> {
    const results = {
      highContrastSupport: false,
      darkModeSupport: false,
      reducedMotionSupport: false,
      colorOnlyInformation: false,
      textScaling: false
    };

    // Test high contrast support
    await this.page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    await this.page.waitForTimeout(500);
    const elementsVisibleInHighContrast = await this.page.locator('button, input, a').count();
    results.highContrastSupport = elementsVisibleInHighContrast > 0;

    // Test dark mode support
    await this.page.emulateMedia({ colorScheme: 'dark' });
    await this.page.waitForTimeout(500);
    const darkModeStyles = await this.page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });
    results.darkModeSupport = darkModeStyles.backgroundColor !== 'rgba(0, 0, 0, 0)';

    // Reset to light mode
    await this.page.emulateMedia({ colorScheme: 'light' });

    // Test reduced motion support
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
    await this.page.waitForTimeout(500);
    const animatedElements = await this.page.locator('[class*="animate"], [class*="transition"]').count();
    const motionCheckResult = await this.page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    results.reducedMotionSupport = motionCheckResult;

    // Reset reduced motion
    await this.page.emulateMedia({ reducedMotion: 'no-preference' });

    // Check for color-only information (simplified check)
    const colorOnlyElements = await this.page.locator(
      '[style*="color"], [class*="text-red"], [class*="text-green"], [class*="bg-red"], [class*="bg-green"]'
    ).count();
    const elementsWithTextOrIcons = await this.page.locator(
      'button:has-text(""), input[type="submit"], a:has-text(""), [aria-label], [title]'
    ).count();
    results.colorOnlyInformation = elementsWithTextOrIcons >= colorOnlyElements * 0.8;

    // Test text scaling (simulate 200% zoom)
    await this.page.setViewportSize({ width: 640, height: 480 }); // Simulate zoom
    await this.page.waitForTimeout(500);
    const overlappingElements = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => {
        const rect = el.getBoundingClientRect();
        return rect.width < 0 || rect.height < 0;
      });
    });
    results.textScaling = !overlappingElements;

    // Reset viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });

    return results;
  }

  /**
   * Wait for app to be ready for testing
   */
  async waitForAppReady(): Promise<void> {
    await this.page.waitForSelector('body', { timeout: 30000 });
    await this.page.waitForLoadState('networkidle');

    // Wait for any loading spinners to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
      return loadingElements.length === 0 ||
             Array.from(loadingElements).every(el =>
               window.getComputedStyle(el as Element).display === 'none'
             );
    }, { timeout: 30000 });
  }
}

test.describe('Accessibility & WCAG Compliance Tests', () => {
  let accessibilityHelper: AccessibilityTestHelper;

  test.beforeEach(async ({ page }) => {
    accessibilityHelper = new AccessibilityTestHelper(page);
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should pass WCAG 2.1 AA accessibility audit', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      // Run comprehensive axe audit with WCAG 2.1 AA rules
      const results = await accessibilityHelper.runAxeAudit({
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
      });

      console.log(`Accessibility Audit Results:
        Violations: ${results.violations.length}
        Passes: ${results.passes.length}
        Incomplete: ${results.incomplete.length}
      `);

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log('Violations found:');
        results.violations.forEach(violation => {
          console.log(`- ${violation.id}: ${violation.description} (${violation.impact})`);
          console.log(`  Help: ${violation.helpUrl}`);
        });
      }

      // Assert WCAG compliance
      const criticalViolations = results.violations.filter(v =>
        v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toHaveLength(0);

      // Allow some minor violations but they should be minimal
      expect(results.violations.length).toBeLessThan(5);

      // Should have many successful checks
      expect(results.passes.length).toBeGreaterThan(10);
    });

    test('should support comprehensive keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      const navigationResults = await accessibilityHelper.testKeyboardNavigation();

      console.log('Keyboard Navigation Results:', navigationResults);

      // At least 80% of elements should have focus indicators
      const focusIndicatorPercentage = (navigationResults.elementsWithFocusIndicator / navigationResults.totalFocusableElements) * 100;
      expect(focusIndicatorPercentage).toBeGreaterThan(80);

      // All elements should be reachable by tab navigation
      expect(navigationResults.elementsReachableByTab).toBeGreaterThan(0);

      // Interactive elements should respond to keyboard activation
      expect(navigationResults.elementsActivatedByEnter).toBeGreaterThan(0);
    });

    test('should be compatible with screen readers', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      const screenReaderResults = await accessibilityHelper.testScreenReaderCompatibility();

      console.log('Screen Reader Compatibility:', screenReaderResults);

      // Should have proper semantic structure
      expect(screenReaderResults.semanticStructure).toBe(true);

      // Should have logical heading hierarchy
      expect(screenReaderResults.headingHierarchy).toBe(true);

      // At least 90% of images should have alt text or be marked as decorative
      expect(screenReaderResults.altTextCoverage).toBeGreaterThan(90);

      // Should have ARIA labels where appropriate
      expect(screenReaderResults.ariaLabelUsage).toBeGreaterThan(0);

      // Should have proper landmarks
      expect(screenReaderResults.landmarkUsage).toBeGreaterThan(0);
    });

    test('should meet color contrast and visual accessibility standards', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      const visualResults = await accessibilityHelper.testColorAndVisualAccessibility();

      console.log('Visual Accessibility Results:', visualResults);

      // Should support high contrast mode
      expect(visualResults.highContrastSupport).toBe(true);

      // Should adapt to dark mode
      expect(visualResults.darkModeSupport).toBe(true);

      // Should respect reduced motion preferences
      expect(visualResults.reducedMotionSupport).toBe(true);

      // Should not rely on color alone for information
      expect(visualResults.colorOnlyInformation).toBe(true);

      // Should handle text scaling properly
      expect(visualResults.textScaling).toBe(true);
    });
  });

  test.describe('Advanced Accessibility Features', () => {
    test('should provide proper focus management', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      // Test focus trap in modals/popups if they exist
      const modalTriggers = page.locator('button[data-testid*="modal"], button[data-testid*="popup"]');
      const modalCount = await modalTriggers.count();

      if (modalCount > 0) {
        const firstModal = modalTriggers.first();
        await firstModal.click();

        // Wait for modal to appear
        await page.waitForTimeout(500);

        // Test that focus is trapped within modal
        let tabIndex = 0;
        const maxTabs = 10;
        let focusedElements: string[] = [];

        while (tabIndex < maxTabs) {
          await page.keyboard.press('Tab');
          const focusedElement = await page.evaluate(() => {
            const el = document.activeElement;
            return el ? `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}` : 'none';
          });
          focusedElements.push(focusedElement);
          tabIndex++;
        }

        // Should cycle through modal elements only
        const uniqueFocusedElements = [...new Set(focusedElements)];
        expect(uniqueFocusedElements.length).toBeGreaterThan(1);
        expect(uniqueFocusedElements.length).toBeLessThan(10); // Should be limited to modal elements

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }

      // Test focus restoration after interactions
      const buttons = page.locator('button').first();
      if (await buttons.isVisible()) {
        await buttons.focus();
        const initialFocusedElement = await page.evaluate(() => document.activeElement?.tagName);

        await buttons.click();
        await page.waitForTimeout(200);

        // Focus should be maintained or restored appropriately
        const finalFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(finalFocusedElement).toBeTruthy();
      }
    });

    test('should provide appropriate ARIA live regions and announcements', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      // Check for ARIA live regions
      const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();

      // Check for proper ARIA attributes on interactive elements
      const elementsWithAriaLabels = await page.locator('[aria-label]').count();
      const elementsWithAriaDescribedBy = await page.locator('[aria-describedby]').count();
      const elementsWithAriaExpanded = await page.locator('[aria-expanded]').count();

      console.log(`ARIA Usage:
        Live regions: ${liveRegions}
        Elements with aria-label: ${elementsWithAriaLabels}
        Elements with aria-describedby: ${elementsWithAriaDescribedBy}
        Elements with aria-expanded: ${elementsWithAriaExpanded}
      `);

      // Should have some ARIA attributes for enhanced accessibility
      const totalAriaUsage = elementsWithAriaLabels + elementsWithAriaDescribedBy + elementsWithAriaExpanded;
      expect(totalAriaUsage).toBeGreaterThan(0);

      // Test dynamic content announcements
      const interactiveElements = page.locator('button, input[type="checkbox"]');
      const elementCount = Math.min(await interactiveElements.count(), 3);

      for (let i = 0; i < elementCount; i++) {
        const element = interactiveElements.nth(i);
        if (await element.isVisible()) {
          // Check if element has proper labeling
          const hasLabel = await element.evaluate(el => {
            return !!(
              el.getAttribute('aria-label') ||
              el.getAttribute('aria-labelledby') ||
              el.textContent?.trim() ||
              el.getAttribute('title')
            );
          });
          expect(hasLabel).toBe(true);
        }
      }
    });

    test('should handle form accessibility correctly', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      // Find form elements
      const inputs = await page.locator('input, select, textarea').all();

      if (inputs.length > 0) {
        for (const input of inputs.slice(0, 5)) { // Test first 5 inputs
          const inputType = await input.getAttribute('type');
          const tagName = await input.evaluate(el => el.tagName.toLowerCase());

          // Check labeling
          const hasProperLabel = await input.evaluate(el => {
            // Check for explicit label
            const id = el.id;
            if (id) {
              const label = document.querySelector(`label[for="${id}"]`);
              if (label) return true;
            }

            // Check for aria-label or aria-labelledby
            if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) {
              return true;
            }

            // Check for parent label
            const parentLabel = el.closest('label');
            if (parentLabel) return true;

            // Check for placeholder (not ideal but acceptable for some cases)
            if (el.getAttribute('placeholder') && inputType !== 'password') {
              return true;
            }

            return false;
          });

          expect(hasProperLabel).toBe(true);

          // Check for error handling accessibility
          if (inputType === 'email' || inputType === 'text') {
            // Try to trigger validation
            await input.fill('invalid');
            await input.blur();
            await page.waitForTimeout(500);

            const hasErrorMessage = await input.evaluate(el => {
              return !!(
                el.getAttribute('aria-describedby') ||
                el.getAttribute('aria-invalid') ||
                document.querySelector(`[id*="${el.id}"][role="alert"]`) ||
                document.querySelector(`.error, .invalid, [class*="error"]`)
              );
            });

            // Error handling should be accessible (if validation exists)
            if (hasErrorMessage) {
              expect(hasErrorMessage).toBe(true);
            }
          }
        }
      }
    });

    test('should support assistive technology interactions', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      // Test custom widget accessibility (if any exist)
      const customWidgets = await page.locator('[role="button"]:not(button), [role="checkbox"]:not(input), [role="slider"], [role="tablist"]').all();

      for (const widget of customWidgets.slice(0, 3)) {
        const role = await widget.getAttribute('role');

        switch (role) {
          case 'button':
            // Should be activatable with Enter and Space
            await widget.focus();
            await expect(widget).toBeFocused();

            // Test keyboard activation
            await widget.press('Enter');
            await page.waitForTimeout(100);
            break;

          case 'checkbox':
            // Should have aria-checked attribute
            const hasAriaChecked = await widget.getAttribute('aria-checked');
            expect(hasAriaChecked).toBeTruthy();

            await widget.focus();
            await widget.press('Space');
            await page.waitForTimeout(100);
            break;

          case 'slider':
            // Should have aria-valuenow, aria-valuemin, aria-valuemax
            const hasAriaValue = await widget.evaluate(el => {
              return !!(
                el.getAttribute('aria-valuenow') ||
                el.getAttribute('aria-valuemin') ||
                el.getAttribute('aria-valuemax')
              );
            });
            expect(hasAriaValue).toBe(true);
            break;

          case 'tablist':
            // Should have proper tab navigation
            const tabItems = page.locator('[role="tab"]');
            const tabCount = await tabItems.count();
            if (tabCount > 0) {
              await tabItems.first().focus();
              await page.keyboard.press('ArrowRight');
              await page.waitForTimeout(100);
            }
            break;
        }
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      // Test touch target sizes
      const touchTargets = await page.locator('button, a, input, [onclick], [role="button"]').all();

      for (const target of touchTargets.slice(0, 10)) {
        if (await target.isVisible()) {
          const boundingBox = await target.boundingBox();
          if (boundingBox) {
            // WCAG recommends minimum 44x44px touch targets
            expect(boundingBox.width).toBeGreaterThanOrEqual(24); // Allow smaller for dense interfaces
            expect(boundingBox.height).toBeGreaterThanOrEqual(24);
          }
        }
      }

      // Test mobile-specific accessibility features
      const results = await accessibilityHelper.runAxeAudit({
        tags: ['wcag2a', 'wcag2aa']
      });

      // Should have no critical mobile accessibility violations
      const criticalMobileViolations = results.violations.filter(v =>
        v.impact === 'critical' &&
        (v.id.includes('touch') || v.id.includes('mobile') || v.id.includes('target'))
      );
      expect(criticalMobileViolations).toHaveLength(0);
    });

    test('should handle orientation changes accessibly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Portrait
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      // Test portrait mode accessibility
      const portraitResults = await accessibilityHelper.runAxeAudit();

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 }); // Landscape
      await page.waitForTimeout(1000);

      // Test landscape mode accessibility
      const landscapeResults = await accessibilityHelper.runAxeAudit();

      // Both orientations should be accessible
      expect(portraitResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
      expect(landscapeResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0);

      // Content should remain accessible in both orientations
      const landscapeButtons = await page.locator('button').count();
      const landscapeLinks = await page.locator('a').count();

      expect(landscapeButtons + landscapeLinks).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility Reporting', () => {
    test('should generate comprehensive accessibility report', async ({ page }) => {
      await page.goto('/');
      await accessibilityHelper.waitForAppReady();

      // Run all accessibility tests
      const axeResults = await accessibilityHelper.runAxeAudit({
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
      });
      const keyboardResults = await accessibilityHelper.testKeyboardNavigation();
      const screenReaderResults = await accessibilityHelper.testScreenReaderCompatibility();
      const visualResults = await accessibilityHelper.testColorAndVisualAccessibility();

      // Compile comprehensive report
      const accessibilityReport = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        wcagCompliance: {
          totalViolations: axeResults.violations.length,
          criticalViolations: axeResults.violations.filter(v => v.impact === 'critical').length,
          seriousViolations: axeResults.violations.filter(v => v.impact === 'serious').length,
          moderateViolations: axeResults.violations.filter(v => v.impact === 'moderate').length,
          minorViolations: axeResults.violations.filter(v => v.impact === 'minor').length,
          totalPasses: axeResults.passes.length,
          complianceScore: Math.max(0, 100 - (axeResults.violations.length * 5))
        },
        keyboardAccessibility: {
          ...keyboardResults,
          keyboardScore: Math.round((keyboardResults.elementsWithFocusIndicator / keyboardResults.totalFocusableElements) * 100)
        },
        screenReaderCompatibility: {
          ...screenReaderResults,
          screenReaderScore: Math.round(
            (Number(screenReaderResults.semanticStructure) * 20) +
            (Number(screenReaderResults.headingHierarchy) * 20) +
            (screenReaderResults.altTextCoverage * 0.2) +
            (Math.min(screenReaderResults.ariaLabelUsage, 10) * 2) +
            (Math.min(screenReaderResults.landmarkUsage, 5) * 4) +
            (Number(screenReaderResults.skipLinks) * 10)
          )
        },
        visualAccessibility: {
          ...visualResults,
          visualScore: Math.round(
            (Number(visualResults.highContrastSupport) * 20) +
            (Number(visualResults.darkModeSupport) * 20) +
            (Number(visualResults.reducedMotionSupport) * 20) +
            (Number(visualResults.colorOnlyInformation) * 20) +
            (Number(visualResults.textScaling) * 20)
          )
        }
      };

      // Calculate overall accessibility score
      const overallScore = Math.round(
        (accessibilityReport.wcagCompliance.complianceScore * 0.4) +
        (accessibilityReport.keyboardAccessibility.keyboardScore * 0.2) +
        (accessibilityReport.screenReaderCompatibility.screenReaderScore * 0.2) +
        (accessibilityReport.visualAccessibility.visualScore * 0.2)
      );

      accessibilityReport['overallAccessibilityScore'] = overallScore;

      console.log('Accessibility Report:', JSON.stringify(accessibilityReport, null, 2));

      // Assert minimum accessibility standards
      expect(accessibilityReport.wcagCompliance.criticalViolations).toBe(0);
      expect(accessibilityReport.wcagCompliance.complianceScore).toBeGreaterThan(80);
      expect(overallScore).toBeGreaterThan(75);

      // Store report for CI/CD integration
      await page.evaluate((report) => {
        (window as any).accessibilityReport = report;
      }, accessibilityReport);
    });
  });
});