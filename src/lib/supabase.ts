import { createClient } from '@supabase/supabase-js'
import {
  EnhancedCompletedSession,
  EnhancedUserPreferences,
  WorkoutSessionData,
  ExerciseSetTracking,
  SetData,
  SetTrackingPreferences,
  DEFAULT_SET_TRACKING_PREFERENCES,
  XP_REWARDS
} from '../types/SetTracking'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://nxrwlczrwkludybkknrk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cndsY3pyd2tsdWR5YmtrbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwOTczODAsImV4cCI6MjA3MzY3MzM4MH0.8O_6sNy8fJpipVBo51E0YhxFHh4O7Kwvld1tH6bVPbg'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey?.length)
console.log('Supabase Key preview:', supabaseAnonKey?.substring(0, 20) + '...')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Validate key format (JWT should have 3 parts separated by dots)
if (supabaseAnonKey.split('.').length !== 3) {
  throw new Error('Invalid Supabase API key format')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Training Program Types
export interface TrainingProgram {
  id: string
  name: string
  description: string
  duration_weeks: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  is_premium: boolean
  workout_structure: WorkoutStructure
  created_at?: string
  updated_at?: string
}

export interface WorkoutStructure {
  phases: {
    [phaseName: string]: {
      name: string
      description: string
      color: string
      weeks: number[]
    }
  }
  workouts: {
    [dayName: string]: {
      color: string
      exercises: {
        [phaseName: string]: Exercise[]
      }
    }
  }
  nutrition_goals: NutritionGoal[]
}

export interface Exercise {
  name: string
  sets: string
  rest: string
  notes: string
  demo: string
}

export interface NutritionGoal {
  name: string
  icon: string
  category: 'protein' | 'hydration' | 'micronutrients' | 'fats' | 'carbs' | 'supplements'
}

// User Progress & Gamification Types
export interface UserProgress {
  id?: string
  user_id?: string
  current_level: number
  total_xp: number
  current_program_id: string
  current_week: number
  programs_completed: string[]
  achievements_unlocked: string[]
  created_at?: string
  updated_at?: string
}

export interface UserGameification {
  id?: string
  user_id?: string
  current_streak: number
  longest_streak: number
  total_workouts: number
  total_nutrition_goals: number
  badges_earned: string[]
  current_challenges: Challenge[]
  weekly_stats: WeeklyStats
  created_at?: string
  updated_at?: string
}

export interface Challenge {
  id: string
  name: string
  description: string
  type: 'workout' | 'nutrition' | 'streak' | 'consistency'
  target_value: number
  current_value: number
  xp_reward: number
  badge_reward?: string
  expires_at?: string
}

export interface WeeklyStats {
  workouts_completed: number
  nutrition_goals_hit: number
  consistency_percentage: number
  xp_earned: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  badge_icon?: string
  xp_reward: number
  unlock_criteria: {
    type: 'workouts' | 'streak' | 'program_completion' | 'nutrition' | 'consistency'
    target: number
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time'
  }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// Legacy interfaces (maintained for backward compatibility)
export interface CompletedSession {
  id?: string
  user_id?: string
  session_date?: string
  session_time?: string
  week: number
  phase: string
  day_name: string
  program_id?: string  // New field for multi-program support
  exercises: any[]
  nutrition: any[]
  exercises_completed: number
  total_exercises: number
  nutrition_completed: number
  total_nutrition: number
  xp_earned?: number    // New field for gamification
  created_at?: string
  updated_at?: string
}

export interface UserPreferences {
  id?: string
  user_id?: string
  current_week: number
  completed_exercises: Record<string, boolean>
  exercise_weights: Record<string, number>
  nutrition_goals: Record<string, boolean>
  current_program_id?: string  // New field for multi-program support
  created_at?: string
  updated_at?: string
}

// Database operations
export class DatabaseService {
  private static userId = 'anonymous'

  // ===== LEGACY METHODS (maintained for backward compatibility) =====

  // Save completed session
  static async saveSession(sessionData: Omit<CompletedSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('completed_sessions')
        .insert({
          user_id: this.userId,
          ...sessionData
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.warn('Database save failed, using localStorage fallback:', error)
      // Fallback to localStorage
      const sessionWithId = {
        id: `session_${Date.now()}`,
        user_id: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...sessionData
      }

      const existingSessions = JSON.parse(localStorage.getItem('completed_sessions') || '[]')
      existingSessions.unshift(sessionWithId)
      localStorage.setItem('completed_sessions', JSON.stringify(existingSessions))

      return sessionWithId
    }
  }

  // Get all completed sessions
  static async getSessions(): Promise<CompletedSession[]> {
    try {
      const { data, error } = await supabase
        .from('completed_sessions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('Database fetch failed, using localStorage fallback:', error)
      // Fallback to localStorage
      const sessions = JSON.parse(localStorage.getItem('completed_sessions') || '[]')
      return sessions.filter((session: CompletedSession) => session.user_id === this.userId)
    }
  }

  // Save user preferences (current state)
  static async savePreferences(preferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      // First, try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .select()
        .single()

      // If update succeeded, return the data
      if (updateData && !updateError) {
        return updateData;
      }

      // If no row exists (PGRST116 error), insert new record
      if (updateError && updateError.code === 'PGRST116') {
        const { data: insertData, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: this.userId,
            ...preferences
          })
          .select()
          .single()

        if (insertError) {
          throw insertError;
        }

        return insertData;
      }

      // If there was a different error, throw it
      if (updateError) {
        throw updateError;
      }

      return updateData;
    } catch (error) {
      console.warn('Database preferences save failed, using localStorage fallback:', error)
      // Fallback to localStorage
      const preferencesWithId = {
        id: `prefs_${this.userId}`,
        user_id: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...preferences
      }

      localStorage.setItem(`user_preferences_${this.userId}`, JSON.stringify(preferencesWithId))
      return preferencesWithId
    }
  }

  // Get user preferences
  static async getPreferences(): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found, return default
          return {
            current_week: 1,
            completed_exercises: {},
            exercise_weights: {},
            nutrition_goals: {}
          }
        }
        throw error
      }

      return data
    } catch (error) {
      console.warn('Database preferences fetch failed, using localStorage fallback:', error)
      // Fallback to localStorage
      const stored = localStorage.getItem(`user_preferences_${this.userId}`)
      if (stored) {
        return JSON.parse(stored)
      }

      // Return default preferences
      return {
        current_week: 1,
        completed_exercises: {},
        exercise_weights: {},
        nutrition_goals: {}
      }
    }
  }

  // Delete a session
  static async deleteSession(sessionId: string) {
    const { error } = await supabase
      .from('completed_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', this.userId)

    if (error) throw error
  }

  // ===== ENHANCED SET TRACKING METHODS =====

  // Save enhanced session with detailed set tracking
  static async saveEnhancedSession(sessionData: EnhancedCompletedSession) {
    const { data, error } = await supabase
      .from('enhanced_sessions')
      .insert({
        user_id: this.userId,
        ...sessionData
      })
      .select()
      .single()

    if (error) {
      // Fallback to regular session table if enhanced table doesn't exist
      console.warn('Enhanced sessions table not available, using regular sessions:', error)
      return this.saveSession(sessionData)
    }

    return data
  }

  // Get enhanced sessions with set tracking data
  static async getEnhancedSessions(): Promise<EnhancedCompletedSession[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_sessions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Enhanced sessions not available, falling back to regular sessions:', error)
        return this.getSessions()
      }

      return data || []
    } catch (error) {
      console.warn('Enhanced sessions error, using fallback:', error)
      return this.getSessions()
    }
  }

  // Save enhanced user preferences with set tracking data
  static async saveEnhancedPreferences(preferences: Omit<EnhancedUserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      // First, try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('enhanced_user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .select()
        .single()

      // If update succeeded, return the data
      if (updateData && !updateError) {
        return updateData;
      }

      // If no row exists (PGRST116 error), insert new record
      if (updateError && updateError.code === 'PGRST116') {
        const { data: insertData, error: insertError } = await supabase
          .from('enhanced_user_preferences')
          .insert({
            user_id: this.userId,
            ...preferences
          })
          .select()
          .single()

        if (insertError) {
          throw insertError;
        }

        return insertData;
      }

      // If there was a different error, throw it
      if (updateError) {
        throw updateError;
      }

      return updateData;
    } catch (error) {
      // Fallback to regular preferences if enhanced table doesn't exist
      console.warn('Enhanced preferences not available, using regular preferences:', error)
      return this.savePreferences({
        current_week: preferences.current_week,
        completed_exercises: preferences.completed_exercises,
        exercise_weights: preferences.exercise_weights,
        nutrition_goals: preferences.nutrition_goals,
        current_program_id: preferences.current_program_id
      })
    }
  }

  // Get enhanced user preferences with set tracking data
  static async getEnhancedPreferences(): Promise<EnhancedUserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('enhanced_user_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found, return default enhanced preferences
          return {
            current_week: 1,
            current_program_id: 'foundation-builder',
            completed_exercises: {},
            exercise_weights: {},
            nutrition_goals: {},
            exercise_set_data: {},
            workout_sessions: {},
            set_tracking_preferences: DEFAULT_SET_TRACKING_PREFERENCES
          }
        }
        // Fallback to regular preferences
        console.warn('Enhanced preferences not available, using regular preferences:', error)
        const regularPrefs = await this.getPreferences()
        if (regularPrefs) {
          return {
            ...regularPrefs,
            exercise_set_data: {},
            workout_sessions: {},
            set_tracking_preferences: DEFAULT_SET_TRACKING_PREFERENCES
          }
        }
        return null
      }

      return data
    } catch (error) {
      console.warn('Enhanced preferences error, using fallback:', error)
      const regularPrefs = await this.getPreferences()
      if (regularPrefs) {
        return {
          ...regularPrefs,
          exercise_set_data: {},
          workout_sessions: {},
          set_tracking_preferences: DEFAULT_SET_TRACKING_PREFERENCES
        }
      }
      return null
    }
  }

  // Save individual set data
  static async saveSetData(exerciseId: string, setData: SetData) {
    const enhancedPrefs = await this.getEnhancedPreferences()
    if (!enhancedPrefs) return

    const updatedSetData = {
      ...enhancedPrefs.exercise_set_data,
      [exerciseId]: {
        ...enhancedPrefs.exercise_set_data[exerciseId],
        sets: enhancedPrefs.exercise_set_data[exerciseId]?.sets.map(set =>
          set.id === setData.id ? setData : set
        ) || [setData]
      }
    }

    return this.saveEnhancedPreferences({
      ...enhancedPrefs,
      exercise_set_data: updatedSetData
    })
  }

  // Save exercise set tracking data
  static async saveExerciseSetTracking(exerciseSetTracking: ExerciseSetTracking) {
    const enhancedPrefs = await this.getEnhancedPreferences()
    if (!enhancedPrefs) return

    const updatedSetData = {
      ...enhancedPrefs.exercise_set_data,
      [exerciseSetTracking.exerciseId]: exerciseSetTracking
    }

    return this.saveEnhancedPreferences({
      ...enhancedPrefs,
      exercise_set_data: updatedSetData
    })
  }

  // Get exercise set tracking data
  static async getExerciseSetTracking(exerciseId: string): Promise<ExerciseSetTracking | null> {
    const enhancedPrefs = await this.getEnhancedPreferences()
    return enhancedPrefs?.exercise_set_data[exerciseId] || null
  }

  // Save workout session data
  static async saveWorkoutSession(sessionData: WorkoutSessionData) {
    const enhancedPrefs = await this.getEnhancedPreferences()
    if (!enhancedPrefs) return

    const updatedSessions = {
      ...enhancedPrefs.workout_sessions,
      [sessionData.id]: sessionData
    }

    return this.saveEnhancedPreferences({
      ...enhancedPrefs,
      workout_sessions: updatedSessions
    })
  }

  // Get workout session data
  static async getWorkoutSession(sessionId: string): Promise<WorkoutSessionData | null> {
    const enhancedPrefs = await this.getEnhancedPreferences()
    return enhancedPrefs?.workout_sessions[sessionId] || null
  }

  // Save set tracking preferences
  static async saveSetTrackingPreferences(preferences: SetTrackingPreferences) {
    const enhancedPrefs = await this.getEnhancedPreferences()
    if (!enhancedPrefs) return

    return this.saveEnhancedPreferences({
      ...enhancedPrefs,
      set_tracking_preferences: preferences
    })
  }

  // Get set tracking preferences
  static async getSetTrackingPreferences(): Promise<SetTrackingPreferences> {
    const enhancedPrefs = await this.getEnhancedPreferences()
    return enhancedPrefs?.set_tracking_preferences || DEFAULT_SET_TRACKING_PREFERENCES
  }

  // Initialize exercise set tracking for a workout
  static async initializeExerciseSetTracking(dayName: string, exerciseIndex: number, exercise: any, week: number): Promise<ExerciseSetTracking> {
    const exerciseId = `${dayName}-${exerciseIndex}-week${week}`

    // Check if tracking already exists
    const existing = await this.getExerciseSetTracking(exerciseId)
    if (existing) return existing

    // Parse sets count and target reps
    const setsCount = parseInt(exercise.sets.split('x')[0].trim()) || 4
    const targetReps = exercise.sets.match(/x\s*(\d+(?:-\d+)?)/)?.[1] || '8-10'

    // Parse rest time
    const parseRestTime = (restString: string): number => {
      if (restString === "N/A") return 0
      const match = restString.match(/(\d+(?:\.\d+)?)\s*(min|sec)/i)
      if (!match) return 90
      const value = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      return unit === 'min' ? value * 60 : value
    }

    const restTime = parseRestTime(exercise.rest)

    // Create set data
    const sets: SetData[] = Array.from({ length: setsCount }, (_, setIndex) => ({
      id: `${exerciseId}-set${setIndex + 1}`,
      setNumber: setIndex + 1,
      weight: 0,
      targetReps,
      completed: false
    }))

    const exerciseSetTracking: ExerciseSetTracking = {
      exerciseId,
      exerciseName: exercise.name,
      totalSets: setsCount,
      targetRestTime: restTime,
      sets,
      currentSet: 1,
      completed: false
    }

    await this.saveExerciseSetTracking(exerciseSetTracking)
    return exerciseSetTracking
  }

  // ===== NEW METHODS FOR MULTI-PROGRAM & GAMIFICATION SUPPORT =====

  // Data Migration Helper - ensures existing users get default program
  static async ensureUserMigration(): Promise<void> {
    try {
      const preferences = await this.getPreferences()
      const progress = await this.getUserProgress()

      // If user has preferences but no current_program_id, migrate to foundation-builder
      if (preferences && !preferences.current_program_id) {
        await this.savePreferences({
          ...preferences,
          current_program_id: 'foundation-builder'
        })
      }

      // If user has no progress record, create default
      if (!progress || !progress.current_program_id) {
        await this.saveUserProgress({
          current_level: 1,
          total_xp: 0,
          current_program_id: 'foundation-builder',
          current_week: preferences?.current_week || 1,
          programs_completed: [],
          achievements_unlocked: []
        })
      }

      // Ensure gamification data exists
      const gamification = await this.getUserGameification()
      if (!gamification) {
        await this.saveUserGameification({
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
    } catch (error) {
      console.warn('Migration check failed:', error)
    }
  }

  // Training Programs
  static async getAvailablePrograms(): Promise<TrainingProgram[]> {
    try {
      const { data, error } = await supabase
        .from('training_programs')
        .select('*')
        .order('difficulty_level', { ascending: true })

      if (error) {
        console.warn('Could not fetch programs from database, using fallback:', error)
        // Fallback to hardcoded programs if table doesn't exist yet
        return this.getFallbackPrograms()
      }
      return data || this.getFallbackPrograms()
    } catch (error) {
      console.warn('Database error, using fallback programs:', error)
      return this.getFallbackPrograms()
    }
  }

  // Fallback programs for development/migration
  private static getFallbackPrograms(): TrainingProgram[] {
    return [
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
        is_premium: true,
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
        is_premium: true,
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
  }

  static async getProgram(programId: string): Promise<TrainingProgram | null> {
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .eq('id', programId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  // User Progress
  static async getUserProgress(): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', this.userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No progress found, return default
        return {
          current_level: 1,
          total_xp: 0,
          current_program_id: '',
          current_week: 1,
          programs_completed: [],
          achievements_unlocked: []
        }
      }
      throw error
    }

    return data
  }

  static async saveUserProgress(progress: Omit<UserProgress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data: updateData, error: updateError } = await supabase
      .from('user_progress')
      .update({
        ...progress,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId)
      .select()
      .single()

    if (updateData && !updateError) {
      return updateData
    }

    if (updateError && updateError.code === 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: this.userId,
          ...progress
        })
        .select()
        .single()

      if (insertError) throw insertError
      return insertData
    }

    if (updateError) throw updateError
    return updateData
  }

  // Gamification
  static async getUserGameification(): Promise<UserGameification | null> {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', this.userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No gamification data found, return default
        return {
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
        }
      }
      throw error
    }

    return data
  }

  static async saveUserGameification(gamification: Omit<UserGameification, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data: updateData, error: updateError } = await supabase
      .from('user_gamification')
      .update({
        ...gamification,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId)
      .select()
      .single()

    if (updateData && !updateError) {
      return updateData
    }

    if (updateError && updateError.code === 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('user_gamification')
        .insert({
          user_id: this.userId,
          ...gamification
        })
        .select()
        .single()

      if (insertError) throw insertError
      return insertData
    }

    if (updateError) throw updateError
    return updateData
  }

  // Achievements
  static async getAvailableAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('rarity', { ascending: true })

      if (error) {
        console.warn('Could not fetch achievements from database, using fallback:', error)
        return this.getFallbackAchievements()
      }
      return data || this.getFallbackAchievements()
    } catch (error) {
      console.warn('Database error, using fallback achievements:', error)
      return this.getFallbackAchievements()
    }
  }

  // Fallback achievements for development/migration
  private static getFallbackAchievements(): Achievement[] {
    return [
      // Workout Achievements
      {
        id: 'first-workout',
        name: 'First Steps',
        description: 'Complete your first workout',
        icon: '💪',
        badge_icon: '🏆',
        xp_reward: 50,
        unlock_criteria: {
          type: 'workouts',
          target: 1,
          timeframe: 'all_time'
        },
        rarity: 'common'
      },
      {
        id: 'workout-warrior',
        name: 'Workout Warrior',
        description: 'Complete 50 workouts',
        icon: '⚔️',
        badge_icon: '🏆',
        xp_reward: 200,
        unlock_criteria: {
          type: 'workouts',
          target: 50,
          timeframe: 'all_time'
        },
        rarity: 'rare'
      },
      {
        id: 'fitness-legend',
        name: 'Fitness Legend',
        description: 'Complete 200 workouts',
        icon: '🌟',
        badge_icon: '🏆',
        xp_reward: 500,
        unlock_criteria: {
          type: 'workouts',
          target: 200,
          timeframe: 'all_time'
        },
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
        unlock_criteria: {
          type: 'streak',
          target: 3,
          timeframe: 'daily'
        },
        rarity: 'common'
      },
      {
        id: 'streak-master',
        name: 'Streak Master',
        description: 'Maintain a 30-day workout streak',
        icon: '🔥',
        badge_icon: '🏆',
        xp_reward: 300,
        unlock_criteria: {
          type: 'streak',
          target: 30,
          timeframe: 'daily'
        },
        rarity: 'epic'
      },
      // Program Completion Achievements
      {
        id: 'foundation-graduate',
        name: 'Foundation Graduate',
        description: 'Complete the Foundation Builder program',
        icon: '🎓',
        badge_icon: '🏆',
        xp_reward: 500,
        unlock_criteria: {
          type: 'program_completion',
          target: 1,
          timeframe: 'all_time'
        },
        rarity: 'rare'
      },
      // Nutrition Achievements
      {
        id: 'nutrition-novice',
        name: 'Nutrition Novice',
        description: 'Complete 100 nutrition goals',
        icon: '🥗',
        badge_icon: '🏆',
        xp_reward: 150,
        unlock_criteria: {
          type: 'nutrition',
          target: 100,
          timeframe: 'all_time'
        },
        rarity: 'common'
      },
      // Consistency Achievements
      {
        id: 'consistent-performer',
        name: 'Consistent Performer',
        description: 'Maintain 90% consistency for a week',
        icon: '📈',
        badge_icon: '🏆',
        xp_reward: 100,
        unlock_criteria: {
          type: 'consistency',
          target: 90,
          timeframe: 'weekly'
        },
        rarity: 'common'
      },
      {
        id: 'perfect-week',
        name: 'Perfect Week',
        description: 'Achieve 100% consistency for a week',
        icon: '✨',
        badge_icon: '🏆',
        xp_reward: 200,
        unlock_criteria: {
          type: 'consistency',
          target: 100,
          timeframe: 'weekly'
        },
        rarity: 'rare'
      }
    ]
  }

  // XP and Level Management
  static async addXP(xpAmount: number, source: string): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress()
    if (!currentProgress) {
      throw new Error('No user progress found')
    }

    const newTotalXP = currentProgress.total_xp + xpAmount
    const newLevel = this.calculateLevel(newTotalXP)

    const updatedProgress = {
      ...currentProgress,
      total_xp: newTotalXP,
      current_level: newLevel
    }

    // Also update gamification stats
    const gamificationData = await this.getUserGameification()
    if (gamificationData) {
      const updatedGamification = {
        ...gamificationData,
        weekly_stats: {
          ...gamificationData.weekly_stats,
          xp_earned: gamificationData.weekly_stats.xp_earned + xpAmount
        }
      }
      await this.saveUserGameification(updatedGamification)
    }

    return await this.saveUserProgress(updatedProgress)
  }

  // Helper Methods
  static calculateLevel(totalXP: number): number {
    // XP formula: Level = floor(sqrt(totalXP / 100)) + 1
    // This means: Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, etc.
    return Math.floor(Math.sqrt(totalXP / 100)) + 1
  }

  static getXPForNextLevel(currentLevel: number): number {
    // XP needed for next level = (level^2) * 100
    return Math.pow(currentLevel, 2) * 100
  }

  static getCurrentLevelProgress(totalXP: number): { currentLevelXP: number; nextLevelXP: number; progress: number } {
    const currentLevel = this.calculateLevel(totalXP)
    const currentLevelStartXP = Math.pow(currentLevel - 1, 2) * 100
    const nextLevelXP = this.getXPForNextLevel(currentLevel)
    const currentLevelXP = totalXP - currentLevelStartXP
    const xpNeededForNextLevel = nextLevelXP - currentLevelStartXP
    const progress = Math.min(100, (currentLevelXP / xpNeededForNextLevel) * 100)

    return {
      currentLevelXP,
      nextLevelXP: xpNeededForNextLevel,
      progress
    }
  }

  // Program Selection and Migration
  static async switchProgram(newProgramId: string): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress()
    if (!currentProgress) {
      throw new Error('No user progress found')
    }

    const updatedProgress = {
      ...currentProgress,
      current_program_id: newProgramId,
      current_week: 1 // Reset to week 1 for new program
    }

    return await this.saveUserProgress(updatedProgress)
  }

  // Complete Program
  static async completeProgram(programId: string): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress()
    if (!currentProgress) {
      throw new Error('No user progress found')
    }

    const completedPrograms = [...currentProgress.programs_completed]
    if (!completedPrograms.includes(programId)) {
      completedPrograms.push(programId)
    }

    // Award completion XP
    const completionXP = 1000 // Base completion XP
    const newTotalXP = currentProgress.total_xp + completionXP
    const newLevel = this.calculateLevel(newTotalXP)

    const updatedProgress = {
      ...currentProgress,
      total_xp: newTotalXP,
      current_level: newLevel,
      programs_completed: completedPrograms
    }

    // Check for program completion achievements
    await this.checkAchievements('program_completion', completedPrograms.length)

    return await this.saveUserProgress(updatedProgress)
  }

  // ===== ENHANCED GAMIFICATION METHODS =====

  // Log workout completion and update gamification data
  static async logWorkoutCompletion(exercisesCompleted: number, totalExercises: number, nutritionCompleted: number, totalNutrition: number): Promise<void> {
    try {
      const [progress, gamification] = await Promise.all([
        this.getUserProgress(),
        this.getUserGameification()
      ])

      if (!progress || !gamification) {
        console.warn('Could not find progress or gamification data')
        return
      }

      // Calculate XP based on completion percentage
      const exerciseCompletionRate = exercisesCompleted / totalExercises
      const nutritionCompletionRate = nutritionCompleted / totalNutrition
      const workoutXP = Math.floor(exerciseCompletionRate * 50) // Max 50 XP for exercises
      const nutritionXP = Math.floor(nutritionCompletionRate * 30) // Max 30 XP for nutrition
      const totalXP = workoutXP + nutritionXP

      // Update gamification stats
      const updatedGamification = {
        ...gamification,
        total_workouts: gamification.total_workouts + 1,
        total_nutrition_goals: gamification.total_nutrition_goals + nutritionCompleted,
        weekly_stats: {
          ...gamification.weekly_stats,
          workouts_completed: gamification.weekly_stats.workouts_completed + 1,
          nutrition_goals_hit: gamification.weekly_stats.nutrition_goals_hit + nutritionCompleted,
          xp_earned: gamification.weekly_stats.xp_earned + totalXP
        }
      }

      // Update streak logic (simplified - assumes daily workout)
      const today = new Date()
      const lastWorkout = await this.getLastWorkoutDate()
      let newStreak = gamification.current_streak

      if (lastWorkout) {
        const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceLastWorkout === 1) {
          newStreak += 1
        } else if (daysSinceLastWorkout > 1) {
          newStreak = 1 // Reset streak
        }
        // If daysSinceLastWorkout === 0, keep current streak (same day workout)
      } else {
        newStreak = 1 // First workout
      }

      updatedGamification.current_streak = newStreak
      updatedGamification.longest_streak = Math.max(updatedGamification.longest_streak, newStreak)

      // Save updated gamification data
      await this.saveUserGameification(updatedGamification)

      // Add XP to user progress
      await this.addXP(totalXP, 'workout_completion')

      // Check for achievements
      await Promise.all([
        this.checkAchievements('workouts', updatedGamification.total_workouts),
        this.checkAchievements('streak', newStreak),
        this.checkAchievements('nutrition', updatedGamification.total_nutrition_goals)
      ])

    } catch (error) {
      console.error('Error logging workout completion:', error)
    }
  }

  // Get last workout date from completed sessions
  private static async getLastWorkoutDate(): Promise<Date | null> {
    try {
      const sessions = await this.getSessions()
      if (sessions.length === 0) return null

      // Get the most recent session date
      const lastSession = sessions[0] // Sessions are ordered by created_at desc
      return lastSession.created_at ? new Date(lastSession.created_at) : null
    } catch (error) {
      console.error('Error getting last workout date:', error)
      return null
    }
  }

  // Check and unlock achievements
  static async checkAchievements(type: string, currentValue: number): Promise<string[]> {
    try {
      const [achievements, progress] = await Promise.all([
        this.getAvailableAchievements(),
        this.getUserProgress()
      ])

      if (!progress) return []

      const eligibleAchievements = achievements.filter(achievement =>
        achievement.unlock_criteria.type === type &&
        achievement.unlock_criteria.target <= currentValue &&
        !progress.achievements_unlocked.includes(achievement.id)
      )

      if (eligibleAchievements.length === 0) return []

      // Unlock achievements
      const newAchievements = eligibleAchievements.map(a => a.id)
      const totalXPReward = eligibleAchievements.reduce((total, a) => total + a.xp_reward, 0)

      // Update progress with new achievements
      const updatedProgress = {
        ...progress,
        achievements_unlocked: [...progress.achievements_unlocked, ...newAchievements],
        total_xp: progress.total_xp + totalXPReward,
        current_level: this.calculateLevel(progress.total_xp + totalXPReward)
      }

      await this.saveUserProgress(updatedProgress)

      return newAchievements
    } catch (error) {
      console.error('Error checking achievements:', error)
      return []
    }
  }

  // Reset weekly stats (call this weekly)
  static async resetWeeklyStats(): Promise<void> {
    try {
      const gamification = await this.getUserGameification()
      if (!gamification) return

      const resetStats = {
        ...gamification,
        weekly_stats: {
          workouts_completed: 0,
          nutrition_goals_hit: 0,
          consistency_percentage: 0,
          xp_earned: 0
        }
      }

      await this.saveUserGameification(resetStats)
    } catch (error) {
      console.error('Error resetting weekly stats:', error)
    }
  }

  // Calculate weekly consistency
  static async calculateWeeklyConsistency(): Promise<number> {
    try {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Sunday
      startOfWeek.setHours(0, 0, 0, 0)

      const sessions = await this.getSessions()
      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.created_at || '')
        return sessionDate >= startOfWeek
      })

      // Assume 3 workouts per week is 100%
      const targetWorkouts = 3
      const actualWorkouts = weekSessions.length
      const consistency = Math.min(100, (actualWorkouts / targetWorkouts) * 100)

      // Update gamification data with consistency
      const gamification = await this.getUserGameification()
      if (gamification) {
        const updatedGamification = {
          ...gamification,
          weekly_stats: {
            ...gamification.weekly_stats,
            consistency_percentage: Math.round(consistency)
          }
        }
        await this.saveUserGameification(updatedGamification)

        // Check consistency achievements
        await this.checkAchievements('consistency', Math.round(consistency))
      }

      return consistency
    } catch (error) {
      console.error('Error calculating weekly consistency:', error)
      return 0
    }
  }

  // Get user's current challenges
  static async getCurrentChallenges(): Promise<Challenge[]> {
    try {
      const gamification = await this.getUserGameification()
      return gamification?.current_challenges || []
    } catch (error) {
      console.error('Error getting current challenges:', error)
      return []
    }
  }

  // Update challenge progress
  static async updateChallengeProgress(challengeId: string, newValue: number): Promise<void> {
    try {
      const gamification = await this.getUserGameification()
      if (!gamification) return

      const updatedChallenges = gamification.current_challenges.map(challenge => {
        if (challenge.id === challengeId) {
          return {
            ...challenge,
            current_value: newValue
          }
        }
        return challenge
      })

      const updatedGamification = {
        ...gamification,
        current_challenges: updatedChallenges
      }

      await this.saveUserGameification(updatedGamification)
    } catch (error) {
      console.error('Error updating challenge progress:', error)
    }
  }

}