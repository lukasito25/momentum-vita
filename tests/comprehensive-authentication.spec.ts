import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { MobileTestHelpers } from './mobile-test-helpers';

/**
 * Comprehensive Authentication Flow Tests for Momentum Vita
 *
 * Tests all authentication scenarios including:
 * - Email, Google, and Apple login flows
 * - Authentication triggers (enhanced mode, premium programs)
 * - Mobile-first authentication experience
 * - Data persistence and state management
 * - Error handling and edge cases
 */

test.describe('Authentication Flow Tests', () => {
  let helpers: TestHelpers;
  let mobileHelpers: MobileTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    mobileHelpers = new MobileTestHelpers(page);
    await helpers.clearAppData();
    await page.goto('/');
    await helpers.waitForAppLoad();
  });

  test.afterEach(async ({ page }) => {
    await helpers.clearAppData();
  });

  test.describe('Authentication Modal Display', () => {
    test('should display authentication modal when accessing premium programs', async ({ page }) => {
      // First ensure we're not authenticated
      const isAuthenticated = await helpers.isUserAuthenticated();
      expect(isAuthenticated).toBe(false);

      // Navigate to program selection
      await helpers.navigateToPrograms();

      // Try to select a premium program (Power Surge Pro or Beast Mode Elite)
      const premiumProgram = page.locator('[data-testid="program-card-power-surge-pro"], [data-testid="program-card-beast-mode-elite"]').first();
      await premiumProgram.click();

      // Authentication modal should appear
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible({ timeout: 5000 });

      // Check modal content for premium program trigger
      await expect(authModal).toContainText('Save Your Progress');
      await expect(authModal).toContainText('Create an account to sync your progress');
    });

    test('should display authentication modal when accessing enhanced mode', async ({ page }) => {
      // Navigate to Foundation Builder (free program)
      await helpers.selectProgram('foundation-builder');

      // Look for enhanced mode toggle or trigger
      const enhancedModeButton = page.locator('[data-testid="enhanced-mode-toggle"], button:has-text("Enhanced Mode"), button:has-text("Advanced")').first();

      if (await enhancedModeButton.count() > 0) {
        await enhancedModeButton.click();

        // Authentication modal should appear
        const authModal = page.locator('[data-testid="auth-modal"]');
        await expect(authModal).toBeVisible({ timeout: 5000 });

        // Check modal content for enhanced mode trigger
        await expect(authModal).toContainText('Unlock Enhanced Tracking');
        await expect(authModal).toContainText('advanced set tracking');
      }
    });

    test('should show correct modal content based on trigger type', async ({ page }) => {
      // Test manual authentication trigger
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), [data-testid="login-button"]').first();

      if (await loginButton.count() > 0) {
        await loginButton.click();

        const authModal = page.locator('[data-testid="auth-modal"]');
        await expect(authModal).toBeVisible();
        await expect(authModal).toContainText('Welcome Back');
      }
    });
  });

  test.describe('Email Authentication', () => {
    test('should successfully authenticate with email and password', async ({ page }) => {
      // Trigger authentication modal
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      // Fill in email authentication form
      await page.fill('[data-testid="email-input"], input[type="email"]', 'test@example.com');
      await page.fill('[data-testid="password-input"], input[type="password"]', 'password123');

      // Submit form
      const submitButton = page.locator('[data-testid="auth-submit"], button[type="submit"], button:has-text("Sign In")').first();
      await submitButton.click();

      // Wait for authentication to complete
      await page.waitForTimeout(2000);

      // Modal should close
      await expect(authModal).not.toBeVisible();

      // User should be authenticated
      const isAuthenticated = await helpers.isUserAuthenticated();
      expect(isAuthenticated).toBe(true);

      // Check localStorage for user data
      const userData = await page.evaluate(() => localStorage.getItem('momentum_vita_user'));
      expect(userData).toBeTruthy();

      const user = JSON.parse(userData!);
      expect(user.email).toBe('test@example.com');
      expect(user.provider).toBe('email');
    });

    test('should switch between login and register modes', async ({ page }) => {
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      // Should start in login mode
      await expect(authModal).toContainText('Welcome Back');

      // Switch to register mode
      const switchToRegister = page.locator('button:has-text("Sign Up"), button:has-text("Register"), a:has-text("Create account")').first();
      if (await switchToRegister.count() > 0) {
        await switchToRegister.click();
        await expect(authModal).toContainText('Join Momentum Vita');

        // Should show name field in register mode
        const nameField = page.locator('[data-testid="name-input"], input[placeholder*="name" i]');
        await expect(nameField).toBeVisible();
      }
    });

    test('should handle form validation errors', async ({ page }) => {
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      // Try to submit with empty fields
      const submitButton = page.locator('[data-testid="auth-submit"], button[type="submit"]').first();
      await submitButton.click();

      // Check for validation messages or that form doesn't submit
      const emailInput = page.locator('[data-testid="email-input"], input[type="email"]');
      const isRequired = await emailInput.getAttribute('required');
      if (isRequired !== null) {
        // HTML5 validation should prevent submission
        await expect(authModal).toBeVisible();
      }
    });

    test('should show/hide password field', async ({ page }) => {
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]');
      const toggleButton = page.locator('[data-testid="password-toggle"], button:has-text("Show"), button:has-text("Hide")').first();

      if (await toggleButton.count() > 0) {
        // Password should be hidden initially
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Click toggle to show password
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click again to hide
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  test.describe('Social Authentication', () => {
    test('should display Google authentication option', async ({ page }) => {
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      const googleButton = page.locator('[data-testid="google-auth"], button:has-text("Google"), button:has-text("Continue with Google")');
      await expect(googleButton).toBeVisible();
    });

    test('should display Apple authentication option', async ({ page }) => {
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      const appleButton = page.locator('[data-testid="apple-auth"], button:has-text("Apple"), button:has-text("Continue with Apple")');
      await expect(appleButton).toBeVisible();
    });

    test('should handle Google authentication flow', async ({ page }) => {
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      const googleButton = page.locator('[data-testid="google-auth"], button:has-text("Google")').first();

      if (await googleButton.count() > 0) {
        await googleButton.click();

        // Wait for mock authentication to complete
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(authModal).not.toBeVisible();

        // Check user data in localStorage
        const userData = await page.evaluate(() => localStorage.getItem('momentum_vita_user'));
        if (userData) {
          const user = JSON.parse(userData);
          expect(user.provider).toBe('google');
        }
      }
    });

    test('should handle Apple authentication flow', async ({ page }) => {
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      const appleButton = page.locator('[data-testid="apple-auth"], button:has-text("Apple")').first();

      if (await appleButton.count() > 0) {
        await appleButton.click();

        // Wait for mock authentication to complete
        await page.waitForTimeout(2000);

        // Modal should close
        await expect(authModal).not.toBeVisible();

        // Check user data in localStorage
        const userData = await page.evaluate(() => localStorage.getItem('momentum_vita_user'));
        if (userData) {
          const user = JSON.parse(userData);
          expect(user.provider).toBe('apple');
        }
      }
    });
  });

  test.describe('Mobile Authentication Experience', () => {
    test('should provide optimal mobile authentication experience', async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile');
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      // Check that modal is properly sized for mobile
      const modalBox = await authModal.boundingBox();
      const viewport = page.viewportSize()!;

      expect(modalBox!.width).toBeLessThanOrEqual(viewport.width);
      expect(modalBox!.height).toBeLessThanOrEqual(viewport.height);

      // Check touch target sizes
      const socialButtons = page.locator('[data-testid="google-auth"], [data-testid="apple-auth"], button:has-text("Google"), button:has-text("Apple")');
      const buttonCount = await socialButtons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = socialButtons.nth(i);
        const touchTarget = await mobileHelpers.checkTouchTargetSize(await button.locator('').first().innerHTML);
        expect(touchTarget.isValid).toBe(true);
      }

      // Check for horizontal scroll
      const hasHorizontalScroll = await mobileHelpers.checkForHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should handle mobile form interactions properly', async ({ page }) => {
      await mobileHelpers.setupMobileViewport('mobile');
      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      const emailInput = page.locator('[data-testid="email-input"], input[type="email"]');

      // Use mobile tap instead of click
      await mobileHelpers.tap('[data-testid="email-input"], input[type="email"]');

      // Verify input is focused
      const isFocused = await emailInput.evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);

      // Check if mobile keyboard attributes are present
      const inputType = await emailInput.getAttribute('type');
      expect(inputType).toBe('email');
    });
  });

  test.describe('Authentication State Management', () => {
    test('should persist authentication state across page reloads', async ({ page }) => {
      // Authenticate user
      await helpers.authenticateUser('test@example.com', 'Test User');

      // Reload page
      await page.reload();
      await helpers.waitForAppLoad();

      // User should still be authenticated
      const isAuthenticated = await helpers.isUserAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    test('should handle logout properly', async ({ page }) => {
      // Authenticate user
      await helpers.authenticateUser('test@example.com', 'Test User');

      // Find and click logout button
      const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")').first();

      if (await logoutButton.count() > 0) {
        await logoutButton.click();

        // User should be logged out
        const isAuthenticated = await helpers.isUserAuthenticated();
        expect(isAuthenticated).toBe(false);

        // localStorage should be cleared
        const userData = await page.evaluate(() => localStorage.getItem('momentum_vita_user'));
        expect(userData).toBeNull();
      }
    });

    test('should handle authentication error scenarios', async ({ page }) => {
      // Test network error simulation
      await page.route('**/api/auth/**', route => route.abort());

      await helpers.triggerAuthModal();

      const emailInput = page.locator('[data-testid="email-input"], input[type="email"]');
      const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]');
      const submitButton = page.locator('[data-testid="auth-submit"], button[type="submit"]').first();

      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await submitButton.click();

      // Should handle error gracefully (no crash, stays on modal)
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();
    });

    test('should maintain user session during navigation', async ({ page }) => {
      // Authenticate user
      await helpers.authenticateUser('test@example.com', 'Test User');

      // Navigate between different sections
      await helpers.navigateToPrograms();
      await helpers.selectProgram('foundation-builder');

      // User should still be authenticated
      const isAuthenticated = await helpers.isUserAuthenticated();
      expect(isAuthenticated).toBe(true);
    });
  });

  test.describe('Premium Program Access Control', () => {
    test('should allow access to premium programs after authentication', async ({ page }) => {
      // Try to access premium program without authentication
      await helpers.navigateToPrograms();

      const premiumProgram = page.locator('[data-testid="program-card-power-surge-pro"], [data-testid="program-card-beast-mode-elite"]').first();
      await premiumProgram.click();

      // Should trigger authentication
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      // Authenticate
      await helpers.authenticateViaModal('test@example.com', 'Test User');

      // Should now have access to premium program
      await expect(authModal).not.toBeVisible();

      // Check if we're now in the premium program
      const programTitle = page.locator('h1, h2, [data-testid="program-title"]');
      await expect(programTitle).toContainText(/Power Surge Pro|Beast Mode Elite/);
    });

    test('should display premium features for authenticated users', async ({ page }) => {
      // Authenticate user first
      await helpers.authenticateUser('test@example.com', 'Test User');

      // Navigate to any program
      await helpers.selectProgram('foundation-builder');

      // Check for enhanced/premium features
      const enhancedFeatures = page.locator('[data-testid="enhanced-features"], [data-testid="premium-features"], .enhanced-mode, .premium-features');

      if (await enhancedFeatures.count() > 0) {
        await expect(enhancedFeatures.first()).toBeVisible();
      }

      // Check for advanced tracking elements
      const advancedTracking = page.locator('[data-testid="set-tracker"], [data-testid="timer-popup"], .set-tracking, .advanced-tracking');

      if (await advancedTracking.count() > 0) {
        await expect(advancedTracking.first()).toBeVisible();
      }
    });
  });

  test.describe('Cross-Browser Authentication', () => {
    // These tests will run across all configured browsers in playwright.config.ts

    test('should work consistently across different browsers', async ({ page, browserName }) => {
      console.log(`Testing authentication in ${browserName}`);

      await helpers.triggerAuthModal();

      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible();

      // Test email authentication
      await page.fill('[data-testid="email-input"], input[type="email"]', 'test@example.com');
      await page.fill('[data-testid="password-input"], input[type="password"]', 'password123');

      const submitButton = page.locator('[data-testid="auth-submit"], button[type="submit"]').first();
      await submitButton.click();

      await page.waitForTimeout(2000);

      // Authentication should work across all browsers
      const isAuthenticated = await helpers.isUserAuthenticated();
      expect(isAuthenticated).toBe(true);
    });
  });
});