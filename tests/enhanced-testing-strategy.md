# Enhanced Playwright Testing Strategy for Momentum Vita PWA

## Overview
This document outlines an enhanced testing strategy for the Momentum Vita PWA fitness application, building upon the existing comprehensive test suite to address modern PWA requirements, custom workout creation, and premium subscription flows.

## 1. PWA-Specific Testing Framework

### 1.1 Service Worker and Offline Functionality
```typescript
// tests/pwa-offline-functionality.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PWA Offline Functionality', () => {
  test('should work offline after initial load', async ({ page, context }) => {
    // Load app and cache resources
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Navigate and verify functionality
    await page.reload();
    await expect(page.locator('[data-testid="training-program"]')).toBeVisible();

    // Test core functionality offline
    const exerciseCheckbox = page.locator('[data-testid="exercise-complete-1"]').first();
    await exerciseCheckbox.click();
    await expect(exerciseCheckbox).toBeChecked();
  });

  test('should sync data when coming back online', async ({ page, context }) => {
    // Make changes offline
    await context.setOffline(true);
    await page.goto('/');

    // Make workout progress
    await page.locator('[data-testid="exercise-complete-1"]').first().click();

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(2000);

    // Verify sync indicator or success state
    const syncIndicator = page.locator('[data-testid="sync-status"]');
    await expect(syncIndicator).toContainText(/synced|up.to.date/i);
  });
});
```

### 1.2 PWA Installation Testing
```typescript
// tests/pwa-installation.spec.ts
test.describe('PWA Installation', () => {
  test('should show install prompt on supported browsers', async ({ page }) => {
    await page.goto('/');

    // Trigger install prompt conditions
    await page.waitForTimeout(3000);

    // Check for install button or prompt
    const installButton = page.locator('[data-testid="install-pwa-button"]');
    if (await installButton.isVisible()) {
      await expect(installButton).toContainText(/install|add to home/i);
    }
  });

  test('should handle app shortcuts correctly', async ({ page, context }) => {
    // Test shortcut navigation
    await page.goto('/?shortcut=workout');
    await expect(page.locator('[data-testid="workout-section"]')).toBeVisible();

    await page.goto('/?shortcut=progress');
    await expect(page.locator('[data-testid="progress-section"]')).toBeVisible();
  });
});
```

## 2. Custom Workout Creation Testing Framework

### 2.1 Workout Builder Interface
```typescript
// tests/custom-workout-creation.spec.ts
test.describe('Custom Workout Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure premium user is logged in
    await page.goto('/');
    await authenticateAsPremiumUser(page);
  });

  test('should create custom workout successfully', async ({ page }) => {
    // Navigate to workout builder
    await page.locator('[data-testid="create-workout-button"]').click();

    // Fill workout details
    await page.locator('[data-testid="workout-name-input"]').fill('Custom Push Workout');
    await page.locator('[data-testid="workout-description"]').fill('Upper body strength focus');

    // Add exercises
    await page.locator('[data-testid="add-exercise-button"]').click();
    await page.locator('[data-testid="exercise-search"]').fill('Push up');
    await page.locator('[data-testid="exercise-option-push-up"]').click();

    // Configure sets and reps
    await page.locator('[data-testid="sets-input"]').fill('3');
    await page.locator('[data-testid="reps-input"]').fill('12');

    // Save workout
    await page.locator('[data-testid="save-workout-button"]').click();

    // Verify creation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="workout-list"]')).toContainText('Custom Push Workout');
  });

  test('should validate workout creation form', async ({ page }) => {
    await page.locator('[data-testid="create-workout-button"]').click();

    // Try to save without required fields
    await page.locator('[data-testid="save-workout-button"]').click();

    // Check validation messages
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Workout name is required');
    await expect(page.locator('[data-testid="exercises-error"]')).toContainText('At least one exercise is required');
  });
});
```

