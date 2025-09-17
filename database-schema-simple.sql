-- =============================================
-- Lukasito Training Master AI - Simplified Schema
-- =============================================
-- Minimal database setup for immediate use

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

-- =============================================
-- 2. USER PROGRESS TABLE
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

-- =============================================
-- 3. USER GAMIFICATION TABLE
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

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Public data policies
CREATE POLICY "Training programs are public" ON training_programs FOR SELECT USING (true);
CREATE POLICY "Achievements are public" ON achievements FOR SELECT USING (true);

-- Allow anonymous access (for development without auth)
CREATE POLICY "Allow anonymous progress" ON user_progress FOR ALL USING (user_id = 'anonymous');
CREATE POLICY "Allow anonymous gamification" ON user_gamification FOR ALL USING (user_id = 'anonymous');

-- =============================================
-- 6. SAMPLE DATA - TRAINING PROGRAMS
-- =============================================
INSERT INTO training_programs (id, name, description, duration_weeks, difficulty_level, tags, is_premium, workout_structure) VALUES
('foundation-builder', 'Foundation Builder', '12-week beginner program focusing on building proper form and movement patterns with ARM specialization', 12, 'beginner', ARRAY['beginner', 'strength', 'form', 'arms'], false, '{
  "phases": {
    "foundation": {"name": "Foundation Phase", "description": "Building movement patterns and base strength", "color": "#3B82F6", "weeks": [1, 2, 3, 4]},
    "growth": {"name": "Growth Phase", "description": "Increasing volume for muscle development", "color": "#10B981", "weeks": [5, 6, 7, 8]},
    "intensity": {"name": "Intensity Phase", "description": "Advanced techniques and peak strength", "color": "#F59E0B", "weeks": [9, 10, 11, 12]}
  },
  "workouts": {},
  "nutrition_goals": []
}'),
('power-surge-pro', 'Power Surge Pro', '16-week intermediate program for explosive power and strength gains with advanced techniques', 16, 'intermediate', ARRAY['intermediate', 'power', 'strength', 'explosive'], true, '{
  "phases": {
    "build": {"name": "Power Build Phase", "description": "Building explosive power foundation", "color": "#8B5CF6", "weeks": [1, 2, 3, 4]},
    "surge": {"name": "Strength Surge Phase", "description": "Increasing load capacity and raw strength", "color": "#EF4444", "weeks": [5, 6, 7, 8]},
    "peak": {"name": "Power Peak Phase", "description": "Maximum power output with plyometrics", "color": "#F97316", "weeks": [9, 10, 11, 12]},
    "elite": {"name": "Elite Conditioning Phase", "description": "Peak performance with advanced techniques", "color": "#DC2626", "weeks": [13, 14, 15, 16]}
  },
  "workouts": {},
  "nutrition_goals": []
}'),
('beast-mode-elite', 'Beast Mode Elite', '20-week advanced program for elite athletes seeking maximum performance and competition-prep training', 20, 'advanced', ARRAY['advanced', 'elite', 'competition', 'maximum'], true, '{
  "phases": {
    "foundation": {"name": "Beast Foundation Phase", "description": "Advanced movement preparation", "color": "#7C2D12", "weeks": [1, 2, 3, 4]},
    "dominance": {"name": "Power Dominance Phase", "description": "Olympic lifts and maximum power", "color": "#991B1B", "weeks": [5, 6, 7, 8]},
    "supremacy": {"name": "Strength Supremacy Phase", "description": "Powerlifting methodology", "color": "#1F2937", "weeks": [9, 10, 11, 12]},
    "warfare": {"name": "Hypertrophy Warfare Phase", "description": "Advanced muscle building techniques", "color": "#0F172A", "weeks": [13, 14, 15, 16]},
    "mastery": {"name": "Elite Mastery Phase", "description": "Peak performance integration", "color": "#000000", "weeks": [17, 18, 19, 20]}
  },
  "workouts": {},
  "nutrition_goals": []
}');

-- =============================================
-- 7. SAMPLE DATA - ACHIEVEMENTS
-- =============================================
INSERT INTO achievements (id, name, description, icon, badge_icon, xp_reward, unlock_criteria, rarity) VALUES
('first-workout', 'First Steps', 'Complete your first workout', '💪', '🏆', 50, '{"type": "workouts", "target": 1, "timeframe": "all_time"}', 'common'),
('workout-warrior', 'Workout Warrior', 'Complete 25 workouts', '⚔️', '🏆', 150, '{"type": "workouts", "target": 25, "timeframe": "all_time"}', 'rare'),
('strength-master', 'Strength Master', 'Complete 100 workouts', '🏋️', '🏆', 500, '{"type": "workouts", "target": 100, "timeframe": "all_time"}', 'epic'),
('streak-starter', 'Streak Starter', 'Maintain a 3-day workout streak', '🔥', '🏆', 75, '{"type": "streak", "target": 3, "timeframe": "daily"}', 'common'),
('foundation-graduate', 'Foundation Graduate', 'Complete the Foundation Builder program', '🎓', '🏆', 500, '{"type": "program_completion", "target": 1, "timeframe": "all_time"}', 'rare'),
('nutrition-novice', 'Nutrition Novice', 'Complete 50 nutrition goals', '🥗', '🏆', 100, '{"type": "nutrition", "target": 50, "timeframe": "all_time"}', 'common');

-- =============================================
-- 8. INITIAL ANONYMOUS USER SETUP
-- =============================================
INSERT INTO user_progress (user_id, current_level, total_xp, current_program_id, current_week, programs_completed, achievements_unlocked)
VALUES ('anonymous', 1, 0, 'foundation-builder', 1, '{}', '{}')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_gamification (user_id, current_streak, longest_streak, total_workouts, total_nutrition_goals, badges_earned, current_challenges, weekly_stats)
VALUES ('anonymous', 0, 0, 0, 0, '{}', '[]', '{"workouts_completed": 0, "nutrition_goals_hit": 0, "consistency_percentage": 0, "xp_earned": 0}')
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- SIMPLIFIED SETUP COMPLETE!
-- =============================================