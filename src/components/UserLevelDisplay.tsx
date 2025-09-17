import { useState, useEffect } from "react";
import { Trophy, Star, TrendingUp, Zap } from "lucide-react";
import { DatabaseService, UserProgress } from '../lib/supabase';

const UserLevelDisplay = () => {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      await DatabaseService.ensureUserMigration();
      const progress = await DatabaseService.getUserProgress();
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userProgress) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl shadow-lg animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-white bg-opacity-20 rounded mb-2"></div>
            <div className="h-3 bg-white bg-opacity-20 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const levelProgress = DatabaseService.getCurrentLevelProgress(userProgress.total_xp);
  const nextLevelXP = DatabaseService.getXPForNextLevel(userProgress.current_level);

  const getLevelIcon = (level: number) => {
    if (level >= 50) return <Trophy className="w-6 h-6 text-yellow-300" />;
    if (level >= 25) return <Zap className="w-6 h-6 text-purple-300" />;
    if (level >= 10) return <TrendingUp className="w-6 h-6 text-blue-300" />;
    return <Star className="w-6 h-6 text-green-300" />;
  };

  const getLevelTitle = (level: number) => {
    if (level >= 50) return "Fitness Legend";
    if (level >= 25) return "Training Master";
    if (level >= 10) return "Dedicated Athlete";
    if (level >= 5) return "Rising Star";
    return "Fitness Beginner";
  };

  const getLevelGradient = (level: number) => {
    if (level >= 50) return "from-yellow-500 to-orange-500";
    if (level >= 25) return "from-purple-500 to-pink-500";
    if (level >= 10) return "from-blue-500 to-indigo-500";
    if (level >= 5) return "from-green-500 to-emerald-500";
    return "from-gray-500 to-slate-500";
  };

  return (
    <div className={`bg-gradient-to-r ${getLevelGradient(userProgress.current_level)} text-white p-4 rounded-xl shadow-lg border border-white border-opacity-20`}>
      <div className="flex items-center gap-4">
        {/* Level Icon and Badge */}
        <div className="relative">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {getLevelIcon(userProgress.current_level)}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg min-w-[24px] text-center">
            {userProgress.current_level}
          </div>
        </div>

        {/* Level Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{getLevelTitle(userProgress.current_level)}</h3>
          </div>

          <div className="space-y-2">
            {/* XP Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Level {userProgress.current_level}</span>
              <span className="opacity-90">{userProgress.total_xp.toLocaleString()} XP</span>
            </div>

            {/* Progress Bar */}
            <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                style={{ width: `${levelProgress.progress}%` }}
              />
            </div>

            {/* Next Level Info */}
            <div className="flex justify-between text-xs opacity-80">
              <span>{Math.round(levelProgress.currentLevelXP).toLocaleString()} / {levelProgress.nextLevelXP.toLocaleString()}</span>
              <span>{Math.round(levelProgress.nextLevelXP - levelProgress.currentLevelXP).toLocaleString()} XP to next level</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="text-center">
          <div className="text-lg font-bold">{userProgress.programs_completed.length}</div>
          <div className="text-xs opacity-80">Programs</div>
          <div className="text-xs opacity-80">Completed</div>
        </div>
      </div>

      {/* Level Perks (optional enhancement) */}
      {userProgress.current_level >= 5 && (
        <div className="mt-3 pt-3 border-t border-white border-opacity-20">
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>Premium Access</span>
            </div>
            {userProgress.current_level >= 10 && (
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>Elite Programs</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLevelDisplay;