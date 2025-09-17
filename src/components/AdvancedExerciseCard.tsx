import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Play,
  Timer,
  Plus,
  Minus,
  Target,
  Clock,
  TrendingUp,
  Award,
  Zap,
  FileText,
  BarChart3,
  Repeat,
  User
} from 'lucide-react';
import {
  AdvancedExerciseCardProps,
  SetData,
  ExerciseSetTracking,
  RPE_DESCRIPTIONS,
  XP_REWARDS
} from '../types/SetTracking';

const AdvancedExerciseCard: React.FC<AdvancedExerciseCardProps> = ({
  exercise,
  exerciseSetTracking,
  dayName,
  exerciseIndex,
  week,
  isExpanded,
  onToggleExpanded,
  onSetComplete,
  onSetUpdate,
  onExerciseComplete,
  onLaunchTimer,
  showAnalytics = true
}) => {
  const [currentWeight, setCurrentWeight] = useState(0);
  const [actualReps, setActualReps] = useState<{[key: number]: number}>({});
  const [rpeValues, setRpeValues] = useState<{[key: number]: number}>({});
  const [setNotes, setSetNotes] = useState<{[key: number]: string}>({});

  const isCompleted = exerciseSetTracking.completed;
  const completedSets = exerciseSetTracking.sets.filter(set => set.completed).length;
  const totalSets = exerciseSetTracking.totalSets;
  const isArmFocus = exercise.notes.includes('ARM FOCUS') || exercise.notes.includes('ARM BONUS');

  // Initialize current weight from first incomplete set or last completed set
  useEffect(() => {
    const currentSet = exerciseSetTracking.sets.find(set => !set.completed);
    const lastCompletedSet = exerciseSetTracking.sets.filter(set => set.completed).pop();
    const weight = currentSet?.weight || lastCompletedSet?.weight || 0;
    setCurrentWeight(weight);
  }, [exerciseSetTracking]);

  // Parse target reps from sets string (e.g., "4 x 8-10" -> "8-10")
  const parseTargetReps = (setsString: string): string => {
    const match = setsString.match(/x\s*(\d+(?:-\d+)?)/);
    return match ? match[1] : '8-10';
  };

  const targetReps = parseTargetReps(exercise.sets);

  // Update weight for a specific set
  const updateSetWeight = (setNumber: number, newWeight: number) => {
    setCurrentWeight(newWeight);
    const setIndex = setNumber - 1;
    if (exerciseSetTracking.sets[setIndex]) {
      const updatedSet: Partial<SetData> = {
        ...exerciseSetTracking.sets[setIndex],
        weight: newWeight
      };
      onSetUpdate(updatedSet);
    }
  };

  // Complete a specific set
  const completeSet = (setNumber: number) => {
    const setIndex = setNumber - 1;
    const currentSet = exerciseSetTracking.sets[setIndex];

    if (currentSet) {
      const completedSetData: SetData = {
        ...currentSet,
        weight: currentWeight,
        reps: actualReps[setNumber] || undefined,
        rpe: rpeValues[setNumber] || undefined,
        completed: true,
        timestamp: new Date().toISOString(),
        notes: setNotes[setNumber] || undefined
      };

      onSetComplete(completedSetData);

      // Check if all sets are completed
      const updatedSets = [...exerciseSetTracking.sets];
      updatedSets[setIndex] = completedSetData;

      if (updatedSets.every(set => set.completed)) {
        setTimeout(() => onExerciseComplete(), 500);
      }
    }
  };

  // Get XP earned for a set based on performance
  const getSetXP = (setNumber: number): number => {
    let xp = XP_REWARDS.SET_COMPLETION;

    // Bonus for hitting target reps
    const reps = actualReps[setNumber];
    if (reps) {
      const [min, max] = targetReps.split('-').map(n => parseInt(n));
      if (reps >= min && (!max || reps <= max)) {
        xp += 2; // Target hit bonus
      }
      if (max && reps > max) {
        xp += 5; // Exceeded target bonus
      }
    }

    // RPE bonus (efficient training)
    const rpe = rpeValues[setNumber];
    if (rpe && rpe >= 7 && rpe <= 8) {
      xp += 3; // Optimal intensity bonus
    }

    return xp;
  };

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    return Math.round((completedSets / totalSets) * 100);
  };

  // Get demo URLs
  const getDemoUrl = () => ({
    video: "https://www.youtube.com/results?search_query=" + exercise.name.replace(/\s+/g, '+'),
    guide: "https://www.google.com/search?q=" + exercise.name.replace(/\s+/g, '+')
  });

  const demos = getDemoUrl();

  return (
    <div
      className={`rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
        isCompleted
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-lg'
          : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 hover:shadow-lg hover:from-blue-50 hover:to-indigo-50'
      } ${isArmFocus ? 'ring-2 ring-orange-400 ring-opacity-50 bg-gradient-to-r from-orange-50 to-amber-50' : ''}`}
    >
      {/* Exercise Header */}
      <div className="p-4">
        <div className="flex items-start gap-4 mb-4">
          <button
            onClick={() => !isExpanded && completeSet(exerciseSetTracking.currentSet)}
            className="mt-1 flex-shrink-0 touch-manipulation group"
            disabled={isExpanded}
          >
            {isCompleted ? (
              <div className="p-1 bg-green-500 rounded-full shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="p-1 border-2 border-gray-300 rounded-full group-hover:border-blue-400 transition-colors">
                <Circle className="w-6 h-6 text-gray-400 group-hover:text-blue-400" />
              </div>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className={`font-bold text-base leading-tight ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
                  {exercise.name}
                  {isArmFocus && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs bg-gradient-to-r from-orange-400 to-amber-500 text-white px-2 py-1 rounded-full font-bold shadow-sm">
                      <span>💪</span> ARM
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="font-mono bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm">
                  {exercise.sets}
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full font-bold shadow-sm">
                    <span>✨</span> +{XP_REWARDS.EXERCISE_COMPLETION} XP
                  </span>
                )}
              </div>
            </div>

            {/* Progress Overview */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">
                  Sets: {completedSets}/{totalSets}
                </span>
                <span className={`font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                  {getProgressPercentage()}%
                </span>
              </div>

              {/* Set Progress Indicators */}
              <div className="flex gap-1 mb-3">
                {Array.from({ length: totalSets }, (_, i) => {
                  const setNumber = i + 1;
                  const set = exerciseSetTracking.sets[i];
                  const isCurrentSet = setNumber === exerciseSetTracking.currentSet;

                  return (
                    <div
                      key={setNumber}
                      className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                        set?.completed
                          ? 'bg-green-500 shadow-md'
                          : isCurrentSet
                            ? 'bg-blue-400 animate-pulse shadow-md'
                            : 'bg-gray-200'
                      } relative overflow-hidden`}
                    >
                      {set?.completed && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {exercise.rest !== "N/A" && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 bg-blue-50 px-3 py-2 rounded-xl">
                <div className="p-1 bg-blue-500 rounded-full">
                  <Clock className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold">Rest: {exercise.rest}</span>
              </div>
            )}

            <p className="text-sm text-gray-700 mb-4 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
              {exercise.notes}
            </p>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
          {/* Weight Control */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700">Weight:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSetWeight(exerciseSetTracking.currentSet, currentWeight - 2.5)}
                className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 touch-manipulation active:scale-95 shadow-md hover:shadow-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-16 text-center font-mono text-sm font-bold bg-gradient-to-r from-slate-100 to-gray-100 py-2 px-1 rounded-lg border border-gray-300 shadow-inner">
                {currentWeight}kg
              </span>
              <button
                onClick={() => updateSetWeight(exerciseSetTracking.currentSet, currentWeight + 2.5)}
                className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all duration-200 touch-manipulation active:scale-95 shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onToggleExpanded}
              className={`flex items-center gap-2 px-3 py-2 ${isExpanded ? 'bg-gradient-to-r from-gray-500 to-gray-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-95 font-medium`}
              title={isExpanded ? "Collapse sets" : "Expand sets"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Sets
            </button>

            <button
              onClick={onLaunchTimer}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 touch-manipulation active:scale-95 shadow-md hover:shadow-lg font-medium"
              title="Open workout timer"
            >
              <Timer className="w-4 h-4" />
              Timer
            </button>
          </div>
        </div>

        {/* Demo Links */}
        <div className="flex gap-2 mb-4">
          <a
            href={demos.video}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 touch-manipulation active:scale-95 shadow-md hover:shadow-lg font-medium"
          >
            <Play className="w-4 h-4" />
            Video
          </a>
          <a
            href={demos.guide}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 touch-manipulation active:scale-95 shadow-md hover:shadow-lg font-medium"
          >
            <FileText className="w-4 h-4" />
            Guide
          </a>
          {showAnalytics && (
            <button className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 touch-manipulation active:scale-95 shadow-md hover:shadow-lg font-medium">
              <BarChart3 className="w-4 h-4" />
              Stats
            </button>
          )}
        </div>
      </div>

      {/* Expanded Set Details */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-blue-800">Set-by-Set Tracking</h4>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                Target: {targetReps} reps
              </span>
            </div>

            {exerciseSetTracking.sets.map((set, index) => {
              const setNumber = set.setNumber;
              const isCurrentSet = setNumber === exerciseSetTracking.currentSet;
              const setXP = getSetXP(setNumber);

              return (
                <div
                  key={setNumber}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    set.completed
                      ? 'bg-green-50 border-green-300 shadow-md'
                      : isCurrentSet
                        ? 'bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200'
                        : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        set.completed
                          ? 'bg-green-500 text-white'
                          : isCurrentSet
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {set.completed ? '✓' : setNumber}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Set {setNumber}</span>
                        {isCurrentSet && !set.completed && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            Current
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {set.completed && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                          +{setXP} XP
                        </span>
                      )}
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {set.weight}kg
                      </span>
                    </div>
                  </div>

                  {!set.completed && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {/* Actual Reps Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Actual Reps
                        </label>
                        <input
                          type="number"
                          value={actualReps[setNumber] || ''}
                          onChange={(e) => setActualReps(prev => ({
                            ...prev,
                            [setNumber]: e.target.value ? parseInt(e.target.value) : 0
                          }))}
                          placeholder={targetReps}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* RPE Rating */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          RPE (1-10)
                        </label>
                        <select
                          value={rpeValues[setNumber] || ''}
                          onChange={(e) => setRpeValues(prev => ({
                            ...prev,
                            [setNumber]: e.target.value ? parseInt(e.target.value) : 0
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select RPE</option>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                              {num} - {RPE_DESCRIPTIONS[num as keyof typeof RPE_DESCRIPTIONS].split(' - ')[1]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Set Notes */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={setNotes[setNumber] || ''}
                          onChange={(e) => setSetNotes(prev => ({
                            ...prev,
                            [setNumber]: e.target.value
                          }))}
                          placeholder="Optional notes..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {set.completed && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-white p-2 rounded-lg">
                        <div className="text-xs text-gray-600">Reps</div>
                        <div className="font-bold">{set.reps || '-'}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg">
                        <div className="text-xs text-gray-600">RPE</div>
                        <div className="font-bold">{set.rpe || '-'}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg">
                        <div className="text-xs text-gray-600">Duration</div>
                        <div className="font-bold">{set.duration ? `${Math.floor(set.duration / 60)}:${(set.duration % 60).toString().padStart(2, '0')}` : '-'}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg">
                        <div className="text-xs text-gray-600">Rest</div>
                        <div className="font-bold">{set.restDuration ? `${Math.floor(set.restDuration / 60)}:${(set.restDuration % 60).toString().padStart(2, '0')}` : '-'}</div>
                      </div>
                    </div>
                  )}

                  {!set.completed && isCurrentSet && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => completeSet(setNumber)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Set
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          +{setXP} XP
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Exercise Summary */}
            {showAnalytics && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 mt-4">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Exercise Analytics
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{completedSets}</div>
                    <div className="text-xs text-gray-600">Sets Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {exerciseSetTracking.sets.reduce((sum, set) => sum + (set.reps || 0), 0)}
                    </div>
                    <div className="text-xs text-gray-600">Total Reps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {exerciseSetTracking.sets.reduce((sum, set) => sum + (set.weight * (set.reps || 0)), 0)}
                    </div>
                    <div className="text-xs text-gray-600">Volume (kg)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {exerciseSetTracking.sets.filter(set => set.rpe).length > 0
                        ? Math.round(exerciseSetTracking.sets.reduce((sum, set) => sum + (set.rpe || 0), 0) / exerciseSetTracking.sets.filter(set => set.rpe).length)
                        : '-'}
                    </div>
                    <div className="text-xs text-gray-600">Avg RPE</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedExerciseCard;