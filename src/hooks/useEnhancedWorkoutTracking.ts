import { useState, useEffect, useCallback } from 'react';
import { DatabaseService } from '../lib/supabase';
import {
  ExerciseSetTracking,
  SetData,
  WorkoutSessionData,
  SetTrackingPreferences,
  EnhancedUserPreferences,
  XP_REWARDS,
  DEFAULT_SET_TRACKING_PREFERENCES
} from '../types/SetTracking';

interface UseEnhancedWorkoutTrackingReturn {
  // Set tracking state
  exerciseSetData: Record<string, ExerciseSetTracking>;
  setTrackingPreferences: SetTrackingPreferences;
  isEnhancedMode: boolean;

  // Actions
  initializeExercise: (dayName: string, exerciseIndex: number, exercise: any, week: number) => Promise<ExerciseSetTracking>;
  updateSetData: (exerciseId: string, setData: Partial<SetData>) => Promise<void>;
  completeSet: (exerciseId: string, setData: SetData) => Promise<number>; // Returns XP earned
  completeExercise: (exerciseId: string) => Promise<void>;

  // Session management
  startWorkoutSession: (dayName: string, exercises: any[], week: number, phase: string) => WorkoutSessionData;
  saveWorkoutSession: (sessionData: WorkoutSessionData) => Promise<void>;
  getWorkoutSession: (sessionId: string) => Promise<WorkoutSessionData | null>;

  // Preferences
  updatePreferences: (preferences: Partial<SetTrackingPreferences>) => Promise<void>;
  toggleEnhancedMode: () => Promise<void>;

  // Analytics
  getExerciseProgress: (exerciseId: string) => ExerciseProgress | null;
  getWorkoutAnalytics: (sessionId: string) => WorkoutAnalytics | null;

  // Utilities
  loading: boolean;
  saving: boolean;
}

interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  totalSets: number;
  completedSets: number;
  averageWeight: number;
  averageReps: number;
  averageRPE: number;
  lastCompleted?: string;
  progressTrend: 'improving' | 'maintaining' | 'declining';
}

interface WorkoutAnalytics {
  sessionId: string;
  totalVolume: number; // Total weight × reps
  averageIntensity: number; // Average RPE
  restEfficiency: number; // Percentage of recommended rest time used
  formConsistency: number; // Based on RPE variation
  timeEfficiency: number; // Actual vs. estimated workout time
  strengthGains: number; // Percentage improvement from last session
  recommendations: string[]; // AI-generated workout tips
}

const useEnhancedWorkoutTracking = (): UseEnhancedWorkoutTrackingReturn => {
  const [exerciseSetData, setExerciseSetData] = useState<Record<string, ExerciseSetTracking>>({});
  const [setTrackingPreferences, setSetTrackingPreferences] = useState<SetTrackingPreferences>(DEFAULT_SET_TRACKING_PREFERENCES);
  const [isEnhancedMode, setIsEnhancedMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load enhanced preferences and data on mount
  useEffect(() => {
    loadEnhancedData();
  }, []);

  const loadEnhancedData = async () => {
    try {
      setLoading(true);
      const preferences = await DatabaseService.getEnhancedPreferences();

      if (preferences) {
        setExerciseSetData(preferences.exercise_set_data || {});
        setSetTrackingPreferences(preferences.set_tracking_preferences || DEFAULT_SET_TRACKING_PREFERENCES);
        setIsEnhancedMode(preferences.set_tracking_preferences?.guidedWorkoutMode || false);
      }
    } catch (error) {
      console.error('Error loading enhanced workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize exercise tracking
  const initializeExercise = useCallback(async (
    dayName: string,
    exerciseIndex: number,
    exercise: any,
    week: number
  ): Promise<ExerciseSetTracking> => {
    try {
      const exerciseSetTracking = await DatabaseService.initializeExerciseSetTracking(
        dayName,
        exerciseIndex,
        exercise,
        week
      );

      setExerciseSetData(prev => ({
        ...prev,
        [exerciseSetTracking.exerciseId]: exerciseSetTracking
      }));

      return exerciseSetTracking;
    } catch (error) {
      console.error('Error initializing exercise:', error);
      throw error;
    }
  }, []);

  // Update set data
  const updateSetData = useCallback(async (exerciseId: string, setData: Partial<SetData>): Promise<void> => {
    try {
      setSaving(true);

      setExerciseSetData(prev => {
        const exercise = prev[exerciseId];
        if (!exercise) return prev;

        const updatedSets = exercise.sets.map(set =>
          set.id === setData.id ? { ...set, ...setData } : set
        );

        return {
          ...prev,
          [exerciseId]: {
            ...exercise,
            sets: updatedSets
          }
        };
      });

      // Save to database
      const updatedExercise = exerciseSetData[exerciseId];
      if (updatedExercise) {
        await DatabaseService.saveExerciseSetTracking(updatedExercise);
      }
    } catch (error) {
      console.error('Error updating set data:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [exerciseSetData]);

  // Complete a set
  const completeSet = useCallback(async (exerciseId: string, setData: SetData): Promise<number> => {
    try {
      setSaving(true);

      // Calculate XP for this set
      let xpEarned = XP_REWARDS.SET_COMPLETION;

      // Target reps bonus
      if (setData.reps && setData.targetReps) {
        const [min, max] = setData.targetReps.split('-').map(n => parseInt(n));
        if (setData.reps >= min && (!max || setData.reps <= max)) {
          xpEarned += 2; // Target hit bonus
        }
        if (max && setData.reps > max) {
          xpEarned += 5; // Exceeded target bonus
        }
      }

      // RPE efficiency bonus
      if (setData.rpe && setData.rpe >= 7 && setData.rpe <= 8) {
        xpEarned += 3; // Optimal intensity bonus
      }

      // Update exercise data
      setExerciseSetData(prev => {
        const exercise = prev[exerciseId];
        if (!exercise) return prev;

        const updatedSets = exercise.sets.map(set =>
          set.id === setData.id ? { ...setData, completed: true, timestamp: new Date().toISOString() } : set
        );

        const completedSets = updatedSets.filter(set => set.completed).length;
        const currentSet = Math.min(exercise.currentSet + 1, exercise.totalSets);

        return {
          ...prev,
          [exerciseId]: {
            ...exercise,
            sets: updatedSets,
            currentSet,
            completed: completedSets === exercise.totalSets
          }
        };
      });

      // Save to database
      const updatedExercise = exerciseSetData[exerciseId];
      if (updatedExercise) {
        await DatabaseService.saveExerciseSetTracking(updatedExercise);
      }

      return xpEarned;
    } catch (error) {
      console.error('Error completing set:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [exerciseSetData]);

  // Complete entire exercise
  const completeExercise = useCallback(async (exerciseId: string): Promise<void> => {
    try {
      setSaving(true);

      setExerciseSetData(prev => {
        const exercise = prev[exerciseId];
        if (!exercise) return prev;

        return {
          ...prev,
          [exerciseId]: {
            ...exercise,
            completed: true,
            completedAt: new Date().toISOString()
          }
        };
      });

      // Save to database
      const updatedExercise = exerciseSetData[exerciseId];
      if (updatedExercise) {
        await DatabaseService.saveExerciseSetTracking(updatedExercise);
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [exerciseSetData]);

  // Start workout session
  const startWorkoutSession = useCallback((
    dayName: string,
    exercises: any[],
    week: number,
    phase: string
  ): WorkoutSessionData => {
    const sessionId = `${dayName}-${Date.now()}`;

    const exerciseSetTrackings: ExerciseSetTracking[] = exercises.map((exercise, index) => {
      const exerciseId = `${dayName}-${index}-week${week}`;
      return exerciseSetData[exerciseId] || {
        exerciseId,
        exerciseName: exercise.name,
        totalSets: parseInt(exercise.sets.split('x')[0].trim()) || 4,
        targetRestTime: parseRestTime(exercise.rest),
        sets: [],
        currentSet: 1,
        completed: false
      };
    });

    const sessionData: WorkoutSessionData = {
      id: sessionId,
      dayName,
      weekNumber: week,
      phase,
      programId: 'foundation-builder', // This should be passed as parameter
      exercises: exerciseSetTrackings,
      nutritionGoals: [], // Would be populated if tracking nutrition
      startedAt: new Date().toISOString(),
      xpEarned: 0,
      status: 'in_progress'
    };

    return sessionData;
  }, [exerciseSetData]);

  // Save workout session
  const saveWorkoutSession = useCallback(async (sessionData: WorkoutSessionData): Promise<void> => {
    try {
      setSaving(true);
      await DatabaseService.saveWorkoutSession(sessionData);
    } catch (error) {
      console.error('Error saving workout session:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  // Get workout session
  const getWorkoutSession = useCallback(async (sessionId: string): Promise<WorkoutSessionData | null> => {
    try {
      return await DatabaseService.getWorkoutSession(sessionId);
    } catch (error) {
      console.error('Error getting workout session:', error);
      return null;
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (preferences: Partial<SetTrackingPreferences>): Promise<void> => {
    try {
      setSaving(true);
      const updatedPreferences = { ...setTrackingPreferences, ...preferences };
      setSetTrackingPreferences(updatedPreferences);
      await DatabaseService.saveSetTrackingPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [setTrackingPreferences]);

  // Toggle enhanced mode
  const toggleEnhancedMode = useCallback(async (): Promise<void> => {
    try {
      const newMode = !isEnhancedMode;
      setIsEnhancedMode(newMode);
      await updatePreferences({ guidedWorkoutMode: newMode });
    } catch (error) {
      console.error('Error toggling enhanced mode:', error);
      throw error;
    }
  }, [isEnhancedMode, updatePreferences]);

  // Get exercise progress
  const getExerciseProgress = useCallback((exerciseId: string): ExerciseProgress | null => {
    const exercise = exerciseSetData[exerciseId];
    if (!exercise) return null;

    const completedSets = exercise.sets.filter(set => set.completed);
    const totalVolume = completedSets.reduce((sum, set) => sum + (set.weight * (set.reps || 0)), 0);
    const averageWeight = completedSets.length > 0
      ? completedSets.reduce((sum, set) => sum + set.weight, 0) / completedSets.length
      : 0;
    const averageReps = completedSets.length > 0
      ? completedSets.filter(set => set.reps).reduce((sum, set) => sum + (set.reps || 0), 0) / completedSets.filter(set => set.reps).length
      : 0;
    const averageRPE = completedSets.length > 0
      ? completedSets.filter(set => set.rpe).reduce((sum, set) => sum + (set.rpe || 0), 0) / completedSets.filter(set => set.rpe).length
      : 0;

    return {
      exerciseId,
      exerciseName: exercise.exerciseName,
      totalSets: exercise.totalSets,
      completedSets: completedSets.length,
      averageWeight,
      averageReps,
      averageRPE,
      lastCompleted: exercise.completedAt,
      progressTrend: 'maintaining' // This would be calculated based on historical data
    };
  }, [exerciseSetData]);

  // Get workout analytics
  const getWorkoutAnalytics = useCallback((sessionId: string): WorkoutAnalytics | null => {
    // This would typically fetch from database and calculate analytics
    // For now, return basic analytics from current session data
    const exercises = Object.values(exerciseSetData);
    const completedSets = exercises.flatMap(ex => ex.sets.filter(set => set.completed));

    if (completedSets.length === 0) return null;

    const totalVolume = completedSets.reduce((sum, set) => sum + (set.weight * (set.reps || 0)), 0);
    const averageIntensity = completedSets.filter(set => set.rpe).length > 0
      ? completedSets.reduce((sum, set) => sum + (set.rpe || 0), 0) / completedSets.filter(set => set.rpe).length
      : 0;

    return {
      sessionId,
      totalVolume,
      averageIntensity,
      restEfficiency: 85, // Would be calculated from actual rest times
      formConsistency: 90, // Would be calculated from RPE consistency
      timeEfficiency: 88, // Would be calculated from session duration
      strengthGains: 2.5, // Would be calculated from weight progression
      recommendations: [
        'Great session! Consider increasing weight by 2.5kg next time.',
        'Your rest periods were consistent - keep it up!',
        'Try to hit the target rep range more consistently.'
      ]
    };
  }, [exerciseSetData]);

  // Helper function to parse rest time
  const parseRestTime = (restString: string): number => {
    if (restString === "N/A") return 0;
    const match = restString.match(/(\d+(?:\.\d+)?)\s*(min|sec)/i);
    if (!match) return 90;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return unit === 'min' ? value * 60 : value;
  };

  return {
    // State
    exerciseSetData,
    setTrackingPreferences,
    isEnhancedMode,

    // Actions
    initializeExercise,
    updateSetData,
    completeSet,
    completeExercise,

    // Session management
    startWorkoutSession,
    saveWorkoutSession,
    getWorkoutSession,

    // Preferences
    updatePreferences,
    toggleEnhancedMode,

    // Analytics
    getExerciseProgress,
    getWorkoutAnalytics,

    // Loading states
    loading,
    saving
  };
};

export default useEnhancedWorkoutTracking;