-- =============================================
-- Lukasito Training Master AI - Database Schema
-- =============================================
-- Complete database setup for the enhanced fitness tracking app
-- with gamification, multiple programs, and advanced features

-- =============================================
-- 1. TRAINING PROGRAMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS training_programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[],
    is_premium BOOLEAN DEFAULT false,
    workout_structure JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_programs_difficulty ON training_programs(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_training_programs_premium ON training_programs(is_premium);

-- =============================================
-- 2. USER PROGRESS TABLE (Levels, XP, Programs)
-- =============================================
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    current_level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    current_program_id TEXT REFERENCES training_programs(id),
    current_week INTEGER DEFAULT 1,
    programs_completed TEXT[] DEFAULT '{}',
    achievements_unlocked TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(current_level);

-- =============================================
-- 3. USER GAMIFICATION TABLE (Streaks, Badges, Stats)
-- =============================================
CREATE TABLE IF NOT EXISTS user_gamification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_workouts INTEGER DEFAULT 0,
    total_nutrition_goals INTEGER DEFAULT 0,
    badges_earned TEXT[] DEFAULT '{}',
    current_challenges JSONB DEFAULT '[]',
    weekly_stats JSONB DEFAULT '{"workouts_completed": 0, "nutrition_goals_hit": 0, "consistency_percentage": 0, "xp_earned": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_streak ON user_gamification(current_streak);

-- =============================================
-- 4. ACHIEVEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    badge_icon TEXT,
    xp_reward INTEGER DEFAULT 0,
    unlock_criteria JSONB NOT NULL,
    rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);

-- =============================================
-- 5. ENHANCED USER PREFERENCES TABLE
-- =============================================
-- Update the existing user_preferences table to support new features
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS current_program_id TEXT REFERENCES training_programs(id);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS exercise_set_data JSONB DEFAULT '{}';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS workout_sessions JSONB DEFAULT '{}';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS set_tracking_preferences JSONB DEFAULT '{
    "trackSets": true,
    "trackReps": true,
    "trackWeight": true,
    "trackRPE": false,
    "trackRestTime": true,
    "autoAdvanceAfterSet": true,
    "soundEnabled": true,
    "vibrationEnabled": false,
    "guidedWorkoutMode": false,
    "showPersonalBests": true,
    "defaultRestTime": 120
}';

-- =============================================
-- 6. ENHANCED COMPLETED SESSIONS TABLE
-- =============================================
-- Update the existing completed_sessions table to support enhanced features
ALTER TABLE completed_sessions ADD COLUMN IF NOT EXISTS program_id TEXT REFERENCES training_programs(id);
ALTER TABLE completed_sessions ADD COLUMN IF NOT EXISTS session_data JSONB;
ALTER TABLE completed_sessions ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_completed_sessions_program_id ON completed_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_completed_sessions_xp ON completed_sessions(xp_earned);

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_sessions ENABLE ROW LEVEL SECURITY;

-- Training programs are public (read-only)
CREATE POLICY "Training programs are viewable by everyone" ON training_programs FOR SELECT USING (true);

-- Achievements are public (read-only)
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

-- User-specific data policies using proper Supabase authentication
-- Note: For anonymous access during development, we'll allow access for user_id = 'anonymous'

-- User Progress Policies
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert anonymous progress" ON user_progress FOR INSERT TO anon
WITH CHECK (user_id = 'anonymous');

CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

-- User Gamification Policies
CREATE POLICY "Users can view own gamification" ON user_gamification FOR SELECT
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

CREATE POLICY "Users can insert own gamification" ON user_gamification FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert anonymous gamification" ON user_gamification FOR INSERT TO anon
WITH CHECK (user_id = 'anonymous');

CREATE POLICY "Users can update own gamification" ON user_gamification FOR UPDATE
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

-- User Preferences Policies
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert anonymous preferences" ON user_preferences FOR INSERT TO anon
WITH CHECK (user_id = 'anonymous');

CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

-- Completed Sessions Policies
CREATE POLICY "Users can view own sessions" ON completed_sessions FOR SELECT
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

CREATE POLICY "Users can insert own sessions" ON completed_sessions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert anonymous sessions" ON completed_sessions FOR INSERT TO anon
WITH CHECK (user_id = 'anonymous');