### 2.2 Exercise Database and Search
```typescript
test.describe('Exercise Database Integration', () => {
  test('should search and filter exercises', async ({ page }) => {
    await page.goto('/');
    await authenticateAsPremiumUser(page);

    await page.locator('[data-testid="exercise-library"]').click();

    // Test search functionality
    await page.locator('[data-testid="exercise-search"]').fill('bench press');
    await page.waitForTimeout(500);

    const searchResults = page.locator('[data-testid="exercise-result"]');
    await expect(searchResults).toHaveCount(3, { timeout: 5000 });

    // Test category filtering
    await page.locator('[data-testid="filter-chest"]').click();
    await expect(page.locator('[data-testid="filtered-exercises"]')).toBeVisible();
  });

  test('should display exercise details and instructions', async ({ page }) => {
    await page.goto('/');
    await authenticateAsPremiumUser(page);

    await page.locator('[data-testid="exercise-library"]').click();
    await page.locator('[data-testid="exercise-bench-press"]').click();

    // Verify exercise details modal
    const exerciseModal = page.locator('[data-testid="exercise-details-modal"]');
    await expect(exerciseModal).toBeVisible();
    await expect(exerciseModal).toContainText('Bench Press');
    await expect(exerciseModal).toContainText(/instructions|how.to/i);

    // Test video/image content
    const mediaContent = exerciseModal.locator('img, video').first();
    await expect(mediaContent).toBeVisible();
  });
});
```

## 3. Enhanced Subscription and Payment Testing

### 3.1 Freemium to Premium Upgrade Flow
```typescript
// tests/subscription-upgrade-flow.spec.ts
test.describe('Subscription Management', () => {
  test('should handle free trial activation', async ({ page }) => {
    await page.goto('/');

    // Start as anonymous user
    await page.locator('[data-testid="program-card-power-surge-pro"]').click();

    // Should trigger auth modal
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();

    // Sign up with email
    await page.locator('[data-testid="email-input"]').fill('test@example.com');
    await page.locator('[data-testid="password-input"]').fill('password123');
    await page.locator('[data-testid="signup-button"]').click();

    // Should trigger free trial offer
    await expect(page.locator('[data-testid="free-trial-modal"]')).toBeVisible();
    await page.locator('[data-testid="start-trial-button"]').click();

    // Should grant access to premium program
    await expect(page.locator('[data-testid="power-surge-pro-content"]')).toBeVisible();
  });

  test('should handle payment gateway integration', async ({ page }) => {
    await page.goto('/');
    await authenticateAsBasicUser(page);

    // Navigate to subscription page
    await page.locator('[data-testid="upgrade-button"]').click();

    // Test subscription plan selection
    await page.locator('[data-testid="premium-plan"]').click();
    await page.locator('[data-testid="proceed-payment"]').click();

    // Mock payment form (depends on your payment provider)
    const paymentFrame = page.frameLocator('[data-testid="payment-iframe"]');
    await paymentFrame.locator('[data-testid="card-number"]').fill('4242424242424242');
    await paymentFrame.locator('[data-testid="expiry"]').fill('12/25');
    await paymentFrame.locator('[data-testid="cvc"]').fill('123');

    await page.locator('[data-testid="complete-payment"]').click();

    // Verify successful upgrade
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Welcome to Premium');
  });
});
```

### 3.2 Feature Access Control Testing
```typescript
test.describe('Feature Access Control', () => {
  test('should restrict premium features for free users', async ({ page }) => {
    await page.goto('/');
    await authenticateAsBasicUser(page);

    // Try to access premium program
    await page.locator('[data-testid="program-card-beast-mode-elite"]').click();

    // Should show upgrade prompt
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toContainText('Premium feature');

    // Verify access is blocked
    await expect(page.locator('[data-testid="beast-mode-elite-content"]')).not.toBeVisible();
  });

  test('should grant full access to premium users', async ({ page }) => {
    await page.goto('/');
    await authenticateAsPremiumUser(page);

    // Access all premium programs
    const premiumPrograms = ['power-surge-pro', 'beast-mode-elite'];

    for (const program of premiumPrograms) {
      await page.locator(`[data-testid="program-card-${program}"]`).click();
      await expect(page.locator(`[data-testid="${program}-content"]`)).toBeVisible();
      await page.goBack();
    }
  });
});
```

## 4. Advanced Mobile Testing Framework

### 4.1 Touch Gesture and Interaction Testing
```typescript
// tests/mobile-touch-interactions.spec.ts
test.describe('Mobile Touch Interactions', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should handle swipe gestures for navigation', async ({ page }) => {
    await page.goto('/');
    await authenticateAsPremiumUser(page);

    // Test horizontal swipe between workout days
    const workoutContainer = page.locator('[data-testid="workout-container"]');

    // Swipe left to next day
    await workoutContainer.hover();
    await page.mouse.down();
    await page.mouse.move(-200, 0);
    await page.mouse.up();

    // Verify navigation occurred
    await expect(page.locator('[data-testid="day-indicator"]')).toContainText('Day 2');
  });

  test('should handle long press for contextual menus', async ({ page }) => {
    await page.goto('/');
    await authenticateAsPremiumUser(page);

    const exerciseCard = page.locator('[data-testid="exercise-card"]').first();

    // Long press on exercise
    await exerciseCard.hover();
    await page.mouse.down();
    await page.waitForTimeout(800);
    await page.mouse.up();

    // Verify context menu appears
    await expect(page.locator('[data-testid="exercise-context-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-exercise"]')).toBeVisible();
    await expect(page.locator('[data-testid="remove-exercise"]')).toBeVisible();
  });
});
```

### 4.2 iOS PWA Safe Area Testing
```typescript
test.describe('iOS PWA Safe Area Support', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should handle safe area insets properly', async ({ page }) => {
    await page.goto('/');

    // Add viewport-fit=cover simulation
    await page.evaluate(() => {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
      document.head.appendChild(meta);
    });

    // Check navigation doesn't overlap with status bar
    const navigation = page.locator('[data-testid="main-navigation"]');
    const navPosition = await navigation.boundingBox();

    // Should be below the status bar (> 44px from top on iPhone 12)
    expect(navPosition!.y).toBeGreaterThan(40);

    // Check bottom navigation doesn't overlap with home indicator
    const bottomNav = page.locator('[data-testid="bottom-navigation"]');
    if (await bottomNav.isVisible()) {
      const bottomPosition = await bottomNav.boundingBox();
      const viewportHeight = page.viewportSize()!.height;

      // Should be above home indicator area
      expect(bottomPosition!.y + bottomPosition!.height).toBeLessThan(viewportHeight - 30);
    }
  });
});
```

## 5. Performance and Accessibility Enhancements

### 5.1 Core Web Vitals Testing
```typescript
// tests/core-web-vitals.spec.ts
test.describe('Core Web Vitals', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          const fid = entries.find(entry => entry.entryType === 'first-input');
          const cls = entries.find(entry => entry.entryType === 'layout-shift');

          resolve({
            lcp: lcp?.startTime,
            fid: fid?.processingStart - fid?.startTime,
            cls: cls?.value
          });
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });

    // Assert Core Web Vitals thresholds
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.fid).toBeLessThan(100);  // FID < 100ms
    expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
  });

  test('should load critical resources quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');

    // Wait for critical elements
    await page.locator('[data-testid="training-program"]').waitFor();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second target
  });
});
```

### 5.2 Enhanced Accessibility Testing
```typescript
// tests/enhanced-accessibility.spec.ts
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Enhanced Accessibility', () => {
  test('should be navigable via keyboard only', async ({ page }) => {
    await page.goto('/');

    // Tab through all interactive elements
    let tabCount = 0;
    const maxTabs = 50;

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      if (activeElement === 'BODY') break; // Cycled through all elements
    }

    // Should be able to complete critical user flow with keyboard
    await page.keyboard.press('Enter'); // Activate focused element

    // Verify no trapped focus
    expect(tabCount).toBeLessThan(maxTabs);
  });

  test('should work with screen readers', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    // Check for proper ARIA labels and roles
    await checkA11y(page, null, {
      rules: {
        'aria-required-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'label': { enabled: true },
        'landmark-one-main': { enabled: true }
      }
    });
  });
});
```

## 6. API Integration and Data Sync Testing

### 6.1 Supabase Integration Testing
```typescript
// tests/api-integration.spec.ts
test.describe('API Integration', () => {
  test('should handle database connection failures gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/supabase.co/**', route => route.abort());

    await page.goto('/');

    // App should still function with cached data
    await expect(page.locator('[data-testid="training-program"]')).toBeVisible();

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });

  test('should sync workout progress across devices', async ({ page, context }) => {
    // Simulate user on device 1
    await page.goto('/');
    await authenticateAsPremiumUser(page);

    // Make workout progress
    await page.locator('[data-testid="exercise-complete-1"]').click();
    await page.waitForTimeout(1000); // Allow sync

    // Open new tab (simulate device 2)
    const newPage = await context.newPage();
    await newPage.goto('/');
    await authenticateAsSameUser(newPage);

    // Verify progress synced
    await expect(newPage.locator('[data-testid="exercise-complete-1"]')).toBeChecked();
  });
});
```

## 7. Test Organization and Best Practices

### 7.1 Page Object Model Structure
```typescript
// tests/page-objects/WorkoutPage.ts
export class WorkoutPage {
  constructor(private page: Page) {}

  async selectProgram(programId: string) {
    await this.page.locator(`[data-testid="program-card-${programId}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async completeExercise(exerciseIndex: number) {
    const checkbox = this.page.locator(`[data-testid="exercise-complete-${exerciseIndex}"]`);
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  }

  async setWeight(exerciseIndex: number, weight: number) {
    const weightInput = this.page.locator(`[data-testid="weight-input-${exerciseIndex}"]`);
    await weightInput.fill(weight.toString());
    await this.page.keyboard.press('Enter');
  }

  async startTimer(seconds: number) {
    await this.page.locator('[data-testid="timer-button"]').click();
    await this.page.locator('[data-testid="timer-input"]').fill(seconds.toString());
    await this.page.locator('[data-testid="start-timer"]').click();
  }

  async verifyTimerRunning() {
    await expect(this.page.locator('[data-testid="timer-countdown"]')).toBeVisible();
  }
}
```

### 7.2 Test Data Factory
```typescript
// tests/fixtures/test-data-factory.ts
export class TestDataFactory {
  static createUser(type: 'free' | 'premium' | 'trial' = 'free') {
    return {
      email: `test-${type}-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${type}`,
      isPremium: type === 'premium',
      trialEndDate: type === 'trial' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
    };
  }

  static createWorkout(programType: 'foundation' | 'power-surge' | 'beast-mode') {
    return {
      name: `Test Workout - ${programType}`,
      exercises: this.getExercisesByProgram(programType),
      duration: 45,
      difficulty: programType === 'foundation' ? 'beginner' : 'intermediate'
    };
  }

  private static getExercisesByProgram(program: string) {
    const exercises = {
      foundation: ['Push-up', 'Squat', 'Plank'],
      'power-surge': ['Bench Press', 'Deadlift', 'Pull-up'],
      'beast-mode': ['Squat', 'Overhead Press', 'Barbell Row']
    };
    return exercises[program] || exercises.foundation;
  }
}
```

## 8. Continuous Integration and Reporting

### 8.1 CI/CD Integration
```yaml
# .github/workflows/playwright-tests.yml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
      env:
        VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### 8.2 Test Reporting and Metrics
```typescript
// tests/custom-reporter.ts
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class CustomReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      console.log(`❌ ${test.title}: ${result.error?.message}`);
    } else if (result.status === 'passed') {
      console.log(`✅ ${test.title}: ${result.duration}ms`);
    }
  }

  onEnd() {
    // Generate custom metrics report
    console.log('📊 Test Summary Generated');
  }
}

export default CustomReporter;
```

## Implementation Priority

1. **High Priority**: PWA offline functionality, subscription flow testing
2. **Medium Priority**: Custom workout creation, enhanced mobile testing
3. **Low Priority**: Advanced performance metrics, detailed accessibility audits

This enhanced testing strategy builds upon your existing comprehensive test suite while addressing modern PWA requirements and ensuring robust coverage for premium features and mobile experiences.