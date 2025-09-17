import { useState, useEffect, useCallback } from 'react';
import { DatabaseService, UserProgress, UserGameification, Achievement } from '../lib/supabase';

interface GamificationState {
  userProgress: UserProgress | null;
  gamificationData: UserGameification | null;
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
}

interface GamificationEvents {
  xpGained: {
    amount: number;
    source: string;
    show: boolean;
  };
  levelUp: {
    newLevel: number;
    oldLevel: number;
    show: boolean;
  };
  achievementUnlocked: {
    achievement: Achievement | null;
    show: boolean;
  };
}

export const useGamification = () => {
  const [state, setState] = useState<GamificationState>({
    userProgress: null,
    gamificationData: null,
    achievements: [],
    loading: true,
    error: null
  });

  const [events, setEvents] = useState<GamificationEvents>({
    xpGained: { amount: 0, source: '', show: false },
    levelUp: { newLevel: 0, oldLevel: 0, show: false },
    achievementUnlocked: { achievement: null, show: false }
  });

  // Load initial data
  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      await DatabaseService.ensureUserMigration();

      const [userProgress, gamificationData, achievements] = await Promise.all([
        DatabaseService.getUserProgress(),
        DatabaseService.getUserGameification(),
        DatabaseService.getAvailableAchievements()
      ]);

      setState({
        userProgress,
        gamificationData,
        achievements,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading gamification data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load gamification data'
      }));
    }
  };

  // Refresh data from database
  const refreshData = useCallback(async () => {
    try {
      const [userProgress, gamificationData] = await Promise.all([
        DatabaseService.getUserProgress(),
        DatabaseService.getUserGameification()
      ]);

      setState(prev => ({
        ...prev,
        userProgress,
        gamificationData
      }));
    } catch (error) {
      console.error('Error refreshing gamification data:', error);
    }
  }, []);

  // Award XP and trigger notifications
  const awardXP = useCallback(async (amount: number, source: string): Promise<void> => {
    if (!state.userProgress || amount <= 0) return;

    try {
      const oldLevel = state.userProgress.current_level;
      const updatedProgress = await DatabaseService.addXP(amount, source);
      const newLevel = updatedProgress.current_level;

      // Update state
      setState(prev => ({
        ...prev,
        userProgress: updatedProgress
      }));

      // Trigger XP gain notification
      setEvents(prev => ({
        ...prev,
        xpGained: {
          amount,
          source,
          show: true
        }
      }));

      // Check for level up
      if (newLevel > oldLevel) {
        setTimeout(() => {
          setEvents(prev => ({
            ...prev,
            levelUp: {
              newLevel,
              oldLevel,
              show: true
            }
          }));
        }, 1000); // Delay level up notification
      }

      // Refresh gamification data to get updated stats
      await refreshData();
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, [state.userProgress, refreshData]);

  // Check and unlock achievements
  const checkAchievements = useCallback(async (type: string, currentValue: number): Promise<string[]> => {
    try {
      const newAchievements = await DatabaseService.checkAchievements(type, currentValue);

      if (newAchievements.length > 0) {
        // Update progress state
        await refreshData();

        // Show achievement notifications one by one
        for (let i = 0; i < newAchievements.length; i++) {
          const achievementId = newAchievements[i];
          const achievement = state.achievements.find(a => a.id === achievementId);

          if (achievement) {
            setTimeout(() => {
              setEvents(prev => ({
                ...prev,
                achievementUnlocked: {
                  achievement,
                  show: true
                }
              }));
            }, (i + 1) * 2000); // Stagger notifications
          }
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }, [state.achievements, refreshData]);

  // Log workout completion with all gamification updates
  const logWorkoutCompletion = useCallback(async (
    exercisesCompleted: number,
    totalExercises: number,
    nutritionCompleted: number,
    totalNutrition: number
  ): Promise<void> => {
    try {
      // Log workout in database (this handles XP calculation and streak updates)
      await DatabaseService.logWorkoutCompletion(exercisesCompleted, totalExercises, nutritionCompleted, totalNutrition);

      // Calculate XP for display
      const exerciseCompletionRate = exercisesCompleted / totalExercises;
      const nutritionCompletionRate = nutritionCompleted / totalNutrition;
      const workoutXP = Math.floor(exerciseCompletionRate * 50);
      const nutritionXP = Math.floor(nutritionCompletionRate * 30);
      const totalXP = workoutXP + nutritionXP;

      // Refresh data to get updated stats
      await refreshData();

      // Trigger XP notification
      if (totalXP > 0) {
        setEvents(prev => ({
          ...prev,
          xpGained: {
            amount: totalXP,
            source: 'workout_completion',
            show: true
          }
        }));
      }

      // Check achievements based on updated stats
      if (state.gamificationData) {
        const updatedGamification = await DatabaseService.getUserGameification();
        if (updatedGamification) {
          await Promise.all([
            checkAchievements('workouts', updatedGamification.total_workouts),
            checkAchievements('streak', updatedGamification.current_streak),
            checkAchievements('nutrition', updatedGamification.total_nutrition_goals)
          ]);
        }
      }
    } catch (error) {
      console.error('Error logging workout completion:', error);
    }
  }, [state.gamificationData, refreshData, checkAchievements]);

  // Event handlers to close notifications
  const closeXPNotification = useCallback(() => {
    setEvents(prev => ({
      ...prev,
      xpGained: { ...prev.xpGained, show: false }
    }));
  }, []);

  const closeLevelUpNotification = useCallback(() => {
    setEvents(prev => ({
      ...prev,
      levelUp: { ...prev.levelUp, show: false }
    }));
  }, []);

  const closeAchievementNotification = useCallback(() => {
    setEvents(prev => ({
      ...prev,
      achievementUnlocked: { ...prev.achievementUnlocked, show: false }
    }));
  }, []);

  // Calculate level progress
  const getLevelProgress = useCallback(() => {
    if (!state.userProgress) {
      return { currentLevelXP: 0, nextLevelXP: 100, progress: 0 };
    }
    return DatabaseService.getCurrentLevelProgress(state.userProgress.total_xp);
  }, [state.userProgress]);

  // Get achievements progress
  const getAchievementProgress = useCallback((achievementId: string): number => {
    const achievement = state.achievements.find(a => a.id === achievementId);
    if (!achievement || !state.gamificationData || !state.userProgress) return 0;

    let currentValue = 0;
    switch (achievement.unlock_criteria.type) {
      case 'workouts':
        currentValue = state.gamificationData.total_workouts;
        break;
      case 'streak':
        currentValue = state.gamificationData.current_streak;
        break;
      case 'program_completion':
        currentValue = state.userProgress.programs_completed.length;
        break;
      case 'nutrition':
        currentValue = state.gamificationData.total_nutrition_goals;
        break;
      case 'consistency':
        currentValue = state.gamificationData.weekly_stats.consistency_percentage;
        break;
    }

    return Math.min(100, (currentValue / achievement.unlock_criteria.target) * 100);
  }, [state.achievements, state.gamificationData, state.userProgress]);

  return {
    // State
    ...state,

    // Events
    events,

    // Actions
    awardXP,
    checkAchievements,
    logWorkoutCompletion,
    refreshData,
    loadGamificationData,

    // Event handlers
    closeXPNotification,
    closeLevelUpNotification,
    closeAchievementNotification,

    // Utilities
    getLevelProgress,
    getAchievementProgress,

    // Computed values
    isUnlocked: (achievementId: string) =>
      state.userProgress?.achievements_unlocked.includes(achievementId) || false,

    currentLevel: state.userProgress?.current_level || 1,
    totalXP: state.userProgress?.total_xp || 0,
    currentStreak: state.gamificationData?.current_streak || 0,
    longestStreak: state.gamificationData?.longest_streak || 0,
    totalWorkouts: state.gamificationData?.total_workouts || 0,
    weeklyStats: state.gamificationData?.weekly_stats || {
      workouts_completed: 0,
      nutrition_goals_hit: 0,
      consistency_percentage: 0,
      xp_earned: 0
    }
  };
};

export default useGamification;