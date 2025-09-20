-- =============================================
-- Momentum Vita - Subscription Management Schema
-- =============================================
-- Enhanced database schema for subscription and payment management
-- Building on existing momentum-vita infrastructure

-- =============================================
-- 1. SUBSCRIPTION PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    stripe_product_id TEXT,
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);

-- =============================================
-- 2. USER SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT REFERENCES subscription_plans(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete')) DEFAULT 'active',
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    subscription_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);

-- =============================================
-- 3. USAGE TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('custom_workouts', 'workout_sharing', 'data_exports', 'ai_suggestions')),
    usage_count INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    monthly_limit INTEGER,
    usage_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, resource_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_resource ON user_usage_tracking(user_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_reset_date ON user_usage_tracking(last_reset_date);

-- =============================================
-- 4. FEATURE ACCESS CONTROL TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS feature_access_control (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_name TEXT NOT NULL UNIQUE,
    free_tier_enabled BOOLEAN DEFAULT false,
    premium_tier_enabled BOOLEAN DEFAULT true,
    free_tier_limit INTEGER DEFAULT 0,
    premium_tier_limit INTEGER DEFAULT -1, -- -1 means unlimited
    feature_description TEXT,
    feature_category TEXT CHECK (feature_category IN ('workouts', 'analytics', 'social', 'data', 'ai', 'customization')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_access_category ON feature_access_control(feature_category);
CREATE INDEX IF NOT EXISTS idx_feature_access_active ON feature_access_control(is_active);

-- =============================================
-- 5. BILLING HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    subscription_id UUID REFERENCES user_subscriptions(id),
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT CHECK (status IN ('paid', 'pending', 'failed', 'refunded')) DEFAULT 'pending',
    invoice_period_start TIMESTAMP WITH TIME ZONE,
    invoice_period_end TIMESTAMP WITH TIME ZONE,
    billing_reason TEXT,
    payment_method_type TEXT,
    invoice_pdf_url TEXT,
    billing_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_status ON billing_history(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_created_at ON billing_history(created_at);

-- =============================================
-- 6. UPDATE EXISTING USER_PREFERENCES TABLE
-- =============================================
-- Add subscription-related fields to existing user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS premium_features_enabled JSONB DEFAULT '{}';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS usage_reset_date DATE DEFAULT CURRENT_DATE;

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Subscription plans are public (read-only)
CREATE POLICY "Subscription plans are viewable by everyone" ON subscription_plans FOR SELECT USING (is_active = true);

-- Feature access control is public (read-only)
CREATE POLICY "Feature access control is viewable by everyone" ON feature_access_control FOR SELECT USING (is_active = true);

-- User-specific subscription policies
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

CREATE POLICY "Users can insert own subscription" ON user_subscriptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert anonymous subscription" ON user_subscriptions FOR INSERT TO anon
WITH CHECK (user_id = 'anonymous');

CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR UPDATE
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

-- User usage tracking policies
CREATE POLICY "Users can view own usage" ON user_usage_tracking FOR SELECT
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

CREATE POLICY "Users can insert own usage" ON user_usage_tracking FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert anonymous usage" ON user_usage_tracking FOR INSERT TO anon
WITH CHECK (user_id = 'anonymous');

CREATE POLICY "Users can update own usage" ON user_usage_tracking FOR UPDATE
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

-- Billing history policies
CREATE POLICY "Users can view own billing history" ON billing_history FOR SELECT
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

CREATE POLICY "Users can insert own billing history" ON billing_history FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert anonymous billing history" ON billing_history FOR INSERT TO anon
WITH CHECK (user_id = 'anonymous');

-- =============================================
-- 8. SAMPLE DATA - SUBSCRIPTION PLANS
-- =============================================

INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, limits) VALUES
('free', 'Free Tier', 'Basic fitness tracking with core features', 0.00, 0.00, '{
  "custom_workouts": false,
  "advanced_analytics": false,
  "workout_sharing": false,
  "data_export": false,
  "ai_suggestions": false,
  "premium_achievements": false,
  "priority_support": false
}', '{
  "custom_workouts": 3,
  "predefined_programs": 1,
  "workout_history": 30,
  "analytics_range": "basic"
}'),

('premium_monthly', 'Premium Monthly', 'Unlimited access to all features with monthly billing', 9.99, NULL, '{
  "custom_workouts": true,
  "advanced_analytics": true,
  "workout_sharing": true,
  "data_export": true,
  "ai_suggestions": true,
  "premium_achievements": true,
  "priority_support": true
}', '{
  "custom_workouts": -1,
  "predefined_programs": -1,
  "workout_history": -1,
  "analytics_range": "unlimited"
}'),

('premium_yearly', 'Premium Yearly', 'Unlimited access to all features with yearly billing (save 33%)', NULL, 79.99, '{
  "custom_workouts": true,
  "advanced_analytics": true,
  "workout_sharing": true,
  "data_export": true,
  "ai_suggestions": true,
  "premium_achievements": true,
  "priority_support": true,
  "yearly_discount": true
}', '{
  "custom_workouts": -1,
  "predefined_programs": -1,
  "workout_history": -1,
  "analytics_range": "unlimited"
}');

-- =============================================
-- 9. SAMPLE DATA - FEATURE ACCESS CONTROL
-- =============================================

INSERT INTO feature_access_control (feature_name, free_tier_enabled, premium_tier_enabled, free_tier_limit, premium_tier_limit, feature_description, feature_category) VALUES
-- Workout Features
('custom_workout_creation', true, true, 3, -1, 'Create and save custom workout routines', 'workouts'),
('workout_templates', false, true, 0, -1, 'Access to premium workout templates', 'workouts'),
('advanced_exercise_library', false, true, 0, -1, 'Extended exercise database with demonstrations', 'workouts'),

-- Analytics Features
('basic_progress_tracking', true, true, -1, -1, 'Basic progress charts and statistics', 'analytics'),
('advanced_analytics', false, true, 0, -1, 'Detailed analytics with trends and insights', 'analytics'),
('performance_insights', false, true, 0, -1, 'AI-powered performance analysis', 'analytics'),

-- Social Features
('workout_sharing', false, true, 0, -1, 'Share workouts with friends and community', 'social'),
('social_challenges', false, true, 0, -1, 'Participate in community challenges', 'social'),
('leaderboards', false, true, 0, -1, 'Compare progress with other users', 'social'),

-- Data Features
('data_export', false, true, 0, -1, 'Export workout data to CSV/PDF', 'data'),
('backup_sync', false, true, 0, -1, 'Cloud backup and sync across devices', 'data'),
('unlimited_history', true, true, 30, -1, 'Access to workout history (days)', 'data'),

-- AI Features
('ai_workout_suggestions', false, true, 0, -1, 'AI-powered workout recommendations', 'ai'),
('smart_progression', false, true, 0, -1, 'Intelligent weight and rep progression', 'ai'),

-- Customization Features
('custom_themes', false, true, 0, -1, 'Customize app appearance and themes', 'customization'),
('premium_achievements', false, true, 0, -1, 'Unlock exclusive achievement badges', 'customization');

-- =============================================
-- 10. FUNCTIONS FOR SUBSCRIPTION MANAGEMENT
-- =============================================

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION is_premium_user(check_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_record RECORD;
BEGIN
    -- Anonymous users are always free tier
    IF check_user_id = 'anonymous' THEN
        RETURN FALSE;
    END IF;

    -- Check current subscription status
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = check_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > NOW());

    -- Return true if active subscription found
    RETURN subscription_record IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current usage for a resource
CREATE OR REPLACE FUNCTION get_user_usage(check_user_id TEXT, resource_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    usage_count INTEGER;
    current_date DATE;
BEGIN
    current_date := CURRENT_DATE;

    -- Get current usage, reset if month changed
    SELECT
        CASE
            WHEN last_reset_date < date_trunc('month', current_date) THEN 0
            ELSE usage_count
        END
    INTO usage_count
    FROM user_usage_tracking
    WHERE user_id = check_user_id AND resource_type = resource_name;

    -- If no record found, return 0
    RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to increment user usage
CREATE OR REPLACE FUNCTION increment_user_usage(check_user_id TEXT, resource_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    new_usage_count INTEGER;
    current_date DATE;
BEGIN
    current_date := CURRENT_DATE;

    -- Insert or update usage record
    INSERT INTO user_usage_tracking (user_id, resource_type, usage_count, last_reset_date)
    VALUES (check_user_id, resource_name, 1, current_date)
    ON CONFLICT (user_id, resource_type)
    DO UPDATE SET
        usage_count = CASE
            WHEN user_usage_tracking.last_reset_date < date_trunc('month', current_date) THEN 1
            ELSE user_usage_tracking.usage_count + 1
        END,
        last_reset_date = CASE
            WHEN user_usage_tracking.last_reset_date < date_trunc('month', current_date) THEN current_date
            ELSE user_usage_tracking.last_reset_date
        END,
        updated_at = NOW()
    RETURNING usage_count INTO new_usage_count;

    RETURN new_usage_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check feature access
CREATE OR REPLACE FUNCTION can_access_feature(check_user_id TEXT, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_premium BOOLEAN;
    feature_config RECORD;
    current_usage INTEGER;
BEGIN
    -- Get premium status
    is_premium := is_premium_user(check_user_id);

    -- Get feature configuration
    SELECT * INTO feature_config
    FROM feature_access_control
    WHERE feature_access_control.feature_name = can_access_feature.feature_name
    AND is_active = true;

    -- If feature not found, deny access
    IF feature_config IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check premium access
    IF is_premium AND feature_config.premium_tier_enabled THEN
        -- Premium users get unlimited access (unless specifically limited)
        IF feature_config.premium_tier_limit = -1 THEN
            RETURN TRUE;
        END IF;

        -- Check premium limits
        current_usage := get_user_usage(check_user_id, feature_name);
        RETURN current_usage < feature_config.premium_tier_limit;
    END IF;

    -- Check free tier access
    IF feature_config.free_tier_enabled THEN
        -- Unlimited free access
        IF feature_config.free_tier_limit = -1 THEN
            RETURN TRUE;
        END IF;

        -- Check free tier limits
        current_usage := get_user_usage(check_user_id, feature_name);
        RETURN current_usage < feature_config.free_tier_limit;
    END IF;

    -- Default deny
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 11. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Apply existing update trigger to new tables
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_usage_tracking_updated_at BEFORE UPDATE ON user_usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_access_control_updated_at BEFORE UPDATE ON feature_access_control FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_history_updated_at BEFORE UPDATE ON billing_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 12. INITIAL DATA SETUP
-- =============================================

-- Create initial subscription for anonymous user (free tier)
INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
VALUES ('anonymous', 'free', 'active', NOW(), NULL)
ON CONFLICT (user_id) DO UPDATE SET
    plan_id = COALESCE(user_subscriptions.plan_id, 'free'),
    status = COALESCE(user_subscriptions.status, 'active');

-- Initialize usage tracking for anonymous user
INSERT INTO user_usage_tracking (user_id, resource_type, usage_count, monthly_limit)
VALUES
    ('anonymous', 'custom_workouts', 0, 3),
    ('anonymous', 'workout_sharing', 0, 0),
    ('anonymous', 'data_exports', 0, 0),
    ('anonymous', 'ai_suggestions', 0, 0)
ON CONFLICT (user_id, resource_type) DO NOTHING;

-- =============================================
-- SUBSCRIPTION MANAGEMENT SETUP COMPLETE!
-- =============================================
-- Features enabled:
-- ✅ Comprehensive subscription management
-- ✅ Stripe integration ready
-- ✅ Feature access control system
-- ✅ Usage tracking and limits
-- ✅ Premium vs Free tier enforcement
-- ✅ Billing history tracking
-- ✅ Trial period support
-- ✅ Automatic usage reset
-- ✅ Real-time permission checking
-- =============================================