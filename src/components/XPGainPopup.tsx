import { useEffect, useState } from 'react';
import { Star, Plus, Zap, Trophy } from 'lucide-react';

export interface XPGainEvent {
  id: string;
  amount: number;
  source: string;
  timestamp: number;
}

interface XPGainPopupProps {
  events: XPGainEvent[];
  onEventComplete: (eventId: string) => void;
}

const XPGainPopup = ({ events, onEventComplete }: XPGainPopupProps) => {
  const [visibleEvents, setVisibleEvents] = useState<XPGainEvent[]>([]);

  useEffect(() => {
    if (events.length > 0) {
      // Show events one by one with slight delays
      events.forEach((event, index) => {
        setTimeout(() => {
          setVisibleEvents(prev => [...prev, event]);

          // Auto-remove after animation completes
          setTimeout(() => {
            setVisibleEvents(prev => prev.filter(e => e.id !== event.id));
            onEventComplete(event.id);
          }, 3000);
        }, index * 200);
      });
    }
  }, [events, onEventComplete]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'workout_completion':
        return <Zap className="w-4 h-4" />;
      case 'exercise_completion':
        return <Star className="w-4 h-4" />;
      case 'achievement_unlock':
        return <Trophy className="w-4 h-4" />;
      case 'streak_bonus':
        return <span className="text-base">🔥</span>;
      case 'program_completion':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      default:
        return <Plus className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'workout_completion':
        return 'from-purple-500 to-purple-600';
      case 'exercise_completion':
        return 'from-blue-500 to-blue-600';
      case 'achievement_unlock':
        return 'from-yellow-500 to-yellow-600';
      case 'streak_bonus':
        return 'from-red-500 to-red-600';
      case 'program_completion':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (visibleEvents.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {visibleEvents.map((event, index) => (
        <div
          key={event.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
            bg-gradient-to-r ${getSourceColor(event.source)} text-white
            transform transition-all duration-300 ease-out
            animate-in slide-in-from-right-full fade-in
          `}
          style={{
            animationDelay: `${index * 100}ms`,
            animationDuration: '400ms',
            animationFillMode: 'both'
          }}
        >
          {/* Icon */}
          <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-2">
            {getSourceIcon(event.source)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg">+{event.amount}</span>
              <span className="text-sm font-medium">XP</span>
            </div>
            <div className="text-xs opacity-90 capitalize">
              {event.source.replace('_', ' ')}
            </div>
          </div>

          {/* Sparkle Effect */}
          <div className="absolute -top-1 -right-1 animate-pulse">
            <Star className="w-4 h-4 text-yellow-300 fill-current" />
          </div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${20 + i * 25}%`,
                  top: `${30 + i * 15}%`,
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default XPGainPopup;