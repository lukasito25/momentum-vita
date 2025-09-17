import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
  CheckCircle2,
  Plus,
  Minus,
  Clock,
  Target,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import { SetData, ExerciseSetTracking, XP_REWARDS } from '../types/SetTracking';

export interface TimerExercise {
  name: string;
  sets: string;
  rest: string;
  notes: string;
  currentWeight?: number;
  completed?: boolean;
  // Enhanced set tracking
  exerciseSetTracking?: ExerciseSetTracking;
}

export interface WorkoutTimerProps {
  exercise: TimerExercise;
  dayName: string;
  exerciseIndex: number;
  onComplete: (exerciseIndex: number, weight: number) => void;
  onWeightChange: (exerciseIndex: number, newWeight: number) => void;
  onSetComplete?: (setData: SetData) => void;
  onSetUpdate?: (setData: Partial<SetData>) => void;
  onClose: () => void;
  isPopup?: boolean;
  enhancedMode?: boolean; // Enable enhanced set tracking
}

interface TimerState {
  currentSet: number;
  totalSets: number;
  restTime: number;
  setTime: number;
  isResting: boolean;
  isRunning: boolean;
  timeRemaining: number;
  setStartTime: number;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  exercise,
  dayName,
  exerciseIndex,
  onComplete,
  onWeightChange,
  onSetComplete,
  onSetUpdate,
  onClose,
  isPopup = false,
  enhancedMode = false
}) => {
  // Parse sets from string (e.g., "4 x 8-10" -> 4 sets)
  const parseSetCount = (setsString: string): number => {
    const match = setsString.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };

  // Parse rest time from string (e.g., "3 min" -> 180 seconds)
  const parseRestTime = (restString: string): number => {
    if (restString === "N/A") return 0;
    const match = restString.match(/(\d+(?:\.\d+)?)\s*(min|sec)/i);
    if (!match) return 90; // Default 90 seconds
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return unit === 'min' ? value * 60 : value;
  };

  const totalSets = parseSetCount(exercise.sets);
  const defaultRestTime = parseRestTime(exercise.rest);

  const [timerState, setTimerState] = useState<TimerState>({
    currentSet: 1,
    totalSets,
    restTime: defaultRestTime,
    setTime: 0,
    isResting: false,
    isRunning: false,
    timeRemaining: 0,
    setStartTime: 0
  });

  const [currentWeight, setCurrentWeight] = useState(exercise.currentWeight || 0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [completedSets, setCompletedSets] = useState<boolean[]>(new Array(totalSets).fill(false));

  // Enhanced set tracking state
  const [currentSetData, setCurrentSetData] = useState<SetData | null>(null);
  const [actualReps, setActualReps] = useState<number | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [setXPEarned, setSetXPEarned] = useState(0);
  const [showPersonalBest, setShowPersonalBest] = useState(false);

  // Initialize enhanced mode data
  useEffect(() => {
    if (enhancedMode && exercise.exerciseSetTracking) {
      const currentSet = exercise.exerciseSetTracking.sets[timerState.currentSet - 1];
      if (currentSet) {
        setCurrentSetData(currentSet);
        setCurrentWeight(currentSet.weight);
      }
    }
  }, [enhancedMode, exercise.exerciseSetTracking, timerState.currentSet]);

  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio context for notifications
  useEffect(() => {
    // Create audio context for beep sounds
    if (soundEnabled) {
      try {
        audioRef.current = new Audio();
      } catch (error) {
        console.warn('Audio not supported');
      }
    }
  }, [soundEnabled]);

  // Generate beep sound
  const playBeep = useCallback((frequency: number = 800, duration: number = 200) => {
    if (!soundEnabled || !audioRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Could not play audio:', error);
    }
  }, [soundEnabled]);

  // Timer tick function
  useEffect(() => {
    if (timerState.isRunning) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.isResting) {
            const newTime = prev.timeRemaining - 1;
            if (newTime <= 0) {
              // Rest complete - ready for next set
              playBeep(1000, 300);
              return {
                ...prev,
                isResting: false,
                isRunning: false,
                timeRemaining: 0,
                setStartTime: Date.now()
              };
            }

            // Audio cues for rest timer
            if (newTime === 10) playBeep(600, 100);
            if (newTime === 5) playBeep(600, 100);
            if (newTime === 3) playBeep(800, 100);
            if (newTime === 2) playBeep(800, 100);
            if (newTime === 1) playBeep(800, 100);

            return { ...prev, timeRemaining: newTime };
          } else {
            // Set in progress - track time spent
            const elapsed = Math.floor((Date.now() - prev.setStartTime) / 1000);
            return { ...prev, setTime: elapsed };
          }
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.isResting, playBeep]);

  // Start set timer
  const startSet = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isResting: false,
      setStartTime: Date.now(),
      setTime: 0
    }));
  };

  // Complete current set and start rest
  const completeSet = () => {
    const newCompletedSets = [...completedSets];
    newCompletedSets[timerState.currentSet - 1] = true;
    setCompletedSets(newCompletedSets);

    // Enhanced set tracking
    if (enhancedMode && currentSetData && onSetComplete) {
      const completedSetData: SetData = {
        ...currentSetData,
        weight: currentWeight,
        reps: actualReps || undefined,
        rpe: rpe || undefined,
        duration: timerState.setTime,
        restDuration: timerState.isResting ? timerState.restTime - timerState.timeRemaining : undefined,
        completed: true,
        timestamp: new Date().toISOString()
      };

      // Calculate XP for this set
      let xpEarned = XP_REWARDS.SET_COMPLETION;

      // Target reps bonus
      if (actualReps && currentSetData.targetReps) {
        const [min, max] = currentSetData.targetReps.split('-').map(n => parseInt(n));
        if (actualReps >= min && (!max || actualReps <= max)) {
          xpEarned += 2; // Target hit bonus
        }
        if (max && actualReps > max) {
          xpEarned += 5; // Exceeded target bonus
        }
      }

      // Perfect rest timing bonus
      if (timerState.isResting && Math.abs(timerState.timeRemaining) <= 10) {
        xpEarned += XP_REWARDS.PERFECT_REST_TIMING;
      }

      // RPE efficiency bonus
      if (rpe && rpe >= 7 && rpe <= 8) {
        xpEarned += 3; // Optimal intensity bonus
      }

      // Check for personal best (simplified check)
      if (currentWeight > (exercise.currentWeight || 0)) {
        xpEarned += XP_REWARDS.PERSONAL_BEST;
        setShowPersonalBest(true);
        setTimeout(() => setShowPersonalBest(false), 3000);
      }

      setSetXPEarned(xpEarned);
      onSetComplete(completedSetData);

      // Reset for next set
      setActualReps(null);
      setRpe(null);
    }

    if (timerState.currentSet < timerState.totalSets) {
      // Start rest period
      setTimerState(prev => ({
        ...prev,
        currentSet: prev.currentSet + 1,
        isResting: true,
        isRunning: true,
        timeRemaining: prev.restTime
      }));
      playBeep(600, 500);
    } else {
      // Exercise complete
      setTimerState(prev => ({ ...prev, isRunning: false }));
      playBeep(1200, 800);
      onComplete(exerciseIndex, currentWeight);
    }
  };

  // Move to next set
  const nextSet = () => {
    if (timerState.currentSet < timerState.totalSets) {
      setTimerState(prev => ({
        ...prev,
        currentSet: prev.currentSet + 1,
        isResting: false,
        isRunning: false,
        timeRemaining: 0,
        setTime: 0
      }));
    }
  };

  // Move to previous set
  const previousSet = () => {
    if (timerState.currentSet > 1) {
      setTimerState(prev => ({
        ...prev,
        currentSet: prev.currentSet - 1,
        isResting: false,
        isRunning: false,
        timeRemaining: 0,
        setTime: 0
      }));
      const newCompletedSets = [...completedSets];
      newCompletedSets[timerState.currentSet - 2] = false;
      setCompletedSets(newCompletedSets);
    }
  };

  // Reset current set
  const resetSet = () => {
    setTimerState(prev => ({
      ...prev,
      isResting: false,
      isRunning: false,
      timeRemaining: 0,
      setTime: 0
    }));
  };

  // Weight adjustment functions
  const adjustWeight = (change: number) => {
    const newWeight = Math.max(0, currentWeight + change);
    setCurrentWeight(newWeight);
    onWeightChange(exerciseIndex, newWeight);

    // Update current set data in enhanced mode
    if (enhancedMode && currentSetData && onSetUpdate) {
      const updatedSetData = { ...currentSetData, weight: newWeight };
      setCurrentSetData(updatedSetData);
      onSetUpdate(updatedSetData);
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const getProgress = (): number => {
    if (timerState.isResting && timerState.restTime > 0) {
      return ((timerState.restTime - timerState.timeRemaining) / timerState.restTime) * 100;
    }
    return (completedSets.filter(Boolean).length / timerState.totalSets) * 100;
  };

  // Component content
  const renderTimer = () => (
    <div className={`bg-white rounded-xl shadow-2xl ${isPopup ? 'w-80' : 'w-full max-w-md mx-auto'} overflow-hidden`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-bold text-sm">Workout Timer</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {isPopup && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Close timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center">
          <h3 className="font-bold text-lg leading-tight">{exercise.name}</h3>
          <p className="text-sm opacity-90">{dayName}</p>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Set Progress */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Set {timerState.currentSet} of {timerState.totalSets}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {exercise.sets}
                </span>
                {enhancedMode && currentSetData && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {currentSetData.targetReps} reps
                  </span>
                )}
                {enhancedMode && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    +{XP_REWARDS.SET_COMPLETION}+ XP
                  </span>
                )}
              </div>
            </div>

            {/* Set indicators */}
            <div className="flex gap-1 mb-3">
              {Array.from({ length: timerState.totalSets }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    completedSets[i]
                      ? 'bg-green-500'
                      : i === timerState.currentSet - 1
                        ? timerState.isRunning
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-blue-300'
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  timerState.isResting ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${getProgress()}%` }}
              />
            </div>

            {/* XP and Personal Best indicators */}
            {enhancedMode && (
              <div className="flex items-center justify-between mt-2">
                {setXPEarned > 0 && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Zap className="w-3 h-3" />
                    +{setXPEarned} XP
                  </div>
                )}
                {showPersonalBest && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 animate-bounce">
                    <Award className="w-3 h-3" />
                    Personal Best!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timer Display */}
          <div className="p-6 text-center">
            {timerState.isResting ? (
              <div>
                <div className="text-3xl font-mono font-bold text-orange-600 mb-2">
                  {formatTime(timerState.timeRemaining)}
                </div>
                <p className="text-sm text-orange-700 mb-4">Rest Time Remaining</p>
                <div className="text-xs text-gray-600">
                  Next: Set {timerState.currentSet + 1} of {timerState.totalSets}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
                  {formatTime(timerState.setTime)}
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  {timerState.isRunning ? 'Set in Progress' : 'Ready to Start Set'}
                </p>
                <div className="text-xs text-gray-600">
                  Rest: {exercise.rest} after this set
                </div>
              </div>
            )}
          </div>

          {/* Weight Controls */}
          <div className="px-4 py-3 bg-gray-50 border-y">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Weight:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustWeight(-2.5)}
                  className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center font-mono text-sm bg-white py-2 px-1 rounded-lg border">
                  {currentWeight}kg
                </span>
                <button
                  onClick={() => adjustWeight(2.5)}
                  className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Exercise Notes */}
          <div className="px-4 py-3 bg-yellow-50 border-b">
            <p className="text-xs text-yellow-800 leading-relaxed">
              <strong>Technique:</strong> {exercise.notes}
            </p>
          </div>

          {/* Enhanced Tracking Fields */}
          {enhancedMode && (
            <div className="px-4 py-3 bg-blue-50 border-b">
              <div className="grid grid-cols-2 gap-3">
                {/* Actual Reps */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Actual Reps
                  </label>
                  <input
                    type="number"
                    value={actualReps || ''}
                    onChange={(e) => setActualReps(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder={currentSetData?.targetReps || 'Target reps'}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={timerState.isResting}
                  />
                </div>

                {/* RPE Rating */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    RPE (1-10)
                  </label>
                  <select
                    value={rpe || ''}
                    onChange={(e) => setRpe(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={timerState.isResting}
                  >
                    <option value="">-</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* XP Opportunities */}
              <div className="mt-3 p-2 bg-yellow-100 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 text-xs font-medium mb-1">
                  <Zap className="w-3 h-3" />
                  XP Opportunities
                </div>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div>• Set completion: +{XP_REWARDS.SET_COMPLETION} XP</div>
                  <div>• Perfect rest timing: +{XP_REWARDS.PERFECT_REST_TIMING} XP</div>
                  <div>• Personal best: +{XP_REWARDS.PERSONAL_BEST} XP</div>
                  {timerState.currentSet === timerState.totalSets && (
                    <div>• Exercise completion: +{XP_REWARDS.EXERCISE_COMPLETION} XP</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timer Controls */}
          <div className="p-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={previousSet}
                disabled={timerState.currentSet === 1}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous set"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {timerState.isResting ? (
                <button
                  onClick={() => setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                  className={`p-3 rounded-lg text-white transition-colors ${
                    timerState.isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
                  title={timerState.isRunning ? "Pause rest" : "Resume rest"}
                >
                  {timerState.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              ) : (
                <>
                  {!timerState.isRunning ? (
                    <button
                      onClick={startSet}
                      className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Start set"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setTimerState(prev => ({ ...prev, isRunning: false }))}
                      className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Pause set"
                    >
                      <Pause className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={resetSet}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Reset current set"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={nextSet}
                disabled={timerState.currentSet === timerState.totalSets}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next set"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!timerState.isResting && (
                <button
                  onClick={completeSet}
                  disabled={!timerState.isRunning && timerState.setTime === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Set
                  {enhancedMode && (
                    <span className="text-xs">+{XP_REWARDS.SET_COMPLETION}+ XP</span>
                  )}
                </button>
              )}

              {timerState.currentSet === timerState.totalSets && completedSets.every(Boolean) && (
                <button
                  onClick={() => onComplete(exerciseIndex, currentWeight)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finish Exercise
                  {enhancedMode && (
                    <span className="text-xs">+{XP_REWARDS.EXERCISE_COMPLETION} XP</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return renderTimer();
};

export default WorkoutTimer;