import React, { useState } from 'react';
import {
  X,
  Play,
  Clock,
  Target,
  Zap,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
} from 'lucide-react';
import EnhancedExerciseCard from './EnhancedExerciseCard';
import { getWorkoutProgram, getTodaysWorkout } from '../data/workout-programs';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  rest: string;
  notes: string;
  demo?: string;
}

interface WorkoutPreviewProps {
  programId: string;
  onClose: () => void;
  onStartWorkout: () => void;
  completedExercises?: string[];
}

const WorkoutPreview: React.FC<WorkoutPreviewProps> = ({
  programId,
  onClose,
  onStartWorkout,
  completedExercises = [],
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    preparation: true
  });

  const program = getWorkoutProgram(programId);
  const todaysWorkout = getTodaysWorkout(programId);

  if (!program || !todaysWorkout) {
    return null;
  }

  const { dayName, exercises, difficulty } = todaysWorkout;
  const workoutDay = program.workouts[dayName];

  // Get all difficulty levels available for this workout
  const availableDifficulties = Object.keys(workoutDay.exercises) as Array<'preparation' | 'unleashed' | 'legendary'>;

  const handleToggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDifficultyInfo = (level: string) => {
    switch (level) {
      case 'preparation':
        return {
          label: 'Preparation',
          description: 'Perfect for beginners or active recovery',
          color: 'bg-green-100 text-green-800',
          icon: Target
        };
      case 'unleashed':
        return {
          label: 'Unleashed',
          description: 'Intermediate to advanced training',
          color: 'bg-orange-100 text-orange-800',
          icon: Zap
        };
      case 'legendary':
        return {
          label: 'Legendary',
          description: 'Elite level, maximum intensity',
          color: 'bg-red-100 text-red-800',
          icon: Zap
        };
      default:
        return {
          label: level,
          description: '',
          color: 'bg-gray-100 text-gray-800',
          icon: Target
        };
    }
  };

  const calculateWorkoutStats = (exercises: Exercise[]) => {
    const totalExercises = exercises.length;
    const estimatedTime = exercises.reduce((total, exercise) => {
      const setsCount = parseInt(exercise.sets.split('x')[0]) || 3;
      const restTime = parseRestTime(exercise.rest);
      return total + (setsCount * 45) + ((setsCount - 1) * restTime); // 45s per set + rest
    }, 0);

    return {
      totalExercises,
      estimatedTime: Math.round(estimatedTime / 60), // Convert to minutes
      completedCount: exercises.filter(ex => completedExercises.includes(ex.id)).length
    };
  };

  const parseRestTime = (restString: string): number => {
    if (restString === "N/A") return 0;
    const match = restString.match(/(\d+(?:\.\d+)?)\s*(min|sec)/i);
    if (!match) return 60;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    return unit === 'min' ? value * 60 : value;
  };

  const currentStats = calculateWorkoutStats(exercises);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="mobile-container max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{dayName}</h1>
              <p className="text-sm text-gray-600">{program.name} - Week 1</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workout Stats */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-900">{currentStats.totalExercises}</div>
                <div className="text-xs text-blue-600">Exercises</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-900">{currentStats.estimatedTime}m</div>
                <div className="text-xs text-green-600">Est. Time</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-900">{currentStats.completedCount}</div>
                <div className="text-xs text-purple-600">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="p-4 space-y-6">
            {/* Current Difficulty Level */}
            <div className="card bg-gradient-to-br from-indigo-50 to-cyan-50 border-indigo-200">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-indigo-900">
                      {getDifficultyInfo(difficulty).label} Level
                    </h3>
                    <p className="text-sm text-indigo-700">
                      {getDifficultyInfo(difficulty).description}
                    </p>
                  </div>
                </div>

                {/* Current Exercises Preview */}
                <div className="space-y-3">
                  {exercises.slice(0, 2).map((exercise, index) => (
                    <EnhancedExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      index={index}
                      isCompleted={completedExercises.includes(exercise.id)}
                      showActions={false}
                    />
                  ))}

                  {exercises.length > 2 && (
                    <div className="text-center py-2 text-indigo-700 text-sm font-medium">
                      +{exercises.length - 2} more exercises
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* All Difficulty Levels */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">All Intensity Levels</h3>

              {availableDifficulties.map((level) => {
                const isExpanded = expandedSections[level];
                const levelExercises = workoutDay.exercises[level];
                const levelInfo = getDifficultyInfo(level);
                const levelStats = calculateWorkoutStats(levelExercises);

                return (
                  <div key={level} className="card">
                    <button
                      onClick={() => handleToggleSection(level)}
                      className="w-full card-body text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <levelInfo.icon className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{levelInfo.label}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${levelInfo.color}`}>
                                {levelStats.totalExercises} exercises
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{levelInfo.description}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-4">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-bold text-gray-900">{levelStats.estimatedTime}m</div>
                            <div className="text-xs text-gray-600">Duration</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-bold text-gray-900">{levelStats.totalExercises}</div>
                            <div className="text-xs text-gray-600">Exercises</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {levelExercises.map((exercise, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{exercise.name}</h4>
                                  <p className="text-xs text-gray-600">{exercise.sets} • {exercise.rest}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const searchQuery = exercise.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '+');
                                    const url = `https://www.youtube.com/results?search_query=how+to+${searchQuery}+exercise+form+tutorial`;
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <ExternalLink className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Workout Tips */}
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="card-body">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">Workout Tips</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Warm up for 5-10 minutes before starting</li>
                      <li>• Focus on proper form over speed</li>
                      <li>• Rest adequately between sets</li>
                      <li>• Stay hydrated throughout your workout</li>
                      <li>• Cool down and stretch after completing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 btn btn-secondary touch-feedback"
            >
              Preview More
            </button>
            <button
              onClick={onStartWorkout}
              className="flex-1 btn btn-primary touch-feedback"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPreview;