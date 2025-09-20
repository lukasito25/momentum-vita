import React, { useState, useEffect } from 'react';
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
  Bookmark,
  Tag,
  Play,
} from 'lucide-react';
import { workoutPrograms, WorkoutProgram } from '../data/workout-programs';

interface SavedWorkout {
  id: string;
  name: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: string;
    rest: string;
    notes: string;
  }>;
  duration: number;
  difficulty: string;
  focus: string[];
  tags?: string[];
  createdAt: string;
}

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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'free' | 'premium' | 'saved'>('all');
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);

  // Load saved workouts from localStorage
  useEffect(() => {
    const loadSavedWorkouts = () => {
      try {
        const saved = localStorage.getItem('saved_workouts');
        if (saved) {
          setSavedWorkouts(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading saved workouts:', error);
      }
    };

    loadSavedWorkouts();

    // Listen for storage changes to update when workouts are saved
    window.addEventListener('storage', loadSavedWorkouts);
    return () => window.removeEventListener('storage', loadSavedWorkouts);
  }, []);

  const filteredPrograms = workoutPrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case 'free':
        return !program.isPremium;
      case 'premium':
        return program.isPremium;
      case 'saved':
        return false; // Don't show programs when saved filter is active
      default:
        return true;
    }
  });

  const filteredSavedWorkouts = savedWorkouts.filter(workout => {
    const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workout.focus.some(focus => focus.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         workout.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleStartSavedWorkout = (workout: SavedWorkout) => {
    // Convert saved workout to the format expected by onComplete
    const workoutData = {
      name: workout.name,
      exercises: workout.exercises,
      duration: workout.duration,
      difficulty: workout.difficulty,
      focus: workout.focus,
    };

    // We need to pass this to the parent component to start the workout
    // For now, we'll store it in a way that can be accessed by the workout flow
    localStorage.setItem('current_workout_temp', JSON.stringify(workoutData));
    onStartTodaysWorkout(); // This will start the workout flow
  };

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
            { id: 'saved', label: 'Saved', icon: Bookmark },
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

      {/* Program List or Saved Workouts */}
      {selectedFilter === 'saved' ? (
        <div className="space-y-4">
          {filteredSavedWorkouts.length > 0 ? (
            filteredSavedWorkouts.map((workout) => (
              <div key={workout.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 text-gray-900">
                        {workout.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {workout.duration} min • {workout.exercises.length} exercises • {workout.difficulty}
                      </p>
                    </div>
                  </div>

                  {/* Workout Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                      <div className="text-sm font-bold text-gray-900">{workout.duration}m</div>
                      <div className="text-xs text-gray-600">Duration</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <Dumbbell className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                      <div className="text-sm font-bold text-gray-900">{workout.exercises.length}</div>
                      <div className="text-xs text-gray-600">Exercises</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <Zap className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                      <div className="text-sm font-bold text-gray-900">{workout.difficulty}</div>
                      <div className="text-xs text-gray-600">Level</div>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {workout.focus.slice(0, 3).map((focus, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700"
                      >
                        {focus}
                      </span>
                    ))}
                    {workout.tags && workout.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartSavedWorkout(workout)}
                    className="w-full btn btn-primary touch-feedback"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Workout
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No saved workouts</h3>
              <p className="text-gray-600 mb-4">Create and save custom workouts to see them here</p>
              <button
                onClick={onStartCustomWorkout}
                className="btn btn-primary touch-feedback"
              >
                Create Workout
              </button>
            </div>
          )}
        </div>
      ) : (
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
      )}

      {/* No Results */}
      {((selectedFilter !== 'saved' && filteredPrograms.length === 0) ||
        (selectedFilter === 'saved' && filteredSavedWorkouts.length === 0 && searchQuery)) && (
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