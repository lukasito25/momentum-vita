/**
 * Feature Access Control System for Momentum Vita
 * Handles premium feature enforcement and usage limitations
 */

import { SubscriptionService, trackFeatureUsage, getUsageStatus, isFeatureEnabled } from './subscription-service';

// Feature definitions and constants
export const FEATURES = {
  // Workout Features
  CUSTOM_WORKOUT_CREATION: 'custom_workout_creation',
  WORKOUT_TEMPLATES: 'workout_templates',
  ADVANCED_EXERCISE_LIBRARY: 'advanced_exercise_library',
  WORKOUT_SHARING: 'workout_sharing',

  // Analytics Features
  BASIC_PROGRESS_TRACKING: 'basic_progress_tracking',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  PERFORMANCE_INSIGHTS: 'performance_insights',
  DETAILED_STATISTICS: 'detailed_statistics',

  // Social Features
  SOCIAL_CHALLENGES: 'social_challenges',
  LEADERBOARDS: 'leaderboards',
  COMMUNITY_ACCESS: 'community_access',

  // Data Features
  DATA_EXPORT: 'data_export',
  BACKUP_SYNC: 'backup_sync',
  UNLIMITED_HISTORY: 'unlimited_history',

  // AI Features
  AI_WORKOUT_SUGGESTIONS: 'ai_workout_suggestions',
  SMART_PROGRESSION: 'smart_progression',
  PERSONALIZED_RECOMMENDATIONS: 'personalized_recommendations',

  // Customization Features
  CUSTOM_THEMES: 'custom_themes',
  PREMIUM_ACHIEVEMENTS: 'premium_achievements',
  ADVANCED_SETTINGS: 'advanced_settings',
} as const;

export const RESOURCE_TYPES = {
  CUSTOM_WORKOUTS: 'custom_workouts',
  WORKOUT_SHARING: 'workout_sharing',
  DATA_EXPORTS: 'data_exports',
  AI_SUGGESTIONS: 'ai_suggestions',
} as const;

// Free tier limits
export const FREE_TIER_LIMITS = {
  CUSTOM_WORKOUTS: 3,
  WORKOUT_HISTORY_DAYS: 30,
  PREDEFINED_PROGRAMS: 1,
  SOCIAL_CONNECTIONS: 0,
  DATA_EXPORTS: 0,
  AI_SUGGESTIONS: 0,
} as const;

// Premium feature categories
export const FEATURE_CATEGORIES = {
  ESSENTIAL: 'essential',
  PREMIUM: 'premium',
  ADVANCED: 'advanced',
  SOCIAL: 'social',
} as const;

// Error types for feature access
export class FeatureAccessError extends Error {
  constructor(
    message: string,
    public featureName: string,
    public reason: 'not_premium' | 'usage_limit' | 'not_enabled' | 'trial_expired',
    public upgradeRequired: boolean = false
  ) {
    super(message);
    this.name = 'FeatureAccessError';
  }
}

export class UsageLimitError extends Error {
  constructor(
    message: string,
    public resourceType: string,
    public currentUsage: number,
    public limit: number,
    public resetDate: string
  ) {
    super(message);
    this.name = 'UsageLimitError';
  }
}

// Feature access checking utilities
export class FeatureGate {
  /**
   * Check if user can access a feature (with detailed error info)
   */
  static async checkAccess(featureName: string, userId?: string): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
    error?: FeatureAccessError;
  }> {
    try {
      const hasAccess = await isFeatureEnabled(featureName, userId);

      if (hasAccess) {
        return { allowed: true };
      }

      // Get subscription summary to determine reason for denial
      const summary = await SubscriptionService.getSubscriptionSummary(userId);

      if (!summary.isPremium) {
        const error = new FeatureAccessError(
          `Premium subscription required for ${featureName}`,
          featureName,
          'not_premium',
          true
        );
        return {
          allowed: false,
          reason: 'Premium subscription required',
          upgradeRequired: true,
          error,
        };
      }

      if (summary.trialDaysRemaining !== undefined && summary.trialDaysRemaining <= 0) {
        const error = new FeatureAccessError(
          `Trial period expired for ${featureName}`,
          featureName,
          'trial_expired',
          true
        );
        return {
          allowed: false,
          reason: 'Trial period expired',
          upgradeRequired: true,
          error,
        };
      }

      const error = new FeatureAccessError(
        `Feature ${featureName} is not available`,
        featureName,
        'not_enabled',
        false
      );
      return {
        allowed: false,
        reason: 'Feature not available',
        upgradeRequired: false,
        error,
      };
    } catch (error) {
      console.error('Error checking feature access:', error);
      return {
        allowed: false,
        reason: 'Error checking access',
        upgradeRequired: false,
      };
    }
  }

  /**
   * Require access to a feature (throws error if not allowed)
   */
  static async requireAccess(featureName: string, userId?: string): Promise<void> {
    const result = await this.checkAccess(featureName, userId);

    if (!result.allowed) {
      throw result.error || new FeatureAccessError(
        result.reason || 'Access denied',
        featureName,
        'not_enabled'
      );
    }
  }

  /**
   * Check usage limits for a resource
   */
  static async checkUsageLimit(resourceType: string, userId?: string): Promise<{
    canUse: boolean;
    current: number;
    limit: number;
    percentage: number;
    error?: UsageLimitError;
  }> {
    try {
      const usage = await getUsageStatus(resourceType, userId);

      if (!usage.canUse && usage.limit > 0) {
        const error = new UsageLimitError(
          `Usage limit reached for ${resourceType}. Used ${usage.current}/${usage.limit}`,
          resourceType,
          usage.current,
          usage.limit,
          new Date().toISOString()
        );
        return { ...usage, error };
      }

      return usage;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return {
        canUse: false,
        current: 0,
        limit: 0,
        percentage: 0,
      };
    }
  }

  /**
   * Require usage capacity (throws error if limit reached)
   */
  static async requireUsageCapacity(resourceType: string, userId?: string): Promise<void> {
    const result = await this.checkUsageLimit(resourceType, userId);

    if (!result.canUse) {
      throw result.error || new UsageLimitError(
        `Usage limit reached for ${resourceType}`,
        resourceType,
        result.current,
        result.limit,
        new Date().toISOString()
      );
    }
  }

  /**
   * Use a resource (increment usage and check limits)
   */
  static async useResource(resourceType: string, userId?: string): Promise<{
    success: boolean;
    newUsage: number;
    error?: UsageLimitError;
  }> {
    try {
      // Check if usage is allowed before incrementing
      await this.requireUsageCapacity(resourceType, userId);

      // Increment usage
      const newUsage = await trackFeatureUsage(resourceType, userId);

      return {
        success: true,
        newUsage,
      };
    } catch (error) {
      if (error instanceof UsageLimitError) {
        return {
          success: false,
          newUsage: error.currentUsage,
          error,
        };
      }

      console.error('Error using resource:', error);
      return {
        success: false,
        newUsage: 0,
        error: new UsageLimitError(
          'Failed to track resource usage',
          resourceType,
          0,
          0,
          new Date().toISOString()
        ),
      };
    }
  }
}

// React hook-like utilities for feature checking
export class FeatureUtils {
  /**
   * Get feature availability status
   */
  static async getFeatureStatus(featureName: string, userId?: string): Promise<{
    available: boolean;
    premium: boolean;
    reason?: string;
    upgradeUrl?: string;
  }> {
    const summary = await SubscriptionService.getSubscriptionSummary(userId);
    const access = await FeatureGate.checkAccess(featureName, userId);

    return {
      available: access.allowed,
      premium: summary.isPremium,
      reason: access.reason,
      upgradeUrl: access.upgradeRequired ? '/subscription/upgrade' : undefined,
    };
  }

  /**
   * Get usage status for all resources
   */
  static async getAllUsageStatus(userId?: string): Promise<Record<string, {
    current: number;
    limit: number;
    percentage: number;
    canUse: boolean;
  }>> {
    const resourceTypes = Object.values(RESOURCE_TYPES);
    const statuses: Record<string, any> = {};

    for (const resourceType of resourceTypes) {
      statuses[resourceType] = await getUsageStatus(resourceType, userId);
    }

    return statuses;
  }

  /**
   * Get feature categories with availability
   */
  static async getCategorizedFeatures(userId?: string): Promise<Record<string, {
    features: string[];
    available: boolean;
    premium: boolean;
  }>> {
    const summary = await SubscriptionService.getSubscriptionSummary(userId);

    return {
      [FEATURE_CATEGORIES.ESSENTIAL]: {
        features: [
          FEATURES.BASIC_PROGRESS_TRACKING,
          FEATURES.CUSTOM_WORKOUT_CREATION,
        ],
        available: true,
        premium: false,
      },
      [FEATURE_CATEGORIES.PREMIUM]: {
        features: [
          FEATURES.ADVANCED_ANALYTICS,
          FEATURES.WORKOUT_TEMPLATES,
          FEATURES.PERFORMANCE_INSIGHTS,
        ],
        available: summary.isPremium,
        premium: true,
      },
      [FEATURE_CATEGORIES.ADVANCED]: {
        features: [
          FEATURES.AI_WORKOUT_SUGGESTIONS,
          FEATURES.SMART_PROGRESSION,
          FEATURES.DATA_EXPORT,
        ],
        available: summary.isPremium,
        premium: true,
      },
      [FEATURE_CATEGORIES.SOCIAL]: {
        features: [
          FEATURES.WORKOUT_SHARING,
          FEATURES.SOCIAL_CHALLENGES,
          FEATURES.LEADERBOARDS,
        ],
        available: summary.isPremium,
        premium: true,
      },
    };
  }

  /**
   * Get upgrade recommendations based on usage patterns
   */
  static async getUpgradeRecommendations(userId?: string): Promise<{
    shouldUpgrade: boolean;
    reasons: string[];
    blockedFeatures: string[];
    usageLimits: Array<{
      resource: string;
      usage: number;
      limit: number;
      percentage: number;
    }>;
  }> {
    const summary = await SubscriptionService.getSubscriptionSummary(userId);
    const usageStatuses = await this.getAllUsageStatus(userId);

    if (summary.isPremium) {
      return {
        shouldUpgrade: false,
        reasons: [],
        blockedFeatures: [],
        usageLimits: [],
      };
    }

    const reasons: string[] = [];
    const blockedFeatures: string[] = [];
    const usageLimits: any[] = [];

    // Check usage limits
    for (const [resource, status] of Object.entries(usageStatuses)) {
      if (status.limit > 0 && status.percentage >= 80) {
        usageLimits.push({
          resource,
          usage: status.current,
          limit: status.limit,
          percentage: status.percentage,
        });

        if (status.percentage >= 100) {
          reasons.push(`You've reached your ${resource} limit`);
        } else {
          reasons.push(`You're approaching your ${resource} limit (${Math.round(status.percentage)}%)`);
        }
      }
    }

    // Check premium features
    const premiumFeatures = [
      FEATURES.ADVANCED_ANALYTICS,
      FEATURES.WORKOUT_SHARING,
      FEATURES.AI_WORKOUT_SUGGESTIONS,
      FEATURES.DATA_EXPORT,
    ];

    for (const feature of premiumFeatures) {
      const access = await FeatureGate.checkAccess(feature, userId);
      if (!access.allowed && access.upgradeRequired) {
        blockedFeatures.push(feature);
      }
    }

    if (blockedFeatures.length > 0) {
      reasons.push(`Unlock ${blockedFeatures.length} premium features`);
    }

    return {
      shouldUpgrade: reasons.length > 0,
      reasons,
      blockedFeatures,
      usageLimits,
    };
  }
}

// Component helper utilities
export const withFeatureGate = <T extends Record<string, any>>(
  component: React.ComponentType<T>,
  requiredFeature: string,
  fallbackComponent?: React.ComponentType<T>
) => {
  return (props: T) => {
    const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);

    React.useEffect(() => {
      FeatureGate.checkAccess(requiredFeature).then(result => {
        setHasAccess(result.allowed);
      });
    }, []);

    if (hasAccess === null) {
      return null; // Loading state
    }

    if (hasAccess) {
      return React.createElement(component, props);
    }

    if (fallbackComponent) {
      return React.createElement(fallbackComponent, props);
    }

    return null;
  };
};

// Export error types and utilities
export { FeatureAccessError, UsageLimitError };

// Export feature checking functions
export {
  FeatureGate as gate,
  FeatureUtils as utils,
  isFeatureEnabled as isEnabled,
  trackFeatureUsage as trackUsage,
  getUsageStatus as getUsage,
};