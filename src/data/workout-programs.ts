import { foundationBuilderProgram } from './foundation-builder';
import { beastModeEliteWorkouts } from './beast-mode-elite';
import { powerSurgeProWorkouts } from './power-surge-pro';

export interface Exercise {
  name: string;
  sets: string;
  rest: string;
  notes: string;
  demo?: string;
}

export interface WorkoutDay {
  color: string;
  exercises: {
    preparation: Exercise[];
    unleashed: Exercise[];
    legendary: Exercise[];
  };
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Beginner to Intermediate' | 'Intermediate' | 'Intermediate to Advanced' | 'Advanced' | 'Elite';
  equipment: string;
  goals: string[];
  weeks: number;
  daysPerWeek: number;
  workouts: Record<string, WorkoutDay>;
  isPremium?: boolean;
}

// Beast Mode Elite Program
const beastModeEliteProgram: WorkoutProgram = {
  id: 'beast-mode-elite',
  name: 'Beast Mode Elite',
  description: 'Advanced 12-week program for elite athletes. Extreme intensity, maximum results.',
  duration: '12 weeks',
  difficulty: 'Elite',
  equipment: 'Full gym access required',
  goals: ['Maximum Strength', 'Elite Performance', 'Advanced Techniques', 'Competition Prep'],
  weeks: 12,
  daysPerWeek: 4,
  workouts: beastModeEliteWorkouts,
  isPremium: true
};

// Power Surge Pro Program
const powerSurgeProProgram: WorkoutProgram = {
  id: 'power-surge-pro',
  name: 'Power Surge Pro',
  description: 'Intermediate to advanced 10-week program focusing on explosive power and strength.',
  duration: '10 weeks',
  difficulty: 'Intermediate to Advanced',
  equipment: 'Gym equipment recommended',
  goals: ['Explosive Power', 'Strength Building', 'Athletic Performance', 'Speed Development'],
  weeks: 10,
  daysPerWeek: 4,
  workouts: powerSurgeProWorkouts,
  isPremium: true
};

// All available workout programs
export const workoutPrograms: WorkoutProgram[] = [
  foundationBuilderProgram,
  powerSurgeProProgram,
  beastModeEliteProgram
];

// Helper functions
export const getWorkoutProgram = (id: string): WorkoutProgram | undefined => {
  return workoutPrograms.find(program => program.id === id);
};

export const getFreePrograms = (): WorkoutProgram[] => {
  return workoutPrograms.filter(program => !program.isPremium);
};

export const getPremiumPrograms = (): WorkoutProgram[] => {
  return workoutPrograms.filter(program => program.isPremium);
};

export const getWorkoutsByDifficulty = (difficulty: WorkoutProgram['difficulty']): WorkoutProgram[] => {
  return workoutPrograms.filter(program => program.difficulty === difficulty);
};

// Get today's workout for a specific program
export const getTodaysWorkout = (programId: string, week: number = 1): { dayName: string; exercises: Exercise[]; difficulty: string } | null => {
  const program = getWorkoutProgram(programId);
  if (!program) return null;

  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const workoutDays = Object.keys(program.workouts);

  // Map days of week to workout days (Monday, Wednesday, Friday for most programs)
  const dayMapping: Record<number, number> = {
    1: 0, // Monday -> first workout
    3: 1, // Wednesday -> second workout
    5: 2, // Friday -> third workout
  };

  const workoutIndex = dayMapping[dayOfWeek];
  if (workoutIndex === undefined || workoutIndex >= workoutDays.length) {
    return null; // No workout today
  }

  const dayName = workoutDays[workoutIndex];
  const workout = program.workouts[dayName];

  // Ensure workout exists and has exercises
  if (!workout || !workout.exercises) {
    return null;
  }

  // Start with preparation level, can be upgraded based on user progress
  const difficulty = 'preparation';
  const exercises = workout.exercises[difficulty as keyof typeof workout.exercises];

  // Ensure exercises array exists and is valid
  if (!exercises || !Array.isArray(exercises)) {
    return null;
  }

  return {
    dayName,
    exercises,
    difficulty
  };
};

export default workoutPrograms;