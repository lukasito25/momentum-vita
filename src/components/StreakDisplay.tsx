import { useState, useEffect } from 'react';
import { Flame, Calendar, TrendingUp, Target, Clock } from 'lucide-react';
import { DatabaseService, UserGameification } from '../lib/supabase';

interface StreakDisplayProps {
  compact?: boolean;
  showWeeklyStats?: boolean;
}

const StreakDisplay = ({ compact = false, showWeeklyStats = true }: StreakDisplayProps) => {
  const [gamificationData, setGamificationData] = useState<UserGameification | null>(null);
  const [loading, setLoading] = useState(true);
  const [consistency, setConsistency] = useState(0);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const [gamification, weeklyConsistency] = await Promise.all([
        DatabaseService.getUserGameification(),
        DatabaseService.calculateWeeklyConsistency()
      ]);

      setGamificationData(gamification);
      setConsistency(weeklyConsistency);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-red-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    if (streak >= 3) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStreakBg = (streak: number) => {
    if (streak >= 30) return 'bg-gradient-to-r from-red-500 to-pink-500';
    if (streak >= 14) return 'bg-gradient-to-r from-orange-500 to-red-500';
    if (streak >= 7) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (streak >= 3) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const getStreakTitle = (streak: number) => {
    if (streak >= 30) return 'Legendary Streak!';
    if (streak >= 14) return 'Epic Streak!';
    if (streak >= 7) return 'Hot Streak!';
    if (streak >= 3) return 'Building Momentum';
    return 'Getting Started';
  };

  const getConsistencyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConsistencyBg = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} bg-white rounded-lg shadow-sm border animate-pulse`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!gamificationData) return null;

  const currentStreak = gamificationData.current_streak;
  const longestStreak = gamificationData.longest_streak;
  const totalWorkouts = gamificationData.total_workouts;
  const weeklyStats = gamificationData.weekly_stats;

  // Compact version for header
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Current Streak */}
        <div className="flex items-center gap-1">
          <div className={`w-6 h-6 rounded-full ${getStreakBg(currentStreak)} flex items-center justify-center`}>
            <Flame className="w-3 h-3 text-white" />
          </div>
          <span className={`font-bold text-sm ${getStreakColor(currentStreak)}`}>
            {currentStreak}
          </span>
        </div>

        {/* Weekly Consistency */}
        {showWeeklyStats && (
          <div className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full ${getConsistencyBg(consistency)} flex items-center justify-center`}>
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className={`font-bold text-sm ${getConsistencyColor(consistency)}`}>
              {Math.round(consistency)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className="space-y-4">
      {/* Current Streak Card */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Flame className={`w-5 h-5 ${getStreakColor(currentStreak)}`} />
            Current Streak
          </h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStreakBg(currentStreak)}`}>
            {getStreakTitle(currentStreak)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${getStreakBg(currentStreak)} flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-xl">{currentStreak}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-1">
              <span className={`text-2xl font-bold ${getStreakColor(currentStreak)}`}>
                {currentStreak}
              </span>
              <span className="text-gray-600 text-sm">
                {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {currentStreak === 0 ? 'Start your streak today!' :
               currentStreak === 1 ? 'Great start! Keep it going!' :
               `${currentStreak} days of consistent training!`}
            </p>
          </div>
        </div>

        {/* Streak Progress Bar */}
        {currentStreak > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Next milestone</span>
              <span>
                {currentStreak < 3 ? '3 days' :
                 currentStreak < 7 ? '7 days' :
                 currentStreak < 14 ? '14 days' :
                 currentStreak < 30 ? '30 days' : '100 days'}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className={`${getStreakBg(currentStreak)} rounded-full h-2 transition-all duration-300`}
                style={{
                  width: `${Math.min(100, (currentStreak / (
                    currentStreak < 3 ? 3 :
                    currentStreak < 7 ? 7 :
                    currentStreak < 14 ? 14 :
                    currentStreak < 30 ? 30 : 100
                  )) * 100)}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Weekly Stats */}
      {showWeeklyStats && (
        <div className="grid grid-cols-2 gap-3">
          {/* Weekly Consistency */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${getConsistencyColor(consistency)}`} />
              <span className="font-semibold text-gray-900 text-sm">Weekly</span>
            </div>
            <div className="space-y-1">
              <div className={`text-xl font-bold ${getConsistencyColor(consistency)}`}>
                {Math.round(consistency)}%
              </div>
              <p className="text-xs text-gray-600">Consistency</p>
              <div className="bg-gray-200 rounded-full h-1.5">
                <div
                  className={`${getConsistencyBg(consistency)} rounded-full h-1.5 transition-all duration-300`}
                  style={{ width: `${consistency}%` }}
                />
              </div>
            </div>
          </div>

          {/* Total Workouts */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-gray-900 text-sm">Total</span>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-purple-600">
                {totalWorkouts}
              </div>
              <p className="text-xs text-gray-600">Workouts</p>
            </div>
          </div>
        </div>
      )}

      {/* Best Streak */}
      {longestStreak > currentStreak && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">Personal Best</div>
              <div className="text-lg font-bold text-orange-600">
                {longestStreak} days
              </div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-xs text-gray-600">
                {longestStreak - currentStreak} days to beat your record!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          This Week
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Workouts Completed</span>
            <span className="font-medium">{weeklyStats.workouts_completed}/3</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Nutrition Goals Hit</span>
            <span className="font-medium">{weeklyStats.nutrition_goals_hit}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">XP Earned</span>
            <span className="font-medium text-blue-600">+{weeklyStats.xp_earned}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;