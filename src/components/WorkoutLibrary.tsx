import React, { useState } from 'react';
import {
  Dumbbell,
  Clock,
  Star,
  Crown,
  Filter,
  Search,
  Calendar,
  Target,
  Zap,
} from 'lucide-react';
import { workoutPrograms, WorkoutProgram } from '../data/workout-programs';

interface WorkoutLibraryProps {
  onSelectProgram: (programId: string) => void;
  onStartCustomWorkout: () => void;
  onStartTodaysWorkout: () => void;
  currentProgramId: string;
  isAuthenticated: boolean;
  onUpgrade: () => void;
}

const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({
  onSelectProgram,
  onStartCustomWorkout,
  onStartTodaysWorkout,
  currentProgramId,
  isAuthenticated,
  onUpgrade,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'free' | 'premium' | 'difficulty'>('all');

  const filteredPrograms = workoutPrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'free':
        return !program.isPremium;
      case 'premium':
        return program.isPremium;
      default:
        return true;
    }
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

  const handleProgramAction = (program: WorkoutProgram) => {
    if (program.isPremium && !isAuthenticated) {
      onUpgrade();
      return;
    }
    onSelectProgram(program.id);
  };

  return (
    <div className="page-content space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onStartTodaysWorkout}
          className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-xl touch-feedback"
        >
          <Calendar className="w-6 h-6 mx-auto mb-2" />
          <div className="text-sm font-medium">Today's Workout</div>
        </button>
        <button
          onClick={onStartCustomWorkout}
          className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl touch-feedback"
        >
          <Target className="w-6 h-6 mx-auto mb-2" />
          <div className="text-sm font-medium">AI Generator</div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'free', label: 'Free' },
            { id: 'premium', label: 'Premium', icon: Crown },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedFilter(id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                selectedFilter === id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Program List */}
      <div className="space-y-4">
        {filteredPrograms.map((program) => {
          const isActive = program.id === currentProgramId;
          const isLocked = program.isPremium && !isAuthenticated;

          return (
            <div
              key={program.id}
              className={`card relative ${
                isActive ? 'border-indigo-500 bg-indigo-50' : ''
              } ${isLocked ? 'opacity-75' : ''}`}
            >
              {/* Premium Badge */}
              {program.isPremium && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-medium rounded-full">
                  <Crown className="w-3 h-3" />
                  Pro
                </div>
              )}

              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-1 ${
                      isActive ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {program.name}
                    </h3>
                    <p className={`text-sm mb-2 ${
                      isActive ? 'text-indigo-600' : 'text-gray-600'
                    }`}>
                      {program.description}
                    </p>
                  </div>
                </div>

                {/* Program Stats */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">{program.duration}</div>
                  </div>
                  <div className="text-center">
                    <Dumbbell className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">{program.daysPerWeek}x/week</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
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
                    <div className="text-xs text-gray-600">Difficulty</div>
                  </div>
                </div>

                {/* Difficulty and Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getDifficultyColor(program.difficulty)
                  }`}>
                    {program.difficulty}
                  </span>

                  {isActive && (
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                      Current Program
                    </span>
                  )}

                  {isLocked && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      Premium Required
                    </span>
                  )}
                </div>

                {/* Goals Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {program.goals.slice(0, 2).map((goal, index) => (
                    <span
                      key={index}
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {goal}
                    </span>
                  ))}
                  {program.goals.length > 2 && (
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      +{program.goals.length - 2}
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleProgramAction(program)}
                  disabled={isLocked}
                  className={`w-full btn touch-feedback ${
                    isActive
                      ? 'btn-secondary'
                      : isLocked
                        ? 'btn-secondary opacity-50 cursor-not-allowed'
                        : 'btn-primary'
                  }`}
                >
                  {isActive ? (
                    'Current Program'
                  ) : isLocked ? (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade for Access
                    </>
                  ) : (
                    'Select Program'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No programs found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
            className="btn btn-secondary touch-feedback"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutLibrary;