/**
 * Stripe Integration Service for Momentum Vita
 * Handles payment processing, subscription management, and billing operations
 */

// Stripe types and interfaces
export interface StripeConfig {
  publishableKey: string;
  priceIds: {
    monthly: string;
    yearly: string;
  };
  webhookSecret?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly?: number;
  priceYearly?: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  stripeProductId?: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  isActive: boolean;
}

export interface PaymentSession {
  sessionId: string;
  url: string;
  customerId?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isPremium: boolean;
  plan: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface BillingPortalSession {
  url: string;
}

export interface UsageReport {
  resourceType: string;
  currentUsage: number;
  limit: number;
  resetDate: string;
}

// Mock Stripe service for development (replace with actual Stripe integration)
export class StripeService {
  private static config: StripeConfig = {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock',
    priceIds: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_mock_monthly',
      yearly: import.meta.env.VITE_STRIPE_PRICE_YEARLY || 'price_mock_yearly'
    }
  };

  private static isProduction = import.meta.env.PROD;
  private static mockMode = !this.isProduction || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  /**
   * Initialize Stripe with configuration
   */
  static initialize(config?: Partial<StripeConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (this.mockMode) {
      console.warn('Stripe Service running in mock mode. Set VITE_STRIPE_PUBLISHABLE_KEY for production.');
    }

    return this.config;
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    priceId: string,
    customerId?: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<PaymentSession> {
    if (this.mockMode) {
      // Mock implementation for development
      return this.mockCreateCheckoutSession(priceId, customerId, successUrl, cancelUrl);
    }

    try {
      // In production, this would call your backend API that creates a Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerId,
          successUrl: successUrl || `${window.location.origin}/subscription/success`,
          cancelUrl: cancelUrl || `${window.location.origin}/subscription/cancel`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.statusText}`);
      }

      const session = await response.json();
      return {
        sessionId: session.id,
        url: session.url,
        customerId: session.customer,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a billing portal session for subscription management
   */
  static async createBillingPortalSession(customerId: string): Promise<BillingPortalSession> {
    if (this.mockMode) {
      return this.mockCreateBillingPortalSession(customerId);
    }

    try {
      const response = await fetch('/api/stripe/create-billing-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.origin,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create billing portal session: ${response.statusText}`);
      }

