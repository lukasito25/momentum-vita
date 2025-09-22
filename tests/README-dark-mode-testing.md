# Dark Mode Testing Suite

## Overview

This comprehensive test suite validates the dark mode functionality in the Momentum Vita fitness app. It ensures proper theme switching, visual consistency, accessibility compliance, and cross-browser compatibility.

## Test Coverage

### 1. Theme Switching Functionality
- **System Theme Detection**: Validates that the app detects and responds to system color scheme preferences
- **Manual Theme Selection**: Tests switching between light, dark, and system modes via the theme settings modal
- **Theme Persistence**: Ensures theme preferences are saved and restored across page reloads and navigation
- **System Preference Changes**: Verifies dynamic response to system theme changes when in system mode

### 2. Visual Validation
- **Component Styling**: Validates dark mode styles are applied to all major components:
  - Main navigation (BottomNavigation)
  - Settings modals (Theme, Notification, Privacy)
  - Main app header and content areas
  - Card components and buttons
- **Color Contrast**: Ensures all text maintains proper contrast ratios in dark mode
- **Visual Regression**: Captures screenshots for comparison testing

### 3. Cross-Browser and Mobile Testing
- **Desktop Browsers**: Chrome, Firefox, Safari
- **Mobile Viewports**: iPhone SE, Pixel 5, various screen sizes
- **Tablet Viewports**: iPad, iPad Pro
- **Responsive Design**: Validates layout adaptation across different screen sizes

### 4. Accessibility Testing
- **WCAG Compliance**: Tests color contrast meets WCAG AA/AAA standards
- **Screen Reader Compatibility**: Validates proper ARIA labeling and semantic markup
- **Keyboard Navigation**: Ensures all interactive elements are keyboard accessible
- **Focus Indicators**: Verifies visible focus indicators in dark mode

### 5. User Interactions
- **Modal Functionality**: Tests theme settings modal interactions
- **Navigation**: Validates tab switching and page navigation
- **Form Controls**: Tests toggle switches and interactive elements
- **Error Handling**: Validates graceful handling of invalid theme data

## File Structure

```
tests/
├── dark-mode-comprehensive.spec.ts    # Main test suite
├── dark-mode-helpers.ts               # Helper utilities and classes
├── dark-mode.config.ts                # Configuration and constants
└── README-dark-mode-testing.md        # This documentation
```

## Test Files

### `dark-mode-comprehensive.spec.ts`
The main test file containing all dark mode test scenarios organized into logical groups:

```typescript
test.describe('Dark Mode Comprehensive Test Suite', () => {
  test.describe('Theme Switching Functionality', () => { ... });
  test.describe('Visual Validation - Dark Mode Styles', () => { ... });
  test.describe('Cross-Browser and Mobile Testing', () => { ... });
  test.describe('Accessibility Testing', () => { ... });
  test.describe('User Interactions in Dark Mode', () => { ... });
  test.describe('Visual Regression Testing', () => { ... });
  test.describe('Performance and Edge Cases', () => { ... });
});
```

### `dark-mode-helpers.ts`
Utility classes providing specialized functions for dark mode testing:

- **`DarkModeTestHelper`**: Core utilities for theme manipulation and validation
- **`DarkModeAccessibilityHelper`**: Accessibility-specific testing functions
- **`DarkModePerformanceHelper`**: Performance measurement utilities
- **`ColorUtils`**: Color analysis and contrast ratio calculations

### `dark-mode.config.ts`
Configuration file containing:

- CSS selectors for all testable elements
- Color definitions for validation
- Viewport configurations for responsive testing
- Timeout and performance thresholds
- Test data and user configurations

## Running the Tests

### Prerequisites

1. Ensure Playwright is installed and configured:
```bash
npm install @playwright/test
npx playwright install
```

2. Install accessibility testing dependencies:
```bash
npm install @axe-core/playwright
```

3. Ensure the development server is running:
```bash
npm run dev
```

### Running All Dark Mode Tests

```bash
# Run all dark mode tests
npx playwright test dark-mode-comprehensive.spec.ts

# Run with specific browser
npx playwright test dark-mode-comprehensive.spec.ts --project=chromium

# Run with headed mode for debugging
npx playwright test dark-mode-comprehensive.spec.ts --headed

# Run specific test group
npx playwright test dark-mode-comprehensive.spec.ts --grep="Theme Switching"
```

### Running Tests by Category

```bash
# Functionality tests only
npx playwright test dark-mode-comprehensive.spec.ts --grep="Theme Switching Functionality"

# Visual validation tests
npx playwright test dark-mode-comprehensive.spec.ts --grep="Visual Validation"

# Accessibility tests
npx playwright test dark-mode-comprehensive.spec.ts --grep="Accessibility Testing"

# Mobile tests
npx playwright test dark-mode-comprehensive.spec.ts --grep="Mobile Testing"
```

### Parallel Execution

```bash
# Run tests in parallel across browsers
npx playwright test dark-mode-comprehensive.spec.ts --workers=3

# Run with specific number of workers
npx playwright test dark-mode-comprehensive.spec.ts --workers=1
```

## Test Data and Setup

### Test User Creation
Tests automatically create authenticated users when needed:

```typescript
await helper.createTestUser({
  email: 'test@example.com',
  isPremium: true,
  goals: ['build-muscle', 'lose-weight']
});
```

### Theme State Management
The helper class manages theme state across tests:

```typescript
// Set specific theme
await helper.setTheme('dark');

// Get current theme state
const state = await helper.getThemeState();

// Clear all app data
await helper.clearAllAppData();
```

## Visual Regression Testing

### Screenshot Capture
Tests automatically capture screenshots for visual regression:

```typescript
// Capture themed screenshots
await helper.takeThemedScreenshot('dark', 'home-page', 'mobile');

// Screenshots are saved to: test-results/screenshots/
```

### Screenshot Naming Convention
- `dark-mode-{theme}-{page}-{viewport}.png`
- `comparison-{theme}-{viewport}.png`
- `modal-{modal}-{theme}.png`

## Accessibility Validation

### WCAG Compliance Testing
```typescript
// Check WCAG AA compliance
const isCompliant = await accessibilityHelper.checkWCAGCompliance('AA');

// Verify focus indicators
const hasFocusIndicators = await accessibilityHelper.checkFocusIndicators();

// Check ARIA labeling
const ariaResults = await accessibilityHelper.checkARIALabeling();
```

### Color Contrast Testing
```typescript
// Calculate contrast ratios
const contrastRatio = ColorUtils.calculateContrastRatio(bgColor, textColor);

// Validate against WCAG standards
expect(contrastRatio).toBeGreaterThanOrEqual(4.5); // AA standard
```

## Performance Testing

### Theme Switch Performance
```typescript
// Measure theme switching time
const switchTime = await performanceHelper.measureThemeSwitchTime();
expect(switchTime).toBeLessThan(1000); // Should be under 1 second

// Monitor layout shifts
const layoutShifts = await performanceHelper.monitorLayoutShifts();
expect(layoutShifts).toBeLessThan(0.1); // Minimal layout shift
```

## Error Handling and Debugging

### Console Error Monitoring
```typescript
const errors = await helper.monitorConsoleErrors();
expect(errors).toHaveLength(0); // No console errors should occur
```

### Test Debugging
```bash
# Run with debug mode
npx playwright test dark-mode-comprehensive.spec.ts --debug

# Generate trace files
npx playwright test dark-mode-comprehensive.spec.ts --trace=on

# Show test report
npx playwright show-report
```

## Common Issues and Solutions

### 1. Theme Not Applying
**Issue**: Theme changes don't take effect
**Solution**: Ensure proper wait conditions:
```typescript
await page.waitForFunction(() => {
  return document.documentElement.classList.contains('dark');
}, { timeout: 5000 });
```

### 2. Modal Not Opening
**Issue**: Theme settings modal doesn't open
**Solution**: Ensure user is authenticated:
```typescript
await helper.ensureUserAuthenticated();
```

### 3. Flaky Tests
**Issue**: Tests fail intermittently
**Solution**: Add proper wait conditions and increase timeouts:
```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // Allow animations to complete
```

### 4. Color Validation Failures
**Issue**: Color validation fails due to minor RGB differences
**Solution**: Use tolerance in color comparisons:
```typescript
const isDarkBackground = ColorUtils.isDarkBackground(backgroundColor);
expect(isDarkBackground).toBeTruthy();
```

## Test Configuration

### Timeout Settings
```typescript
test.setTimeout(60000); // 60 seconds for complex theme tests
```

### Retry Configuration
```typescript
test.describe.configure({ retries: 2 }); // Retry failed tests twice
```

### Browser-Specific Settings
```typescript
// Set color scheme preference
await page.emulateMedia({ colorScheme: 'dark' });

// Set viewport for mobile testing
await page.setViewportSize({ width: 375, height: 667 });
```

## Continuous Integration

### CI Configuration
```yaml
# In .github/workflows/playwright.yml
- name: Run Dark Mode Tests
  run: npx playwright test dark-mode-comprehensive.spec.ts --reporter=github
```

### Test Reports
- HTML reports: `playwright-report/index.html`
- JSON results: `test-results/results.json`
- Screenshots: `test-results/screenshots/`
- Videos: `test-results/videos/` (on failure)

## Contributing

### Adding New Tests
1. Follow the existing test structure and naming conventions
2. Use the helper classes for common operations
3. Add appropriate documentation and comments
4. Ensure tests are deterministic and not flaky

### Updating Configurations
1. Modify `dark-mode.config.ts` for new selectors or settings
2. Update helper classes for new functionality
3. Document any breaking changes

### Best Practices
1. Use descriptive test names that clearly indicate what is being tested
2. Group related tests using `describe` blocks
3. Use proper setup and teardown procedures
4. Add meaningful assertions with clear error messages
5. Keep tests independent and isolated

## Troubleshooting

### Common Playwright Issues
1. **Timeout errors**: Increase timeout values or add better wait conditions
2. **Element not found**: Verify selectors are correct and elements exist
3. **Color validation**: Check that CSS classes are properly applied

### Theme-Specific Issues
1. **System theme not detected**: Ensure proper media query emulation
2. **Persistence failures**: Check localStorage operations
3. **Modal interactions**: Verify proper modal opening/closing sequences

For additional help, consult the [Playwright documentation](https://playwright.dev/docs/intro) or the project's testing guidelines.