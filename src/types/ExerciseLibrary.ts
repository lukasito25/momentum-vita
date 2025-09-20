// Exercise Library Types for Custom Workout Builder

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'abs'
  | 'obliques'
  | 'cardio'
  | 'full-body';

export type Equipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'resistance-bands'
  | 'kettlebell'
  | 'cable-machine'
  | 'smith-machine'
  | 'pull-up-bar'
  | 'bench'
  | 'plates'
  | 'medicine-ball'
  | 'suspension-trainer'
  | 'foam-roller'
  | 'box'
  | 'battle-ropes';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ExerciseType = 'compound' | 'isolation' | 'cardio' | 'flexibility' | 'plyometric';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  type: ExerciseType;
  videoUrl?: string;
  imageUrl?: string;
  tips: string[];
  commonMistakes: string[];
  variations?: Exercise['id'][];
  targetReps: string; // e.g., "8-12", "15-20", "30 seconds"
  defaultSets: number;
  restTime: number; // in seconds
  calories?: number; // estimated calories per rep/minute
  tags: string[];
  popularity: number; // 1-100, for sorting
  isComplex?: boolean; // requires technique focus
  prerequisites?: Exercise['id'][]; // exercises to master first
  progressions?: Exercise['id'][]; // next level exercises
  modifications?: {
    easier: Exercise['id'][];
    harder: Exercise['id'][];
  };
}

export interface ExerciseFilter {
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty[];
  type: ExerciseType[];
  searchTerm: string;
  showFavorites: boolean;
  sortBy: 'name' | 'difficulty' | 'popularity' | 'recently-added';
  sortOrder: 'asc' | 'desc';
}

export interface CustomWorkout {
  id: string;
  name: string;
  description: string;
  exercises: CustomWorkoutExercise[];
  estimatedDuration: number; // in minutes
  difficulty: Difficulty;
  tags: string[];
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isPremium: boolean;
  createdBy?: string; // user id
  likes?: number;
  uses?: number;
  notes?: string;
}

export interface CustomWorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  targetReps: string;
  restTime: number;
  weight?: number;
  notes?: string;
  isSuperset?: boolean;
  supersetGroup?: number;
  order: number;
  modifications?: {
    dropSets?: boolean;
    restPause?: boolean;
    cluster?: boolean;
    tempo?: string; // e.g., "3-1-2-1"
  };
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  exercises: Omit<CustomWorkoutExercise, 'id' | 'exercise'>[];
  difficulty: Difficulty;
  estimatedDuration: number;
  targetMuscles: MuscleGroup[];
  requiredEquipment: Equipment[];
  isPremium: boolean;
  tags: string[];
}

export interface ExerciseProgress {
  exerciseId: string;
  personalBest: {
    weight: number;
    reps: number;
    date: string;
  };
  lastPerformed: {
    weight: number;
    reps: number;
    sets: number;
    date: string;
  };
  totalSessions: number;
  averageWeight: number;
  averageReps: number;
  trend: 'improving' | 'maintaining' | 'declining';
  notes: string[];
}

export interface WorkoutBuilderState {
  currentWorkout: Partial<CustomWorkout>;
  selectedExercises: CustomWorkoutExercise[];
  isEditing: boolean;
  draggedExercise: CustomWorkoutExercise | null;
  showExerciseLibrary: boolean;
  activeSuperset: number | null;
  unsavedChanges: boolean;
}

export interface ExerciseLibraryState {
  exercises: Exercise[];
  filteredExercises: Exercise[];
  filters: ExerciseFilter;
  favorites: string[]; // exercise IDs
  recentlyUsed: string[]; // exercise IDs
  isLoading: boolean;
  selectedExercise: Exercise | null;
  showExerciseDetail: boolean;
}

// Premium Features Configuration
export interface PremiumFeatures {
  maxCustomWorkouts: number;
  maxExercisesPerWorkout: number;
  advancedFilters: boolean;
  supersetSupport: boolean;
  workoutTemplates: boolean;
  progressTracking: boolean;
  exerciseAnalytics: boolean;
  customTags: boolean;
  workoutSharing: boolean;
  advancedModifications: boolean;
}

export const FREE_TIER_LIMITS: PremiumFeatures = {
  maxCustomWorkouts: 3,
  maxExercisesPerWorkout: 8,
  advancedFilters: false,
  supersetSupport: false,
  workoutTemplates: false,
  progressTracking: false,
  exerciseAnalytics: false,
  customTags: false,
  workoutSharing: false,
  advancedModifications: false,
};

export const PREMIUM_TIER_LIMITS: PremiumFeatures = {
  maxCustomWorkouts: -1, // unlimited
  maxExercisesPerWorkout: -1, // unlimited
  advancedFilters: true,
  supersetSupport: true,
  workoutTemplates: true,
  progressTracking: true,
  exerciseAnalytics: true,
  customTags: true,
  workoutSharing: true,
  advancedModifications: true,
};

// Exercise Database Search and Filtering
export interface ExerciseSearchResult {
  exercise: Exercise;
  relevanceScore: number;
  matchedFields: string[];
}

export interface ExerciseLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseSelect: (exercise: Exercise) => void;
  selectedExercises?: string[]; // IDs of already selected exercises
  filters?: Partial<ExerciseFilter>;
  showAddButton?: boolean;
  multiSelect?: boolean;
  onMultiSelect?: (exercises: Exercise[]) => void;
}

export interface WorkoutBuilderProps {
  initialWorkout?: Partial<CustomWorkout>;
  onSave: (workout: CustomWorkout) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export interface QuickLoggerProps {
  workout: CustomWorkout;
  onWorkoutComplete: (sessionData: any) => void;
  onWorkoutPause: () => void;
  onWorkoutAbandon: () => void;
}

// Default exercise categories for quick filtering
export const MUSCLE_GROUP_CATEGORIES = {
  'Upper Body': ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps'],
  'Lower Body': ['legs', 'quadriceps', 'hamstrings', 'glutes', 'calves'],
  'Core': ['core', 'abs', 'obliques'],
  'Full Body': ['full-body', 'cardio']
} as const;

export const EQUIPMENT_CATEGORIES = {
  'Home Gym': ['bodyweight', 'dumbbells', 'resistance-bands', 'pull-up-bar'],
  'Commercial Gym': ['barbell', 'cable-machine', 'smith-machine', 'bench'],
  'Functional': ['kettlebell', 'medicine-ball', 'battle-ropes', 'box'],
  'Minimal': ['bodyweight', 'resistance-bands', 'foam-roller']
} as const;

// Utility functions for working with exercises
export const getExerciseDuration = (exercise: CustomWorkoutExercise): number => {
  // Estimate duration based on sets, reps, and rest time
  const avgRepsTime = 30; // seconds per set
  const totalSetTime = exercise.sets * avgRepsTime;
  const totalRestTime = (exercise.sets - 1) * exercise.restTime;
  return Math.ceil((totalSetTime + totalRestTime) / 60); // return minutes
};

export const getWorkoutDuration = (exercises: CustomWorkoutExercise[]): number => {
  return exercises.reduce((total, exercise) => total + getExerciseDuration(exercise), 0);
};

export const getWorkoutMuscleGroups = (exercises: CustomWorkoutExercise[]): MuscleGroup[] => {
  const muscleGroups = new Set<MuscleGroup>();
  exercises.forEach(ex => {
    ex.exercise.primaryMuscles.forEach(muscle => muscleGroups.add(muscle));
    ex.exercise.secondaryMuscles.forEach(muscle => muscleGroups.add(muscle));
  });
  return Array.from(muscleGroups);
};

export const getWorkoutEquipment = (exercises: CustomWorkoutExercise[]): Equipment[] => {
  const equipment = new Set<Equipment>();
  exercises.forEach(ex => {
    ex.exercise.equipment.forEach(eq => equipment.add(eq));
  });
  return Array.from(equipment);
};

export const calculateWorkoutDifficulty = (exercises: CustomWorkoutExercise[]): Difficulty => {
  if (exercises.length === 0) return 'beginner';

  const difficultyScores = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'expert': 4
  };

  const avgScore = exercises.reduce((sum, ex) =>
    sum + difficultyScores[ex.exercise.difficulty], 0
  ) / exercises.length;

  if (avgScore < 1.5) return 'beginner';
  if (avgScore < 2.5) return 'intermediate';
  if (avgScore < 3.5) return 'advanced';
  return 'expert';
};