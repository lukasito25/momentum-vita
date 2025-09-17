import React from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Target,
  CheckCircle2,
  Timer,
  BarChart3,
  Zap,
  Play
} from 'lucide-react';

interface WorkoutModeToggleProps {
  isEnhancedMode: boolean;
  onToggle: () => void;
  showGuidedOption?: boolean;
  onStartGuided?: () => void;
  disabled?: boolean;
}

const WorkoutModeToggle: React.FC<WorkoutModeToggleProps> = ({
  isEnhancedMode,
  onToggle,
  showGuidedOption = true,
  onStartGuided,
  disabled = false
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-gray-800">Workout Mode</h3>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 touch-manipulation ${
            isEnhancedMode
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl transform hover:scale-105'}`}
        >
          {isEnhancedMode ? (
            <ToggleRight className="w-5 h-5" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          <span className="font-medium">Enhanced Tracking</span>
        </button>
      </div>

      {/* Mode Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Standard Mode */}
        <div className={`p-4 rounded-xl border-2 transition-all ${
          !isEnhancedMode
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className={`w-5 h-5 ${!isEnhancedMode ? 'text-blue-600' : 'text-gray-500'}`} />
            <h4 className={`font-semibold ${!isEnhancedMode ? 'text-blue-800' : 'text-gray-600'}`}>
              Standard Mode
            </h4>
          </div>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Exercise completion tracking</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Weight progression</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Basic timer functionality</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Simple session saving</span>
            </li>
          </ul>
        </div>

        {/* Enhanced Mode */}
        <div className={`p-4 rounded-xl border-2 transition-all ${
          isEnhancedMode
            ? 'border-purple-300 bg-purple-50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className={`w-5 h-5 ${isEnhancedMode ? 'text-purple-600' : 'text-gray-500'}`} />
            <h4 className={`font-semibold ${isEnhancedMode ? 'text-purple-800' : 'text-gray-600'}`}>
              Enhanced Mode
            </h4>
          </div>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span>Set-by-set tracking</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span>RPE and reps logging</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span>Advanced timer with context</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span>Detailed analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span>Enhanced XP rewards</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Enhanced Mode Features */}
      {isEnhancedMode && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 mb-4">
          <h5 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Enhanced Features Available
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Timer className="w-4 h-4" />
              <span>Set Timers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Target className="w-4 h-4" />
              <span>Rep Tracking</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <BarChart3 className="w-4 h-4" />
              <span>Progress Analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Zap className="w-4 h-4" />
              <span>Bonus XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Guided Workout Option */}
      {showGuidedOption && isEnhancedMode && onStartGuided && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={onStartGuided}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Play className="w-5 h-5" />
            <span>Start Guided Workout</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              +10 Bonus XP
            </span>
          </button>
          <p className="text-xs text-gray-600 text-center mt-2">
            Complete step-by-step workout with automatic progression and enhanced tracking
          </p>
        </div>
      )}

      {/* Benefits Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-full mt-0.5 flex-shrink-0"></div>
          <div>
            <p className="text-sm text-yellow-800">
              <strong>Pro Tip:</strong> Enhanced mode provides detailed insights into your training but requires more input during workouts. Switch anytime based on your preference!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutModeToggle;