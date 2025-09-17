import { test, expect } from '@playwright/test';

test.describe('Quick Smoke Test', () => {
  test('should load the fitness tracking app successfully', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check if page loaded
    await expect(page).toHaveTitle(/Training Program/);

    // Look for any main content
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check if there are any obvious interactive elements
    const interactiveElements = page.locator('button, input, a');
    const elementCount = await interactiveElements.count();
    expect(elementCount).toBeGreaterThan(0);

    console.log(`✅ App loaded successfully with ${elementCount} interactive elements`);
  });

  test('should have basic workout interface elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for workout-related content
    const workoutElements = [
      'text=Monday',
      'text=Wednesday',
      'text=Friday',
      'text=exercise',
      'text=workout',
      'input[type="checkbox"]',
      'button'
    ];

    let foundElements = 0;
    for (const selector of workoutElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundElements++;
        console.log(`✅ Found ${count} elements matching: ${selector}`);
      }
    }

    expect(foundElements).toBeGreaterThan(0);
    console.log(`✅ Found ${foundElements} types of workout elements`);
  });

  test('should handle basic user interaction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to find and click a checkbox
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      const firstCheckbox = checkboxes.first();
      const initialState = await firstCheckbox.isChecked();

      await firstCheckbox.click();
      await page.waitForTimeout(1000); // Wait for any save operations

      const newState = await firstCheckbox.isChecked();
      expect(newState).toBe(!initialState);

      console.log(`✅ Checkbox interaction works: ${initialState} → ${newState}`);
    } else {
      console.log('ℹ️  No checkboxes found - this might be expected');
    }

    // Try to find and click a button
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.click();
      console.log(`✅ Button interaction works (${buttonCount} buttons found)`);
    }

    expect(buttonCount + checkboxCount).toBeGreaterThan(0);
  });
});