CREATE POLICY "Users can update own sessions" ON completed_sessions FOR UPDATE
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

CREATE POLICY "Users can delete own sessions" ON completed_sessions FOR DELETE
USING (user_id = 'anonymous' OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text));

-- =============================================
-- 8. SAMPLE DATA - TRAINING PROGRAMS
-- =============================================

INSERT INTO training_programs (id, name, description, duration_weeks, difficulty_level, tags, is_premium, workout_structure) VALUES
('foundation-builder', 'Foundation Builder', '12-week beginner program focusing on building proper form and movement patterns with ARM specialization', 12, 'beginner', ARRAY['beginner', 'strength', 'form', 'arms'], false, '{
  "phases": {
    "foundation": {
      "name": "Foundation Phase",
      "description": "Building movement patterns and base strength",
      "color": "#3B82F6",
      "weeks": [1, 2, 3, 4]
    },
    "growth": {
      "name": "Growth Phase",
      "description": "Increasing volume for muscle development",
      "color": "#10B981",
      "weeks": [5, 6, 7, 8]
    },
    "intensity": {
      "name": "Intensity Phase",
      "description": "Advanced techniques and peak strength",
      "color": "#F59E0B",
      "weeks": [9, 10, 11, 12]
    }
  },
  "workouts": {},
  "nutrition_goals": []
}'),

('power-surge-pro', 'Power Surge Pro', '16-week intermediate program for explosive power and strength gains with advanced techniques', 16, 'intermediate', ARRAY['intermediate', 'power', 'strength', 'explosive'], true, '{
  "phases": {
    "build": {
      "name": "Power Build Phase",
      "description": "Building explosive power foundation",
      "color": "#8B5CF6",
      "weeks": [1, 2, 3, 4]
    },
    "surge": {
      "name": "Strength Surge Phase",
      "description": "Increasing load capacity and raw strength",
      "color": "#EF4444",
      "weeks": [5, 6, 7, 8]
    },
    "peak": {
      "name": "Power Peak Phase",
      "description": "Maximum power output with plyometrics",
      "color": "#F97316",
      "weeks": [9, 10, 11, 12]
    },
    "elite": {
      "name": "Elite Conditioning Phase",
      "description": "Peak performance with advanced techniques",
      "color": "#DC2626",
      "weeks": [13, 14, 15, 16]
    }
  },
  "workouts": {},
  "nutrition_goals": []
}'),

('beast-mode-elite', 'Beast Mode Elite', '20-week advanced program for elite athletes seeking maximum performance and competition-prep training', 20, 'advanced', ARRAY['advanced', 'elite', 'competition', 'maximum'], true, '{
  "phases": {
    "foundation": {
      "name": "Beast Foundation Phase",
      "description": "Advanced movement preparation",
      "color": "#7C2D12",
      "weeks": [1, 2, 3, 4]
    },
    "dominance": {
      "name": "Power Dominance Phase",
      "description": "Olympic lifts and maximum power",
      "color": "#991B1B",
      "weeks": [5, 6, 7, 8]
    },
    "supremacy": {
      "name": "Strength Supremacy Phase",
      "description": "Powerlifting methodology",
      "color": "#1F2937",
      "weeks": [9, 10, 11, 12]
    },
    "warfare": {
      "name": "Hypertrophy Warfare Phase",
      "description": "Advanced muscle building techniques",
      "color": "#0F172A",
      "weeks": [13, 14, 15, 16]
    },
    "mastery": {
      "name": "Elite Mastery Phase",
      "description": "Peak performance integration",
      "color": "#000000",
      "weeks": [17, 18, 19, 20]
    }
  },
  "workouts": {},
  "nutrition_goals": []
}');

-- =============================================
-- 9. SAMPLE DATA - ACHIEVEMENTS
-- =============================================

