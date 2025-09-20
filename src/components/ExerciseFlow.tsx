import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  SkipForward,
  X,
  Timer,
  Plus,
  Minus,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  rest: string;
  notes: string;
}

interface ExerciseFlowProps {
  exercises: Exercise[];
  onComplete: () => void;
  onExit: () => void;
  currentExerciseIndex?: number;
}

interface SetData {
  weight: number;
  reps: number;
  completed: boolean;
}

const ExerciseFlow: React.FC<ExerciseFlowProps> = ({
  exercises,
  onComplete,
  onExit,
  currentExerciseIndex = 0,
}) => {
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(currentExerciseIndex);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState('');
  const [exerciseData, setExerciseData] = useState<Record<string, SetData[]>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentExercise = exercises[activeExerciseIndex];
  const totalSets = parseInt(currentExercise?.sets.split('x')[0] || '3');
  const targetReps = currentExercise?.sets.match(/x\s*(\d+(?:-\d+)?)/)?.[1] || '8-10';
  const restDuration = parseRestTime(currentExercise?.rest || '90 sec');

  // Parse rest time from string
  function parseRestTime(restString: string): number {
    if (restString === "N/A") return 0;
    const match = restString.match(/(\d+(?:\.\d+)?)\s*(min|sec)/i);
    if (!match) return 90;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return unit === 'min' ? value * 60 : value;
  }

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsResting(false);
            playSound('complete');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, restTime]);

  // Audio feedback
  const playSound = (type: 'start' | 'complete' | 'rest') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies = { start: 800, complete: 1000, rest: 600 };
      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Silently fail if audio context is not available
    }
  };

  const handleCompleteSet = () => {
    const exerciseId = currentExercise.id;
    const setData: SetData = {
      weight,
      reps: parseInt(reps) || 0,
      completed: true,
    };

    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), setData],
    }));

    if (currentSet >= totalSets) {
      // Exercise complete
      if (activeExerciseIndex >= exercises.length - 1) {
        // Workout complete
        playSound('complete');
        onComplete();
        return;
      }

      // Move to next exercise
      setActiveExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setWeight(0);
      setReps('');
      setIsResting(false);
      playSound('complete');
    } else {
      // Start rest period
      if (restDuration > 0) {
        setIsResting(true);
        setRestTime(restDuration);
        setIsTimerRunning(true);
        playSound('rest');
      }
      setCurrentSet(prev => prev + 1);
      setReps('');
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setIsTimerRunning(false);
    setRestTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((activeExerciseIndex + (currentSet - 1) / totalSets) / exercises.length) * 100;

  if (!currentExercise) {
    return null;
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="page-header px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
            aria-label="Exit workout"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-gray-900">
              Exercise {activeExerciseIndex + 1} of {exercises.length}
            </h1>
            <p className="text-sm text-gray-600">Set {currentSet} of {totalSets}</p>
          </div>
          <button
            onClick={onExit}
            className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
            aria-label="Close workout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {/* Rest Timer */}
        {isResting && (
          <div className="card mb-6 bg-orange-50 border-orange-200">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Timer className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-orange-900 mb-2">Rest Time</h2>
              <div className="text-4xl font-mono font-bold text-orange-700 mb-4">
                {formatTime(restTime)}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSkipRest}
                  className="btn btn-secondary touch-feedback"
                >
                  Skip Rest
                </button>
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="btn btn-primary touch-feedback"
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Card */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentExercise.name}
              </h2>
              <p className="text-gray-600">
                Target: {targetReps} reps
              </p>
            </div>

            {/* Weight Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Weight (kg)
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setWeight(Math.max(0, weight - 2.5))}
                  className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center touch-feedback"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{weight}</div>
                  <div className="text-sm text-gray-600">kg</div>
                </div>
                <button
                  onClick={() => setWeight(weight + 2.5)}
                  className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center touch-feedback"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reps Input */}
            <div className="mb-6">
              <label htmlFor="reps" className="block text-sm font-medium text-gray-700 mb-2">
                Completed Reps
              </label>
              <input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={targetReps}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleCompleteSet}
              disabled={!reps || isResting}
              className="w-full btn btn-success btn-lg touch-feedback disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {currentSet >= totalSets
                ? activeExerciseIndex >= exercises.length - 1
                  ? 'Complete Workout'
                  : 'Next Exercise'
                : 'Complete Set'
              }
            </button>
          </div>
        </div>

        {/* Exercise Notes */}
        {currentExercise.notes && (
          <div className="card bg-yellow-50 border-yellow-200 mb-6">
            <div className="card-body">
              <h3 className="font-semibold text-yellow-900 mb-2">Exercise Notes</h3>
              <p className="text-sm text-yellow-800">{currentExercise.notes}</p>
            </div>
          </div>
        )}

        {/* Exercise Navigation */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold text-gray-900 mb-4">Exercise Progress</h3>
            <div className="space-y-2">
              {exercises.map((exercise, index) => {
                const isActive = index === activeExerciseIndex;
                const isCompleted = index < activeExerciseIndex;
                const completedSets = exerciseData[exercise.id]?.length || 0;
                const exerciseTotalSets = parseInt(exercise.sets.split('x')[0] || '3');

                return (
                  <div
                    key={exercise.id}
                    className={`flex items-center p-3 rounded-lg ${
                      isActive
                        ? 'bg-indigo-50 border border-indigo-200'
                        : isCompleted
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`font-medium ${
                        isActive ? 'text-indigo-900' : isCompleted ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {exercise.name}
                      </p>
                      <p className={`text-sm ${
                        isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {isActive ? `Set ${currentSet}/${exerciseTotalSets}` :
                         isCompleted ? `${completedSets}/${exerciseTotalSets} completed` :
                         exercise.sets}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : isActive ? (
                        <div className="w-5 h-5 bg-indigo-600 rounded-full animate-pulse-soft" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseFlow;