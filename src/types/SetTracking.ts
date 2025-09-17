// Enhanced Set Tracking Types for Advanced Workout Flow

export interface SetData {
  id: string;
  setNumber: number; // 1, 2, 3, etc.
  weight: number;
  reps?: number; // Actual reps performed
  targetReps: string; // Target reps (e.g., "8-10")
  duration?: number; // Time spent on set in seconds
  restDuration?: number; // Rest time after set in seconds
  completed: boolean;
  notes?: string;
  timestamp?: string;
  difficulty?: 'easy' | 'moderate' | 'hard' | 'failure';
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface ExerciseSetTracking {
  exerciseId: string;
  exerciseName: string;
  totalSets: number;
  targetRestTime: number; // Rest time between sets in seconds
  sets: SetData[];
  currentSet: number; // Which set is currently active (1-based)
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
  totalDuration?: number; // Total exercise duration in seconds
  notes?: string;
}

export interface WorkoutSessionData {
  id: string;
  dayName: string;
  weekNumber: number;
  phase: string;
  programId: string;
  exercises: ExerciseSetTracking[];
  nutritionGoals: NutritionGoalTracking[];
  startedAt: string;
  completedAt?: string;
  totalDuration?: number; // Total workout duration in seconds
  xpEarned: number;
  status: 'in_progress' | 'completed' | 'paused' | 'abandoned';
  sessionNotes?: string;
}

export interface NutritionGoalTracking {
  id: string;
  name: string;
  icon: string;
  category: string;
  completed: boolean;
  completedAt?: string;
}

export interface SetTrackingState {
  exerciseId: string;
  setNumber: number;
  isActive: boolean;
  isResting: boolean;
  restTimeRemaining: number;
  setStartTime?: number;
  setDuration: number;
}

export interface WorkoutFlowState {
  currentExercise: number; // Index of current exercise
  currentSet: number; // Current set number within exercise
  isWorkoutActive: boolean;
  isSetActive: boolean;
  isResting: boolean;
  restTimeRemaining: number;
  workoutStartTime?: number;
  exerciseStartTime?: number;
  setStartTime?: number;
  mode: 'guided' | 'free' | 'timer_only'; // Different workout modes
}

export interface AdvancedTimerState extends SetTrackingState {
  exerciseName: string;
  totalSets: number;
  targetReps: string;
  targetRestTime: number;
  currentWeight: number;
  setHistory: SetData[];
  autoAdvance: boolean; // Auto-advance to next set after rest
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Enhanced exercise completion tracking
export interface ExerciseProgress {
  dayName: string;
  exerciseIndex: number;
  week: number;
  totalSets: number;
  completedSets: number;
  averageWeight: number;
  lastPerformed?: string;
  personalBest?: {
    weight: number;
    reps: number;
    date: string;
  };
  progressTrend: 'improving' | 'maintaining' | 'declining';
}

// Workout analytics and insights
export interface WorkoutAnalytics {
  sessionId: string;
  totalVolume: number; // Total weight × reps
  averageIntensity: number; // Average RPE
  restEfficiency: number; // Percentage of recommended rest time used
  formConsistency: number; // Based on RPE variation
  timeEfficiency: number; // Actual vs. estimated workout time
  strengthGains: number; // Percentage improvement from last session
  recommendations: string[]; // AI-generated workout tips
}

// Set completion events for gamification
export interface SetCompletionEvent {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  targetReps: string;
  duration: number;
  rpe?: number;
  isPersonalBest: boolean;
  xpEarned: number;
  achievements?: string[]; // Any achievements unlocked
}

// Enhanced preferences for set tracking
export interface SetTrackingPreferences {
  autoStartTimer: boolean;
  autoAdvanceOnComplete: boolean;
  showRestReminders: boolean;
  trackRPE: boolean;
  trackActualReps: boolean;
  defaultRestTime: number;
  soundNotifications: boolean;
  vibrationNotifications: boolean;
  guidedWorkoutMode: boolean;
  showProgressAnalytics: boolean;
}

// Database interfaces for enhanced tracking
export interface EnhancedCompletedSession {
  id?: string;
  user_id?: string;
  session_date: string;
  session_time: string;
  week: number;
  phase: string;
  day_name: string;
  program_id: string;

  // Enhanced session data
  session_data: WorkoutSessionData;
  analytics?: WorkoutAnalytics;

  // Legacy compatibility
  exercises: any[];
  nutrition: any[];
  exercises_completed: number;
  total_exercises: number;
  nutrition_completed: number;
  total_nutrition: number;
  xp_earned: number;

  created_at?: string;
  updated_at?: string;
}

export interface EnhancedUserPreferences {
  id?: string;
  user_id?: string;
  current_week: number;
  current_program_id: string;

  // Legacy tracking (for backward compatibility)
  completed_exercises: Record<string, boolean>;
  exercise_weights: Record<string, number>;
  nutrition_goals: Record<string, boolean>;

  // Enhanced set tracking
  exercise_set_data: Record<string, ExerciseSetTracking>;
  workout_sessions: Record<string, WorkoutSessionData>;
  set_tracking_preferences: SetTrackingPreferences;

  created_at?: string;
  updated_at?: string;
}

// Utility types for component props
export interface SetTrackerProps {
  exerciseSetTracking: ExerciseSetTracking;
  onSetComplete: (setData: SetData) => void;
  onSetUpdate: (setData: Partial<SetData>) => void;
  onExerciseComplete: () => void;
  isActive: boolean;
  showAdvanced?: boolean;
}

export interface AdvancedExerciseCardProps {
  exercise: {
    name: string;
    sets: string;
    rest: string;
    notes: string;
    demo: string;
  };
  exerciseSetTracking: ExerciseSetTracking;
  dayName: string;
  exerciseIndex: number;
  week: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSetComplete: (setData: SetData) => void;
  onSetUpdate: (setData: Partial<SetData>) => void;
  onExerciseComplete: () => void;
  onLaunchTimer: () => void;
  showAnalytics?: boolean;
}

export interface GuidedWorkoutFlowProps {
  dayName: string;
  exercises: any[];
  week: number;
  phase: string;
  onWorkoutComplete: (sessionData: WorkoutSessionData) => void;
  onWorkoutPause: () => void;
  onWorkoutResume: () => void;
  onWorkoutAbandon: () => void;
}

// Constants
export const DEFAULT_SET_TRACKING_PREFERENCES: SetTrackingPreferences = {
  autoStartTimer: true,
  autoAdvanceOnComplete: false,
  showRestReminders: true,
  trackRPE: false,
  trackActualReps: true,
  defaultRestTime: 90,
  soundNotifications: true,
  vibrationNotifications: true,
  guidedWorkoutMode: false,
  showProgressAnalytics: true,
};

export const RPE_DESCRIPTIONS = {
  1: 'Very Easy - Could do many more reps',
  2: 'Easy - Could do several more reps',
  3: 'Moderate - Could do a few more reps',
  4: 'Moderate+ - Could do 2-3 more reps',
  5: 'Hard - Could do 1-2 more reps',
  6: 'Hard+ - Could do 1 more rep',
  7: 'Very Hard - Could maybe do 1 more rep',
  8: 'Very Hard+ - Questionable if 1 more rep possible',
  9: 'Extremely Hard - Definitely no more reps',
  10: 'Failure - Could not complete the rep'
};

export const XP_REWARDS = {
  SET_COMPLETION: 5,
  EXERCISE_COMPLETION: 15,
  PERSONAL_BEST: 25,
  PERFECT_REST_TIMING: 3,
  SESSION_COMPLETION: 50,
  GUIDED_WORKOUT_BONUS: 10,
};