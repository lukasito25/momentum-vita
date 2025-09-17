import { useState, useEffect } from 'react';
import { Flame, TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { DatabaseService, UserGameification } from '../lib/supabase';

interface StreakTrackerProps {
  compact?: boolean;
  showDetails?: boolean;
}

const StreakTracker = ({ compact = false, showDetails = true }: StreakTrackerProps) => {
  const [gamificationData, setGamificationData] = useState<UserGameification | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyConsistency, setWeeklyConsistency] = useState(0);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const [gamification, consistency] = await Promise.all([
        DatabaseService.getUserGameification(),
        DatabaseService.calculateWeeklyConsistency()
      ]);

      setGamificationData(gamification);
      setWeeklyConsistency(consistency);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border ${compact ? 'p-3' : 'p-4'} animate-pulse`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!gamificationData) {
    return null;
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'from-red-500 to-orange-500';
    if (streak >= 14) return 'from-orange-500 to-yellow-500';
    if (streak >= 7) return 'from-yellow-500 to-amber-500';
    if (streak >= 3) return 'from-blue-500 to-purple-500';
    return 'from-gray-400 to-gray-500';
  };

  const getStreakTitle = (streak: number) => {
    if (streak >= 30) return 'Legendary Streak!';
    if (streak >= 14) return 'Epic Streak!';
    if (streak >= 7) return 'Great Streak!';
    if (streak >= 3) return 'Good Streak!';
    if (streak >= 1) return 'Keep Going!';
    return 'Start Your Streak!';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '👑';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '💪';
    return '🌱';
  };

  const getConsistencyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const streakGradient = getStreakColor(gamificationData.current_streak);

  // Compact view for header
  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${streakGradient} flex items-center justify-center text-lg shadow-lg`}>
            {getStreakEmoji(gamificationData.current_streak)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-gray-900">
                {gamificationData.current_streak} Day{gamificationData.current_streak !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Best: {gamificationData.longest_streak} days
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConsistencyColor(weeklyConsistency)}`}>
            {Math.round(weeklyConsistency)}%
          </div>
        </div>
      </div>
    );
  }

  // Full streak tracker
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Workout Streak
        </h3>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">Weekly Goal: 3 workouts</span>
        </div>
      </div>

      {/* Current Streak Display */}
      <div className="text-center mb-6">
        <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r ${streakGradient} flex items-center justify-center text-4xl shadow-xl mb-4 animate-pulse-slow`}>
          {getStreakEmoji(gamificationData.current_streak)}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {gamificationData.current_streak}
        </h2>
        <p className="text-lg text-gray-600 mb-1">
          Day{gamificationData.current_streak !== 1 ? 's' : ''} in a row
        </p>
        <p className="text-sm font-medium text-orange-600">
          {getStreakTitle(gamificationData.current_streak)}
        </p>
      </div>

      {showDetails && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {gamificationData.longest_streak}
              </div>
              <div className="text-xs text-gray-600">Best Streak</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {gamificationData.total_workouts}
              </div>
              <div className="text-xs text-gray-600">Total Workouts</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getConsistencyColor(weeklyConsistency).split(' ')[0]}`}>
                {Math.round(weeklyConsistency)}%
              </div>
              <div className="text-xs text-gray-600">This Week</div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Weekly Progress</span>
              <span className="text-sm text-gray-600">
                {gamificationData.weekly_stats.workouts_completed}/3 workouts
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (gamificationData.weekly_stats.workouts_completed / 3) * 100)}%` }}
              />
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Streak Milestones
            </h4>

            {[
              { days: 3, title: 'Getting Started', icon: '🌱', achieved: gamificationData.current_streak >= 3 },
              { days: 7, title: 'One Week Strong', icon: '⭐', achieved: gamificationData.current_streak >= 7 },
              { days: 14, title: 'Two Week Warrior', icon: '🔥', achieved: gamificationData.current_streak >= 14 },
              { days: 30, title: 'Monthly Master', icon: '👑', achieved: gamificationData.current_streak >= 30 }
            ].map((milestone) => (
              <div key={milestone.days} className={`flex items-center gap-3 p-2 rounded-lg ${milestone.achieved ? 'bg-green-50' : 'bg-gray-50'}`}>
                <span className="text-xl">{milestone.icon}</span>
                <div className="flex-1">
                  <div className={`font-medium ${milestone.achieved ? 'text-green-800' : 'text-gray-600'}`}>
                    {milestone.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {milestone.days} day{milestone.days !== 1 ? 's' : ''} streak
                  </div>
                </div>
                {milestone.achieved && (
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Encouragement Message */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Keep It Up!</span>
            </div>
            <p className="text-sm text-blue-700">
              {gamificationData.current_streak === 0
                ? "Start your fitness journey today! Every expert was once a beginner."
                : gamificationData.current_streak < 3
                ? "You're building momentum! Consistency is key to reaching your goals."
                : gamificationData.current_streak < 7
                ? "Great job! You're developing a healthy habit that will transform your life."
                : gamificationData.current_streak < 14
                ? "Amazing consistency! You're proving that dedication pays off."
                : gamificationData.current_streak < 30
                ? "Incredible streak! You're an inspiration to others on their fitness journey."
                : "Legendary dedication! You've mastered the art of consistency."
              }
            </p>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default StreakTracker;