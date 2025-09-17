import { test, expect, Page } from '@playwright/test';

interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive
}

interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  resourceLoadTimes: Array<{ name: string; duration: number; size?: number }>;
  bundleSize: number;
  imageOptimization: {
    totalImages: number;
    optimizedImages: number;
    lazyLoadedImages: number;
    averageImageSize: number;
  };
}

class PerformanceTestHelper {
  constructor(private page: Page) {}

  /**
   * Measure Core Web Vitals
   */
  async measureCoreWebVitals(): Promise<CoreWebVitals> {
    return await this.page.evaluate(() => {
      return new Promise<CoreWebVitals>((resolve) => {
        const vitals: Partial<CoreWebVitals> = {};

        // Measure LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Measure FID
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            vitals.fid = entry.processingStart - entry.startTime;
          });
        }).observe({ entryTypes: ['first-input'] });

        // Measure CLS
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        vitals.fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

        // Get navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        vitals.ttfb = navigation.responseStart - navigation.requestStart;

        // Calculate TTI (simplified)
        vitals.tti = navigation.domInteractive - navigation.navigationStart;

        setTimeout(() => {
          resolve({
            lcp: vitals.lcp || 0,
            fid: vitals.fid || 0,
            cls: vitals.cls || 0,
            fcp: vitals.fcp || 0,
            ttfb: vitals.ttfb || 0,
            tti: vitals.tti || 0
          });
        }, 3000); // Wait for measurements to stabilize
      });
    });
  }

  /**
   * Measure comprehensive performance metrics
   */
  async measurePerformanceMetrics(): Promise<PerformanceMetrics> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      // Calculate bundle size from main resources
      let bundleSize = 0;
      const jsResources = resources.filter(r => r.name.includes('.js'));
      jsResources.forEach(resource => {
        bundleSize += resource.transferSize || resource.encodedBodySize || 0;
      });

      // Analyze image optimization
      const images = Array.from(document.querySelectorAll('img'));
      const imageMetrics = {
        totalImages: images.length,
        optimizedImages: images.filter(img =>
          img.getAttribute('loading') === 'lazy' ||
          img.getAttribute('decoding') === 'async'
        ).length,
        lazyLoadedImages: images.filter(img => img.getAttribute('loading') === 'lazy').length,
        averageImageSize: 0
      };

      // Calculate average image size from resource timings
      const imageResources = resources.filter(r =>
        r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      );
      if (imageResources.length > 0) {
        const totalImageSize = imageResources.reduce((sum, img) =>
          sum + (img.transferSize || img.encodedBodySize || 0), 0
        );
        imageMetrics.averageImageSize = totalImageSize / imageResources.length;
      }

      return {
        navigationStart: navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry =>
          entry.name === 'first-paint'
        )?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry =>
          entry.name === 'first-contentful-paint'
        )?.startTime || 0,
        resourceLoadTimes: resources.map(resource => ({
          name: resource.name.split('/').pop() || 'unknown',
          duration: resource.duration,
          size: resource.transferSize || resource.encodedBodySize
        })),
        bundleSize,
        imageOptimization: imageMetrics
      };
    });
  }

  /**
   * Wait for app to be ready for testing
   */
  async waitForAppReady(): Promise<void> {
    // Wait for main content to load
    await this.page.waitForSelector('body', { timeout: 30000 });

    // Wait for any loading spinners to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [data-testid*="loading"]');
      return loadingElements.length === 0 ||
             Array.from(loadingElements).every(el =>
               window.getComputedStyle(el as Element).display === 'none'
             );
    }, { timeout: 30000 });

    // Wait for network idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Test JavaScript bundle size
   */
  async measureBundlePerformance(): Promise<{
    totalBundleSize: number;
    individualBundles: Array<{ name: string; size: number; gzippedSize?: number }>;
    cacheEfficiency: number;
  }> {
    const bundleMetrics = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r =>
        r.name.includes('.js') || r.name.includes('chunk')
      );

      let totalSize = 0;
      const bundles = jsResources.map(resource => {
        const size = resource.transferSize || resource.encodedBodySize || 0;
        totalSize += size;

        return {
          name: resource.name.split('/').pop() || 'unknown',
          size: size,
          gzippedSize: resource.transferSize,
          fromCache: resource.transferSize === 0 && resource.duration < 10
        };
      });

      const cachedResources = bundles.filter(b => b.fromCache).length;
      const cacheEfficiency = bundles.length > 0 ? (cachedResources / bundles.length) * 100 : 0;

      return {
        totalBundleSize: totalSize,
        individualBundles: bundles,
        cacheEfficiency
      };
    });

    return bundleMetrics;
  }
}

test.describe('Performance & Core Web Vitals Tests', () => {
  let performanceHelper: PerformanceTestHelper;

  test.beforeEach(async ({ page }) => {
    performanceHelper = new PerformanceTestHelper(page);
  });

  test.describe('Core Web Vitals Compliance', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      // Navigate to the app
      const startTime = Date.now();
      await page.goto('/');
      await performanceHelper.waitForAppReady();
      const initialLoadTime = Date.now() - startTime;

      // Measure Core Web Vitals
      const vitals = await performanceHelper.measureCoreWebVitals();

      // Log results for debugging
      console.log('Core Web Vitals:', vitals);
      console.log('Initial Load Time:', initialLoadTime, 'ms');

      // Assert Core Web Vitals thresholds (Google's recommended values)
      expect(vitals.lcp).toBeLessThan(2500); // LCP should be under 2.5s
      expect(vitals.fid).toBeLessThan(100);  // FID should be under 100ms
      expect(vitals.cls).toBeLessThan(0.1);  // CLS should be under 0.1
      expect(vitals.fcp).toBeLessThan(1800); // FCP should be under 1.8s
      expect(vitals.ttfb).toBeLessThan(800); // TTFB should be under 800ms

      // Overall load time should be reasonable
      expect(initialLoadTime).toBeLessThan(3000); // 3 seconds max
    });

    test('should maintain performance under different connection speeds', async ({ page }) => {
      // Test with different network conditions
      const networkConditions = [
        { name: 'Fast 3G', downloadThroughput: 1500000, uploadThroughput: 750000, latency: 40 },
        { name: 'Slow 3G', downloadThroughput: 500000, uploadThroughput: 500000, latency: 400 },
        { name: 'Fast 4G', downloadThroughput: 4000000, uploadThroughput: 3000000, latency: 20 }
      ];

      for (const condition of networkConditions) {
        // Apply network throttling
        await page.context().route('**/*', async (route) => {
          await new Promise(resolve => setTimeout(resolve, condition.latency));
          await route.continue();
        });

        const startTime = Date.now();
        await page.goto('/');
        await performanceHelper.waitForAppReady();
        const loadTime = Date.now() - startTime;

        console.log(`${condition.name} load time:`, loadTime, 'ms');

        // Adjust expectations based on network speed
        if (condition.name === 'Slow 3G') {
          expect(loadTime).toBeLessThan(15000); // 15 seconds for slow 3G
        } else {
          expect(loadTime).toBeLessThan(8000); // 8 seconds for faster connections
        }

        // Clear network throttling
        await page.context().unroute('**/*');
      }
    });
  });

  test.describe('Bundle Size and Resource Optimization', () => {
    test('should have optimized bundle sizes', async ({ page }) => {
      await page.goto('/');
      await performanceHelper.waitForAppReady();

      const bundleMetrics = await performanceHelper.measureBundlePerformance();

      console.log('Bundle Metrics:', bundleMetrics);

      // Total bundle size should be reasonable for a fitness app
      expect(bundleMetrics.totalBundleSize).toBeLessThan(1000000); // 1MB max

      // Should have good cache efficiency
      expect(bundleMetrics.cacheEfficiency).toBeGreaterThan(0); // Some caching

      // Individual bundles shouldn't be too large
      bundleMetrics.individualBundles.forEach(bundle => {
        expect(bundle.size).toBeLessThan(500000); // 500KB per bundle max
      });
    });

    test('should optimize image loading and sizes', async ({ page }) => {
      await page.goto('/');
      await performanceHelper.waitForAppReady();

      const metrics = await performanceHelper.measurePerformanceMetrics();

      console.log('Image Optimization:', metrics.imageOptimization);

      // Should have lazy loading for images
      if (metrics.imageOptimization.totalImages > 0) {
        const lazyLoadPercentage = (metrics.imageOptimization.lazyLoadedImages / metrics.imageOptimization.totalImages) * 100;
        expect(lazyLoadPercentage).toBeGreaterThan(50); // At least 50% lazy loaded

        // Average image size should be reasonable
        expect(metrics.imageOptimization.averageImageSize).toBeLessThan(200000); // 200KB average
      }
    });

    test('should efficiently load critical resources first', async ({ page }) => {
      const resourcePromises: Array<{ type: string; startTime: number; name: string }> = [];

      page.on('response', response => {
        const url = response.url();
        if (url.includes('.css') || url.includes('.js') || url === page.url()) {
          resourcePromises.push({
            type: url.includes('.css') ? 'CSS' : url.includes('.js') ? 'JS' : 'HTML',
            startTime: Date.now(),
            name: url.split('/').pop() || 'unknown'
          });
        }
      });

      await page.goto('/');
      await performanceHelper.waitForAppReady();

      // Critical resources (CSS, initial JS) should load first
      const sortedResources = resourcePromises.sort((a, b) => a.startTime - b.startTime);
      const firstThree = sortedResources.slice(0, 3);

      // At least one of the first three resources should be critical
      const hasCriticalFirst = firstThree.some(resource =>
        resource.type === 'HTML' || resource.type === 'CSS'
      );
      expect(hasCriticalFirst).toBe(true);
    });
  });

  test.describe('Runtime Performance', () => {
    test('should handle large datasets without performance degradation', async ({ page }) => {
      // Create large dataset in localStorage
      await page.evaluateOnNewDocument(() => {
        const largeDataset: Record<string, any> = {};
        const weights: Record<string, number> = {};
        const nutrition: Record<string, boolean> = {};

        // Generate 12 weeks of comprehensive data
        for (let week = 1; week <= 12; week++) {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          days.forEach(day => {
            // Create exercises for each day
            for (let exercise = 0; exercise < 15; exercise++) {
              const exerciseKey = `${day}-exercise-${exercise}-week${week}`;
              largeDataset[exerciseKey] = Math.random() > 0.3;
              weights[exerciseKey] = Math.floor(Math.random() * 100) + 10;
            }

            // Create nutrition data
            for (let nutrition_item = 0; nutrition_item < 20; nutrition_item++) {
              const nutritionKey = `${day}-nutrition-${nutrition_item}-week${week}`;
              nutrition[nutritionKey] = Math.random() > 0.4;
            }
          });
        }

        localStorage.setItem('completedExercises', JSON.stringify(largeDataset));
        localStorage.setItem('exerciseWeights', JSON.stringify(weights));
        localStorage.setItem('nutritionGoals', JSON.stringify(nutrition));
      });

      const startTime = Date.now();
      await page.goto('/');
      await performanceHelper.waitForAppReady();
      const loadTime = Date.now() - startTime;

      // Should still load efficiently with large dataset
      expect(loadTime).toBeLessThan(8000);

      // Test interaction performance with large dataset
      const interactiveElements = page.locator('button, input[type="checkbox"], select');
      const elementCount = Math.min(await interactiveElements.count(), 5);

      for (let i = 0; i < elementCount; i++) {
        const element = interactiveElements.nth(i);
        if (await element.isVisible()) {
          const interactionStart = Date.now();
          await element.click();
          const interactionTime = Date.now() - interactionStart;

          // Interactions should remain fast even with large datasets
          expect(interactionTime).toBeLessThan(300);
        }
      }
    });

    test('should manage memory efficiently during extended use', async ({ page }) => {
      await page.goto('/');
      await performanceHelper.waitForAppReady();

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          };
        }
        return null;
      });

      if (initialMemory) {
        // Simulate extended usage patterns
        for (let i = 0; i < 20; i++) {
          // Interact with various elements
          const checkboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = Math.min(await checkboxes.count(), 3);

          for (let j = 0; j < checkboxCount; j++) {
            const checkbox = checkboxes.nth(j);
            if (await checkbox.isVisible()) {
              await checkbox.click();
              await page.waitForTimeout(50);
            }
          }

          // Navigate or change views if possible
          const buttons = page.locator('button');
          const buttonCount = Math.min(await buttons.count(), 2);

          for (let k = 0; k < buttonCount; k++) {
            const button = buttons.nth(k);
            if (await button.isVisible()) {
              await button.click();
              await page.waitForTimeout(100);
            }
          }

          await page.waitForTimeout(200);
        }

        // Check final memory usage
        const finalMemory = await page.evaluate(() => {
          if ('memory' in performance) {
            return {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize
            };
          }
          return null;
        });

        if (finalMemory) {
          const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
          const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

          console.log(`Memory usage increased by: ${memoryIncreaseMB.toFixed(2)} MB`);

          // Memory shouldn't grow excessively during normal usage
          expect(memoryIncreaseMB).toBeLessThan(100); // 100MB max increase
        }
      }
    });

    test('should perform well across different device capabilities', async ({ page }) => {
      const deviceConfigurations = [
        { name: 'High-end Desktop', width: 1920, height: 1080, deviceScaleFactor: 1 },
        { name: 'Mid-range Laptop', width: 1366, height: 768, deviceScaleFactor: 1 },
        { name: 'High DPI Laptop', width: 1440, height: 900, deviceScaleFactor: 2 },
        { name: 'Tablet', width: 768, height: 1024, deviceScaleFactor: 2 },
        { name: 'Mobile', width: 375, height: 667, deviceScaleFactor: 3 }
      ];

      for (const device of deviceConfigurations) {
        await page.setViewportSize({
          width: device.width,
          height: device.height
        });

        const startTime = Date.now();
        await page.goto('/');
        await performanceHelper.waitForAppReady();
        const loadTime = Date.now() - startTime;

        console.log(`${device.name} load time: ${loadTime}ms`);

        // Performance expectations adjust based on device type
        if (device.name.includes('Mobile')) {
          expect(loadTime).toBeLessThan(10000); // 10s for mobile
        } else if (device.name.includes('Tablet')) {
          expect(loadTime).toBeLessThan(8000); // 8s for tablet
        } else {
          expect(loadTime).toBeLessThan(6000); // 6s for desktop
        }

        // Test interaction performance on this device
        const button = page.locator('button').first();
        if (await button.isVisible()) {
          const interactionStart = Date.now();
          await button.click();
          const interactionTime = Date.now() - interactionStart;

          expect(interactionTime).toBeLessThan(500);
        }
      }
    });
  });

  test.describe('Performance Monitoring and Reporting', () => {
    test('should generate comprehensive performance report', async ({ page }) => {
      await page.goto('/');
      await performanceHelper.waitForAppReady();

      // Gather all performance metrics
      const coreVitals = await performanceHelper.measureCoreWebVitals();
      const detailedMetrics = await performanceHelper.measurePerformanceMetrics();
      const bundleMetrics = await performanceHelper.measureBundlePerformance();

      // Create performance report
      const performanceReport = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        coreWebVitals: coreVitals,
        detailedMetrics: {
          domContentLoaded: detailedMetrics.domContentLoaded,
          loadComplete: detailedMetrics.loadComplete,
          firstPaint: detailedMetrics.firstPaint,
          firstContentfulPaint: detailedMetrics.firstContentfulPaint
        },
        bundleAnalysis: {
          totalSize: bundleMetrics.totalBundleSize,
          bundleCount: bundleMetrics.individualBundles.length,
          cacheEfficiency: bundleMetrics.cacheEfficiency
        },
        imageOptimization: detailedMetrics.imageOptimization,
        resourceCount: detailedMetrics.resourceLoadTimes.length
      };

      console.log('Performance Report:', JSON.stringify(performanceReport, null, 2));

      // Assert overall performance is acceptable
      expect(performanceReport.coreWebVitals.lcp).toBeLessThan(2500);
      expect(performanceReport.detailedMetrics.domContentLoaded).toBeLessThan(2000);
      expect(performanceReport.bundleAnalysis.totalSize).toBeLessThan(1000000);

      // Store report for CI/CD integration
      await page.evaluate((report) => {
        (window as any).performanceReport = report;
      }, performanceReport);
    });
  });
});