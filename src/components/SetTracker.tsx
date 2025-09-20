import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Timer,
  Plus,
  Minus,
  RotateCcw,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Award
} from 'lucide-react';
import { SetData, ExerciseSetTracking, SetTrackerProps, XP_REWARDS } from '../types/SetTracking';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

const SetTracker: React.FC<SetTrackerProps> = ({
  exerciseSetTracking,
  onSetComplete,
  onSetUpdate,
  onExerciseComplete,
  isActive,
  showAdvanced = true
}) => {
  // Haptic feedback hook
  const { triggerHaptic } = useHapticFeedback();
  const [currentSetData, setCurrentSetData] = useState<SetData | null>(null);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [setTimer, setSetTimer] = useState(0);
  const [isSetActive, setIsSetActive] = useState(false);
  const [showRPE, setShowRPE] = useState(false);
  const [actualReps, setActualReps] = useState<number | null>(null);

  // Initialize current set data
  useEffect(() => {
    if (exerciseSetTracking.currentSet <= exerciseSetTracking.totalSets) {
      const currentSet = exerciseSetTracking.sets[exerciseSetTracking.currentSet - 1];
      if (currentSet && !currentSet.completed) {
        setCurrentSetData(currentSet);
      }
    }
  }, [exerciseSetTracking.currentSet, exerciseSetTracking.sets]);

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            playNotificationSound();
            triggerHaptic('notification');
            return 0;
          }
          if (prev === 10) {
            // Warning at 10 seconds remaining
            triggerHaptic('warning');
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restTimer]);

  // Set timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isSetActive) {
      interval = setInterval(() => {
        setSetTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSetActive]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const startSet = () => {
    setIsSetActive(true);
    setSetTimer(0);
    setIsResting(false);
    triggerHaptic('start');
  };

  const pauseSet = () => {
    setIsSetActive(false);
    triggerHaptic('selection');
  };

  const completeSet = async () => {
    if (!currentSetData) return;

    const completedSetData: SetData = {
      ...currentSetData,
      duration: setTimer,
      reps: actualReps || undefined,
      completed: true,
      timestamp: new Date().toISOString()
    };

    // Update local state
    setIsSetActive(false);
    setSetTimer(0);

    // Call the completion handler
    onSetComplete(completedSetData);

    // Trigger success haptic feedback
    triggerHaptic('success');

    // Start rest timer if not the last set
    if (exerciseSetTracking.currentSet < exerciseSetTracking.totalSets) {
      setRestTimer(exerciseSetTracking.targetRestTime);
      setIsResting(true);
      playNotificationSound();
    } else {
      // Exercise complete
      onExerciseComplete();
      triggerHaptic('notification');
    }

    // Reset for next set
    setActualReps(null);
    setShowRPE(false);
  };

  const updateWeight = (change: number) => {
    if (!currentSetData) return;

    const newWeight = Math.max(0, currentSetData.weight + change);
    const updatedSetData = { ...currentSetData, weight: newWeight };

    setCurrentSetData(updatedSetData);
    onSetUpdate(updatedSetData);
    triggerHaptic('impact');
  };

  const resetSet = () => {
    setIsSetActive(false);
    setSetTimer(0);
    setIsResting(false);
    setRestTimer(0);
    setActualReps(null);
    setShowRPE(false);
    triggerHaptic('selection');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRPEDescription = (rpe: number): string => {
    const descriptions = {
      1: 'Very Easy',
      2: 'Easy',
      3: 'Moderate',
      4: 'Somewhat Hard',
      5: 'Hard',
      6: 'Harder',
      7: 'Very Hard',
      8: 'Very Very Hard',
      9: 'Extremely Hard',
      10: 'Maximum Effort'
    };
    return descriptions[rpe as keyof typeof descriptions] || '';
  };

  const getCompletedSetsCount = () => {
    return exerciseSetTracking.sets.filter(set => set.completed).length;
  };

  const getCurrentSetProgress = () => {
    const completedSets = getCompletedSetsCount();
    return (completedSets / exerciseSetTracking.totalSets) * 100;
  };

  if (!currentSetData) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
          <Award className="w-5 h-5" />
          <span className="font-bold">Exercise Complete!</span>
        </div>
        <p className="text-sm text-green-600">
          All sets completed for {exerciseSetTracking.exerciseName}
        </p>
        <div className="mt-2 text-xs text-green-500">
          +{XP_REWARDS.EXERCISE_COMPLETION} XP earned
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
      isActive ? 'border-blue-500 shadow-xl' : 'border-gray-200'
    }`}>
      {/* Exercise Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg">{exerciseSetTracking.exerciseName}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-white/20 px-2 py-1 rounded-full" aria-label={`Currently on set ${exerciseSetTracking.currentSet} of ${exerciseSetTracking.totalSets} total sets`}>
              Set {exerciseSetTracking.currentSet} of {exerciseSetTracking.totalSets}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-2" role="progressbar" aria-valuenow={getCurrentSetProgress()} aria-valuemin={0} aria-valuemax={100} aria-label={`Exercise progress: ${getCurrentSetProgress()}% completed`}>
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${getCurrentSetProgress()}%` }}
          />
        </div>
      </div>

      {/* Set Progress Indicators */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex gap-1" role="list" aria-label="Set completion indicators">
          {exerciseSetTracking.sets.map((set, index) => (
            <div
              key={set.id}
              role="listitem"
              aria-label={`Set ${index + 1}: ${
                set.completed
                  ? 'Completed'
                  : index === exerciseSetTracking.currentSet - 1
                    ? isSetActive
                      ? 'Currently active'
                      : 'Current set, not started'
                    : 'Not started'
              }`}
              className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                set.completed
                  ? 'bg-green-500'
                  : index === exerciseSetTracking.currentSet - 1
                    ? isSetActive
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-blue-300'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>{getCompletedSetsCount()} completed</span>
          <span>{exerciseSetTracking.totalSets - getCompletedSetsCount()} remaining</span>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="p-6 text-center">
        {isResting ? (
          <div>
            <div className="text-4xl font-mono font-bold text-orange-600 mb-2">
              {formatTime(restTimer)}
            </div>
            <p className="text-sm text-orange-700 mb-2">Rest Time Remaining</p>
            <div className="text-xs text-gray-600">
              Next: Set {exerciseSetTracking.currentSet + 1} of {exerciseSetTracking.totalSets}
            </div>
            <div className="mt-3">
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${((exerciseSetTracking.targetRestTime - restTimer) / exerciseSetTracking.targetRestTime) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
              {formatTime(setTimer)}
            </div>
            <p className="text-sm text-blue-700 mb-2">
              {isSetActive ? 'Set in Progress' : 'Ready to Start Set'}
            </p>
            <div className="text-xs text-gray-600 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Target: {currentSetData.targetReps} reps
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Rest: {formatTime(exerciseSetTracking.targetRestTime)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Weight Controls */}
      <div className="px-4 py-3 bg-gray-50 border-y">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700" id="weight-label">Weight:</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateWeight(-2.5)}
              className="w-12 h-12 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors touch-manipulation"
              disabled={isResting}
              aria-label={`Decrease weight by 2.5kg, current weight ${currentSetData.weight}kg`}
              aria-describedby="weight-label"
            >
              <Minus className="w-6 h-6" />
            </button>
            <span className="w-24 text-center font-mono text-lg font-bold bg-white py-3 px-2 rounded-lg border" aria-live="polite" aria-label={`Current weight: ${currentSetData.weight} kilograms`}>
              {currentSetData.weight}kg
            </span>
            <button
              onClick={() => updateWeight(2.5)}
              className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors touch-manipulation"
              disabled={isResting}
              aria-label={`Increase weight by 2.5kg, current weight ${currentSetData.weight}kg`}
              aria-describedby="weight-label"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Tracking (Optional) */}
      {showAdvanced && (
        <div className="p-4 bg-blue-50 border-b">
          <div className="grid grid-cols-2 gap-4">
            {/* Actual Reps Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="actual-reps-input">
                Actual Reps
              </label>
              <input
                id="actual-reps-input"
                type="number"
                value={actualReps || ''}
                onChange={(e) => setActualReps(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={currentSetData.targetReps?.toString()}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                disabled={isResting}
                aria-describedby="actual-reps-help"
              />
              <div id="actual-reps-help" className="sr-only">
                Enter the number of repetitions you actually completed for this set. Target is {currentSetData.targetReps} reps.
              </div>
            </div>

            {/* RPE Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="rpe-select">
                RPE (1-10)
              </label>
              <select
                id="rpe-select"
                value={currentSetData.rpe || ''}
                onChange={(e) => {
                  const rpe = e.target.value ? parseInt(e.target.value) : undefined;
                  const updatedSetData = { ...currentSetData, rpe };
                  setCurrentSetData(updatedSetData);
                  onSetUpdate(updatedSetData);
                }}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                disabled={isResting}
                aria-describedby="rpe-help"
              >
                <option value="">Select RPE</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num} - {getRPEDescription(num)}</option>
                ))}
              </select>
              <div id="rpe-help" className="sr-only">
                Rate of Perceived Exertion: 1 is very easy, 10 is maximum effort
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          {isResting ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsResting(false);
                  triggerHaptic('selection');
                }}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium touch-manipulation min-h-[48px]"
                aria-label="Skip the remaining rest time and continue to next set"
              >
                Skip Rest
              </button>
              <button
                onClick={() => {
                  setRestTimer(prev => prev + 30);
                  triggerHaptic('selection');
                }}
                className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors text-sm touch-manipulation min-h-[48px]"
                aria-label="Add 30 seconds to rest timer"
              >
                +30s
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {!isSetActive ? (
                <button
                  onClick={startSet}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium touch-manipulation min-h-[48px]"
                  aria-label="Start the current set timer"
                >
                  <Play className="w-5 h-5" />
                  Start Set
                </button>
              ) : (
                <button
                  onClick={pauseSet}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium touch-manipulation min-h-[48px]"
                  aria-label="Pause the current set timer"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
              )}

              <button
                onClick={resetSet}
                className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors touch-manipulation min-h-[48px] min-w-[48px]"
                aria-label="Reset the current set timer and data"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Complete Set Button */}
        {!isResting && (
          <button
            onClick={completeSet}
            disabled={!isSetActive && setTimer === 0}
            className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[56px]"
            aria-label={`Complete current set and earn ${XP_REWARDS.SET_COMPLETION} experience points`}
          >
            <CheckCircle2 className="w-5 h-5" />
            Complete Set
            <span className="text-sm" aria-hidden="true">+{XP_REWARDS.SET_COMPLETION} XP</span>
          </button>
        )}

        {/* Exercise Complete Button */}
        {exerciseSetTracking.currentSet === exerciseSetTracking.totalSets &&
         exerciseSetTracking.sets[exerciseSetTracking.currentSet - 1]?.completed && (
          <button
            onClick={onExerciseComplete}
            className="w-full flex items-center justify-center gap-2 py-4 mt-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-colors font-medium touch-manipulation min-h-[56px]"
            aria-label={`Finish exercise and earn ${XP_REWARDS.EXERCISE_COMPLETION} experience points`}
          >
            <Award className="w-5 h-5" />
            Finish Exercise
            <span className="text-sm" aria-hidden="true">+{XP_REWARDS.EXERCISE_COMPLETION} XP</span>
          </button>
        )}

      </div>

      {/* XP Indicators */}
      {isActive && (
        <div className="px-4 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <Zap className="w-4 h-4" />
              <span className="font-medium">XP Opportunities:</span>
            </div>
            <div className="mt-2 space-y-1 text-xs text-yellow-700">
              <div>• Set completion: +{XP_REWARDS.SET_COMPLETION} XP</div>
              <div>• Perfect rest timing: +{XP_REWARDS.PERFECT_REST_TIMING} XP</div>
              <div>• Personal best: +{XP_REWARDS.PERSONAL_BEST} XP</div>
              <div>• Exercise completion: +{XP_REWARDS.EXERCISE_COMPLETION} XP</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetTracker;