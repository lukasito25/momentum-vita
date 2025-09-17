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
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div className="flex flex-col gap-3 mb-4">
        <h3 className="text-base font-semibold text-gray-800">Workout Mode</h3>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 touch-manipulation text-sm ${
            isEnhancedMode
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isEnhancedMode ? (
            <ToggleRight className="w-4 h-4" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
          <span className="font-medium">Enhanced Tracking</span>
        </button>
      </div>

      {/* Mode Comparison */}
      <div className="space-y-3 mb-4">
        {/* Standard Mode */}
        <div className={`p-3 rounded-lg border-2 transition-all ${
          !isEnhancedMode
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className={`w-4 h-4 ${!isEnhancedMode ? 'text-blue-600' : 'text-gray-500'}`} />
            <h4 className={`text-sm font-semibold ${!isEnhancedMode ? 'text-blue-800' : 'text-gray-600'}`}>
              Standard Mode
            </h4>
          </div>
          <ul className="text-xs space-y-1">
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
              <span>Exercise completion tracking</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
              <span>Weight progression</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
              <span>Basic timer functionality</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
              <span>Simple session saving</span>
            </li>
          </ul>
        </div>

        {/* Enhanced Mode */}
        <div className={`p-3 rounded-lg border-2 transition-all ${
          isEnhancedMode
            ? 'border-purple-300 bg-purple-50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className={`w-4 h-4 ${isEnhancedMode ? 'text-purple-600' : 'text-gray-500'}`} />
            <h4 className={`text-sm font-semibold ${isEnhancedMode ? 'text-purple-800' : 'text-gray-600'}`}>
              Enhanced Mode
            </h4>
          </div>
          <ul className="text-xs space-y-1">
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>Set-by-set tracking</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>RPE and reps logging</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>Advanced timer with context</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>Detailed analytics</span>
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>Enhanced XP rewards</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Enhanced Mode Features */}
      {isEnhancedMode && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 mb-3">
          <h5 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Enhanced Features Available
          </h5>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-purple-700">
              <Timer className="w-3 h-3 flex-shrink-0" />
              <span>Set Timers</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-700">
              <Target className="w-3 h-3 flex-shrink-0" />
              <span>Rep Tracking</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-700">
              <BarChart3 className="w-3 h-3 flex-shrink-0" />
              <span>Progress Analytics</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-700">
              <Zap className="w-3 h-3 flex-shrink-0" />
              <span>Bonus XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Guided Workout Option */}
      {showGuidedOption && isEnhancedMode && onStartGuided && (
        <div className="border-t border-gray-200 pt-3">
          <button
            onClick={onStartGuided}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">Start Guided Workout</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              +10 XP
            </span>
          </button>
          <p className="text-xs text-gray-600 text-center mt-2">
            Step-by-step workout with enhanced tracking
          </p>
        </div>
      )}

      {/* Benefits Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full mt-0.5 flex-shrink-0"></div>
          <div>
            <p className="text-xs text-yellow-800">
              <strong>Pro Tip:</strong> Enhanced mode provides detailed insights but requires more input. Switch anytime!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutModeToggle;