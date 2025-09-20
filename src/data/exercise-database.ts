import { Exercise, MuscleGroup, Equipment, Difficulty, ExerciseType } from '../types/ExerciseLibrary';

// Comprehensive Exercise Database
export const EXERCISE_DATABASE: Exercise[] = [
  // CHEST EXERCISES
  {
    id: 'push-up',
    name: 'Push-Up',
    description: 'Classic bodyweight exercise targeting chest, shoulders, and triceps',
    instructions: [
      'Start in plank position with hands slightly wider than shoulders',
      'Lower body until chest nearly touches the ground',
      'Push back up to starting position',
      'Keep core tight throughout the movement'
    ],
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    type: 'compound',
    tips: [
      'Keep body in straight line from head to heels',
      'Don\'t let hips sag or pike up',
      'Control the descent for better muscle activation'
    ],
    commonMistakes: [
      'Partial range of motion',
      'Poor core engagement',
      'Flaring elbows too wide'
    ],
    targetReps: '8-15',
    defaultSets: 3,
    restTime: 60,
    calories: 5,
    tags: ['bodyweight', 'chest', 'beginner-friendly', 'home-workout'],
    popularity: 95,
    variations: ['incline-push-up', 'diamond-push-up', 'wide-grip-push-up'],
    modifications: {
      easier: ['incline-push-up', 'knee-push-up'],
      harder: ['diamond-push-up', 'one-arm-push-up', 'archer-push-up']
    }
  },
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    description: 'Fundamental chest exercise using barbell for maximum strength development',
    instructions: [
      'Lie on bench with eyes under the bar',
      'Grip bar slightly wider than shoulder width',
      'Unrack and lower bar to chest with control',
      'Press bar up until arms are extended',
      'Keep feet planted and maintain arch'
    ],
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: [
      'Retract shoulder blades for stability',
      'Touch bar to chest at nipple line',
      'Drive through heels for leg drive'
    ],
    commonMistakes: [
      'Bouncing bar off chest',
      'Lifting feet off ground',
      'Too wide or narrow grip'
    ],
    targetReps: '6-10',
    defaultSets: 4,
    restTime: 180,
    calories: 8,
    tags: ['barbell', 'chest', 'strength', 'compound'],
    popularity: 90,
    isComplex: true,
    prerequisites: ['push-up'],
    variations: ['incline-bench-press', 'decline-bench-press', 'close-grip-bench-press']
  },
  {
    id: 'dumbbell-chest-press',
    name: 'Dumbbell Chest Press',
    description: 'Dumbbell variation allowing greater range of motion and unilateral training',
    instructions: [
      'Lie on bench holding dumbbells at chest level',
      'Press dumbbells up and slightly together',
      'Lower with control to feel stretch in chest',
      'Maintain neutral wrist position'
    ],
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: ['dumbbells', 'bench'],
    difficulty: 'beginner',
    type: 'compound',
    tips: [
      'Allow dumbbells to go deeper than barbell',
      'Focus on squeezing chest at top',
      'Keep elbows at 45-degree angle'
    ],
    commonMistakes: [
      'Going too heavy too soon',
      'Flaring elbows too wide',
      'Not controlling the weight'
    ],
    targetReps: '8-12',
    defaultSets: 3,
    restTime: 90,
    calories: 7,
    tags: ['dumbbell', 'chest', 'unilateral', 'range-of-motion'],
    popularity: 85,
    variations: ['incline-dumbbell-press', 'decline-dumbbell-press']
  },

  // BACK EXERCISES
  {
    id: 'pull-up',
    name: 'Pull-Up',
    description: 'Ultimate bodyweight back exercise for developing pulling strength',
    instructions: [
      'Hang from bar with palms facing away',
      'Pull body up until chin clears bar',
      'Lower with control to full arm extension',
      'Engage lats and avoid swinging'
    ],
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: ['pull-up-bar'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: [
      'Think about pulling elbows down and back',
      'Squeeze shoulder blades together',
      'Start from dead hang for full range'
    ],
    commonMistakes: [
      'Using momentum to swing',
      'Not achieving full range of motion',
      'Neglecting the negative portion'
    ],
    targetReps: '5-10',
    defaultSets: 3,
    restTime: 120,
    calories: 6,
    tags: ['bodyweight', 'back', 'pull', 'functional'],
    popularity: 80,
    prerequisites: ['inverted-row'],
    variations: ['chin-up', 'wide-grip-pull-up', 'neutral-grip-pull-up'],
    modifications: {
      easier: ['assisted-pull-up', 'inverted-row'],
      harder: ['weighted-pull-up', 'archer-pull-up', 'one-arm-pull-up']
    }
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    description: 'King of all exercises - full body compound movement',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Hinge at hips and grip bar outside legs',
      'Keep chest up and back straight',
      'Drive through heels to stand up',
      'Reverse movement to lower bar'
    ],
    primaryMuscles: ['back', 'glutes', 'hamstrings'],
    secondaryMuscles: ['core', 'legs', 'shoulders'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    type: 'compound',
    tips: [
      'Keep bar close to body throughout',
      'Engage lats to protect spine',
      'Lead with hips on the way up'
    ],
    commonMistakes: [
      'Rounding the back',
      'Bar drifting away from body',
      'Not engaging glutes at top'
    ],
    targetReps: '5-8',
    defaultSets: 4,
    restTime: 240,
    calories: 12,
    tags: ['barbell', 'compound', 'strength', 'full-body'],
    popularity: 88,
    isComplex: true,
    prerequisites: ['romanian-deadlift', 'hip-hinge'],
    variations: ['sumo-deadlift', 'romanian-deadlift', 'trap-bar-deadlift']
  },
  {
    id: 'bent-over-row',
    name: 'Bent-Over Barbell Row',
    description: 'Horizontal pulling exercise for back thickness and strength',
    instructions: [
      'Hold barbell with overhand grip',
      'Hinge at hips keeping back straight',
      'Pull bar to lower chest/upper abdomen',
      'Squeeze shoulder blades together',
      'Lower with control'
    ],
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: [
      'Keep torso stable throughout',
      'Pull with elbows, not hands',
      'Focus on squeezing back muscles'
    ],
    commonMistakes: [
      'Using too much body english',
      'Not maintaining hip hinge',
      'Rowing to wrong position'
    ],
    targetReps: '6-10',
    defaultSets: 4,
    restTime: 120,
    calories: 8,
    tags: ['barbell', 'back', 'pull', 'horizontal'],
    popularity: 75,
    prerequisites: ['hip-hinge'],
    variations: ['dumbbell-row', 'pendlay-row', 'chest-supported-row']
  },

  // LEG EXERCISES
  {
    id: 'squat',
    name: 'Bodyweight Squat',
    description: 'Fundamental lower body movement pattern',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower by pushing hips back and bending knees',
      'Keep chest up and knees tracking over toes',
      'Descend until thighs parallel to floor',
      'Drive through heels to return to start'
    ],
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'calves', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    type: 'compound',
    tips: [
      'Keep weight in heels and mid-foot',
      'Maintain neutral spine throughout',
      'Think about sitting back into a chair'
    ],
    commonMistakes: [
      'Knees caving inward',
      'Not achieving depth',
      'Forward lean of torso'
    ],
    targetReps: '12-20',
    defaultSets: 3,
    restTime: 60,
    calories: 6,
    tags: ['bodyweight', 'legs', 'fundamental', 'functional'],
    popularity: 90,
    variations: ['goblet-squat', 'jump-squat', 'single-leg-squat'],
    progressions: ['goblet-squat', 'barbell-back-squat']
  },
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    description: 'The king of leg exercises for maximum strength and mass',
    instructions: [
      'Position bar on upper traps (high bar) or rear delts (low bar)',
      'Step back from rack with feet shoulder-width apart',
      'Descend by pushing hips back and bending knees',
      'Keep chest up and core braced',
      'Drive through whole foot to stand up'
    ],
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'calves', 'core', 'back'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: [
      'Breathe and brace core before descending',
      'Keep knees aligned with toes',
      'Focus on driving floor away'
    ],
    commonMistakes: [
      'Knee valgus (caving in)',
      'Excessive forward lean',
      'Not reaching proper depth'
    ],
    targetReps: '6-10',
    defaultSets: 4,
    restTime: 180,
    calories: 10,
    tags: ['barbell', 'legs', 'compound', 'strength'],
    popularity: 85,
    isComplex: true,
    prerequisites: ['squat', 'goblet-squat'],
    variations: ['front-squat', 'overhead-squat', 'box-squat']
  },
  {
    id: 'lunges',
    name: 'Forward Lunges',
    description: 'Unilateral leg exercise for balance, stability, and strength',
    instructions: [
      'Step forward with one leg into a long stride',
      'Lower back knee toward ground',
      'Keep front knee over ankle',
      'Push off front foot to return to start',
      'Alternate legs or complete all reps on one side'
    ],
    primaryMuscles: ['quadriceps', 'glutes'],
    secondaryMuscles: ['hamstrings', 'calves', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    type: 'compound',
    tips: [
      'Take a long enough stride',
      'Keep torso upright',
      'Control the descent'
    ],
    commonMistakes: [
      'Step too short or too long',
      'Allowing front knee to cave',
      'Not stabilizing core'
    ],
    targetReps: '10-15 each leg',
    defaultSets: 3,
    restTime: 60,
    calories: 7,
    tags: ['bodyweight', 'legs', 'unilateral', 'balance'],
    popularity: 80,
    variations: ['reverse-lunges', 'lateral-lunges', 'walking-lunges']
  },

  // SHOULDER EXERCISES
  {
    id: 'overhead-press',
    name: 'Standing Overhead Press',
    description: 'Fundamental vertical pressing movement for shoulder strength',
    instructions: [
      'Hold bar at shoulder height with grip slightly wider than shoulders',
      'Engage core and keep feet planted',
      'Press bar straight up over head',
      'Lock out arms fully at top',
      'Lower with control to shoulders'
    ],
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: [
      'Keep rib cage down and core tight',
      'Press bar in straight line up',
      'Move head slightly back as bar passes'
    ],
    commonMistakes: [
      'Arching back excessively',
      'Pressing bar forward',
      'Not achieving full lockout'
    ],
    targetReps: '6-10',
    defaultSets: 4,
    restTime: 120,
    calories: 7,
    tags: ['barbell', 'shoulders', 'press', 'core'],
    popularity: 75,
    prerequisites: ['push-up'],
    variations: ['dumbbell-shoulder-press', 'seated-press', 'push-press']
  },
  {
    id: 'lateral-raises',
    name: 'Dumbbell Lateral Raises',
    description: 'Isolation exercise targeting the medial deltoids',
    instructions: [
      'Hold dumbbells at sides with slight bend in elbows',
      'Raise arms out to sides until parallel to floor',
      'Lead with pinky finger',
      'Lower with control',
      'Keep torso stable throughout'
    ],
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    type: 'isolation',
    tips: [
      'Use lighter weight for proper form',
      'Think about pouring water from a pitcher',
      'Don\'t use momentum'
    ],
    commonMistakes: [
      'Using too much weight',
      'Swinging the weights',
      'Raising arms too high'
    ],
    targetReps: '12-15',
    defaultSets: 3,
    restTime: 60,
    calories: 4,
    tags: ['dumbbell', 'shoulders', 'isolation', 'medial-delt'],
    popularity: 70,
    variations: ['cable-lateral-raises', 'seated-lateral-raises']
  },

  // ARM EXERCISES
  {
    id: 'bicep-curls',
    name: 'Dumbbell Bicep Curls',
    description: 'Classic isolation exercise for bicep development',
    instructions: [
      'Hold dumbbells with arms at sides, palms facing forward',
      'Keep elbows close to body',
      'Curl weights up by flexing biceps',
      'Squeeze at the top',
      'Lower with control'
    ],
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    type: 'isolation',
    tips: [
      'Don\'t swing the weights',
      'Focus on the negative portion',
      'Keep wrists straight'
    ],
    commonMistakes: [
      'Using momentum',
      'Partial range of motion',
      'Moving elbows'
    ],
    targetReps: '10-15',
    defaultSets: 3,
    restTime: 60,
    calories: 3,
    tags: ['dumbbell', 'biceps', 'isolation', 'arms'],
    popularity: 85,
    variations: ['hammer-curls', 'preacher-curls', 'cable-curls']
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    description: 'Bodyweight exercise targeting triceps and rear deltoids',
    instructions: [
      'Sit on edge of bench with hands beside hips',
      'Extend legs out and lift hips off bench',
      'Lower body by bending elbows',
      'Push back up to starting position',
      'Keep elbows close to body'
    ],
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['shoulders', 'chest'],
    equipment: ['bench'],
    difficulty: 'intermediate',
    type: 'compound',
    tips: [
      'Don\'t go too low to avoid shoulder stress',
      'Keep body close to bench',
      'Focus on tricep engagement'
    ],
    commonMistakes: [
      'Going too deep',
      'Flaring elbows out',
      'Leaning forward too much'
    ],
    targetReps: '8-15',
    defaultSets: 3,
    restTime: 90,
    calories: 5,
    tags: ['bodyweight', 'triceps', 'bench', 'compound'],
    popularity: 75,
    modifications: {
      easier: ['bench-tricep-dips-bent-knees'],
      harder: ['weighted-tricep-dips', 'ring-dips']
    }
  },

  // CORE EXERCISES
  {
    id: 'plank',
    name: 'Plank',
    description: 'Isometric core exercise for stability and endurance',
    instructions: [
      'Start in push-up position on forearms',
      'Keep body in straight line from head to heels',
      'Engage core and glutes',
      'Breathe normally while holding position',
      'Hold for prescribed time'
    ],
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders', 'glutes'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    type: 'isolation',
    tips: [
      'Don\'t let hips sag or pike up',
      'Keep neck in neutral position',
      'Breathe steadily throughout'
    ],
    commonMistakes: [
      'Improper body alignment',
      'Holding breath',
      'Not engaging glutes'
    ],
    targetReps: '30-60 seconds',
    defaultSets: 3,
    restTime: 60,
    calories: 4,
    tags: ['bodyweight', 'core', 'isometric', 'stability'],
    popularity: 90,
    variations: ['side-plank', 'plank-up-downs', 'plank-jacks'],
    progressions: ['side-plank', 'plank-up-downs']
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    description: 'Dynamic core exercise that also provides cardio benefits',
    instructions: [
      'Start in plank position',
      'Bring right knee toward chest',
      'Quickly switch legs',
      'Keep hips level and core engaged',
      'Maintain steady rhythm'
    ],
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders', 'legs', 'cardio'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    type: 'cardio',
    tips: [
      'Keep hands planted firmly',
      'Maintain plank position throughout',
      'Start slow and build speed'
    ],
    commonMistakes: [
      'Letting hips rise',
      'Not bringing knees far enough',
      'Poor hand placement'
    ],
    targetReps: '20-30 seconds',
    defaultSets: 3,
    restTime: 60,
    calories: 8,
    tags: ['bodyweight', 'core', 'cardio', 'dynamic'],
    popularity: 80,
    variations: ['cross-body-mountain-climbers', 'slow-mountain-climbers']
  },

  // CARDIO EXERCISES
  {
    id: 'burpees',
    name: 'Burpees',
    description: 'Full-body exercise combining squat, plank, and jump',
    instructions: [
      'Start standing, then squat down and place hands on floor',
      'Jump feet back into plank position',
      'Perform push-up (optional)',
      'Jump feet back to squat position',
      'Explosively jump up with arms overhead'
    ],
    primaryMuscles: ['full-body'],
    secondaryMuscles: ['cardio'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    type: 'cardio',
    tips: [
      'Land softly on jumps',
      'Keep core engaged throughout',
      'Pace yourself for multiple reps'
    ],
    commonMistakes: [
      'Poor landing mechanics',
      'Not achieving full range',
      'Going too fast too soon'
    ],
    targetReps: '5-15',
    defaultSets: 3,
    restTime: 90,
    calories: 12,
    tags: ['bodyweight', 'full-body', 'cardio', 'explosive'],
    popularity: 70,
    modifications: {
      easier: ['step-back-burpees', 'half-burpees'],
      harder: ['burpee-box-jumps', 'burpee-pull-ups']
    }
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    description: 'Classic cardio exercise for warm-up and conditioning',
    instructions: [
      'Start standing with feet together, arms at sides',
      'Jump feet apart while raising arms overhead',
      'Jump back to starting position',
      'Maintain steady rhythm',
      'Land softly on balls of feet'
    ],
    primaryMuscles: ['cardio'],
    secondaryMuscles: ['legs', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    type: 'cardio',
    tips: [
      'Land lightly on feet',
      'Keep movements controlled',
      'Breathe rhythmically'
    ],
    commonMistakes: [
      'Landing too hard',
      'Not achieving full range',
      'Rushing the movement'
    ],
    targetReps: '20-50',
    defaultSets: 3,
    restTime: 30,
    calories: 6,
    tags: ['bodyweight', 'cardio', 'warm-up', 'conditioning'],
    popularity: 85,
    variations: ['star-jumps', 'seal-jacks', 'power-jacks']
  }
];

// Helper function to get exercises by muscle group
export const getExercisesByMuscleGroup = (muscleGroup: MuscleGroup): Exercise[] => {
  return EXERCISE_DATABASE.filter(exercise =>
    exercise.primaryMuscles.includes(muscleGroup) ||
    exercise.secondaryMuscles.includes(muscleGroup)
  );
};

// Helper function to get exercises by equipment
export const getExercisesByEquipment = (equipment: Equipment): Exercise[] => {
  return EXERCISE_DATABASE.filter(exercise =>
    exercise.equipment.includes(equipment)
  );
};

// Helper function to get exercises by difficulty
export const getExercisesByDifficulty = (difficulty: Difficulty): Exercise[] => {
  return EXERCISE_DATABASE.filter(exercise =>
    exercise.difficulty === difficulty
  );
};

// Helper function to search exercises
export const searchExercises = (searchTerm: string): Exercise[] => {
  const term = searchTerm.toLowerCase();
  return EXERCISE_DATABASE.filter(exercise =>
    exercise.name.toLowerCase().includes(term) ||
    exercise.description.toLowerCase().includes(term) ||
    exercise.tags.some(tag => tag.toLowerCase().includes(term)) ||
    exercise.primaryMuscles.some(muscle => muscle.toLowerCase().includes(term)) ||
    exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(term))
  );
};

// Helper function to get exercise by ID
export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISE_DATABASE.find(exercise => exercise.id === id);
};