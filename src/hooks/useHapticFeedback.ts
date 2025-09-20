import { useCallback } from 'react';

interface HapticFeedbackOptions {
  pattern?: number | number[];
  intensity?: 'light' | 'medium' | 'heavy';
}

export const useHapticFeedback = () => {
  const isHapticSupported = useCallback(() => {
    return 'vibrate' in navigator || 'hapticFeedback' in navigator;
  }, []);

  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Haptic feedback not supported:', error);
      }
    }
  }, []);

  const triggerHaptic = useCallback((type: string, options?: HapticFeedbackOptions) => {
    if (!isHapticSupported()) return;

    // Use custom pattern if provided
    if (options?.pattern) {
      vibrate(options.pattern);
      return;
    }

    // Predefined haptic patterns for different interactions
    const patterns = {
      // Button interactions
      tap: 10,
      button: 15,
      longPress: [20, 10, 20],

      // Set tracking interactions
      setComplete: [30, 10, 30],
      exerciseComplete: [50, 20, 50, 20, 50],
      workoutComplete: [100, 50, 100, 50, 100, 50, 100],

      // Timer interactions
      timerStart: 25,
      timerEnd: [40, 20, 40],
      restTimerEnd: [60, 30, 60, 30, 60],

      // Progress milestones
      personalBest: [80, 40, 80, 40, 80],
      levelUp: [100, 50, 100, 50, 100, 50, 100],
      achievementUnlocked: [120, 60, 120, 60, 120],

      // Navigation
      swipe: 8,
      scroll: 5,

      // Feedback
      success: [50, 30, 50],
      error: [100, 50, 100, 50, 100],
      warning: [60, 40, 60],

      // Weight adjustments
      weightIncrease: [20, 10, 20],
      weightDecrease: [15, 10, 15],

      // Gamification
      xpGain: [30, 15, 30],
      streakContinue: [40, 20, 40],
      streakBreak: [80, 40, 80, 40, 80],

      // Social interactions
      like: 20,
      share: [25, 15, 25],
      follow: [35, 20, 35]
    };

    const pattern = patterns[type as keyof typeof patterns];
    if (pattern) {
      vibrate(pattern);
    }
  }, [vibrate, isHapticSupported]);

  // Specific workout-related haptic methods
  const workoutHaptics = {
    // Set completion with progressive intensity based on set number
    setComplete: useCallback((setNumber: number, totalSets: number) => {
      const intensity = Math.min(20 + (setNumber * 5), 50);
      triggerHaptic('setComplete', { pattern: [intensity, 10, intensity] });
    }, [triggerHaptic]),

    // Exercise completion with celebration pattern
    exerciseComplete: useCallback(() => {
      triggerHaptic('exerciseComplete');
    }, [triggerHaptic]),

    // Personal best achievement with intense celebration
    personalBest: useCallback(() => {
      triggerHaptic('personalBest');
    }, [triggerHaptic]),

    // Timer notifications
    restTimerWarning: useCallback(() => {
      triggerHaptic('warning');
    }, [triggerHaptic]),

    restTimerEnd: useCallback(() => {
      triggerHaptic('restTimerEnd');
    }, [triggerHaptic]),

    // Weight adjustments for easier gym use
    weightAdjustment: useCallback((direction: 'increase' | 'decrease') => {
      triggerHaptic(direction === 'increase' ? 'weightIncrease' : 'weightDecrease');
    }, [triggerHaptic]),

    // Gamification feedback
    xpGained: useCallback((amount: number) => {
      // Longer vibration for bigger XP gains
      const intensity = Math.min(20 + Math.floor(amount / 10), 60);
      triggerHaptic('xpGain', { pattern: [intensity, 15, intensity] });
    }, [triggerHaptic]),

    achievementUnlocked: useCallback(() => {
      triggerHaptic('achievementUnlocked');
    }, [triggerHaptic]),

    levelUp: useCallback(() => {
      triggerHaptic('levelUp');
    }, [triggerHaptic])
  };

  // UI interaction haptics
  const uiHaptics = {
    buttonTap: useCallback(() => {
      triggerHaptic('button');
    }, [triggerHaptic]),

    longPress: useCallback(() => {
      triggerHaptic('longPress');
    }, [triggerHaptic]),

    swipe: useCallback(() => {
      triggerHaptic('swipe');
    }, [triggerHaptic]),

    success: useCallback(() => {
      triggerHaptic('success');
    }, [triggerHaptic]),

    error: useCallback(() => {
      triggerHaptic('error');
    }, [triggerHaptic]),

    warning: useCallback(() => {
      triggerHaptic('warning');
    }, [triggerHaptic])
  };

  return {
    isSupported: isHapticSupported(),
    triggerHaptic,
    workout: workoutHaptics,
    ui: uiHaptics,

    // Quick access methods for common patterns
    tap: useCallback(() => triggerHaptic('tap'), [triggerHaptic]),
    success: useCallback(() => triggerHaptic('success'), [triggerHaptic]),
    error: useCallback(() => triggerHaptic('error'), [triggerHaptic]),
    setComplete: useCallback(() => triggerHaptic('setComplete'), [triggerHaptic])
  };
};

export default useHapticFeedback;