INSERT INTO achievements (id, name, description, icon, badge_icon, xp_reward, unlock_criteria, rarity) VALUES
-- Workout Achievements
('first-workout', 'First Steps', 'Complete your first workout', '💪', '🏆', 50, '{"type": "workouts", "target": 1, "timeframe": "all_time"}', 'common'),
('workout-warrior', 'Workout Warrior', 'Complete 25 workouts', '⚔️', '🏆', 150, '{"type": "workouts", "target": 25, "timeframe": "all_time"}', 'rare'),
('strength-master', 'Strength Master', 'Complete 100 workouts', '🏋️', '🏆', 500, '{"type": "workouts", "target": 100, "timeframe": "all_time"}', 'epic'),
('fitness-legend', 'Fitness Legend', 'Complete 250 workouts', '🌟', '🏆', 1000, '{"type": "workouts", "target": 250, "timeframe": "all_time"}', 'legendary'),

-- Streak Achievements
('streak-starter', 'Streak Starter', 'Maintain a 3-day workout streak', '🔥', '🏆', 75, '{"type": "streak", "target": 3, "timeframe": "daily"}', 'common'),
('streak-warrior', 'Streak Warrior', 'Maintain a 7-day workout streak', '🔥', '🏆', 150, '{"type": "streak", "target": 7, "timeframe": "daily"}', 'rare'),
('streak-master', 'Streak Master', 'Maintain a 30-day workout streak', '🔥', '🏆', 300, '{"type": "streak", "target": 30, "timeframe": "daily"}', 'epic'),

-- Program Completion
('foundation-graduate', 'Foundation Graduate', 'Complete the Foundation Builder program', '🎓', '🏆', 500, '{"type": "program_completion", "target": 1, "timeframe": "all_time"}', 'rare'),
('power-surge-master', 'Power Surge Master', 'Complete the Power Surge Pro program', '⚡', '🏆', 750, '{"type": "program_completion", "target": 2, "timeframe": "all_time"}', 'epic'),

-- Nutrition Achievements
('nutrition-novice', 'Nutrition Novice', 'Complete 50 nutrition goals', '🥗', '🏆', 100, '{"type": "nutrition", "target": 50, "timeframe": "all_time"}', 'common'),
('nutrition-king', 'Nutrition King', 'Complete 200 nutrition goals', '👑', '🏆', 300, '{"type": "nutrition", "target": 200, "timeframe": "all_time"}', 'rare'),

-- Consistency Achievements
('consistent-performer', 'Consistent Performer', 'Maintain 80% consistency for a week', '📈', '🏆', 100, '{"type": "consistency", "target": 80, "timeframe": "weekly"}', 'common'),
('perfect-week', 'Perfect Week', 'Achieve 100% consistency for a week', '✨', '🏆', 200, '{"type": "consistency", "target": 100, "timeframe": "weekly"}', 'rare');

-- =============================================
-- 10. FUNCTIONS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_training_programs_updated_at BEFORE UPDATE ON training_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. INITIAL ANONYMOUS USER SETUP
-- =============================================

-- Create initial user progress for anonymous user
INSERT INTO user_progress (user_id, current_level, total_xp, current_program_id, current_week, programs_completed, achievements_unlocked)
VALUES ('anonymous', 1, 0, 'foundation-builder', 1, '{}', '{}')
ON CONFLICT (user_id) DO UPDATE SET
    current_program_id = COALESCE(user_progress.current_program_id, 'foundation-builder');

-- Create initial gamification data for anonymous user
INSERT INTO user_gamification (user_id, current_streak, longest_streak, total_workouts, total_nutrition_goals, badges_earned, current_challenges, weekly_stats)
VALUES ('anonymous', 0, 0, 0, 0, '{}', '[]', '{"workouts_completed": 0, "nutrition_goals_hit": 0, "consistency_percentage": 0, "xp_earned": 0}')
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- Your Lukasito Training Master AI database is ready!
--
-- Features enabled:
-- ✅ 3 Training Programs (Foundation, Power Surge Pro, Beast Mode Elite)
-- ✅ XP & Leveling System
-- ✅ 13 Achievements with different rarities
-- ✅ Streak Tracking & Gamification
-- ✅ Enhanced Workout Tracking
-- ✅ Cross-device Synchronization
-- ✅ Row Level Security
-- ✅ Anonymous user setup
--
-- Next steps:
-- 1. The app will now connect to your Supabase database
-- 2. All user progress will be saved and synchronized
-- 3. Gamification features will work across devices
-- =============================================