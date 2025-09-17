import { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Zap, Crown } from 'lucide-react';

interface LevelUpNotificationProps {
  newLevel: number;
  oldLevel: number;
  show: boolean;
  onComplete?: () => void;
}

const LevelUpNotification = ({ newLevel, oldLevel, show, onComplete }: LevelUpNotificationProps) => {
  const [visible, setVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebration' | 'exit'>('enter');

  useEffect(() => {
    if (show && newLevel > oldLevel) {
      setVisible(true);
      setAnimationPhase('enter');

      // Start celebration phase
      const celebrationTimer = setTimeout(() => {
        setAnimationPhase('celebration');
      }, 800);

      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setAnimationPhase('exit');
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 500);
      }, 4000);

      return () => {
        clearTimeout(celebrationTimer);
        clearTimeout(timer);
      };
    }
  }, [show, newLevel, oldLevel, onComplete]);

  if (!visible || newLevel <= oldLevel) return null;

  const getLevelIcon = (level: number) => {
    if (level >= 50) return Crown;
    if (level >= 25) return Trophy;
    if (level >= 10) return TrendingUp;
    return Star;
  };

  const getLevelTitle = (level: number) => {
    if (level >= 50) return "Fitness Legend";
    if (level >= 25) return "Training Master";
    if (level >= 10) return "Dedicated Athlete";
    if (level >= 5) return "Rising Star";
    return "Fitness Beginner";
  };

  const getLevelGradient = (level: number) => {
    if (level >= 50) return "from-yellow-400 via-orange-500 to-red-500";
    if (level >= 25) return "from-purple-400 via-purple-500 to-pink-500";
    if (level >= 10) return "from-blue-400 via-blue-500 to-indigo-500";
    if (level >= 5) return "from-green-400 via-green-500 to-emerald-500";
    return "from-gray-400 via-gray-500 to-slate-500";
  };

  const LevelIcon = getLevelIcon(newLevel);

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'enter':
        return 'animate-level-up-enter';
      case 'celebration':
        return 'animate-level-up-celebrate';
      case 'exit':
        return 'animate-level-up-exit';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Fireworks/Confetti Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-firework text-3xl"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 1}s`
            }}
          >
            {['🎆', '🎉', '✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 6)]}
          </div>
        ))}
      </div>

      {/* Level Up Notification */}
      <div className={`relative max-w-lg w-full ${getAnimationClasses()}`}>
        {/* Main notification */}
        <div className={`bg-gradient-to-br ${getLevelGradient(newLevel)} text-white rounded-2xl shadow-2xl border-4 border-white overflow-hidden relative`}>
          {/* Animated background rays */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 bg-white animate-ray-expand"
                style={{
                  height: '200px',
                  transformOrigin: 'center top',
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 text-center">
            {/* Level Up Text */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2 animate-text-glow">
                LEVEL UP!
              </h1>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-6xl font-bold animate-number-flip">
                  {oldLevel}
                </div>
                <div className="flex flex-col items-center">
                  <TrendingUp className="w-8 h-8 mb-1 animate-bounce" />
                  <div className="text-sm opacity-90">TO</div>
                </div>
                <div className="text-6xl font-bold animate-number-flip-delayed">
                  {newLevel}
                </div>
              </div>
            </div>

            {/* Level Icon and Title */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 animate-icon-bounce">
                <LevelIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {getLevelTitle(newLevel)}
              </h2>
              <p className="text-lg opacity-90">
                You've reached Level {newLevel}!
              </p>
            </div>

            {/* Achievement indicators */}
            <div className="flex justify-center gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">More XP Rewards</span>
                </div>
              </div>
              {newLevel >= 5 && (
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    <span className="font-semibold">Premium Access</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Animated border */}
          <div className="absolute inset-0 border-4 border-white rounded-2xl animate-border-glow"></div>
        </div>

        {/* Floating achievement particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes level-up-enter {
          0% {
            transform: scale(0.1) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes level-up-celebrate {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes level-up-exit {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0;
          }
        }

        @keyframes firework {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0.5) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes ray-expand {
          0% {
            height: 0px;
            opacity: 0;
          }
          50% {
            height: 200px;
            opacity: 1;
          }
          100% {
            height: 300px;
            opacity: 0;
          }
        }

        @keyframes text-glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          }
          50% {
            text-shadow: 0 0 30px rgba(255, 255, 255, 1), 0 0 40px rgba(255, 255, 255, 0.8);
          }
        }

        @keyframes number-flip {
          0% {
            transform: rotateY(0deg) scale(1);
          }
          25% {
            transform: rotateY(90deg) scale(0.8);
          }
          75% {
            transform: rotateY(-90deg) scale(1.2);
          }
          100% {
            transform: rotateY(0deg) scale(1);
          }
        }

        @keyframes icon-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }

        @keyframes border-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4);
          }
        }

        @keyframes float-particle {
          0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-level-up-enter {
          animation: level-up-enter 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-level-up-celebrate {
          animation: level-up-celebrate 1.5s ease-in-out infinite;
        }

        .animate-level-up-exit {
          animation: level-up-exit 0.5s ease-in;
        }

        .animate-firework {
          animation: firework ease-out infinite;
        }

        .animate-ray-expand {
          animation: ray-expand 2s ease-out infinite;
        }

        .animate-text-glow {
          animation: text-glow 2s ease-in-out infinite;
        }

        .animate-number-flip {
          animation: number-flip 0.8s ease-in-out;
        }

        .animate-number-flip-delayed {
          animation: number-flip 0.8s ease-in-out 0.2s;
        }

        .animate-icon-bounce {
          animation: icon-bounce 2s infinite;
        }

        .animate-border-glow {
          animation: border-glow 2s ease-in-out infinite;
        }

        .animate-float-particle {
          animation: float-particle ease-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LevelUpNotification;