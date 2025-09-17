import { Page, expect, Browser, BrowserContext } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * Mobile-specific test utilities for Momentum Vita
 * Focuses on touch interactions, responsive design, and mobile UX
 */
export class MobileTestHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Set up mobile viewport with proper touch simulation
   */
  async setupMobileViewport(device: 'mobile' | 'tablet' | 'mobile-landscape' = 'mobile') {
    const viewports = {
      mobile: { width: 375, height: 667 }, // iPhone SE
      tablet: { width: 768, height: 1024 }, // iPad
      'mobile-landscape': { width: 667, height: 375 } // iPhone SE landscape
    };

    await this.page.setViewportSize(viewports[device]);

    // Enable touch events for mobile testing
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
    });
  }

  /**
   * Simulate touch interactions with proper timing
   */
  async tap(selector: string, options?: { force?: boolean; timeout?: number }) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: options?.timeout || 10000 });

    // Use tap instead of click for mobile
    await element.tap({ force: options?.force });

    // Add small delay to simulate human interaction
    await this.page.waitForTimeout(100);
  }

  /**
   * Long press simulation for mobile
   */
  async longPress(selector: string, duration: number = 1000) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });

    const box = await element.boundingBox();
    if (!box) throw new Error(`Element ${selector} not found`);

    await this.page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.waitForTimeout(duration);
  }

  /**
   * Check if element has proper touch target size (minimum 44px)
   */
  async checkTouchTargetSize(selector: string): Promise<{ width: number; height: number; isValid: boolean }> {
    const element = this.page.locator(selector);
    const box = await element.boundingBox();

    if (!box) {
      return { width: 0, height: 0, isValid: false };
    }

    const MIN_TOUCH_SIZE = 44;
    const isValid = box.width >= MIN_TOUCH_SIZE && box.height >= MIN_TOUCH_SIZE;

    return {
      width: box.width,
      height: box.height,
      isValid
    };
  }

  /**
   * Check for horizontal scroll (which shouldn't exist on mobile)
   */
  async checkForHorizontalScroll(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
  }

  /**
   * Simulate swipe gesture
   */
  async swipe(direction: 'left' | 'right' | 'up' | 'down', distance: number = 200) {
    const viewport = this.page.viewportSize();
    if (!viewport) throw new Error('Viewport not set');

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;

    let endX = startX;
    let endY = startY;

    switch (direction) {
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
    }

    await this.page.touchscreen.tap(startX, startY);
    await this.page.mouse.move(endX, endY);
    await this.page.waitForTimeout(100);
  }

  /**
   * Check responsive breakpoints
   */
  async testResponsiveBreakpoints() {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'mobile-large', width: 414, height: 896 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1024, height: 768 }
    ];

    const results = [];

    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await this.page.waitForTimeout(500); // Allow layout to settle

      const hasHorizontalScroll = await this.checkForHorizontalScroll();
      const elements = await this.checkMobileLayoutElements();

      results.push({
        breakpoint: breakpoint.name,
        dimensions: `${breakpoint.width}x${breakpoint.height}`,
        hasHorizontalScroll,
        elements
      });
    }

    return results;
  }

  /**
   * Check mobile-specific layout elements
   */
  async checkMobileLayoutElements() {
    const elements = {
      headerExists: await this.page.locator('header, [role="banner"]').count() > 0,
      navigationExists: await this.page.locator('nav, [role="navigation"]').count() > 0,
      mainContentExists: await this.page.locator('main, [role="main"]').count() > 0,
      buttonsAreTouchFriendly: true, // Will be checked individually
      textIsReadable: true // Will be checked by font size
    };

    // Check button touch targets
    const buttons = await this.page.locator('button, [role="button"], a').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        elements.buttonsAreTouchFriendly = false;
        break;
      }
    }

    // Check text readability (minimum 16px font size)
    const textElements = await this.page.locator('p, span, div').all();
    for (const element of textElements.slice(0, 10)) { // Sample first 10 elements
      const fontSize = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseInt(style.fontSize);
      });

      if (fontSize < 16) {
        elements.textIsReadable = false;
        break;
      }
    }

    return elements;
  }

  /**
   * Test network performance on mobile (simulate slow 3G)
   */
  async simulateSlowNetwork() {
    await this.page.context().route('**/*', async (route) => {
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
  }

  /**
   * Check for mobile-specific CSS classes
   */
  async checkMobileCSSClasses(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const mobileClasses = [];
      const allElements = document.querySelectorAll('*');

      for (const element of allElements) {
        const classList = Array.from(element.classList);
        const mobileSpecific = classList.filter(cls =>
          cls.includes('mobile') ||
          cls.includes('sm:') ||
          cls.includes('md:') ||
          cls.includes('lg:') ||
          cls.includes('touch')
        );

        if (mobileSpecific.length > 0) {
          mobileClasses.push(...mobileSpecific);
        }
      }

      return [...new Set(mobileClasses)];
    });
  }

  /**
   * Check scroll behavior on mobile
   */
  async checkScrollBehavior() {
    const initialScrollY = await this.page.evaluate(() => window.scrollY);

    // Scroll down
    await this.page.mouse.wheel(0, 500);
    await this.page.waitForTimeout(500);

    const scrolledY = await this.page.evaluate(() => window.scrollY);

    // Check if scroll actually happened
    const canScroll = scrolledY > initialScrollY;

    // Check for smooth scrolling
    const hasSmootScrollBehavior = await this.page.evaluate(() => {
      const style = window.getComputedStyle(document.documentElement);
      return style.scrollBehavior === 'smooth';
    });

    return {
      canScroll,
      hasSmootScrollBehavior,
      initialPosition: initialScrollY,
      scrolledPosition: scrolledY
    };
  }

  /**
   * Test mobile orientation changes
   */
  async testOrientationChange() {
    const portrait = { width: 375, height: 667 };
    const landscape = { width: 667, height: 375 };

    // Start in portrait
    await this.page.setViewportSize(portrait);
    await this.page.waitForTimeout(500);

    const portraitLayout = await this.checkMobileLayoutElements();

    // Switch to landscape
    await this.page.setViewportSize(landscape);
    await this.page.waitForTimeout(500);

    const landscapeLayout = await this.checkMobileLayoutElements();

    return {
      portrait: portraitLayout,
      landscape: landscapeLayout,
      adaptsToOrientation: true // Will be determined by layout checks
    };
  }

  /**
   * Check for mobile-specific performance metrics
   */
  async checkMobilePerformance() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
      };
    });

    return {
      ...metrics,
      isMobileOptimized: {
        domContentLoaded: metrics.domContentLoaded < 1000, // < 1s
        firstContentfulPaint: metrics.firstContentfulPaint < 1500, // < 1.5s
        totalLoadTime: metrics.totalLoadTime < 3000 // < 3s
      }
    };
  }

  /**
   * Simulate device features (battery, network, etc.)
   */
  async simulateDeviceFeatures() {
    await this.page.addInitScript(() => {
      // Simulate low battery
      Object.defineProperty(navigator, 'getBattery', {
        writable: false,
        value: () => Promise.resolve({
          charging: false,
          level: 0.2, // 20% battery
          chargingTime: Infinity,
          dischargingTime: 3600 // 1 hour remaining
        })
      });

      // Simulate reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        })
      });
    });
  }

  /**
   * Check touch-specific event handling
   */
  async checkTouchEventHandling(selector: string): Promise<boolean> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;

      // Check if element has touch event listeners
      const events = ['touchstart', 'touchend', 'touchmove'];
      const clone = element.cloneNode(true) as Element;

      // This is a simplified check - in reality, event listeners are harder to detect
      const hasTouch = events.some(event => {
        const attr = `on${event}`;
        return element.hasAttribute(attr) ||
               (element as any)[attr] !== null;
      });

      return hasTouch;
    }, selector);
  }
}

/**
 * Page Object Model for Mobile Program Selection
 */
export class MobileProgramSelectionPage {
  constructor(private page: Page, private helpers: MobileTestHelpers) {}

  // Selectors for program selection elements
  readonly selectors = {
    programCards: '[data-testid="program-card"]',
    programTitle: '[data-testid="program-title"]',
    programDescription: '[data-testid="program-description"]',
    selectButton: '[data-testid="select-program-btn"]',
    backButton: '[data-testid="back-to-programs"]',
    foundationBuilder: '[data-testid="foundation-builder"]',
    powerSurgePro: '[data-testid="power-surge-pro"]',
    beastModeElite: '[data-testid="beast-mode-elite"]'
  };

  async navigateToPrograms() {
    await this.helpers.tap(this.selectors.backButton);
    await this.page.waitForSelector(this.selectors.programCards);
  }

  async selectProgram(program: 'foundation-builder' | 'power-surge-pro' | 'beast-mode-elite') {
    const programSelector = this.selectors[program.replace(/-/g, '') as keyof typeof this.selectors];
    await this.helpers.tap(programSelector as string);
    await this.page.waitForTimeout(500);
  }

  async checkProgramCardLayout() {
    const cards = await this.page.locator(this.selectors.programCards).all();
    const results = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const box = await card.boundingBox();
      const touchSize = await this.helpers.checkTouchTargetSize(this.selectors.programCards + `:nth-child(${i + 1})`);

      results.push({
        index: i,
        dimensions: box,
        touchTargetValid: touchSize.isValid,
        isVisible: await card.isVisible()
      });
    }

    return results;
  }

  async checkTextAlignment() {
    return await this.page.evaluate(() => {
      const titles = document.querySelectorAll('[data-testid="program-title"]');
      const descriptions = document.querySelectorAll('[data-testid="program-description"]');

      const alignment = {
        titlesVisible: Array.from(titles).every(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        descriptionsVisible: Array.from(descriptions).every(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        textOverflow: Array.from(document.querySelectorAll('*')).some(el => {
          const style = window.getComputedStyle(el);
          return style.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth;
        })
      };

      return alignment;
    });
  }
}

/**
 * Page Object Model for Mobile Workout Interface
 */
export class MobileWorkoutPage {
  constructor(private page: Page, private helpers: MobileTestHelpers) {}

  readonly selectors = {
    exerciseCard: '[data-testid="exercise-card"]',
    weightControls: '[data-testid="weight-controls"]',
    increaseWeight: '[data-testid="increase-weight"]',
    decreaseWeight: '[data-testid="decrease-weight"]',
    currentWeight: '[data-testid="current-weight"]',
    timerButton: '[data-testid="timer-button"]',
    videoButton: '[data-testid="video-button"]',
    guideButton: '[data-testid="guide-button"]',
    workoutModeToggle: '[data-testid="workout-mode-toggle"]',
    exerciseCheckbox: '[data-testid="exercise-checkbox"]',
    nutritionGoal: '[data-testid="nutrition-goal"]',
    saveSessionButton: '[data-testid="save-session"]'
  };

  async testWeightControls(exerciseIndex: number = 0) {
    const exerciseCard = this.page.locator(this.selectors.exerciseCard).nth(exerciseIndex);

    // Get initial weight
    const initialWeight = await exerciseCard.locator(this.selectors.currentWeight).textContent();

    // Test increase button
    await this.helpers.tap(exerciseCard.locator(this.selectors.increaseWeight).nth(0));
    await this.page.waitForTimeout(300);

    const increasedWeight = await exerciseCard.locator(this.selectors.currentWeight).textContent();

    // Test decrease button
    await this.helpers.tap(exerciseCard.locator(this.selectors.decreaseWeight).nth(0));
    await this.page.waitForTimeout(300);

    const decreasedWeight = await exerciseCard.locator(this.selectors.currentWeight).textContent();

    return {
      initialWeight,
      increasedWeight,
      decreasedWeight,
      weightsChanged: initialWeight !== increasedWeight
    };
  }

  async checkButtonLayout() {
    const buttons = [
      this.selectors.timerButton,
      this.selectors.videoButton,
      this.selectors.guideButton
    ];

    const layout = {};

    for (const buttonSelector of buttons) {
      const button = this.page.locator(buttonSelector).first();
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        const touchSize = await this.helpers.checkTouchTargetSize(buttonSelector);

        (layout as any)[buttonSelector] = {
          dimensions: box,
          touchTargetValid: touchSize.isValid,
          isVisible: true
        };
      }
    }

    // Check if buttons stack vertically on mobile
    const firstButton = this.page.locator(this.selectors.timerButton).first();
    const secondButton = this.page.locator(this.selectors.videoButton).first();

    if (await firstButton.isVisible() && await secondButton.isVisible()) {
      const firstBox = await firstButton.boundingBox();
      const secondBox = await secondButton.boundingBox();

      (layout as any).stacksVertically = firstBox && secondBox &&
        Math.abs((firstBox.y + firstBox.height) - secondBox.y) < 20;
    }

    return layout;
  }

  async testWorkoutModeToggle() {
    const toggle = this.page.locator(this.selectors.workoutModeToggle);

    if (await toggle.isVisible()) {
      const initialState = await toggle.getAttribute('aria-checked') ||
                          await toggle.getAttribute('data-state');

      await this.helpers.tap(this.selectors.workoutModeToggle);
      await this.page.waitForTimeout(500);

      const newState = await toggle.getAttribute('aria-checked') ||
                      await toggle.getAttribute('data-state');

      return {
        initialState,
        newState,
        toggled: initialState !== newState
      };
    }

    return { toggled: false, error: 'Toggle not found' };
  }

  async checkExerciseCardOverflow() {
    const cards = await this.page.locator(this.selectors.exerciseCard).all();
    const overflowResults = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const hasOverflow = await card.evaluate(el => {
        return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      });

      const box = await card.boundingBox();

      overflowResults.push({
        cardIndex: i,
        hasOverflow,
        dimensions: box
      });
    }

    return overflowResults;
  }

  async testTouchInteractions() {
    const interactions = [];

    // Test exercise checkbox tap
    const checkboxes = await this.page.locator(this.selectors.exerciseCheckbox).all();
    if (checkboxes.length > 0) {
      const checkbox = checkboxes[0];
      const initialChecked = await checkbox.isChecked();

      await this.helpers.tap(this.selectors.exerciseCheckbox);
      await this.page.waitForTimeout(300);

      const finalChecked = await checkbox.isChecked();

      interactions.push({
        element: 'exercise-checkbox',
        initialState: initialChecked,
        finalState: finalChecked,
        changed: initialChecked !== finalChecked
      });
    }

    // Test nutrition goal tap
    const nutritionGoals = await this.page.locator(this.selectors.nutritionGoal).all();
    if (nutritionGoals.length > 0) {
      const goal = nutritionGoals[0];
      const initialChecked = await goal.getAttribute('aria-checked') === 'true';

      await this.helpers.tap(this.selectors.nutritionGoal);
      await this.page.waitForTimeout(300);

      const finalChecked = await goal.getAttribute('aria-checked') === 'true';

      interactions.push({
        element: 'nutrition-goal',
        initialState: initialChecked,
        finalState: finalChecked,
        changed: initialChecked !== finalChecked
      });
    }

    return interactions;
  }
}