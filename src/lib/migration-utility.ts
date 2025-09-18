/**
 * Database Migration Utility for Multi-Program & Gamification Features
 *
 * This utility helps migrate existing fitness tracking data to support:
 * - Multiple training programs
 * - Gamification features (XP, levels, achievements, streaks)
 * - Enhanced user progress tracking
 *
 * Usage:
 * 1. Run the SQL schema from database-schema.sql in your Supabase SQL editor
 * 2. Import and call runMigration() from this utility
 * 3. Verify the migration completed successfully
 */

import { supabase, DatabaseService } from './supabase'

interface MigrationResult {
  success: boolean
  message: string
  details?: any
}

interface MigrationStatus {
  tablesCreated: boolean
  dataBackfilled: boolean
  usersMigrated: boolean
  achievementsSeeded: boolean
  programsSeeded: boolean
}

export class MigrationUtility {

  /**
   * Run complete migration process
   */
  static async runMigration(): Promise<MigrationResult> {
    try {
      console.log('🚀 Starting database migration for multi-program & gamification features...')

      const status: MigrationStatus = {
        tablesCreated: false,
        dataBackfilled: false,
        usersMigrated: false,
        achievementsSeeded: false,
        programsSeeded: false
      }

      // Step 1: Check if new tables exist
      console.log('📋 Step 1: Checking table structure...')
      status.tablesCreated = await this.checkTablesExist()

      if (!status.tablesCreated) {
        return {
          success: false,
          message: 'New database tables not found. Please run the database-schema.sql file in your Supabase SQL editor first.',
          details: status
        }
      }

      // Step 2: Seed training programs
      console.log('📚 Step 2: Seeding training programs...')
      status.programsSeeded = await this.seedTrainingPrograms()

      // Step 3: Seed achievements
      console.log('🏆 Step 3: Seeding achievements...')
      status.achievementsSeeded = await this.seedAchievements()

      // Step 4: Migrate existing users
      console.log('👥 Step 4: Migrating existing user data...')
      status.usersMigrated = await this.migrateExistingUsers()

      // Step 5: Backfill existing sessions
      console.log('💾 Step 5: Backfilling existing session data...')
      status.dataBackfilled = await this.backfillSessionData()

      console.log('✅ Migration completed successfully!')

      return {
        success: true,
        message: 'Migration completed successfully. Your database now supports multiple programs and gamification features.',
        details: status
      }

    } catch (error) {
      console.error('❌ Migration failed:', error)
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      }
    }
  }

  /**
   * Check if all required tables exist
   */
  private static async checkTablesExist(): Promise<boolean> {
    try {
      const requiredTables = ['training_programs', 'user_progress', 'user_gamification', 'achievements']

      for (const table of requiredTables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error && error.code === '42P01') { // Table doesn't exist
          console.log(`❌ Table '${table}' not found`)
          return false
        }
      }

      console.log('✅ All required tables exist')
      return true
    } catch (error) {
      console.error('Error checking tables:', error)
      return false
    }
  }

  /**
   * Seed training programs with initial data
   */
  private static async seedTrainingPrograms(): Promise<boolean> {
    try {
      // Check if programs already exist
      const { data: existingPrograms } = await supabase
        .from('training_programs')
        .select('id')

      if (existingPrograms && existingPrograms.length > 0) {
        console.log('ℹ️ Training programs already seeded')
        return true
      }

      const programs = [
        {
          id: 'foundation-builder',
          name: 'Foundation Builder',
          description: '12-week beginner program focusing on building proper form and movement patterns',
          duration_weeks: 12,
          difficulty_level: 'beginner',
          tags: ['beginner', 'strength', 'form'],
          is_premium: false,
          workout_structure: {
            phases: {
              foundation: {
                name: "Foundation Phase",
                description: "Building movement patterns and base strength",
                color: "#3B82F6",
                weeks: [1, 2, 3, 4]
              },
              growth: {
                name: "Growth Phase",
                description: "Increasing volume for muscle development",
                color: "#10B981",
                weeks: [5, 6, 7, 8]
              },
              intensity: {
                name: "Intensity Phase",
                description: "Advanced techniques and peak strength",
                color: "#F59E0B",
                weeks: [9, 10, 11, 12]
              }
            },
            workouts: {},
            nutrition_goals: []
          }
        },
        {
          id: 'power-surge-pro',
          name: 'Power Surge Pro',
          description: '12-week intermediate program for explosive power and strength gains',
          duration_weeks: 12,
          difficulty_level: 'intermediate',
          tags: ['intermediate', 'power', 'strength'],
          is_premium: false, // Unlocked for all users
          workout_structure: {
            phases: {
              build: {
                name: "Power Build Phase",
                description: "Building explosive power foundation",
                color: "#8B5CF6",
                weeks: [1, 2, 3, 4]
              },
              surge: {
                name: "Power Surge Phase",
                description: "Peak power development",
                color: "#EF4444",
                weeks: [5, 6, 7, 8]
              },
              peak: {
                name: "Peak Performance Phase",
                description: "Maximum power output",
                color: "#F97316",
                weeks: [9, 10, 11, 12]
              }
            },
            workouts: {},
            nutrition_goals: []
          }
        },
        {
          id: 'beast-mode-elite',
          name: 'Beast Mode Elite',
          description: '12-week advanced program for elite athletes seeking maximum gains',
          duration_weeks: 12,
          difficulty_level: 'advanced',
          tags: ['advanced', 'elite', 'maximum'],
          is_premium: false, // Unlocked for all users
          workout_structure: {
            phases: {
              preparation: {
                name: "Beast Preparation Phase",
                description: "Preparing for extreme training intensity",
                color: "#7C2D12",
                weeks: [1, 2, 3, 4]
              },
              unleashed: {
                name: "Beast Unleashed Phase",
                description: "Maximum intensity training",
                color: "#991B1B",
                weeks: [5, 6, 7, 8]
              },
              legendary: {
                name: "Legendary Phase",
                description: "Elite performance mastery",
                color: "#1F2937",
                weeks: [9, 10, 11, 12]
              }
            },
            workouts: {},
            nutrition_goals: []
          }
        }
      ]

      const { error } = await supabase
        .from('training_programs')
        .insert(programs)

      if (error) throw error

      console.log('✅ Training programs seeded successfully')
      return true
    } catch (error) {
      console.error('Error seeding training programs:', error)
      return false
    }
  }

  /**
   * Seed achievements with initial data
   */
  private static async seedAchievements(): Promise<boolean> {
    try {
      // Check if achievements already exist
      const { data: existingAchievements } = await supabase
        .from('achievements')
        .select('id')

      if (existingAchievements && existingAchievements.length > 0) {
        console.log('ℹ️ Achievements already seeded')
        return true
      }

      const achievements = [
        // Workout Achievements
        {
          id: 'first-workout',
          name: 'First Steps',
          description: 'Complete your first workout',
          icon: '💪',
          badge_icon: '🏆',
          xp_reward: 50,
          unlock_criteria: { type: 'workouts', target: 1, timeframe: 'all_time' },
          rarity: 'common'
        },
        {
          id: 'workout-warrior',
          name: 'Workout Warrior',
          description: 'Complete 50 workouts',
          icon: '⚔️',
          badge_icon: '🏆',
          xp_reward: 200,
          unlock_criteria: { type: 'workouts', target: 50, timeframe: 'all_time' },
          rarity: 'rare'
        },
        {
          id: 'fitness-legend',
          name: 'Fitness Legend',
          description: 'Complete 200 workouts',
          icon: '🌟',
          badge_icon: '🏆',
          xp_reward: 500,
          unlock_criteria: { type: 'workouts', target: 200, timeframe: 'all_time' },
          rarity: 'legendary'
        },
        // Streak Achievements
        {
          id: 'streak-starter',
          name: 'Streak Starter',
          description: 'Maintain a 3-day workout streak',
          icon: '🔥',
          badge_icon: '🏆',
          xp_reward: 75,
          unlock_criteria: { type: 'streak', target: 3, timeframe: 'daily' },
          rarity: 'common'
        },
        {
          id: 'streak-master',
          name: 'Streak Master',
          description: 'Maintain a 30-day workout streak',
          icon: '🔥',
          badge_icon: '🏆',
          xp_reward: 300,
          unlock_criteria: { type: 'streak', target: 30, timeframe: 'daily' },
          rarity: 'epic'
        },
        {
          id: 'unstoppable',
          name: 'Unstoppable',
          description: 'Maintain a 100-day workout streak',
          icon: '🔥',
          badge_icon: '🏆',
          xp_reward: 1000,
          unlock_criteria: { type: 'streak', target: 100, timeframe: 'daily' },
          rarity: 'legendary'
        },
        // Program Completion Achievements
        {
          id: 'foundation-graduate',
          name: 'Foundation Graduate',
          description: 'Complete the Foundation Builder program',
          icon: '🎓',
          badge_icon: '🏆',
          xp_reward: 500,
          unlock_criteria: { type: 'program_completion', target: 1, timeframe: 'all_time' },
          rarity: 'rare'
        },
        {
          id: 'power-surge-champion',
          name: 'Power Surge Champion',
          description: 'Complete the Power Surge Pro program',
          icon: '⚡',
          badge_icon: '🏆',
          xp_reward: 750,
          unlock_criteria: { type: 'program_completion', target: 1, timeframe: 'all_time' },
          rarity: 'epic'
        },
        {
          id: 'beast-mode-elite-master',
          name: 'Beast Mode Elite',
          description: 'Complete the Beast Mode Elite program',
          icon: '👑',
          badge_icon: '🏆',
          xp_reward: 1000,
          unlock_criteria: { type: 'program_completion', target: 1, timeframe: 'all_time' },
          rarity: 'legendary'
        },
        // Nutrition Achievements
        {
          id: 'nutrition-novice',
          name: 'Nutrition Novice',
          description: 'Complete 100 nutrition goals',
          icon: '🥗',
          badge_icon: '🏆',
          xp_reward: 150,
          unlock_criteria: { type: 'nutrition', target: 100, timeframe: 'all_time' },
          rarity: 'common'
        },
        {
          id: 'nutrition-master',
          name: 'Nutrition Master',
          description: 'Complete 500 nutrition goals',
          icon: '🥗',
          badge_icon: '🏆',
          xp_reward: 400,
          unlock_criteria: { type: 'nutrition', target: 500, timeframe: 'all_time' },
          rarity: 'rare'
        },
        // Consistency Achievements
        {
          id: 'consistent-performer',
          name: 'Consistent Performer',
          description: 'Maintain 90% consistency for a week',
          icon: '📈',
          badge_icon: '🏆',
          xp_reward: 100,
          unlock_criteria: { type: 'consistency', target: 90, timeframe: 'weekly' },
          rarity: 'common'
        },
        {
          id: 'perfect-week',
          name: 'Perfect Week',
          description: 'Achieve 100% consistency for a week',
          icon: '✨',
          badge_icon: '🏆',
          xp_reward: 200,
          unlock_criteria: { type: 'consistency', target: 100, timeframe: 'weekly' },
          rarity: 'rare'
        }
      ]

      const { error } = await supabase
        .from('achievements')
        .insert(achievements)

      if (error) throw error

      console.log('✅ Achievements seeded successfully')
      return true
    } catch (error) {
      console.error('Error seeding achievements:', error)
      return false
    }
  }

  /**
   * Migrate existing users to new multi-program structure
   */
  private static async migrateExistingUsers(): Promise<boolean> {
    try {
      // Get all existing users from user_preferences
      const { data: existingUsers, error } = await supabase
        .from('user_preferences')
        .select('*')

      if (error) throw error

      if (!existingUsers || existingUsers.length === 0) {
        console.log('ℹ️ No existing users found to migrate')
        return true
      }

      for (const user of existingUsers) {
        // Update user_preferences with default program if not set
        if (!user.current_program_id) {
          await supabase
            .from('user_preferences')
            .update({ current_program_id: 'foundation-builder' })
            .eq('user_id', user.user_id)
        }

        // Create user_progress record
        const { data: existingProgress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.user_id)
          .single()

        if (!existingProgress) {
          await supabase
            .from('user_progress')
            .insert({
              user_id: user.user_id,
              current_level: 1,
              total_xp: 0,
              current_program_id: user.current_program_id || 'foundation-builder',
              current_week: user.current_week || 1,
              programs_completed: [],
              achievements_unlocked: []
            })
        }

        // Create user_gamification record
        const { data: existingGamification } = await supabase
          .from('user_gamification')
          .select('*')
          .eq('user_id', user.user_id)
          .single()

        if (!existingGamification) {
          await supabase
            .from('user_gamification')
            .insert({
              user_id: user.user_id,
              current_streak: 0,
              longest_streak: 0,
              total_workouts: 0,
              total_nutrition_goals: 0,
              badges_earned: [],
              current_challenges: [],
              weekly_stats: {
                workouts_completed: 0,
                nutrition_goals_hit: 0,
                consistency_percentage: 0,
                xp_earned: 0
              }
            })
        }
      }

      console.log(`✅ Migrated ${existingUsers.length} existing users`)
      return true
    } catch (error) {
      console.error('Error migrating existing users:', error)
      return false
    }
  }

  /**
   * Backfill existing session data with program_id
   */
  private static async backfillSessionData(): Promise<boolean> {
    try {
      // Get all existing sessions without program_id
      const { data: sessions, error } = await supabase
        .from('completed_sessions')
        .select('*')
        .is('program_id', null)

      if (error) throw error

      if (!sessions || sessions.length === 0) {
        console.log('ℹ️ No sessions found that need backfilling')
        return true
      }

      // Update all sessions without program_id to use 'foundation-builder'
      const { error: updateError } = await supabase
        .from('completed_sessions')
        .update({
          program_id: 'foundation-builder',
          xp_earned: 50 // Retroactive XP for old sessions
        })
        .is('program_id', null)

      if (updateError) throw updateError

      console.log(`✅ Backfilled ${sessions.length} existing sessions`)
      return true
    } catch (error) {
      console.error('Error backfilling session data:', error)
      return false
    }
  }

  /**
   * Verify migration completed successfully
   */
  static async verifyMigration(): Promise<MigrationResult> {
    try {
      console.log('🔍 Verifying migration...')

      // Check data counts
      const [programsCount, achievementsCount, usersCount] = await Promise.all([
        supabase.from('training_programs').select('*', { count: 'exact', head: true }),
        supabase.from('achievements').select('*', { count: 'exact', head: true }),
        supabase.from('user_progress').select('*', { count: 'exact', head: true })
      ])

      const verification = {
        training_programs: programsCount.count || 0,
        achievements: achievementsCount.count || 0,
        users_migrated: usersCount.count || 0
      }

      console.log('📊 Migration verification results:', verification)

      return {
        success: true,
        message: 'Migration verification completed',
        details: verification
      }
    } catch (error) {
      return {
        success: false,
        message: `Migration verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      }
    }
  }

  /**
   * Rollback migration (use with caution)
   */
  static async rollbackMigration(): Promise<MigrationResult> {
    try {
      console.log('⚠️ WARNING: Rolling back migration...')

      // This is a destructive operation - use with caution
      const tables = ['user_gamification', 'user_progress', 'achievements', 'training_programs']

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 'never-matches') // Delete all rows

        if (error && error.code !== '42P01') { // Ignore table not found
          console.error(`Error clearing ${table}:`, error)
        }
      }

      // Reset user_preferences program_id to null
      await supabase
        .from('user_preferences')
        .update({ current_program_id: null })
        .not('user_id', 'is', null)

      // Reset completed_sessions program_id to null
      await supabase
        .from('completed_sessions')
        .update({ program_id: null, xp_earned: 0 })
        .not('id', 'is', null)

      console.log('✅ Migration rollback completed')

      return {
        success: true,
        message: 'Migration rolled back successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      }
    }
  }
}

// Export migration functions for easy use
export const { runMigration, verifyMigration, rollbackMigration } = MigrationUtility