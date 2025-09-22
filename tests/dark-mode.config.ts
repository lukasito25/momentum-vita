/**
 * Dark Mode Test Configuration
 *
 * Configuration settings and constants for dark mode testing
 * in the Momentum Vita fitness app.
 */

export const DARK_MODE_CONFIG = {
  // Theme-related selectors
  selectors: {
    // Main app elements
    mobileContainer: '.mobile-container',
    pageHeader: '.page-header',
    bottomNav: '.bottom-nav',
    navTab: '.nav-tab',
    navTabActive: '.nav-tab-active',

    // Modal elements
    themeModal: 'text=Theme Settings',
    notificationModal: 'text=Notification Settings',
    privacyModal: 'text=Privacy Settings',
    modalCloseButton: 'button:has(svg)',

    // Theme option buttons
    lightThemeButton: 'button:has-text("Light")',
    darkThemeButton: 'button:has-text("Dark")',
    systemThemeButton: 'button:has-text("System")',

    // Navigation elements
    profileTab: '[aria-label="Profile"]',
    homeTab: '[aria-label="Home"]',
    workoutTab: '[aria-label="Workout"]',
    progressTab: '[aria-label="Progress"]',

    // Settings buttons
    themeSettingsButton: 'button:has-text("Theme")',
    notificationSettingsButton: 'button:has-text("Notifications")',
    privacySettingsButton: 'button:has-text("Privacy")',

    // Content elements
    card: '.card',
    cardBody: '.card-body',
    button: 'button',
    primaryButton: '.btn-primary',

    // Toggle switches
    toggleSwitch: 'button[class*="bg-indigo-500"], button[class*="bg-gray-200"]',
  },

  // Color definitions for validation
  colors: {
    dark: {
      backgrounds: [
        'rgb(31, 41, 55)',   // gray-800
        'rgb(17, 24, 39)',   // gray-900
        'rgb(55, 65, 81)',   // gray-700
        'rgb(75, 85, 99)',   // gray-600
      ],
      text: [
        'rgb(243, 244, 246)', // gray-100
        'rgb(229, 231, 235)', // gray-200
        'rgb(255, 255, 255)', // white
        'rgb(209, 213, 219)', // gray-300
      ],
      accent: [
        'rgb(129, 140, 248)', // indigo-400 (for dark mode)
        'rgb(99, 102, 241)',  // indigo-500
      ]
    },
    light: {
      backgrounds: [
        'rgb(255, 255, 255)', // white
        'rgb(249, 250, 251)', // gray-50
        'rgb(243, 244, 246)', // gray-100
      ],
      text: [
        'rgb(17, 24, 39)',    // gray-900
        'rgb(31, 41, 55)',    // gray-800
        'rgb(55, 65, 81)',    // gray-700
      ],
      accent: [
        'rgb(79, 70, 229)',   // indigo-600
        'rgb(99, 102, 241)',  // indigo-500
      ]
    }
  },

  // Viewport configurations for responsive testing
  viewports: {
    mobile: {
      iphone: { width: 375, height: 667 },
      iphonePlus: { width: 414, height: 736 },
      pixel: { width: 360, height: 640 },
      galaxyS8: { width: 360, height: 740 },
    },
    tablet: {
      ipad: { width: 768, height: 1024 },
      ipadPro: { width: 1024, height: 1366 },
      surfacePro: { width: 912, height: 1368 },
    },
    desktop: {
      small: { width: 1280, height: 720 },
      medium: { width: 1440, height: 900 },
      large: { width: 1920, height: 1080 },
    }
  },

  // Timing configurations
  timeouts: {
    appLoad: 30000,
    themeSwitch: 5000,
    modalOpen: 10000,
    modalClose: 5000,
    navigation: 5000,
    animation: 1000,
  },

  // Accessibility standards
  accessibility: {
    wcag: {
      AA: {
        contrastRatio: 4.5,
        largeTextRatio: 3.0,
      },
      AAA: {
        contrastRatio: 7.0,
        largeTextRatio: 4.5,
      }
    },
    // Elements that must have focus indicators
    focusableElements: [
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '[tabindex="0"]',
      '[role="button"]',
      '[role="tab"]',
    ],
  },

  // Test data
  testData: {
    user: {
      id: 'test-user-dark-mode',
      email: 'darkmode.test@example.com',
      name: 'Dark Mode Tester',
      provider: 'email' as const,
      isPremium: true,
      goals: ['build-muscle', 'lose-weight'],
      experience: 'intermediate' as const,
    },
    themes: ['light', 'dark', 'system'] as const,
    navigationTabs: ['Home', 'Workout', 'Progress', 'Profile'] as const,
    settingsModals: [
      { button: 'Theme', title: 'Theme Settings' },
      { button: 'Notifications', title: 'Notification Settings' },
      { button: 'Privacy', title: 'Privacy Settings' },
    ] as const,
  },

  // Screenshot configurations
  screenshots: {
    directory: 'test-results/screenshots',
    formats: {
      comparison: 'comparison-{theme}-{viewport}.png',
      regression: 'regression-{test}-{timestamp}.png',
      modal: 'modal-{modal}-{theme}.png',
      page: 'page-{page}-{theme}-{viewport}.png',
    },
    options: {
      fullPage: true,
      animations: 'disabled' as const,
      caret: 'hide' as const,
    }
  },

  // Performance thresholds
  performance: {
    themeSwitchTime: 1000, // milliseconds
    layoutShiftThreshold: 0.1,
    paintTiming: 2000,
  },

  // Local storage keys
  localStorage: {
    theme: 'momentum_vita_theme',
    user: 'momentum_vita_user',
    notifications: 'momentum_vita_notifications',
    privacy: 'momentum_vita_privacy',
    currentProgram: 'current_program_id',
    programId: 'currentProgramId',
    currentWeek: 'currentWeek',
  },

  // Error patterns to ignore in console
  ignoredErrors: [
    /ResizeObserver loop limit exceeded/,
    /Non-passive event listener/,
    /Warning: validateDOMNesting/,
  ],

  // CSS class patterns for validation
  cssClasses: {
    darkMode: [
      'dark:bg-gray-800',
      'dark:text-gray-100',
      'dark:border-gray-700',
      'dark:hover:bg-gray-700',
    ],
    lightMode: [
      'bg-white',
      'text-gray-900',
      'border-gray-200',
      'hover:bg-gray-50',
    ],
    themeToggle: [
      'bg-indigo-500',
      'bg-gray-200',
      'dark:bg-gray-600',
    ]
  }
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    baseURL: 'http://localhost:5173',
    slowMo: 100,
    timeout: 60000,
  },
  staging: {
    baseURL: 'https://staging.momentum-vita.app',
    slowMo: 0,
    timeout: 30000,
  },
  production: {
    baseURL: 'https://momentum-vita.app',
    slowMo: 0,
    timeout: 30000,
  }
};

