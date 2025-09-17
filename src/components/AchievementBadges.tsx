import { useState, useEffect } from "react";
import { Trophy, Award, Star, Zap, Target, TrendingUp, Check, X } from "lucide-react";
import { DatabaseService, Achievement, UserProgress, UserGameification } from '../lib/supabase';
import ProgressiveImage from './ProgressiveImage';
import { useFitnessImages } from '../hooks/useFitnessImages';

const AchievementBadges = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [gamificationData, setGamificationData] = useState<UserGameification | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [loading, setLoading] = useState(true);
  const fitnessImages = useFitnessImages();

  useEffect(() => {
    loadAchievementData();
  }, []);

  const loadAchievementData = async () => {
    try {
      const [achievementsData, progressData, gamificationData] = await Promise.all([
        DatabaseService.getAvailableAchievements(),
        DatabaseService.getUserProgress(),
        DatabaseService.getUserGameification()
      ]);

      setAchievements(achievementsData);
      setUserProgress(progressData);
      setGamificationData(gamificationData);

      // Get recent achievements (unlocked ones)
      if (progressData?.achievements_unlocked.length) {
        const recent = achievementsData
          .filter(achievement => progressData.achievements_unlocked.includes(achievement.id))
          .slice(0, 3);
        setRecentAchievements(recent);
      }
    } catch (error) {
      console.error('Error loading achievement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorderColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  const getAchievementIcon = (achievement: Achievement) => {
    if (achievement.icon) return achievement.icon;

    switch (achievement.unlock_criteria.type) {
      case 'workouts': return '💪';
      case 'streak': return '🔥';
      case 'program_completion': return '🎓';
      case 'nutrition': return '🥗';
      case 'consistency': return '📈';
      default: return '🏆';
    }
  };

  const isAchievementUnlocked = (achievementId: string): boolean => {
    return userProgress?.achievements_unlocked.includes(achievementId) || false;
  };

  const getProgressTowardsAchievement = (achievement: Achievement): number => {
    if (!gamificationData) return 0;

    switch (achievement.unlock_criteria.type) {
      case 'workouts':
        return gamificationData.total_workouts;
      case 'streak':
        return gamificationData.current_streak;
      case 'program_completion':
        return userProgress?.programs_completed.length || 0;
      case 'nutrition':
        return gamificationData.total_nutrition_goals;
      case 'consistency':
        return gamificationData.weekly_stats.consistency_percentage;
      default:
        return 0;
    }
  };

  const getProgressPercentage = (achievement: Achievement): number => {
    const current = getProgressTowardsAchievement(achievement);
    return Math.min(100, (current / achievement.unlock_criteria.target) * 100);
  };

  const getAchievementBackgroundImage = (achievement: Achievement): string => {
    // Map achievement types to background images
    switch (achievement.unlock_criteria.type) {
      case 'workouts':
        return fitnessImages.getAchievementImage('first_workout')?.url || '';
      case 'streak':
        return fitnessImages.getAchievementImage('streak_7')?.url || '';
      case 'program_completion':
        return fitnessImages.getAchievementImage('strength_master')?.url || '';
      case 'nutrition':
        return fitnessImages.getAchievementImage('nutrition_king')?.url || '';
      default:
        return fitnessImages.getAchievementImage('first_workout')?.url || '';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-16 h-16 bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const nextAchievements = achievements
    .filter(achievement => !isAchievementUnlocked(achievement.id))
    .filter(achievement => getProgressPercentage(achievement) > 0)
    .sort((a, b) => getProgressPercentage(b) - getProgressPercentage(a))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Recent Achievements
            </h3>
            <button
              onClick={() => setShowAllAchievements(true)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex-shrink-0 relative group cursor-pointer`}
                title={achievement.description}
              >
                {/* Achievement Badge with Background Image */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 group-hover:scale-110 transition-transform duration-200">
                  {/* Background Image */}
                  <ProgressiveImage
                    src={getAchievementBackgroundImage(achievement)}
                    alt={`${achievement.name} background`}
                    className="absolute inset-0 w-full h-full"
                    size="achievement"
                    lazy={false}
                  />

                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(achievement.rarity)} opacity-80`}></div>
                  <div className={`absolute inset-0 border-2 ${getRarityBorderColor(achievement.rarity)} rounded-full`}></div>

                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center text-2xl text-white drop-shadow-lg">
                    {getAchievementIcon(achievement)}
                  </div>
                </div>

                {/* Completion Checkmark */}
                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1 shadow-lg">
                  <Check className="w-3 h-3" />
                </div>

                {/* Achievement Info */}
                <div className="text-center mt-2">
                  <div className="text-xs font-medium text-gray-900 truncate max-w-[64px]">
                    {achievement.name}
                  </div>
                  <div className="text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    +{achievement.xp_reward} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Towards Next Achievements */}
      {nextAchievements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Progress Tracker
            </h3>
          </div>

          <div className="space-y-4">
            {nextAchievements.map((achievement) => {
              const progress = getProgressTowardsAchievement(achievement);
              const percentage = getProgressPercentage(achievement);

              return (
                <div key={achievement.id} className="flex items-center gap-4">
                  {/* Achievement Badge with Background Image */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 flex-shrink-0">
                    {/* Background Image */}
                    <ProgressiveImage
                      src={getAchievementBackgroundImage(achievement)}
                      alt={`${achievement.name} background`}
                      className="absolute inset-0 w-full h-full"
                      size="achievement"
                      lazy={false}
                    />

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(achievement.rarity)} opacity-75`}></div>
                    <div className={`absolute inset-0 border-2 ${getRarityBorderColor(achievement.rarity)} rounded-full`}></div>

                    {/* Icon */}
                    <div className="absolute inset-0 flex items-center justify-center text-lg text-white drop-shadow-lg">
                      {getAchievementIcon(achievement)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">{achievement.name}</span>
                      <span className="text-xs text-gray-600">
                        {progress}/{achievement.unlock_criteria.target}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} rounded-full h-2 transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-medium text-blue-600">+{achievement.xp_reward} XP</div>
                    <div className={`text-xs font-medium ${getRarityBorderColor(achievement.rarity).replace('border-', 'text-')}`}>
                      {achievement.rarity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Achievements Modal */}
      {showAllAchievements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6" />
                <h2 className="text-xl font-bold">All Achievements</h2>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
                  {userProgress?.achievements_unlocked.length || 0}/{achievements.length}
                </span>
              </div>
              <button
                onClick={() => setShowAllAchievements(false)}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => {
                  const isUnlocked = isAchievementUnlocked(achievement.id);
                  const progress = getProgressTowardsAchievement(achievement);
                  const percentage = getProgressPercentage(achievement);

                  return (
                    <div
                      key={achievement.id}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isUnlocked
                          ? `${getRarityBorderColor(achievement.rarity)} bg-gradient-to-br from-white to-gray-50`
                          : 'border-gray-200 bg-white opacity-75'
                      }`}
                    >
                      {isUnlocked && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}

                      <div className="text-center mb-3">
                        <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-2xl border-2 ${getRarityBorderColor(achievement.rarity)} ${isUnlocked ? 'shadow-lg' : 'opacity-75'}`}>
                          {getAchievementIcon(achievement)}
                        </div>
                      </div>

                      <div className="text-center space-y-2">
                        <h3 className="font-semibold text-gray-900">{achievement.name}</h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <div className={`text-xs font-medium ${getRarityBorderColor(achievement.rarity).replace('border-', 'text-')}`}>
                          {achievement.rarity.toUpperCase()}
                        </div>

                        {!isUnlocked && percentage > 0 && (
                          <div className="mt-3">
                            <div className="bg-gray-200 rounded-full h-2 mb-1">
                              <div
                                className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} rounded-full h-2 transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600">
                              {progress}/{achievement.unlock_criteria.target}
                            </div>
                          </div>
                        )}

                        <div className="text-sm font-medium text-blue-600">+{achievement.xp_reward} XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementBadges;