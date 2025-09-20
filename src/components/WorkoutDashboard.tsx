import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Clock, Target, Flame, Timer, Plus, Dumbbell } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  rest: string;
  notes: string;
  completed?: boolean;
}

interface WorkoutDashboardProps {
  currentProgram?: string;
  currentWeek?: number;
  todaysWorkout?: Exercise[];
  onStartWorkout?: () => void;
  onStartExercise?: (exerciseId: string) => void;
  isAuthenticated?: boolean;
  onUpgrade?: () => void;
}

const WorkoutDashboard: React.FC<WorkoutDashboardProps> = ({
  currentProgram = "Foundation Builder",
  currentWeek = 1,
  todaysWorkout = [],
  onStartWorkout,
  onStartExercise,
  isAuthenticated = false,
  onUpgrade,
}) => {
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(3);
  const [todayCompleted, setTodayCompleted] = useState(false);

  // Calculate progress
  const totalExercises = todaysWorkout.length;
  const completedCount = completedExercises.length;
  const progressPercentage = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  const handleExerciseComplete = (exerciseId: string) => {
    if (!completedExercises.includes(exerciseId)) {
      setCompletedExercises(prev => [...prev, exerciseId]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="page-content space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Ready for today's workout?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card card-body p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg mx-auto mb-2">
              <Flame className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{currentStreak}</div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </div>

          <div className="card card-body p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{progressPercentage}%</div>
            <div className="text-xs text-gray-600">Today's Goal</div>
          </div>

          <div className="card card-body p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-xl font-bold text-gray-900">{completedCount}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Current Workout Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Today's Workout</h2>
              <p className="text-sm text-gray-600">{currentProgram} - Week {currentWeek}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-indigo-600">
                Day {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{completedCount}/{totalExercises}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            {todaysWorkout.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Dumbbell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">No workout scheduled for today</p>
                <button className="btn btn-primary btn-lg touch-feedback">
                  Choose Workout
                </button>
              </div>
            ) : (
              <>
                {completedCount === 0 ? (
                  <button
                    onClick={onStartWorkout}
                    className="w-full btn btn-primary btn-lg touch-feedback"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Workout
                  </button>
                ) : completedCount === totalExercises ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Workout Complete!</h3>
                    <p className="text-sm text-gray-600">Great job finishing today's session</p>
                  </div>
                ) : (
                  <button
                    onClick={onStartWorkout}
                    className="w-full btn btn-primary btn-lg touch-feedback"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Continue Workout ({completedCount}/{totalExercises})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Today's Exercises Preview */}
      {todaysWorkout.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold text-gray-900 mb-4">Today's Exercises</h3>
            <div className="space-y-3">
              {todaysWorkout.slice(0, 3).map((exercise, index) => {
                const isCompleted = completedExercises.includes(exercise.id);
                return (
                  <div
                    key={exercise.id}
                    className={`flex items-center p-3 rounded-lg border transition-colors ${
                      isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        isCompleted ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {exercise.name}
                      </p>
                      <p className={`text-sm ${
                        isCompleted ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {exercise.sets}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Clock className={`w-4 h-4 ${
                        isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                );
              })}

              {todaysWorkout.length > 3 && (
                <div className="text-center text-sm text-gray-600 pt-2">
                  +{todaysWorkout.length - 3} more exercises
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Features Teaser */}
      {!isAuthenticated && (
        <div className="card bg-gradient-to-br from-indigo-50 to-cyan-50 border-indigo-200">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Unlock Premium</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get AI-powered workouts, custom programs, and detailed analytics
            </p>
            <button
              onClick={onUpgrade}
              className="btn btn-primary touch-feedback"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutDashboard;