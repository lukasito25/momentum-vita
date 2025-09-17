import { useEffect, useState } from 'react';
import { X, Trophy, Star, TrendingUp, Zap, Crown, Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  newLevel: number;
  previousLevel: number;
  isOpen: boolean;
  onClose: () => void;
}

const LevelUpModal = ({ newLevel, previousLevel, isOpen, onClose }: LevelUpModalProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      setShowFireworks(true);

      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
      setShowFireworks(false);
    }
  }, [isOpen, onClose]);

  const getLevelConfig = (level: number) => {
    if (level >= 50) {
      return {
        title: 'Fitness Legend',
        icon: <Crown className="w-8 h-8 text-yellow-300" />,
        gradient: 'from-yellow-400 via-yellow-500 to-orange-500',
        bgGradient: 'from-yellow-50 to-orange-50',
        textColor: 'text-yellow-700',
        particles: '👑',
        message: 'You have achieved legendary status!'
      };
    } else if (level >= 25) {
      return {
        title: 'Training Master',
        icon: <Zap className="w-8 h-8 text-purple-300" />,
        gradient: 'from-purple-400 via-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
        textColor: 'text-purple-700',
        particles: '⚡',
        message: 'Master level achieved! You\'re unstoppable!'
      };
    } else if (level >= 10) {
      return {
        title: 'Dedicated Athlete',
        icon: <TrendingUp className="w-8 h-8 text-blue-300" />,
        gradient: 'from-blue-400 via-blue-500 to-indigo-500',
        bgGradient: 'from-blue-50 to-indigo-50',
        textColor: 'text-blue-700',
        particles: '🚀',
        message: 'Your dedication is paying off!'
      };
    } else if (level >= 5) {
      return {
        title: 'Rising Star',
        icon: <Star className="w-8 h-8 text-green-300" />,
        gradient: 'from-green-400 via-green-500 to-emerald-500',
        bgGradient: 'from-green-50 to-emerald-50',
        textColor: 'text-green-700',
        particles: '⭐',
        message: 'You\'re rising fast! Keep it up!'
      };
    } else {
      return {
        title: 'Fitness Beginner',
        icon: <Trophy className="w-8 h-8 text-gray-300" />,
        gradient: 'from-gray-400 via-gray-500 to-slate-500',
        bgGradient: 'from-gray-50 to-slate-50',
        textColor: 'text-gray-700',
        particles: '🌱',
        message: 'Great start on your fitness journey!'
      };
    }
  };

  if (!isOpen) return null;

  const levelConfig = getLevelConfig(newLevel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      {/* Animated Background Particles */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={`firework-${i}`}
              className="absolute animate-bounce text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`
              }}
            >
              {levelConfig.particles}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <div
        className={`
          relative max-w-lg w-full mx-auto rounded-2xl shadow-2xl
          bg-gradient-to-br ${levelConfig.bgGradient}
          border-2 border-white border-opacity-20
          ${showAnimation ? 'animate-in zoom-in-95 duration-700 ease-out' : ''}
        `}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="relative text-center pt-8 pb-6">
          {/* Level Up Banner */}
          <div className="mb-6">
            <div className="inline-block px-6 py-2 bg-white bg-opacity-90 rounded-full shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                LEVEL UP!
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </h2>
            </div>
          </div>

          {/* Level Progression */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Previous Level */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-600">
                {previousLevel}
              </div>
              <div className="text-xs text-gray-600 mt-1">Previous</div>
            </div>

            {/* Arrow */}
            <div className="flex items-center">
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <div className="w-3 h-3 bg-gray-400 transform rotate-45 -ml-1.5"></div>
            </div>

            {/* New Level */}
            <div className="text-center">
              <div className={`
                w-20 h-20 rounded-full bg-gradient-to-br ${levelConfig.gradient}
                flex items-center justify-center text-2xl font-bold text-white
                shadow-2xl border-4 border-white
                ${showAnimation ? 'animate-pulse' : ''}
              `}>
                {newLevel}
              </div>
              <div className={`text-sm font-semibold mt-1 ${levelConfig.textColor}`}>
                New Level!
              </div>
            </div>
          </div>

          {/* Level Title and Icon */}
          <div className="space-y-4">
            <div className={`
              w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${levelConfig.gradient}
              flex items-center justify-center shadow-xl border-4 border-white
              ${showAnimation ? 'animate-bounce' : ''}
            `}>
              {levelConfig.icon}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {levelConfig.title}
              </h3>
              <p className={`text-lg font-medium ${levelConfig.textColor}`}>
                Level {newLevel}
              </p>
              <p className="text-gray-600 text-sm px-6 italic">
                {levelConfig.message}
              </p>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="px-6 pb-6">
          <div className="bg-white bg-opacity-60 rounded-xl p-6 space-y-4">
            <h4 className="font-bold text-gray-800 text-center text-lg">
              Level {newLevel} Unlocked!
            </h4>

            {/* Level Benefits */}
            <div className="space-y-3">
              {newLevel >= 5 && (
                <div className="flex items-center gap-3 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Premium features unlocked</span>
                </div>
              )}

              {newLevel >= 10 && (
                <div className="flex items-center gap-3 text-sm">
                  <Trophy className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">Elite training programs available</span>
                </div>
              )}

              {newLevel >= 25 && (
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700">Advanced analytics unlocked</span>
                </div>
              )}

              {newLevel >= 50 && (
                <div className="flex items-center gap-3 text-sm">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700">Legendary status achieved</span>
                </div>
              )}
            </div>

            {/* Generic Level Benefit */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-lg">🎯</span>
                <span className="text-gray-700 font-medium">
                  Increased XP multiplier: {Math.floor(newLevel / 5) + 1}x
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-white text-lg
              bg-gradient-to-r ${levelConfig.gradient}
              hover:opacity-90 transition-opacity duration-200
              shadow-lg transform hover:scale-105 transition-transform
            `}
          >
            Continue Training
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {/* Corner sparkles */}
          <div className="absolute top-4 left-4">
            <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute top-4 right-16">
            <Star className="w-3 h-3 text-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute bottom-4 left-8">
            <Star className="w-5 h-5 text-yellow-400 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="absolute bottom-4 right-4">
            <Star className="w-3 h-3 text-yellow-400 animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;