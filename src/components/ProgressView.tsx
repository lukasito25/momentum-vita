import React from 'react';
import { TrendingUp, Calendar, Target, Award, BarChart3, Flame } from 'lucide-react';

interface ProgressViewProps {
  isAuthenticated: boolean;
  onUpgrade: () => void;
}

// Mock data for demonstration
const mockStats = {
  weeklyWorkouts: 3,
  currentStreak: 5,
  totalWorkouts: 24,
  monthlyGoal: 16,
  averageSessionTime: 32, // minutes
  favoriteExercise: 'Push-ups',
};

const mockRecentWorkouts = [
  { date: '2025-09-20', name: 'Upper Body', duration: 28, completed: true },
  { date: '2025-09-18', name: 'Lower Body', duration: 35, completed: true },
  { date: '2025-09-16', name: 'Core Focus', duration: 22, completed: true },
  { date: '2025-09-14', name: 'Full Body', duration: 40, completed: true },
];

const ProgressView: React.FC<ProgressViewProps> = ({
  isAuthenticated,
  onUpgrade,
}) => {
  if (!isAuthenticated) {
    return (
      <div className="page-content">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Track Your Progress</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Sign up to see detailed analytics, workout history, and track your fitness journey over time
          </p>
          <button
            onClick={onUpgrade}
            className="btn btn-primary btn-lg touch-feedback"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round((mockStats.weeklyWorkouts / 4) * 100); // 4 workouts per week goal

  return (
    <div className="page-content space-y-6">
      {/* This Week's Progress */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Progress</h2>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Weekly Goal</span>
              <span className="font-medium text-gray-900">
                {mockStats.weeklyWorkouts}/4 workouts
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{mockStats.currentStreak}</div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mockStats.averageSessionTime}m</div>
              <div className="text-xs text-gray-600">Avg Session</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card card-body p-4 text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2">
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{mockStats.totalWorkouts}</div>
          <div className="text-xs text-gray-600">Total Workouts</div>
        </div>

        <div className="card card-body p-4 text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg mx-auto mb-2">
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{mockStats.monthlyGoal}</div>
          <div className="text-xs text-gray-600">Monthly Goal</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-body">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Workouts</h3>
          <div className="space-y-3">
            {mockRecentWorkouts.map((workout, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {workout.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(workout.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {workout.duration}m
                  </p>
                  <p className="text-xs text-green-600">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Achievements</h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-xs text-gray-600">5 Day Streak</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-1">💪</div>
              <div className="text-xs text-gray-600">First Month</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xs text-gray-600">Consistent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="card bg-gradient-to-br from-indigo-50 to-cyan-50 border-indigo-200">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">Weekly Insight</h3>
          </div>
          <p className="text-sm text-indigo-800">
            You're on track to beat your weekly goal! Your most consistent workout time is in the morning.
            Keep up the great work! 🎉
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;