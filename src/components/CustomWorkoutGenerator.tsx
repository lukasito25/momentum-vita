import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  Clock,
  Zap,
  Users,
  Home,
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Minus,
  Shuffle,
} from 'lucide-react';

interface CustomWorkoutGeneratorProps {
  onComplete: (workout: GeneratedWorkout) => void;
  onClose: () => void;
}

interface GeneratedWorkout {
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
}

type WorkoutGoal = 'strength' | 'endurance' | 'flexibility' | 'fat-loss' | 'muscle-gain' | 'functional';
type WorkoutDuration = '15' | '30' | '45' | '60';
type EquipmentType = 'none' | 'basic' | 'gym';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

const exerciseDatabase = {
  strength: {
    bodyweight: [
      { name: "Push-ups", sets: "3 x 8-12", rest: "60 sec", notes: "Focus on controlled movement and full range of motion" },
      { name: "Pull-ups", sets: "3 x 5-8", rest: "90 sec", notes: "Use assistance if needed, focus on form" },
      { name: "Squats", sets: "3 x 12-15", rest: "60 sec", notes: "Full depth, weight in heels" },
      { name: "Pike Push-ups", sets: "3 x 6-10", rest: "75 sec", notes: "Shoulders and core engagement" },
      { name: "Single Leg Deadlifts", sets: "3 x 8-10 each", rest: "60 sec", notes: "Balance and posterior chain" },
    ],
    basic: [
      { name: "Dumbbell Press", sets: "3 x 8-12", rest: "90 sec", notes: "Control the weight through full range" },
      { name: "Dumbbell Rows", sets: "3 x 10-12", rest: "75 sec", notes: "Squeeze shoulder blades together" },
      { name: "Goblet Squats", sets: "3 x 10-15", rest: "60 sec", notes: "Hold weight at chest, deep squat" },
      { name: "Overhead Press", sets: "3 x 8-10", rest: "90 sec", notes: "Press straight up, core tight" },
      { name: "Deadlifts", sets: "3 x 6-8", rest: "2 min", notes: "Hip hinge movement, straight back" },
    ],
    gym: [
      { name: "Barbell Bench Press", sets: "4 x 6-8", rest: "2-3 min", notes: "Progressive overload, proper form" },
      { name: "Barbell Rows", sets: "4 x 8-10", rest: "2 min", notes: "Pull to lower chest, control negative" },
      { name: "Barbell Squats", sets: "4 x 8-10", rest: "2-3 min", notes: "Full depth, track knees over toes" },
      { name: "Overhead Press", sets: "4 x 6-8", rest: "2 min", notes: "Standing, core braced throughout" },
      { name: "Deadlifts", sets: "3 x 5", rest: "3 min", notes: "Heavy compound movement, perfect form" },
    ]
  },
  endurance: {
    bodyweight: [
      { name: "Burpees", sets: "3 x 8-12", rest: "45 sec", notes: "Full body explosive movement" },
      { name: "Mountain Climbers", sets: "3 x 30 sec", rest: "30 sec", notes: "Quick feet, maintain plank" },
      { name: "Jump Squats", sets: "3 x 15-20", rest: "45 sec", notes: "Explosive up, soft landing" },
      { name: "High Knees", sets: "3 x 30 sec", rest: "30 sec", notes: "Drive knees up, quick tempo" },
      { name: "Plank Jacks", sets: "3 x 20", rest: "45 sec", notes: "Jump feet out and in while planking" },
    ],
    basic: [
      { name: "Kettlebell Swings", sets: "4 x 20", rest: "60 sec", notes: "Hip drive, explosive movement" },
      { name: "Dumbbell Thrusters", sets: "3 x 12-15", rest: "75 sec", notes: "Squat to press, full body" },
      { name: "Battle Ropes", sets: "4 x 30 sec", rest: "60 sec", notes: "Alternating waves, constant motion" },
      { name: "Box Jumps", sets: "3 x 10-12", rest: "90 sec", notes: "Explosive up, step down safely" },
      { name: "Rowing Machine", sets: "3 x 500m", rest: "2 min", notes: "Maintain consistent pace" },
    ],
    gym: [
      { name: "Treadmill Intervals", sets: "6 x 2 min", rest: "1 min easy", notes: "High intensity intervals" },
      { name: "Bike Sprints", sets: "8 x 30 sec", rest: "90 sec", notes: "All-out effort on sprints" },
      { name: "Rowing Intervals", sets: "5 x 250m", rest: "90 sec", notes: "Sub-maximal sustainable pace" },
      { name: "Circuit Training", sets: "3 rounds", rest: "2 min", notes: "5 exercises, 45 sec each" },
      { name: "Stair Climber", sets: "20 min steady", rest: "N/A", notes: "Moderate to high intensity" },
    ]
  },
  flexibility: {
    bodyweight: [
      { name: "Cat-Cow Stretch", sets: "2 x 10", rest: "30 sec", notes: "Spinal mobility, slow controlled movement" },
      { name: "Hip Circles", sets: "2 x 8 each direction", rest: "30 sec", notes: "Open hip joint, full range" },
      { name: "Leg Swings", sets: "2 x 10 each", rest: "30 sec", notes: "Dynamic hip mobility" },
      { name: "Arm Circles", sets: "2 x 10 each direction", rest: "30 sec", notes: "Shoulder mobility warm-up" },
      { name: "Deep Squat Hold", sets: "3 x 30-60 sec", rest: "60 sec", notes: "Hip and ankle mobility" },
    ],
    basic: [
      { name: "Yoga Flow", sets: "2 x 5 min", rest: "1 min", notes: "Sun salutation sequence" },
      { name: "Foam Rolling", sets: "10 min total", rest: "N/A", notes: "Target tight areas, slow pressure" },
      { name: "Resistance Band Stretches", sets: "2 x 30 sec each", rest: "30 sec", notes: "Assisted stretching" },
      { name: "Mobility Stick Work", sets: "5 min", rest: "N/A", notes: "Shoulder and thoracic mobility" },
      { name: "Stretching Routine", sets: "15 min", rest: "N/A", notes: "Full body static stretches" },
    ],
    gym: [
      { name: "Sauna Session", sets: "2 x 10 min", rest: "5 min cool", notes: "Heat therapy for recovery" },
      { name: "Pool Recovery", sets: "20 min easy", rest: "N/A", notes: "Low impact movement" },
      { name: "Assisted Stretching", sets: "30 min session", rest: "N/A", notes: "Partner or trainer assisted" },
      { name: "Mobility Class", sets: "45 min", rest: "N/A", notes: "Guided mobility session" },
      { name: "Massage Therapy", sets: "30-60 min", rest: "N/A", notes: "Professional recovery session" },
    ]
  }
};

const CustomWorkoutGenerator: React.FC<CustomWorkoutGeneratorProps> = ({
  onComplete,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<'goals' | 'duration' | 'equipment' | 'experience' | 'generate' | 'results'>('goals');
  const [selectedGoals, setSelectedGoals] = useState<WorkoutGoal[]>([]);
  const [duration, setDuration] = useState<WorkoutDuration>('30');
  const [equipment, setEquipment] = useState<EquipmentType>('none');
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);

  const goals: Array<{ id: WorkoutGoal; label: string; icon: React.ComponentType; description: string }> = [
    { id: 'strength', label: 'Build Strength', icon: Dumbbell, description: 'Increase muscle strength and power' },
    { id: 'endurance', label: 'Improve Endurance', icon: Zap, description: 'Boost cardiovascular fitness' },
    { id: 'flexibility', label: 'Enhance Flexibility', icon: Users, description: 'Improve mobility and range of motion' },
    { id: 'fat-loss', label: 'Burn Fat', icon: Target, description: 'High-intensity fat burning' },
    { id: 'muscle-gain', label: 'Build Muscle', icon: Dumbbell, description: 'Hypertrophy and muscle growth' },
    { id: 'functional', label: 'Functional Fitness', icon: Home, description: 'Real-world movement patterns' },
  ];

  const equipmentOptions = [
    { id: 'none' as EquipmentType, label: 'No Equipment', description: 'Bodyweight only' },
    { id: 'basic' as EquipmentType, label: 'Basic Equipment', description: 'Dumbbells, resistance bands' },
    { id: 'gym' as EquipmentType, label: 'Full Gym', description: 'Complete gym access' },
  ];

  const handleGoalToggle = (goalId: WorkoutGoal) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const generateWorkout = () => {
    if (selectedGoals.length === 0) return;

    // AI-powered workout generation logic
    const primaryGoal = selectedGoals[0];
    const availableExercises = exerciseDatabase[primaryGoal]?.[equipment] || exerciseDatabase.strength[equipment];

    // Calculate number of exercises based on duration
    const exerciseCount = duration === '15' ? 4 : duration === '30' ? 6 : duration === '45' ? 8 : 10;

    // Select exercises with some randomization
    const selectedExercises = [];
    const usedExercises = new Set();

    for (let i = 0; i < Math.min(exerciseCount, availableExercises.length); i++) {
      let exercise;
      do {
        exercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
      } while (usedExercises.has(exercise.name) && usedExercises.size < availableExercises.length);

      if (!usedExercises.has(exercise.name)) {
        selectedExercises.push({
          id: `exercise_${i}`,
          name: exercise.name,
          sets: adjustSetsForExperience(exercise.sets, experience),
          rest: exercise.rest,
          notes: exercise.notes,
        });
        usedExercises.add(exercise.name);
      }
    }

    const workout: GeneratedWorkout = {
      name: `Custom ${primaryGoal.charAt(0).toUpperCase() + primaryGoal.slice(1)} Workout`,
      exercises: selectedExercises,
      duration: parseInt(duration),
      difficulty: experience,
      focus: selectedGoals,
    };

    setGeneratedWorkout(workout);
    setCurrentStep('results');
  };

  const adjustSetsForExperience = (baseSets: string, level: ExperienceLevel): string => {
    const [sets, reps] = baseSets.split(' x ');
    const setCount = parseInt(sets);

    if (level === 'beginner') {
      return `${Math.max(2, setCount - 1)} x ${reps}`;
    } else if (level === 'advanced') {
      return `${setCount + 1} x ${reps}`;
    }
    return baseSets;
  };

  const regenerateWorkout = () => {
    generateWorkout();
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'goals':
        setCurrentStep('duration');
        break;
      case 'duration':
        setCurrentStep('equipment');
        break;
      case 'equipment':
        setCurrentStep('experience');
        break;
      case 'experience':
        setCurrentStep('generate');
        generateWorkout();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'duration':
        setCurrentStep('goals');
        break;
      case 'equipment':
        setCurrentStep('duration');
        break;
      case 'experience':
        setCurrentStep('equipment');
        break;
      case 'generate':
      case 'results':
        setCurrentStep('experience');
        break;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'goals':
        return selectedGoals.length > 0;
      case 'duration':
      case 'equipment':
      case 'experience':
        return true;
      default:
        return false;
    }
  };

  const getProgressPercentage = () => {
    const steps = ['goals', 'duration', 'equipment', 'experience', 'results'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="mobile-container max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button
            onClick={currentStep === 'goals' ? onClose : handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
          >
            {currentStep === 'goals' ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">AI Workout Generator</span>
          </div>
          <div className="w-8 h-8" /> {/* Spacer */}
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'goals' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">What are your goals?</h2>
              <p className="text-gray-600 mb-6">Select what you want to focus on today</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {goals.map(({ id, label, icon: Icon, description }) => (
                  <button
                    key={id}
                    onClick={() => handleGoalToggle(id)}
                    className={`p-4 rounded-lg border-2 transition-all touch-feedback ${
                      selectedGoals.includes(id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      selectedGoals.includes(id) ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <div className={`text-sm font-medium mb-1 ${
                      selectedGoals.includes(id) ? 'text-indigo-900' : 'text-gray-700'
                    }`}>
                      {label}
                    </div>
                    <div className={`text-xs ${
                      selectedGoals.includes(id) ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'duration' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">How much time do you have?</h2>
              <p className="text-gray-600 mb-6">Choose your workout duration</p>
              <div className="space-y-3 mb-6">
                {['15', '30', '45', '60'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setDuration(time as WorkoutDuration)}
                    className={`w-full p-4 rounded-lg border-2 flex items-center justify-between transition-all touch-feedback ${
                      duration === time
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className={`w-5 h-5 ${
                        duration === time ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        duration === time ? 'text-indigo-900' : 'text-gray-700'
                      }`}>
                        {time} minutes
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'equipment' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">What equipment do you have?</h2>
              <p className="text-gray-600 mb-6">We'll tailor the workout to your available equipment</p>
              <div className="space-y-3 mb-6">
                {equipmentOptions.map(({ id, label, description }) => (
                  <button
                    key={id}
                    onClick={() => setEquipment(id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all touch-feedback ${
                      equipment === id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-medium mb-1 ${
                      equipment === id ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {label}
                    </div>
                    <div className={`text-sm ${
                      equipment === id ? 'text-indigo-600' : 'text-gray-600'
                    }`}>
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'experience' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">What's your experience level?</h2>
              <p className="text-gray-600 mb-6">Help us set the right intensity</p>
              <div className="space-y-3 mb-6">
                {[
                  { id: 'beginner' as ExperienceLevel, label: 'Beginner', description: 'New to working out' },
                  { id: 'intermediate' as ExperienceLevel, label: 'Intermediate', description: '6+ months experience' },
                  { id: 'advanced' as ExperienceLevel, label: 'Advanced', description: '2+ years experience' },
                ].map(({ id, label, description }) => (
                  <button
                    key={id}
                    onClick={() => setExperience(id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all touch-feedback ${
                      experience === id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-medium mb-1 ${
                      experience === id ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {label}
                    </div>
                    <div className={`text-sm ${
                      experience === id ? 'text-indigo-600' : 'text-gray-600'
                    }`}>
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'results' && generatedWorkout && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{generatedWorkout.name}</h2>
                <p className="text-gray-600">
                  {generatedWorkout.duration} min • {generatedWorkout.exercises.length} exercises • {generatedWorkout.difficulty}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {generatedWorkout.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{exercise.name}</span>
                      <span className="text-sm text-indigo-600">{exercise.sets}</span>
                    </div>
                    <p className="text-xs text-gray-600">{exercise.notes}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={regenerateWorkout}
                  className="flex-1 btn btn-secondary touch-feedback"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Regenerate
                </button>
                <button
                  onClick={() => onComplete(generatedWorkout)}
                  className="flex-1 btn btn-primary touch-feedback"
                >
                  Start Workout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep !== 'results' && (
          <div className="p-6 pt-0">
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-full btn btn-primary btn-lg touch-feedback disabled:opacity-50"
            >
              {currentStep === 'experience' ? 'Generate Workout' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomWorkoutGenerator;