import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Heart, Plus, X, ArrowLeft, Zap, Target, Clock, TrendingUp } from 'lucide-react';
import {
  Exercise,
  ExerciseFilter,
  ExerciseSearchResult,
  MuscleGroup,
  Equipment,
  Difficulty,
  ExerciseType,
  MUSCLE_GROUP_CATEGORIES,
  EQUIPMENT_CATEGORIES
} from '../types/ExerciseLibrary';
import { useAuth } from '../contexts/AuthContext';
import ProgressiveImage from './ProgressiveImage';

interface ExerciseLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseSelect: (exercise: Exercise) => void;
  selectedExercises?: string[];
  filters?: Partial<ExerciseFilter>;
  showAddButton?: boolean;
  multiSelect?: boolean;
  onMultiSelect?: (exercises: Exercise[]) => void;
}

// Mock exercise database - in a real app, this would come from an API
const EXERCISE_DATABASE: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    description: 'Classic compound chest exercise using barbell',
    instructions: [
      'Lie flat on bench with feet firmly on the ground',
      'Grip barbell slightly wider than shoulder width',
      'Lower bar to chest with control',
      'Press up to full arm extension'
    ],
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: ['Keep shoulders pinned back', 'Control the descent', 'Drive through your feet'],
    commonMistakes: ['Bouncing off chest', 'Flaring elbows too wide', 'Arching back excessively'],
    targetReps: '6-10',
    defaultSets: 4,
    restTime: 120,
    tags: ['strength', 'power', 'upper-body'],
    popularity: 95,
    isComplex: true
  },
  {
    id: 'squat',
    name: 'Back Squat',
    description: 'Fundamental compound lower body movement',
    instructions: [
      'Position barbell on upper back',
      'Stand with feet shoulder-width apart',
      'Descend by pushing hips back and bending knees',
      'Drive through heels to return to standing'
    ],
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: ['Keep chest up', 'Track knees over toes', 'Go to parallel or below'],
    commonMistakes: ['Knee valgus', 'Forward lean', 'Partial range of motion'],
    targetReps: '8-12',
    defaultSets: 4,
    restTime: 150,
    tags: ['strength', 'power', 'lower-body'],
    popularity: 92,
    isComplex: true
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'Ultimate posterior chain strength exercise',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Hinge at hips and grip bar with hands outside legs',
      'Keep chest up and shoulders back',
      'Drive through heels to stand up, keeping bar close'
    ],
    primaryMuscles: ['hamstrings', 'glutes', 'back'],
    secondaryMuscles: ['core', 'legs'],
    equipment: ['barbell', 'plates'],
    difficulty: 'advanced',
    type: 'compound',
    tips: ['Keep bar close to body', 'Neutral spine', 'Full hip extension at top'],
    commonMistakes: ['Rounding back', 'Bar drifting forward', 'Hyperextending at top'],
    targetReps: '5-8',
    defaultSets: 3,
    restTime: 180,
    tags: ['strength', 'power', 'posterior-chain'],
    popularity: 88,
    isComplex: true
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    description: 'Bodyweight upper body pressing movement',
    instructions: [
      'Start in plank position with hands under shoulders',
      'Lower body as one unit until chest nearly touches ground',
      'Push back up to starting position',
      'Maintain straight line from head to heels'
    ],
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    type: 'compound',
    tips: ['Keep core engaged', 'Full range of motion', 'Control the movement'],
    commonMistakes: ['Sagging hips', 'Partial range', 'Flaring elbows'],
    targetReps: '10-20',
    defaultSets: 3,
    restTime: 60,
    tags: ['bodyweight', 'upper-body', 'endurance'],
    popularity: 85,
    isComplex: false
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    description: 'Unilateral back strengthening exercise',
    instructions: [
      'Place one knee and hand on bench for support',
      'Hold dumbbell in opposite hand',
      'Pull dumbbell to hip while squeezing shoulder blade',
      'Lower with control'
    ],
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: ['dumbbells', 'bench'],
    difficulty: 'beginner',
    type: 'compound',
    tips: ['Lead with elbow', 'Squeeze at the top', 'Avoid rotation'],
    commonMistakes: ['Using momentum', 'Not pulling to hip', 'Rotating torso'],
    targetReps: '8-12',
    defaultSets: 3,
    restTime: 90,
    tags: ['strength', 'unilateral', 'back'],
    popularity: 78,
    isComplex: false
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    description: 'Standing shoulder pressing movement',
    instructions: [
      'Stand with feet hip-width apart',
      'Hold barbell at shoulder height',
      'Press bar straight up overhead',
      'Lower with control to shoulders'
    ],
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: ['Keep core tight', 'Press in straight line', 'Full lockout'],
    commonMistakes: ['Arching back', 'Pressing forward', 'Incomplete lockout'],
    targetReps: '6-10',
    defaultSets: 4,
    restTime: 120,
    tags: ['strength', 'shoulders', 'vertical-push'],
    popularity: 72,
    isComplex: true
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    description: 'Bodyweight vertical pulling exercise',
    instructions: [
      'Hang from bar with hands shoulder-width apart',
      'Pull body up until chin clears bar',
      'Lower with control to full arm extension',
      'Maintain engagement throughout'
    ],
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: ['pull-up-bar'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: ['Full range of motion', 'Controlled movement', 'Engage lats'],
    commonMistakes: ['Partial reps', 'Swinging', 'Not reaching full extension'],
    targetReps: '5-12',
    defaultSets: 3,
    restTime: 120,
    tags: ['bodyweight', 'vertical-pull', 'upper-body'],
    popularity: 80,
    isComplex: false
  },
  {
    id: 'lunges',
    name: 'Walking Lunges',
    description: 'Dynamic unilateral leg exercise',
    instructions: [
      'Step forward into lunge position',
      'Lower until both knees at 90 degrees',
      'Push off front foot to step into next lunge',
      'Alternate legs with each step'
    ],
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    type: 'compound',
    tips: ['Keep torso upright', 'Step into each lunge', 'Control the descent'],
    commonMistakes: ['Leaning forward', 'Small steps', 'Bouncing at bottom'],
    targetReps: '10-16',
    defaultSets: 3,
    restTime: 75,
    tags: ['bodyweight', 'unilateral', 'functional'],
    popularity: 65,
    isComplex: false
  }
];

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  isOpen,
  onClose,
  onExerciseSelect,
  selectedExercises = [],
  filters: initialFilters,
  showAddButton = true,
  multiSelect = false,
  onMultiSelect
}) => {
  const { user, isAuthenticated } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [multiSelectedExercises, setMultiSelectedExercises] = useState<string[]>([]);

  const [filters, setFilters] = useState<ExerciseFilter>({
    muscleGroups: [],
    equipment: [],
    difficulty: [],
    type: [],
    searchTerm: '',
    showFavorites: false,
    sortBy: 'popularity',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Search and filter exercises
  const filteredExercises = useMemo(() => {
    let results = EXERCISE_DATABASE;

    // Text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(exercise =>
        exercise.name.toLowerCase().includes(searchLower) ||
        exercise.description.toLowerCase().includes(searchLower) ||
        exercise.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        exercise.primaryMuscles.some(muscle => muscle.toLowerCase().includes(searchLower))
      );
    }

    // Muscle group filter
    if (filters.muscleGroups.length > 0) {
      results = results.filter(exercise =>
        filters.muscleGroups.some(muscle =>
          exercise.primaryMuscles.includes(muscle) ||
          exercise.secondaryMuscles.includes(muscle)
        )
      );
    }

    // Equipment filter
    if (filters.equipment.length > 0) {
      results = results.filter(exercise =>
        filters.equipment.some(equipment =>
          exercise.equipment.includes(equipment)
        )
      );
    }

    // Difficulty filter
    if (filters.difficulty.length > 0) {
      results = results.filter(exercise =>
        filters.difficulty.includes(exercise.difficulty)
      );
    }

    // Exercise type filter
    if (filters.type.length > 0) {
      results = results.filter(exercise =>
        filters.type.includes(exercise.type)
      );
    }

    // Favorites filter
    if (filters.showFavorites) {
      results = results.filter(exercise => favorites.includes(exercise.id));
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          break;
        case 'popularity':
          comparison = a.popularity - b.popularity;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return results;
  }, [searchTerm, filters, favorites, EXERCISE_DATABASE]);

  const toggleFilter = (filterType: keyof ExerciseFilter, value: any) => {
    setFilters(prev => {
      const currentValues = prev[filterType] as any[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return { ...prev, [filterType]: newValues };
    });
  };

  const toggleFavorite = (exerciseId: string) => {
    setFavorites(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    if (multiSelect) {
      setMultiSelectedExercises(prev =>
        prev.includes(exercise.id)
          ? prev.filter(id => id !== exercise.id)
          : [...prev, exercise.id]
      );
    } else {
      onExerciseSelect(exercise);
    }
  };

  const handleMultiSelectComplete = () => {
    if (onMultiSelect) {
      const exercises = EXERCISE_DATABASE.filter(ex => multiSelectedExercises.includes(ex.id));
      onMultiSelect(exercises);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Close exercise library"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Exercise Library</h1>
              <p className="text-gray-600">{filteredExercises.length} exercises available</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {multiSelect && multiSelectedExercises.length > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {multiSelectedExercises.length} selected
                </span>
                <button
                  onClick={handleMultiSelectComplete}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Add Selected
                </button>
              </>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              aria-label="Toggle filters"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Filters */}
          {showFilters && (
            <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Muscle Groups */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Muscle Groups</label>
                <div className="space-y-2">
                  {Object.entries(MUSCLE_GROUP_CATEGORIES).map(([category, muscles]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">{category}</h4>
                      <div className="space-y-1 ml-2">
                        {muscles.map(muscle => (
                          <label key={muscle} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filters.muscleGroups.includes(muscle as MuscleGroup)}
                              onChange={() => toggleFilter('muscleGroups', muscle)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{muscle}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                <div className="space-y-2">
                  {Object.entries(EQUIPMENT_CATEGORIES).map(([category, equipment]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">{category}</h4>
                      <div className="space-y-1 ml-2">
                        {equipment.map(item => (
                          <label key={item} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filters.equipment.includes(item as Equipment)}
                              onChange={() => toggleFilter('equipment', item)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{item.replace('-', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <div className="space-y-1">
                  {(['beginner', 'intermediate', 'advanced', 'expert'] as Difficulty[]).map(difficulty => (
                    <label key={difficulty} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.difficulty.includes(difficulty)}
                        onChange={() => toggleFilter('difficulty', difficulty)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{difficulty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="popularity">Popularity</option>
                  <option value="name">Name</option>
                  <option value="difficulty">Difficulty</option>
                </select>
              </div>
            </div>
          )}

          {/* Exercise Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No exercises found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isSelected={selectedExercises.includes(exercise.id)}
                    isFavorite={favorites.includes(exercise.id)}
                    isMultiSelected={multiSelectedExercises.includes(exercise.id)}
                    onSelect={() => handleExerciseSelect(exercise)}
                    onToggleFavorite={() => toggleFavorite(exercise.id)}
                    onViewDetails={() => setSelectedExercise(exercise)}
                    showAddButton={showAddButton}
                    multiSelect={multiSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exercise Detail Modal */}
        {selectedExercise && (
          <ExerciseDetailModal
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
            onSelect={() => {
              handleExerciseSelect(selectedExercise);
              setSelectedExercise(null);
            }}
            showAddButton={showAddButton}
          />
        )}
      </div>
    </div>
  );
};

// Exercise Card Component
interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  isFavorite: boolean;
  isMultiSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
  showAddButton: boolean;
  multiSelect: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isSelected,
  isFavorite,
  isMultiSelected,
  onSelect,
  onToggleFavorite,
  onViewDetails,
  showAddButton,
  multiSelect
}) => {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-orange-100 text-orange-800',
    expert: 'bg-red-100 text-red-800'
  };

  return (
    <div className={`
      border-2 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer
      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
      ${isMultiSelected ? 'border-purple-500 bg-purple-50' : ''}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {multiSelect && (
            <input
              type="checkbox"
              checked={isMultiSelected}
              onChange={onSelect}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[exercise.difficulty]}`}>
            {exercise.difficulty}
          </span>
        </div>

        <button
          onClick={onToggleFavorite}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          aria-label="Toggle favorite"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div onClick={onViewDetails} className="cursor-pointer">
        <h3 className="font-semibold text-gray-900 mb-2">{exercise.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{exercise.description}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>{exercise.targetReps} reps</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{exercise.restTime}s rest</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {exercise.primaryMuscles.slice(0, 2).map(muscle => (
            <span key={muscle} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {muscle}
            </span>
          ))}
          {exercise.primaryMuscles.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{exercise.primaryMuscles.length - 2}
            </span>
          )}
        </div>
      </div>

      {showAddButton && !multiSelect && (
        <button
          onClick={onSelect}
          disabled={isSelected}
          className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isSelected
              ? 'bg-green-100 text-green-800 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
          }`}
          aria-label={isSelected ? 'Exercise already selected' : 'Add exercise'}
        >
          {isSelected ? (
            <>
              <span>✓</span>
              Added
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Exercise
            </>
          )}
        </button>
      )}
    </div>
  );
};

// Exercise Detail Modal Component
interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
  onSelect: () => void;
  showAddButton: boolean;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose,
  onSelect,
  showAddButton
}) => {
  return (
    <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{exercise.name}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Close exercise details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-700">{exercise.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Primary Muscles</h3>
              <div className="flex flex-wrap gap-1">
                {exercise.primaryMuscles.map(muscle => (
                  <span key={muscle} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {muscle}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Equipment</h3>
              <div className="flex flex-wrap gap-1">
                {exercise.equipment.map(item => (
                  <span key={item} className="px-2 py-1 bg-gray-200 text-gray-800 text-sm rounded-full">
                    {item.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="text-gray-700">{instruction}</li>
              ))}
            </ol>
          </div>

          {exercise.tips.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Tips</h3>
              <ul className="list-disc list-inside space-y-1">
                {exercise.tips.map((tip, index) => (
                  <li key={index} className="text-green-700">{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {exercise.commonMistakes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Common Mistakes</h3>
              <ul className="list-disc list-inside space-y-1">
                {exercise.commonMistakes.map((mistake, index) => (
                  <li key={index} className="text-red-700">{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">{exercise.targetReps}</div>
              <div className="text-sm text-gray-600">Target Reps</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-lg font-bold text-purple-600">{exercise.defaultSets}</div>
              <div className="text-sm text-gray-600">Default Sets</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">{exercise.restTime}s</div>
              <div className="text-sm text-gray-600">Rest Time</div>
            </div>
          </div>

          {showAddButton && (
            <button
              onClick={onSelect}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add to Workout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseLibrary;