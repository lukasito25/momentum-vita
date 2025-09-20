import React, { useState } from 'react';
import {
  X,
  Crown,
  Clock,
  Target,
  Users,
  Dumbbell,
  Zap,
  Sparkles,
  ChevronRight,
  Star,
} from 'lucide-react';
import { workoutPrograms, WorkoutProgram } from '../data/workout-programs';

interface ProgramSelectionModalProps {
  onSelectProgram: (programId: string) => void;
  onClose: () => void;
  onUpgrade: () => void;
  isAuthenticated: boolean;
  currentProgramId?: string;
}

const ProgramSelectionModal: React.FC<ProgramSelectionModalProps> = ({
  onSelectProgram,
  onClose,
  onUpgrade,
  isAuthenticated,
  currentProgramId,
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'free' | 'premium'>('all');

  const filteredPrograms = workoutPrograms.filter(program => {
    if (selectedTab === 'free') return !program.isPremium;
    if (selectedTab === 'premium') return program.isPremium;
    return true;
  });

  const getDifficultyColor = (difficulty: WorkoutProgram['difficulty']) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Beginner to Intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Intermediate to Advanced':
        return 'bg-orange-100 text-orange-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      case 'Elite':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyStars = (difficulty: WorkoutProgram['difficulty']) => {
    const levels = {
      'Beginner': 1,
      'Beginner to Intermediate': 2,
      'Intermediate': 3,
      'Intermediate to Advanced': 4,
      'Advanced': 4,
      'Elite': 5,
    };
    return levels[difficulty] || 3;
  };

  const handleProgramSelect = (program: WorkoutProgram) => {
    if (program.isPremium && !isAuthenticated) {
      onUpgrade();
      return;
    }
    onSelectProgram(program.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="mobile-container max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Choose Your Program</h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('all')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                selectedTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Programs
            </button>
            <button
              onClick={() => setSelectedTab('free')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                selectedTab === 'free'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setSelectedTab('premium')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                selectedTab === 'premium'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Crown className="w-4 h-4 mr-1 inline" />
              Premium
            </button>
          </div>
        </div>

        {/* Program List */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {filteredPrograms.map((program) => {
            const isSelected = program.id === currentProgramId;
            const isLocked = program.isPremium && !isAuthenticated;

            return (
              <div
                key={program.id}
                className={`relative rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLocked ? 'opacity-75' : ''}`}
              >
                {/* Premium Badge */}
                {program.isPremium && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-medium rounded-full">
                    <Crown className="w-3 h-3" />
                    Pro
                  </div>
                )}

                {/* Lock Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-gray-50/80 rounded-xl flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Crown className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Premium Required</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleProgramSelect(program)}
                  className="w-full p-4 text-left touch-feedback"
                  disabled={isLocked}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-1 ${
                        isSelected ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                        {program.name}
                      </h3>
                      <p className={`text-sm ${
                        isSelected ? 'text-indigo-600' : 'text-gray-600'
                      }`}>
                        {program.description}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ml-2 ${
                      isSelected ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                  </div>

                  {/* Program Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{program.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{program.daysPerWeek}x/week</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{program.equipment}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < getDifficultyStars(program.difficulty)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getDifficultyColor(program.difficulty)
                    }`}>
                      {program.difficulty}
                    </span>

                    {isSelected && (
                      <span className="text-xs font-medium text-indigo-600">
                        Current Program
                      </span>
                    )}
                  </div>

                  {/* Goals */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {program.goals.slice(0, 3).map((goal, index) => (
                      <span
                        key={index}
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          isSelected
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {goal}
                      </span>
                    ))}
                    {program.goals.length > 3 && (
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        +{program.goals.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Premium Upsell */}
        {!isAuthenticated && (
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">Unlock All Programs</h3>
                  <p className="text-sm text-indigo-700">Get access to premium workout plans</p>
                </div>
              </div>
              <button
                onClick={onUpgrade}
                className="w-full btn btn-primary touch-feedback"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramSelectionModal;