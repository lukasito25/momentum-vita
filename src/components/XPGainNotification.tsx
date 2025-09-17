import { useState, useEffect } from 'react';
import { Zap, Star } from 'lucide-react';

interface XPGainNotificationProps {
  xpGained: number;
  source: string;
  onComplete?: () => void;
  show: boolean;
}

const XPGainNotification = ({ xpGained, source, onComplete, show }: XPGainNotificationProps) => {
  const [visible, setVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (show && xpGained > 0) {
      setVisible(true);
      setAnimationClass('animate-slide-up');

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setAnimationClass('animate-fade-out');
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, xpGained, onComplete]);

  if (!visible || xpGained <= 0) return null;

  const getSourceIcon = () => {
    switch (source) {
      case 'workout_completion':
      case 'exercise_completion':
        return '💪';
      case 'nutrition_goals':
        return '🥗';
      case 'streak_bonus':
        return '🔥';
      case 'achievement_unlock':
        return '🏆';
      case 'timer_completion':
        return '⏱️';
      default:
        return '⭐';
    }
  };

  const getSourceText = () => {
    switch (source) {
      case 'workout_completion':
        return 'Workout Completed';
      case 'exercise_completion':
        return 'Exercise Completed';
      case 'nutrition_goals':
        return 'Nutrition Goals';
      case 'streak_bonus':
        return 'Streak Bonus';
      case 'achievement_unlock':
        return 'Achievement Unlocked';
      case 'timer_completion':
        return 'Timer Completed';
      default:
        return 'XP Gained';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <div className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-yellow-300 ${animationClass}`}>
        <div className="flex items-center gap-3">
          {/* Animated icon */}
          <div className="relative">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl animate-bounce">
              {getSourceIcon()}
            </div>
            <div className="absolute -top-1 -right-1 bg-yellow-300 text-yellow-900 rounded-full p-1">
              <Zap className="w-3 h-3" />
            </div>
          </div>

          {/* XP details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-200" />
              <span className="font-bold text-lg">+{xpGained} XP</span>
            </div>
            <div className="text-sm text-yellow-100 opacity-90">
              {getSourceText()}
            </div>
          </div>

          {/* Animated sparkles */}
          <div className="flex flex-col gap-1">
            <div className="w-2 h-2 bg-yellow-200 rounded-full animate-ping"></div>
            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-yellow-200 rounded-full animate-ping animation-delay-200"></div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-2 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-expand-width"></div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }

        @keyframes expand-width {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .animate-fade-out {
          animation: fade-out 0.3s ease-in;
        }

        .animate-expand-width {
          animation: expand-width 2.5s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
};

export default XPGainNotification;