      const session = await response.json();
      return {
        url: session.url,
      };
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw new Error('Failed to create billing portal session');
    }
  }

  /**
   * Get subscription status for a customer
   */
  static async getSubscriptionStatus(customerId: string): Promise<SubscriptionStatus> {
    if (this.mockMode) {
      return this.mockGetSubscriptionStatus(customerId);
    }

    try {
      const response = await fetch(`/api/stripe/subscription-status/${customerId}`);

      if (!response.ok) {
        throw new Error(`Failed to get subscription status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting subscription status:', error);
      // Return default free tier status on error
      return {
        isActive: false,
        isPremium: false,
        plan: 'free',
        status: 'canceled',
        cancelAtPeriodEnd: false,
      };
    }
  }

  /**
   * Cancel subscription at period end
   */
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (this.mockMode) {
      return this.mockCancelSubscription(subscriptionId);
    }

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd: true,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(subscriptionId: string): Promise<boolean> {
    if (this.mockMode) {
      return this.mockReactivateSubscription(subscriptionId);
    }

    try {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return false;
    }
  }

  /**
   * Get available subscription plans
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    // This would typically come from your backend or Stripe
    return [
      {
        id: 'free',
        name: 'Free Tier',
        description: 'Basic fitness tracking with core features',
        priceMonthly: 0,
        priceYearly: 0,
        features: {
          custom_workouts: false,
          advanced_analytics: false,
          workout_sharing: false,
          data_export: false,
          ai_suggestions: false,
          premium_achievements: false,
          priority_support: false,
        },
        limits: {
          custom_workouts: 3,
          predefined_programs: 1,
          workout_history: 30,
        },
        isActive: true,
      },
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        description: 'Unlimited access to all features with monthly billing',
        priceMonthly: 9.99,
        stripePriceIdMonthly: this.config.priceIds.monthly,
        features: {
          custom_workouts: true,
          advanced_analytics: true,
          workout_sharing: true,
          data_export: true,
          ai_suggestions: true,
          premium_achievements: true,
          priority_support: true,
        },
        limits: {
          custom_workouts: -1, // unlimited
          predefined_programs: -1,
          workout_history: -1,
        },
        isActive: true,
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        description: 'Unlimited access to all features with yearly billing (save 33%)',
        priceYearly: 79.99,
        stripePriceIdYearly: this.config.priceIds.yearly,
        features: {
          custom_workouts: true,
          advanced_analytics: true,
          workout_sharing: true,
          data_export: true,
          ai_suggestions: true,
          premium_achievements: true,
          priority_support: true,
          yearly_discount: true,
        },
        limits: {
          custom_workouts: -1,
          predefined_programs: -1,
          workout_history: -1,
        },
        isActive: true,
      },
    ];
  }

  // =============================================
  // MOCK IMPLEMENTATIONS FOR DEVELOPMENT
  // =============================================

  private static mockCreateCheckoutSession(
    priceId: string,
    customerId?: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<PaymentSession> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockSessionId = `cs_mock_${Date.now()}`;
        const mockUrl = `https://checkout.stripe.com/pay/${mockSessionId}`;

        // In development, redirect to success page after a delay
        console.log('Mock Stripe Checkout:', {
          priceId,
          customerId,
          successUrl,
          cancelUrl,
        });

        resolve({
          sessionId: mockSessionId,
          url: mockUrl,
          customerId: customerId || `cus_mock_${Date.now()}`,
        });
      }, 500);
    });
  }

  private static mockCreateBillingPortalSession(customerId: string): Promise<BillingPortalSession> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Mock Billing Portal for customer:', customerId);
        resolve({
          url: `https://billing.stripe.com/session/mock_${customerId}`,
        });
      }, 300);
    });
  }

  private static mockGetSubscriptionStatus(customerId: string): Promise<SubscriptionStatus> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock premium status based on customer ID for testing
        const isPremium = customerId.includes('premium') || customerId.includes('paid');

        resolve({
          isActive: isPremium,
          isPremium,
          plan: isPremium ? 'premium_monthly' : 'free',
          status: isPremium ? 'active' : 'canceled',
          currentPeriodStart: isPremium ? new Date().toISOString() : undefined,
          currentPeriodEnd: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          cancelAtPeriodEnd: false,
        });
      }, 200);
    });
  }

  private static mockCancelSubscription(subscriptionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Mock cancel subscription:', subscriptionId);
        resolve(true);
      }, 500);
    });
  }

  private static mockReactivateSubscription(subscriptionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Mock reactivate subscription:', subscriptionId);
        resolve(true);
      }, 500);
    });
  }

  /**
   * Handle successful payment completion
   */
  static async handlePaymentSuccess(sessionId: string, customerId: string): Promise<boolean> {
    try {
      if (this.mockMode) {
        console.log('Mock payment success:', { sessionId, customerId });
        return true;
      }

      // In production, verify the payment with your backend
      const response = await fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          customerId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error handling payment success:', error);
      return false;
    }
  }

  /**
   * Process webhook events from Stripe
   */
  static async processWebhookEvent(event: any): Promise<boolean> {
    try {
      console.log('Processing Stripe webhook event:', event.type);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          // Handle subscription lifecycle events
          break;
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          // Handle payment events
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return true;
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return false;
    }
  }
}

// Export utility functions for price formatting
export const formatPrice = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const calculateYearlyDiscount = (monthlyPrice: number, yearlyPrice: number): number => {
  const yearlyMonthlyEquivalent = monthlyPrice * 12;
  return Math.round(((yearlyMonthlyEquivalent - yearlyPrice) / yearlyMonthlyEquivalent) * 100);
};

// Export default configuration
export const STRIPE_CONFIG = {
  PLANS: {
    FREE: 'free',
    PREMIUM_MONTHLY: 'premium_monthly',
    PREMIUM_YEARLY: 'premium_yearly',
  },
  FEATURES: {
    CUSTOM_WORKOUTS: 'custom_workouts',
    ADVANCED_ANALYTICS: 'advanced_analytics',
    WORKOUT_SHARING: 'workout_sharing',
    DATA_EXPORT: 'data_export',
    AI_SUGGESTIONS: 'ai_suggestions',
    PREMIUM_ACHIEVEMENTS: 'premium_achievements',
  },
  LIMITS: {
    FREE_CUSTOM_WORKOUTS: 3,
    FREE_WORKOUT_HISTORY_DAYS: 30,
  },
} as const;