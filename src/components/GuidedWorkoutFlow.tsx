import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  Trophy,
  Timer,
  RotateCcw,
  X,
  ArrowRight,
  ArrowLeft,
  Award,
  TrendingUp,
  Save,
  Minus,
  Plus
} from 'lucide-react';
import {
  GuidedWorkoutFlowProps,
  WorkoutSessionData,
  ExerciseSetTracking,
  SetData,
  WorkoutFlowState,
  XP_REWARDS
} from '../types/SetTracking';

interface GuidedFlowTimerState {
  isRunning: boolean;
  isResting: boolean;
  timeRemaining: number;
  setStartTime: number;
  currentSetDuration: number;
}

const GuidedWorkoutFlow: React.FC<GuidedWorkoutFlowProps> = ({
  dayName,
  exercises,
  week,
  phase,
  onWorkoutComplete,
  onWorkoutPause,
  onWorkoutResume,
  onWorkoutAbandon
}) => {
  // Workout flow state
  const [flowState, setFlowState] = useState<WorkoutFlowState>({
    currentExercise: 0,
    currentSet: 1,
    isWorkoutActive: false,
    isSetActive: false,
    isResting: false,
    restTimeRemaining: 0,
    workoutStartTime: undefined,
    exerciseStartTime: undefined,
    setStartTime: undefined,
    mode: 'guided'
  });

  // Timer state
  const [timerState, setTimerState] = useState<GuidedFlowTimerState>({
    isRunning: false,
    isResting: false,
    timeRemaining: 0,
    setStartTime: 0,
    currentSetDuration: 0
  });

  // Exercise tracking state
  const [exerciseTrackingData, setExerciseTrackingData] = useState<ExerciseSetTracking[]>([]);
  const [currentWeight, setCurrentWeight] = useState<{[key: number]: number}>({});
  const [actualReps, setActualReps] = useState<number | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [setNotes, setSetNotes] = useState<string>('');

  // Session data
  const [sessionXP, setSessionXP] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize exercise tracking data
  useEffect(() => {
    const initializeExerciseData = () => {
      const trackingData: ExerciseSetTracking[] = exercises.map((exercise, index) => {
        const setsCount = parseInt(exercise.sets.split('x')[0].trim()) || 4;
        const targetReps = exercise.sets.match(/x\s*(\d+(?:-\d+)?)/)?.[1] || '8-10';
        const restTime = parseRestTime(exercise.rest);

        const sets: SetData[] = Array.from({ length: setsCount }, (_, setIndex) => ({
          id: `${dayName}-${index}-${setIndex + 1}-week${week}`,
          setNumber: setIndex + 1,
          weight: 0,
          targetReps,
          completed: false
        }));

        return {
          exerciseId: `${dayName}-${index}-week${week}`,
          exerciseName: exercise.name,
          totalSets: setsCount,
          targetRestTime: restTime,
          sets,
          currentSet: 1,
          completed: false
        };
      });

      setExerciseTrackingData(trackingData);
      setTotalSets(trackingData.reduce((sum, ex) => sum + ex.totalSets, 0));

      // Initialize weights
      const weights: {[key: number]: number} = {};
      trackingData.forEach((_, index) => {
        weights[index] = 0;
      });
      setCurrentWeight(weights);
    };

    initializeExerciseData();
  }, [exercises, dayName, week]);

  // Parse rest time from string
  const parseRestTime = (restString: string): number => {
    if (restString === "N/A") return 0;
    const match = restString.match(/(\d+(?:\.\d+)?)\s*(min|sec)/i);
    if (!match) return 90;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return unit === 'min' ? value * 60 : value;
  };

  // Timer effects
  useEffect(() => {
    if (timerState.isRunning) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.isResting) {
            const newTime = prev.timeRemaining - 1;
            if (newTime <= 0) {
              // Rest complete
              playBeep(1000, 300);
              return {
                ...prev,
                isResting: false,
                isRunning: false,
                timeRemaining: 0
              };
            }
            // Rest countdown audio cues
            if ([10, 5, 3, 2, 1].includes(newTime)) playBeep(600 + newTime * 40, 100);
            return { ...prev, timeRemaining: newTime };
          } else {
            // Set timer
            const elapsed = Math.floor((Date.now() - prev.setStartTime) / 1000);
            return { ...prev, currentSetDuration: elapsed };
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
  }, [timerState.isRunning]);

  // Audio notifications
  const playBeep = (frequency: number = 800, duration: number = 200) => {
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
  };

  // Start workout
  const startWorkout = () => {
    setFlowState(prev => ({
      ...prev,
      isWorkoutActive: true,
      workoutStartTime: Date.now()
    }));
  };

  // Start current set
  const startSet = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isResting: false,
      setStartTime: Date.now(),
      currentSetDuration: 0
    }));

    setFlowState(prev => ({
      ...prev,
      isSetActive: true,
      setStartTime: Date.now()
    }));
  };

  // Complete current set
  const completeSet = () => {
    const currentExercise = exerciseTrackingData[flowState.currentExercise];
    if (!currentExercise) return;

    const currentSet = currentExercise.sets[flowState.currentSet - 1];
    if (!currentSet) return;

    // Create completed set data
    const completedSetData: SetData = {
      ...currentSet,
      weight: currentWeight[flowState.currentExercise] || 0,
      reps: actualReps || undefined,
      rpe: rpe || undefined,
      duration: timerState.currentSetDuration,
      completed: true,
      timestamp: new Date().toISOString(),
      notes: setNotes || undefined
    };

    // Calculate XP for this set
    let setXP = XP_REWARDS.SET_COMPLETION;
    if (actualReps) {
      const [min, max] = completedSetData.targetReps.split('-').map(n => parseInt(n));
      if (actualReps >= min && (!max || actualReps <= max)) {
        setXP += 2; // Target hit bonus
      }
    }

    // Update exercise tracking data
    setExerciseTrackingData(prev => {
      const updated = [...prev];
      updated[flowState.currentExercise] = {
        ...currentExercise,
        sets: currentExercise.sets.map((set, index) =>
          index === flowState.currentSet - 1 ? completedSetData : set
        ),
        currentSet: Math.min(flowState.currentSet + 1, currentExercise.totalSets)
      };
      return updated;
    });

    setSessionXP(prev => prev + setXP);
    setCompletedSets(prev => prev + 1);

    // Clear set data
    setActualReps(null);
    setRpe(null);
    setSetNotes('');

    // Check if exercise is complete
    if (flowState.currentSet >= currentExercise.totalSets) {
      // Exercise complete
      playBeep(1200, 800);

      // Mark exercise as complete
      setExerciseTrackingData(prev => {
        const updated = [...prev];
        updated[flowState.currentExercise] = {
          ...updated[flowState.currentExercise],
          completed: true,
          completedAt: new Date().toISOString()
        };
        return updated;
      });

      // Award exercise completion XP
      setSessionXP(prev => prev + XP_REWARDS.EXERCISE_COMPLETION);

      // Check if workout is complete
      if (flowState.currentExercise >= exercises.length - 1) {
        completeWorkout();
        return;
      }

      // Move to next exercise
      setTimeout(() => {
        setFlowState(prev => ({
          ...prev,
          currentExercise: prev.currentExercise + 1,
          currentSet: 1,
          isSetActive: false,
          exerciseStartTime: Date.now()
        }));
      }, 2000);

    } else {
      // Start rest period
      const restTime = currentExercise.targetRestTime;
      if (restTime > 0) {
        setTimerState(prev => ({
          ...prev,
          isResting: true,
          isRunning: true,
          timeRemaining: restTime
        }));

        setFlowState(prev => ({
          ...prev,
          currentSet: prev.currentSet + 1,
          isResting: true,
          restTimeRemaining: restTime,
          isSetActive: false
        }));

        playBeep(600, 500);
      } else {
        // No rest, move to next set immediately
        setFlowState(prev => ({
          ...prev,
          currentSet: prev.currentSet + 1,
          isSetActive: false
        }));
      }
    }
  };

  // Complete workout
  const completeWorkout = () => {
    const completedAt = new Date().toISOString();
    const workoutDuration = flowState.workoutStartTime
      ? Math.floor((Date.now() - flowState.workoutStartTime) / 1000)
      : 0;

    const sessionData: WorkoutSessionData = {
      id: `${dayName}-${Date.now()}`,
      dayName,
      weekNumber: week,
      phase,
      programId: 'foundation-builder', // Default, should be passed as prop
      exercises: exerciseTrackingData,
      nutritionGoals: [], // Would be populated if tracking nutrition in guided mode
      startedAt: flowState.workoutStartTime ? new Date(flowState.workoutStartTime).toISOString() : new Date().toISOString(),
      completedAt,
      totalDuration: workoutDuration,
      xpEarned: sessionXP + XP_REWARDS.SESSION_COMPLETION,
      status: 'completed'
    };

    onWorkoutComplete(sessionData);
  };

  // Navigate sets/exercises
  const navigateTo = (exerciseIndex: number, setNumber: number) => {
    setFlowState(prev => ({
      ...prev,
      currentExercise: exerciseIndex,
      currentSet: setNumber,
      isSetActive: false,
      isResting: false
    }));

    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isResting: false,
      timeRemaining: 0
    }));
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current exercise and set
  const currentExercise = exerciseTrackingData[flowState.currentExercise];
  const currentSet = currentExercise?.sets[flowState.currentSet - 1];
  const exercise = exercises[flowState.currentExercise];

  // Calculate progress
  const overallProgress = Math.round((completedSets / totalSets) * 100);
  const exerciseProgress = currentExercise
    ? Math.round(((flowState.currentSet - 1) / currentExercise.totalSets) * 100)
    : 0;

  if (!flowState.isWorkoutActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Guided Workout</h2>
            <p className="text-gray-600">{dayName} - Week {week}</p>
            <p className="text-sm text-gray-500 mt-1">{phase} Phase</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{exercises.length}</div>
                <div className="text-xs text-gray-600">Exercises</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{totalSets}</div>
                <div className="text-xs text-gray-600">Total Sets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">~{Math.round(totalSets * 2.5)}</div>
                <div className="text-xs text-gray-600">Est. Minutes</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Set-by-set guidance and timing</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Automatic rest periods</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Enhanced XP rewards</span>
            </div>
          </div>

          <button
            onClick={startWorkout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Play className="w-6 h-6" />
            Start Guided Workout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6" />
            <div>
              <h1 className="font-bold text-lg">Guided Workout</h1>
              <p className="text-sm text-blue-200">{dayName} - Week {week}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <div className="text-xs text-blue-200">Complete</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white/20 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Current Status */}
        <div className="flex items-center justify-between text-sm">
          <span>Exercise {flowState.currentExercise + 1} of {exercises.length}</span>
          <span>Set {flowState.currentSet} of {currentExercise?.totalSets || 0}</span>
          <span className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            {sessionXP} XP
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Current Exercise Card */}
        {exercise && currentExercise && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{exercise.name}</h2>
                <p className="text-gray-600 text-sm">{exercise.sets}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{exerciseProgress}%</div>
                <div className="text-xs text-gray-600">Exercise Progress</div>
              </div>
            </div>

            {/* Exercise Progress */}
            <div className="flex gap-1 mb-4">
              {currentExercise.sets.map((set, index) => (
                <div
                  key={index}
                  className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                    set.completed
                      ? 'bg-green-500'
                      : index === flowState.currentSet - 1
                        ? 'bg-blue-400 animate-pulse'
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Current Set Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-blue-800">Set {flowState.currentSet}</h3>
                <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                  Target: {currentSet?.targetReps} reps
                </span>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-4">
                {timerState.isResting ? (
                  <div>
                    <div className="text-4xl font-mono font-bold text-orange-600 mb-2">
                      {formatTime(timerState.timeRemaining)}
                    </div>
                    <p className="text-orange-700 font-semibold">Rest Time Remaining</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
                      {formatTime(timerState.currentSetDuration)}
                    </div>
                    <p className="text-blue-700 font-semibold">
                      {flowState.isSetActive ? 'Set in Progress' : 'Ready to Start'}
                    </p>
                  </div>
                )}
              </div>

              {/* Weight Control */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setCurrentWeight(prev => ({
                    ...prev,
                    [flowState.currentExercise]: Math.max(0, (prev[flowState.currentExercise] || 0) - 2.5)
                  }))}
                  className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentWeight[flowState.currentExercise] || 0}kg</div>
                  <div className="text-xs text-gray-600">Weight</div>
                </div>
                <button
                  onClick={() => setCurrentWeight(prev => ({
                    ...prev,
                    [flowState.currentExercise]: (prev[flowState.currentExercise] || 0) + 2.5
                  }))}
                  className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Set Tracking Form */}
              {flowState.isSetActive && !timerState.isResting && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Actual Reps
                    </label>
                    <input
                      type="number"
                      value={actualReps || ''}
                      onChange={(e) => setActualReps(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder={currentSet?.targetReps || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      RPE (1-10)
                    </label>
                    <select
                      value={rpe || ''}
                      onChange={(e) => setRpe(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select RPE</option>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={setNotes}
                      onChange={(e) => setSetNotes(e.target.value)}
                      placeholder="Optional..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!flowState.isSetActive && !timerState.isResting && (
                  <button
                    onClick={startSet}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
                  >
                    <Play className="w-5 h-5" />
                    Start Set
                  </button>
                )}

                {flowState.isSetActive && !timerState.isResting && (
                  <button
                    onClick={completeSet}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Complete Set
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      +{XP_REWARDS.SET_COMPLETION}+ XP
                    </span>
                  </button>
                )}

                {timerState.isResting && (
                  <div className="flex-1 text-center text-orange-700 font-semibold py-3">
                    Next set starts automatically...
                  </div>
                )}
              </div>
            </div>

            {/* Exercise Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-sm text-yellow-800">
                <strong>Technique:</strong> {exercise.notes}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-bold text-gray-800 mb-4">Workout Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exerciseTrackingData.map((exerciseData, exerciseIndex) => (
              <div
                key={exerciseIndex}
                className={`p-3 rounded-xl border transition-all ${
                  exerciseIndex === flowState.currentExercise
                    ? 'border-blue-300 bg-blue-50'
                    : exerciseData.completed
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm truncate">
                    {exercises[exerciseIndex]?.name}
                  </span>
                  {exerciseData.completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="flex gap-1">
                  {exerciseData.sets.map((set, setIndex) => (
                    <button
                      key={setIndex}
                      onClick={() => navigateTo(exerciseIndex, setIndex + 1)}
                      className={`w-6 h-6 text-xs rounded-full transition-all ${
                        set.completed
                          ? 'bg-green-500 text-white'
                          : exerciseIndex === flowState.currentExercise && setIndex + 1 === flowState.currentSet
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {setIndex + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workout Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex gap-3">
            <button
              onClick={onWorkoutPause}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-medium"
            >
              <Pause className="w-5 h-5" />
              Pause Workout
            </button>
            <button
              onClick={onWorkoutAbandon}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
            >
              <X className="w-5 h-5" />
              End Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedWorkoutFlow;