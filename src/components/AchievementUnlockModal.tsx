import { useState, useEffect } from 'react';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { Achievement } from '../lib/supabase';

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  show: boolean;
  onClose: () => void;
}

const AchievementUnlockModal = ({ achievement, show, onClose }: AchievementUnlockModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebration' | 'exit'>('enter');

  useEffect(() => {
    if (show && achievement) {
      setIsVisible(true);
      setAnimationPhase('enter');

      // Start celebration phase after entrance
      const celebrationTimer = setTimeout(() => {
        setAnimationPhase('celebration');
      }, 500);

      // Auto-close after 5 seconds
      const closeTimer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => {
        clearTimeout(celebrationTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [show, achievement]);

  const handleClose = () => {
    setAnimationPhase('exit');
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible || !achievement) return null;

  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          gradient: 'from-gray-400 via-gray-500 to-gray-600',
          borderColor: 'border-gray-300',
          glowColor: 'shadow-gray-400/30',
          textColor: 'text-gray-700',
          bgPattern: 'bg-gray-50'
        };
      case 'rare':
        return {
          gradient: 'from-blue-400 via-blue-500 to-blue-600',
          borderColor: 'border-blue-300',
          glowColor: 'shadow-blue-400/40',
          textColor: 'text-blue-700',
          bgPattern: 'bg-blue-50'
        };
      case 'epic':
        return {
          gradient: 'from-purple-400 via-purple-500 to-purple-600',
          borderColor: 'border-purple-300',
          glowColor: 'shadow-purple-400/50',
          textColor: 'text-purple-700',
          bgPattern: 'bg-purple-50'
        };
      case 'legendary':
        return {
          gradient: 'from-yellow-400 via-orange-500 to-red-500',
          borderColor: 'border-yellow-300',
          glowColor: 'shadow-yellow-400/60',
          textColor: 'text-orange-700',
          bgPattern: 'bg-gradient-to-br from-yellow-50 to-orange-50'
        };
      default:
        return {
          gradient: 'from-gray-400 via-gray-500 to-gray-600',
          borderColor: 'border-gray-300',
          glowColor: 'shadow-gray-400/30',
          textColor: 'text-gray-700',
          bgPattern: 'bg-gray-50'
        };
    }
  };

  const rarityConfig = getRarityConfig(achievement.rarity);

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'enter':
        return 'animate-achievement-enter';
      case 'celebration':
        return 'animate-achievement-celebrate';
      case 'exit':
        return 'animate-achievement-exit';
      default:
        return '';
    }
  };

  const getAchievementIcon = () => {
    return achievement.icon || '🏆';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      {/* Confetti/Sparkles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute animate-confetti-fall text-2xl`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            {['✨', '🌟', '⭐', '💫'][Math.floor(Math.random() * 4)]}
          </div>
        ))}
      </div>

      {/* Achievement Modal */}
      <div className={`relative ${rarityConfig.bgPattern} rounded-2xl shadow-2xl border-4 ${rarityConfig.borderColor} ${rarityConfig.glowColor} max-w-md w-full ${getAnimationClasses()}`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className={`bg-gradient-to-r ${rarityConfig.gradient} text-white p-6 rounded-t-xl relative overflow-hidden`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
          </div>

          <div className="relative text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-6 h-6" />
              <h2 className="text-xl font-bold">Achievement Unlocked!</h2>
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-sm opacity-90 uppercase tracking-wider font-semibold">
              {achievement.rarity} Achievement
            </div>
          </div>
        </div>

        {/* Achievement Icon */}
        <div className="flex justify-center -mt-8 mb-4 relative z-10">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${rarityConfig.gradient} flex items-center justify-center text-4xl shadow-xl border-4 border-white animate-icon-pulse`}>
            {getAchievementIcon()}
          </div>

          {/* Floating sparkles around icon */}
          <div className="absolute inset-0 animate-spin-slow">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-40px)`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Achievement Details */}
        <div className="px-6 pb-6 text-center">
          <h3 className={`text-2xl font-bold ${rarityConfig.textColor} mb-2`}>
            {achievement.name}
          </h3>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            {achievement.description}
          </p>

          {/* XP Reward */}
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${rarityConfig.gradient} text-white px-4 py-2 rounded-full shadow-lg`}>
            <Star className="w-4 h-4" />
            <span className="font-bold">+{achievement.xp_reward} XP</span>
            <Sparkles className="w-4 h-4" />
          </div>

          {/* Rarity Badge */}
          <div className="mt-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${rarityConfig.textColor} ${rarityConfig.bgPattern} border ${rarityConfig.borderColor}`}>
              {achievement.rarity.toUpperCase()} RARITY
            </span>
          </div>
        </div>

        {/* Animated border glow */}
        <div className={`absolute inset-0 rounded-2xl border-4 ${rarityConfig.borderColor} animate-glow-pulse pointer-events-none`}></div>
      </div>

      <style>{`
        @keyframes achievement-enter {
          0% {
            transform: scale(0.3) rotate(-180deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.1) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes achievement-celebrate {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.05) rotate(2deg);
          }
          50% {
            transform: scale(1.02) rotate(-1deg);
          }
          75% {
            transform: scale(1.05) rotate(1deg);
          }
        }

        @keyframes achievement-exit {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.8);
            opacity: 0;
          }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes icon-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 20px currentColor;
          }
          50% {
            box-shadow: 0 0 30px currentColor, 0 0 40px currentColor;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-achievement-enter {
          animation: achievement-enter 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-achievement-celebrate {
          animation: achievement-celebrate 2s ease-in-out infinite;
        }

        .animate-achievement-exit {
          animation: achievement-exit 0.3s ease-in;
        }

        .animate-confetti-fall {
          animation: confetti-fall linear infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-icon-pulse {
          animation: icon-pulse 2s ease-in-out infinite;
        }

        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AchievementUnlockModal;