/**
 * Browser-specific configurations
 */
export const BROWSER_CONFIG = {
  chromium: {
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
    ],
    colorScheme: 'dark',
  },
  firefox: {
    args: [
      '--no-sandbox',
    ],
    colorScheme: 'dark',
  },
  webkit: {
    args: [],
    colorScheme: 'dark',
  },
};

/**
 * Test categories and their priorities
 */
export const TEST_CATEGORIES = {
  smoke: {
    priority: 1,
    timeout: 30000,
    retries: 3,
  },
  functionality: {
    priority: 2,
    timeout: 60000,
    retries: 2,
  },
  visual: {
    priority: 3,
    timeout: 90000,
    retries: 1,
  },
  accessibility: {
    priority: 2,
    timeout: 45000,
    retries: 2,
  },
  performance: {
    priority: 3,
    timeout: 120000,
    retries: 1,
  },
};

/**
 * Helper function to get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENT_CONFIG[env as keyof typeof ENVIRONMENT_CONFIG] || ENVIRONMENT_CONFIG.development;
}

/**
 * Helper function to create test user with custom properties
 */
export function createTestUser(overrides: Partial<typeof DARK_MODE_CONFIG.testData.user> = {}) {
  return {
    ...DARK_MODE_CONFIG.testData.user,
    id: `${DARK_MODE_CONFIG.testData.user.id}-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Helper function to generate screenshot filename
 */
export function generateScreenshotName(
  type: keyof typeof DARK_MODE_CONFIG.screenshots.formats,
  params: Record<string, string>
): string {
  let filename = DARK_MODE_CONFIG.screenshots.formats[type];

  Object.entries(params).forEach(([key, value]) => {
    filename = filename.replace(`{${key}}`, value);
  });

  // Add timestamp if not provided
  if (filename.includes('{timestamp}')) {
    filename = filename.replace('{timestamp}', Date.now().toString());
  }

  return filename;
}

/**
 * Helper function to validate color against theme palette
 */
export function isValidThemeColor(
  color: string,
  theme: 'light' | 'dark',
  colorType: 'backgrounds' | 'text' | 'accent'
): boolean {
  const palette = DARK_MODE_CONFIG.colors[theme][colorType];
  return palette.some(paletteColor => color.includes(paletteColor));
}

/**
 * Default export with all configurations
 */
export default {
  DARK_MODE_CONFIG,
  ENVIRONMENT_CONFIG,
  BROWSER_CONFIG,
  TEST_CATEGORIES,
  getEnvironmentConfig,
  createTestUser,
  generateScreenshotName,
  isValidThemeColor,
};