/**
 * Subscription Management Service for Momentum Vita
 * Handles subscription lifecycle, feature access, and usage tracking
 */

import { supabase } from './supabase';
import { StripeService, SubscriptionStatus, SubscriptionPlan } from './stripe-service';

// Types and interfaces
export interface UserSubscription {
  id?: string;
  userId: string;
  planId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  subscriptionMetadata: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeatureAccess {
  featureName: string;
  freeTierEnabled: boolean;
  premiumTierEnabled: boolean;
  freeTierLimit: number;
  premiumTierLimit: number;
  featureDescription: string;
  featureCategory: 'workouts' | 'analytics' | 'social' | 'data' | 'ai' | 'customization';
  isActive: boolean;
}

export interface UserUsage {
  id?: string;
  userId: string;
  resourceType: string;
  usageCount: number;
  lastResetDate: string;
  monthlyLimit?: number;
  usageHistory: UsageHistoryEntry[];
}

export interface UsageHistoryEntry {
  date: string;
  count: number;
  action: string;
}

export interface SubscriptionSummary {
  isActive: boolean;
  isPremium: boolean;
  plan: SubscriptionPlan | null;
  subscription: UserSubscription | null;
  features: Record<string, boolean>;
  usage: Record<string, UserUsage>;
  trialDaysRemaining?: number;
}

// Main subscription service class
export class SubscriptionService {
  private static userId = 'anonymous';

  // Set current user ID
  static setUserId(userId: string) {
    this.userId = userId || 'anonymous';
  }

  // Get current user ID
  static getUserId(): string {
    return this.userId;
  }

  /**
   * Get user's current subscription summary
   */
  static async getSubscriptionSummary(userId?: string): Promise<SubscriptionSummary> {
    const targetUserId = userId || this.userId;

    try {
      // Get user subscription
      const subscription = await this.getUserSubscription(targetUserId);

      // Get subscription plans
      const plans = await StripeService.getSubscriptionPlans();
      const plan = plans.find(p => p.id === subscription?.planId) || plans.find(p => p.id === 'free');

      // Get feature access
      const features = await this.getUserFeatureAccess(targetUserId);

      // Get usage data
      const usage = await this.getUserUsageData(targetUserId);

      // Calculate trial days remaining
      let trialDaysRemaining: number | undefined;
      if (subscription?.trialEnd) {
        const trialEndDate = new Date(subscription.trialEnd);
        const now = new Date();
        const diffTime = trialEndDate.getTime() - now.getTime();
        trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        trialDaysRemaining = Math.max(0, trialDaysRemaining);
      }

      const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
      const isPremium = isActive && subscription?.planId !== 'free';

      return {
        isActive,
        isPremium,
        plan: plan || null,
        subscription,
        features,
        usage,
        trialDaysRemaining,
      };
    } catch (error) {
      console.error('Error getting subscription summary:', error);

      // Return default free tier summary on error
      const freePlan = (await StripeService.getSubscriptionPlans()).find(p => p.id === 'free');
      return {
        isActive: false,
        isPremium: false,
        plan: freePlan || null,
        subscription: null,
        features: {},
        usage: {},
      };
    }
  }

  /**
   * Get user's subscription from database
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (!data) {
        // Create default free subscription for new users
        return await this.createFreeSubscription(userId);
      }

      return {
        id: data.id,
        userId: data.user_id,
        planId: data.plan_id,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        status: data.status,
        billingCycle: data.billing_cycle,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        trialStart: data.trial_start,
        trialEnd: data.trial_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        canceledAt: data.canceled_at,
        subscriptionMetadata: data.subscription_metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  /**
   * Create free tier subscription for new user
   */
  static async createFreeSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'free',
          status: 'active',
          billing_cycle: 'monthly',
          cancel_at_period_end: false,
          subscription_metadata: {},
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize usage tracking for new user
      await this.initializeUserUsage(userId);

      return {
        id: data.id,
        userId: data.user_id,
        planId: data.plan_id,
        status: data.status,
        billingCycle: data.billing_cycle,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        subscriptionMetadata: data.subscription_metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating free subscription:', error);
      return null;
    }
  }

  /**
   * Update user subscription
   */
  static async updateUserSubscription(
    userId: string,
    updates: Partial<UserSubscription>
  ): Promise<UserSubscription | null> {
    try {
      const updateData: any = {};

      if (updates.planId) updateData.plan_id = updates.planId;
      if (updates.stripeCustomerId) updateData.stripe_customer_id = updates.stripeCustomerId;
      if (updates.stripeSubscriptionId) updateData.stripe_subscription_id = updates.stripeSubscriptionId;
      if (updates.status) updateData.status = updates.status;
      if (updates.billingCycle) updateData.billing_cycle = updates.billingCycle;
      if (updates.currentPeriodStart) updateData.current_period_start = updates.currentPeriodStart;
      if (updates.currentPeriodEnd) updateData.current_period_end = updates.currentPeriodEnd;
      if (updates.trialStart) updateData.trial_start = updates.trialStart;
      if (updates.trialEnd) updateData.trial_end = updates.trialEnd;
      if (updates.cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;
      if (updates.canceledAt) updateData.canceled_at = updates.canceledAt;
      if (updates.subscriptionMetadata) updateData.subscription_metadata = updates.subscriptionMetadata;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.getUserSubscription(userId);
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return null;
    }
  }

  /**
   * Get user's feature access permissions
   */
  static async getUserFeatureAccess(userId: string): Promise<Record<string, boolean>> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const isPremium = subscription?.status === 'active' && subscription?.planId !== 'free';

      // Get all feature access rules
      const { data: features, error } = await supabase
        .from('feature_access_control')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const access: Record<string, boolean> = {};

      for (const feature of features || []) {
        if (isPremium) {
          access[feature.feature_name] = feature.premium_tier_enabled;
        } else {
          access[feature.feature_name] = feature.free_tier_enabled;
        }
      }

      return access;
    } catch (error) {
      console.error('Error getting feature access:', error);
      return {};
    }
  }

  /**
   * Check if user can access a specific feature
   */
  static async canAccessFeature(featureName: string, userId?: string): Promise<boolean> {
    const targetUserId = userId || this.userId;

    try {
      // Use database function for accurate permission checking
      const { data, error } = await supabase
        .rpc('can_access_feature', {
          check_user_id: targetUserId,
          feature_name: featureName,
        });

      if (error) throw error;

      return data === true;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get user's usage data for all resources
   */
  static async getUserUsageData(userId: string): Promise<Record<string, UserUsage>> {
    try {
      const { data, error } = await supabase
        .from('user_usage_tracking')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const usage: Record<string, UserUsage> = {};

      for (const record of data || []) {
        usage[record.resource_type] = {
          id: record.id,
          userId: record.user_id,
          resourceType: record.resource_type,
          usageCount: record.usage_count,
          lastResetDate: record.last_reset_date,
          monthlyLimit: record.monthly_limit,
          usageHistory: record.usage_history || [],
        };
      }

      return usage;
    } catch (error) {
      console.error('Error getting user usage data:', error);
      return {};
    }
  }

  /**
   * Get current usage for a specific resource
   */
  static async getCurrentUsage(resourceType: string, userId?: string): Promise<number> {
    const targetUserId = userId || this.userId;

    try {
      const { data, error } = await supabase
        .rpc('get_user_usage', {
          check_user_id: targetUserId,
          resource_name: resourceType,
        });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('Error getting current usage:', error);
      return 0;
    }
  }

  /**
   * Increment usage for a resource
   */
  static async incrementUsage(resourceType: string, userId?: string): Promise<number> {
    const targetUserId = userId || this.userId;

    try {
      const { data, error } = await supabase
        .rpc('increment_user_usage', {
          check_user_id: targetUserId,
          resource_name: resourceType,
        });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw new Error('Failed to track resource usage');
    }
  }

  /**
   * Initialize usage tracking for a new user
   */
  static async initializeUserUsage(userId: string): Promise<void> {
    try {
      const defaultResources = [
        { resource_type: 'custom_workouts', monthly_limit: 3 },
        { resource_type: 'workout_sharing', monthly_limit: 0 },
        { resource_type: 'data_exports', monthly_limit: 0 },
        { resource_type: 'ai_suggestions', monthly_limit: 0 },
      ];

      for (const resource of defaultResources) {
        await supabase
          .from('user_usage_tracking')
          .insert({
            user_id: userId,
            resource_type: resource.resource_type,
            usage_count: 0,
            monthly_limit: resource.monthly_limit,
            usage_history: [],
          })
          .on('conflict', 'user_id,resource_type')
          .ignore();
      }
    } catch (error) {
      console.error('Error initializing user usage:', error);
    }
  }

  /**
   * Start subscription upgrade process
   */
  static async startUpgrade(planId: string, userId?: string): Promise<string | null> {
    const targetUserId = userId || this.userId;

    try {
      const subscription = await this.getUserSubscription(targetUserId);
      const plans = await StripeService.getSubscriptionPlans();
      const targetPlan = plans.find(p => p.id === planId);

      if (!targetPlan || targetPlan.id === 'free') {
        throw new Error('Invalid plan selected');
      }

      // Determine which Stripe price ID to use
      let priceId: string;
      if (planId === 'premium_monthly' && targetPlan.stripePriceIdMonthly) {
        priceId = targetPlan.stripePriceIdMonthly;
      } else if (planId === 'premium_yearly' && targetPlan.stripePriceIdYearly) {
        priceId = targetPlan.stripePriceIdYearly;
      } else {
        throw new Error('No Stripe price ID configured for this plan');
      }

      // Create checkout session
      const session = await StripeService.createCheckoutSession(
        priceId,
        subscription?.stripeCustomerId,
        `${window.location.origin}/subscription/success?plan=${planId}`,
        `${window.location.origin}/subscription/cancel`
      );

      // Update subscription with pending upgrade
      if (subscription) {
        await this.updateUserSubscription(targetUserId, {
          subscriptionMetadata: {
            ...subscription.subscriptionMetadata,
            pendingUpgrade: planId,
            checkoutSessionId: session.sessionId,
          },
        });
      }

      return session.url;
    } catch (error) {
      console.error('Error starting upgrade:', error);
      return null;
    }
  }

  /**
   * Complete subscription upgrade after successful payment
   */
  static async completeUpgrade(
    sessionId: string,
    planId: string,
    stripeData: any,
    userId?: string
  ): Promise<boolean> {
    const targetUserId = userId || this.userId;

    try {
      const billingCycle = planId.includes('yearly') ? 'yearly' : 'monthly';

      await this.updateUserSubscription(targetUserId, {
        planId,
        stripeCustomerId: stripeData.customerId,
        stripeSubscriptionId: stripeData.subscriptionId,
        status: 'active',
        billingCycle,
        currentPeriodStart: stripeData.currentPeriodStart,
        currentPeriodEnd: stripeData.currentPeriodEnd,
        trialStart: stripeData.trialStart,
        trialEnd: stripeData.trialEnd,
        cancelAtPeriodEnd: false,
        subscriptionMetadata: {
          upgradeCompletedAt: new Date().toISOString(),
          checkoutSessionId: sessionId,
        },
      });

      // Update usage limits for premium features
      await this.updateUsageLimitsForPremium(targetUserId);

      return true;
    } catch (error) {
      console.error('Error completing upgrade:', error);
      return false;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId?: string): Promise<boolean> {
    const targetUserId = userId || this.userId;

    try {
      const subscription = await this.getUserSubscription(targetUserId);

      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription to cancel');
      }

      // Cancel in Stripe
      const success = await StripeService.cancelSubscription(subscription.stripeSubscriptionId);

      if (success) {
        // Update local subscription
        await this.updateUserSubscription(targetUserId, {
          cancelAtPeriodEnd: true,
          subscriptionMetadata: {
            ...subscription.subscriptionMetadata,
            canceledAt: new Date().toISOString(),
          },
        });
      }

      return success;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  /**
   * Reactivate canceled subscription
   */
  static async reactivateSubscription(userId?: string): Promise<boolean> {
    const targetUserId = userId || this.userId;

    try {
      const subscription = await this.getUserSubscription(targetUserId);

      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No subscription to reactivate');
      }

      // Reactivate in Stripe
      const success = await StripeService.reactivateSubscription(subscription.stripeSubscriptionId);

      if (success) {
        // Update local subscription
        await this.updateUserSubscription(targetUserId, {
          cancelAtPeriodEnd: false,
          subscriptionMetadata: {
            ...subscription.subscriptionMetadata,
            reactivatedAt: new Date().toISOString(),
          },
        });
      }

      return success;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return false;
    }
  }

  /**
   * Update usage limits when user upgrades to premium
   */
  private static async updateUsageLimitsForPremium(userId: string): Promise<void> {
    try {
      const premiumLimits = [
        { resource_type: 'custom_workouts', monthly_limit: -1 }, // unlimited
        { resource_type: 'workout_sharing', monthly_limit: -1 },
        { resource_type: 'data_exports', monthly_limit: -1 },
        { resource_type: 'ai_suggestions', monthly_limit: -1 },
      ];

      for (const limit of premiumLimits) {
        await supabase
          .from('user_usage_tracking')
          .update({ monthly_limit: limit.monthly_limit })
          .eq('user_id', userId)
          .eq('resource_type', limit.resource_type);
      }
    } catch (error) {
      console.error('Error updating premium limits:', error);
    }
  }

  /**
   * Sync subscription status with Stripe
   */
  static async syncWithStripe(userId?: string): Promise<boolean> {
    const targetUserId = userId || this.userId;

    try {
      const subscription = await this.getUserSubscription(targetUserId);

      if (!subscription?.stripeCustomerId) {
        return false;
      }

      const stripeStatus = await StripeService.getSubscriptionStatus(subscription.stripeCustomerId);

      // Update local subscription with Stripe data
      await this.updateUserSubscription(targetUserId, {
        status: stripeStatus.status,
        currentPeriodStart: stripeStatus.currentPeriodStart,
        currentPeriodEnd: stripeStatus.currentPeriodEnd,
        trialEnd: stripeStatus.trialEnd,
        cancelAtPeriodEnd: stripeStatus.cancelAtPeriodEnd,
      });

      return true;
    } catch (error) {
      console.error('Error syncing with Stripe:', error);
      return false;
    }
  }
}

// Export utility functions
export const isFeatureEnabled = async (featureName: string, userId?: string): Promise<boolean> => {
  return SubscriptionService.canAccessFeature(featureName, userId);
};

export const trackFeatureUsage = async (resourceType: string, userId?: string): Promise<number> => {
  return SubscriptionService.incrementUsage(resourceType, userId);
};

export const getUsageStatus = async (resourceType: string, userId?: string): Promise<{
  current: number;
  limit: number;
  percentage: number;
  canUse: boolean;
}> => {
  const current = await SubscriptionService.getCurrentUsage(resourceType, userId);
  const usageData = await SubscriptionService.getUserUsageData(userId || SubscriptionService.getUserId());
  const resourceUsage = usageData[resourceType];
  const limit = resourceUsage?.monthlyLimit || 0;

  return {
    current,
    limit,
    percentage: limit > 0 ? (current / limit) * 100 : 0,
    canUse: limit === -1 || current < limit,
  };
};