import { useState, useEffect } from "react";
import { CheckCircle2, Circle, RotateCcw, Trophy, Calendar, Clock, Plus, Minus, Play, FileText, Save, History, X, ArrowLeft, Timer } from "lucide-react";
import { DatabaseService } from './lib/supabase';
import ProgramSelection from './components/ProgramSelection';
import UserLevelDisplay from './components/UserLevelDisplay';
import AchievementBadges from './components/AchievementBadges';
import StreakTracker from './components/StreakTracker';
import XPGainNotification from './components/XPGainNotification';
import AchievementUnlockModal from './components/AchievementUnlockModal';
import LevelUpNotification from './components/LevelUpNotification';
import ProgressiveImage from './components/ProgressiveImage';
import LoadingScreen from './components/LoadingScreen';
import { useTimerPopup } from './components/TimerPopup';
import useGamification from './hooks/useGamification';
import { useWorkoutImages } from './hooks/useFitnessImages';
import useEnhancedWorkoutTracking from './hooks/useEnhancedWorkoutTracking';
import AdvancedExerciseCard from './components/AdvancedExerciseCard';
import GuidedWorkoutFlow from './components/GuidedWorkoutFlow';
import WorkoutModeToggle from './components/WorkoutModeToggle';
import WorkoutBuilder from './components/WorkoutBuilder';
import PremiumFeatureShowcase from './components/PremiumFeatureShowcase';
import type { TimerExercise } from './components/WorkoutTimer';
import { ExerciseSetTracking, SetData, WorkoutSessionData } from './types/SetTracking';
import { CustomWorkout } from './types/ExerciseLibrary';
import { beastModeEliteWorkouts } from './data/beast-mode-elite';
import { powerSurgeProWorkouts } from './data/power-surge-pro';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';

const TrainingProgram = () => {
  // Authentication hooks - now with defensive context
  const { user, login, isAuthenticated, isLoading: authLoading } = useAuth();
  const hasEnhancedMode = isAuthenticated && (user?.isPremium || isAuthenticated); // Enhanced mode for authenticated users (demo mode)

  const [currentWeek, setCurrentWeek] = useState(1);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [exerciseWeights, setExerciseWeights] = useState<Record<string, number>>({});
  const [nutritionGoals, setNutritionGoals] = useState<Record<string, boolean>>({});

  // Program-specific progress storage
  const [programProgress, setProgramProgress] = useState<Record<string, {
    currentWeek: number;
    completedExercises: Record<string, boolean>;
    exerciseWeights: Record<string, number>;
    nutritionGoals: Record<string, boolean>;
  }>>({});
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProgramSelection, setShowProgramSelection] = useState(false);
  const [currentProgramId, setCurrentProgramId] = useState<string>('foundation-builder');
  const [showGuidedWorkout, setShowGuidedWorkout] = useState(false);
  const [guidedWorkoutDay, setGuidedWorkoutDay] = useState<string>('');
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});

  // Custom workout builder state
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<CustomWorkout | null>(null);
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);

  // Premium features demo state
  const [showPremiumDemo, setShowPremiumDemo] = useState(false);
  const [premiumDemoFeature, setPremiumDemoFeature] = useState<'analytics' | 'programs' | 'customization'>('customization');

  // Authentication modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTrigger, setAuthTrigger] = useState<'enhanced-mode' | 'program-switch' | 'manual'>('manual');

  // Timer popup hook
  const timerPopup = useTimerPopup();

  // Gamification hook
  const gamification = useGamification();

  // Workout images hook
  const workoutImages = useWorkoutImages();

  // Enhanced workout tracking hook
  const enhancedTracking = useEnhancedWorkoutTracking();

  // Load data from Supabase on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Check if user should see program selection on first load
  useEffect(() => {
    const checkProgramSelection = async () => {
      try {
        await DatabaseService.ensureUserMigration();
        const userProgress = await DatabaseService.getUserProgress();
        if (userProgress?.current_program_id) {
          setCurrentProgramId(userProgress.current_program_id);
        } else {
          setShowProgramSelection(true);
        }
      } catch (error) {
        console.error('Error checking program selection:', error);
      }
    };

    if (!loading) {
      checkProgramSelection();
    }
  }, [loading]);

  // Auto-save progress when it changes
  useEffect(() => {
    if (!loading && currentProgramId) {
      saveCurrentProgramProgress();
    }
  }, [currentWeek, completedExercises, exerciseWeights, nutritionGoals, currentProgramId, loading]);

  const loadData = async () => {
    try {
      const [preferences, sessions, userProgress] = await Promise.all([
        DatabaseService.getPreferences(),
        DatabaseService.getSessions(),
        DatabaseService.getUserProgress()
      ]);

      if (preferences) {
        setCurrentWeek(preferences.current_week);
        setCompletedExercises(preferences.completed_exercises || {});
        setExerciseWeights(preferences.exercise_weights || {});
        setNutritionGoals(preferences.nutrition_goals || {});
        if (preferences.current_program_id) {
          setCurrentProgramId(preferences.current_program_id);
        }
      } else {
        setCompletedExercises({});
        setExerciseWeights({});
        setNutritionGoals({});
      }

      if (userProgress?.current_program_id) {
        setCurrentProgramId(userProgress.current_program_id);
      }

      setCompletedSessions(sessions || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Program selection handlers
  const handleProgramSelect = async (programId: string) => {
    try {
      // Save current program progress before switching
      saveCurrentProgramProgress();

      // Switch to new program and load its progress
      setCurrentProgramId(programId);
      loadProgramProgress(programId);

      // Try to update database, but don't fail if database is unavailable
      try {
        await DatabaseService.switchProgram(programId);
        const newProgress = programProgress[programId];
        await DatabaseService.savePreferences({
          current_week: newProgress?.currentWeek || 1,
          completed_exercises: newProgress?.completedExercises || {},
          exercise_weights: newProgress?.exerciseWeights || {},
          nutrition_goals: newProgress?.nutritionGoals || {},
          current_program_id: programId
        });
      } catch (dbError) {
        console.warn('Database unavailable, using local state only:', dbError);
      }

      setShowProgramSelection(false);
    } catch (error) {
      console.error('Error selecting program:', error);
      alert('Failed to switch program. Please try again.');
    }
  };

  const handleBackToProgramSelection = () => {
    setShowProgramSelection(true);
  };

  // Authentication handlers
  const handleAuthRequired = (trigger: 'enhanced-mode' | 'program-switch') => {
    if (isAuthenticated) return true;

    setAuthTrigger(trigger);
    setShowAuthModal(true);
    return false;
  };

  const handleAuth = async (userData: { email: string; name: string; provider: string }) => {
    try {
      await login(userData);
      setShowAuthModal(false);

      // If they were trying to enable enhanced mode, do it now
      if (authTrigger === 'enhanced-mode') {
        enhancedTracking.toggleEnhancedMode();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  // Progressive program structure - changes every 4 weeks, adapted per program
  const getPhase = (week: number) => {
    const programPhases = {
      'foundation-builder': {
        1: 'foundation',
        2: 'growth',
        3: 'intensity'
      },
      'beast-mode-elite': {
        1: 'preparation',
        2: 'unleashed',
        3: 'legendary'
      },
      'power-surge-pro': {
        1: 'build',
        2: 'surge',
        3: 'peak',
        4: 'elite'
      }
    };

    // Different phase progression for different programs
    let phaseIndex: number;
    if (currentProgramId === 'power-surge-pro') {
      // 16-week program with 4 phases (4 weeks each)
      phaseIndex = week <= 4 ? 1 : week <= 8 ? 2 : week <= 12 ? 3 : 4;
    } else if (currentProgramId === 'beast-mode-elite') {
      // 20-week program with 3 phases (approximately 6-7 weeks each)
      phaseIndex = week <= 7 ? 1 : week <= 14 ? 2 : 3;
    } else {
      // 12-week programs with 3 phases (4 weeks each)
      phaseIndex = week <= 4 ? 1 : week <= 8 ? 2 : 3;
    }
    return programPhases[currentProgramId as keyof typeof programPhases]?.[phaseIndex] || 'foundation';
  };

  const phaseConfig = {
    // Foundation Builder phases
    foundation: {
      name: "Foundation Phase",
      description: "Building movement patterns and base strength",
      color: "bg-blue-600"
    },
    growth: {
      name: "Growth Phase",
      description: "Higher volume for maximum muscle growth",
      color: "bg-green-600"
    },
    intensity: {
      name: "Intensity Phase",
      description: "Advanced techniques and peak strength",
      color: "bg-red-600"
    },
    // Beast Mode Elite phases
    preparation: {
      name: "Beast Preparation Phase",
      description: "Advanced movement preparation and power building",
      color: "bg-orange-600"
    },
    unleashed: {
      name: "Power Unleashed Phase",
      description: "Maximum power development and heavy training",
      color: "bg-red-700"
    },
    legendary: {
      name: "Legendary Phase",
      description: "Elite performance and legendary strength",
      color: "bg-gray-900"
    },
    // Power Surge Pro phases
    build: {
      name: "Power Build Phase",
      description: "Building explosive power foundation",
      color: "bg-purple-600"
    },
    surge: {
      name: "Strength Surge Phase",
      description: "Increasing load capacity and raw strength",
      color: "bg-indigo-600"
    },
    peak: {
      name: "Power Peak Phase",
      description: "Maximum power output with plyometrics",
      color: "bg-blue-700"
    },
    elite: {
      name: "Elite Conditioning Phase",
      description: "Peak performance with advanced techniques",
      color: "bg-slate-800"
    }
  };

  // Daily nutrition goals
  const dailyNutritionGoals = [
    { name: "Meal 1: Protein (39g)", icon: "🥩", category: "protein" },
    { name: "Meal 2: Protein (39g)", icon: "🍗", category: "protein" },
    { name: "Meal 3: Protein (39g)", icon: "🥛", category: "protein" },
    { name: "Meal 4: Protein (39g)", icon: "🍳", category: "protein" },
    { name: "Water: 2-3 Liters", icon: "💧", category: "hydration" },
    { name: "Vegetables/Fruits", icon: "🥗", category: "micronutrients" },
    { name: "Healthy Fats", icon: "🥑", category: "fats" },
    { name: "Complex Carbs", icon: "🍠", category: "carbs" },
    { name: "Creatine", icon: "💊", category: "supplements" },
    { name: "Omega-3", icon: "🐟", category: "supplements" },
    { name: "Ashwagandha", icon: "🌿", category: "supplements" },
    { name: "Lion's Mane", icon: "🍄", category: "supplements" },
    { name: "B-Complex", icon: "💉", category: "supplements" }
  ];

  // Function to get workouts based on current program
  const getWorkouts = () => {
    switch (currentProgramId) {
      case 'beast-mode-elite':
        return beastModeEliteWorkouts;
      case 'power-surge-pro':
        return powerSurgeProWorkouts;
      case 'foundation-builder':
      default:
        return foundationBuilderWorkouts;
    }
  };

  // Foundation Builder workouts (original program)
  const foundationBuilderWorkouts = {
    "Monday - Push Day": {
      color: "bg-red-600",
      exercises: {
        foundation: [
          { name: "Incline Barbell Press", sets: "4 x 8-10", rest: "3 min", notes: "Upper chest priority - 30-45° angle", demo: "incline-barbell-press" },
          { name: "Overhead Press", sets: "4 x 8-10", rest: "2.5 min", notes: "Core tight, drive through legs", demo: "overhead-press" },
          { name: "Incline Dumbbell Press", sets: "3 x 10-12", rest: "2.5 min", notes: "Deep stretch, slow negative", demo: "incline-db-press" },
          { name: "Lateral Raises", sets: "4 x 12-15", rest: "90 sec", notes: "Control weight, slight lean forward", demo: "lateral-raises" },
          { name: "Weighted Dips", sets: "3 x 10-12", rest: "2 min", notes: "Lean forward for chest emphasis", demo: "weighted-dips" },
          { name: "Close-Grip Bench Press", sets: "3 x 10-12", rest: "2 min", notes: "Tricep mass builder", demo: "close-grip-bench" },
          { name: "Overhead Tricep Extension", sets: "3 x 12-15", rest: "90 sec", notes: "ARM FOCUS: Full stretch at bottom", demo: "overhead-tricep-ext" },
          { name: "Rear Delt Flyes", sets: "3 x 15-20", rest: "60 sec", notes: "Light weight, squeeze at top", demo: "rear-delt-flyes" }
        ],
        growth: [
          { name: "Incline Barbell Press", sets: "5 x 6-8", rest: "3 min", notes: "Progressive overload focus", demo: "incline-barbell-press" },
          { name: "Dumbbell Shoulder Press", sets: "4 x 8-10", rest: "2.5 min", notes: "Full ROM, control at top", demo: "db-shoulder-press" },
          { name: "Decline Barbell Press", sets: "4 x 8-10", rest: "2.5 min", notes: "Lower chest development", demo: "decline-barbell-press" },
          { name: "Arnold Press", sets: "3 x 10-12", rest: "2 min", notes: "Rotation for all deltoid heads", demo: "arnold-press" },
          { name: "Superset: Lateral + Rear Raises", sets: "4 x 12+12", rest: "2 min", notes: "No rest between exercises", demo: "lateral-rear-superset" },
          { name: "Weighted Dips", sets: "4 x 8-12", rest: "2.5 min", notes: "Add weight belt/chain", demo: "weighted-dips-heavy" },
          { name: "Diamond Push-ups", sets: "3 x max", rest: "90 sec", notes: "ARM FOCUS: Tricep isolation, to failure", demo: "diamond-pushups" },
          { name: "Cable Tricep Pushdowns", sets: "3 x 12-15", rest: "90 sec", notes: "ARM FOCUS: Rope attachment, full extension", demo: "cable-tricep-pushdowns" },
          { name: "Cable Upright Rows", sets: "3 x 12-15", rest: "60 sec", notes: "Wide grip, pull to chest", demo: "cable-upright-rows" }
        ],
        intensity: [
          { name: "Incline Barbell Press", sets: "6 x 4-6", rest: "4 min", notes: "Heavy singles, spotter needed", demo: "heavy-incline-press" },
          { name: "Push Press", sets: "5 x 3-5", rest: "3 min", notes: "Explosive leg drive", demo: "push-press" },
          { name: "Weighted Dip Clusters", sets: "4 x 3+3+3", rest: "15s between, 3min total", notes: "Heavy dips with mini-rests", demo: "dip-clusters" },
          { name: "Handstand Push-ups", sets: "4 x 5-8", rest: "3 min", notes: "Wall-assisted, full ROM", demo: "handstand-pushups" },
          { name: "Drop Set Lateral Raises", sets: "3 x 10+8+6", rest: "2.5 min", notes: "Heavy to light, no rest", demo: "drop-set-laterals" },
          { name: "Close-Grip Press to Skulls", sets: "4 x 6+8", rest: "2.5 min", notes: "ARM FOCUS: Mechanical drop set", demo: "cgbp-to-skulls" },
          { name: "21s Tricep Extensions", sets: "3 x 21", rest: "2 min", notes: "ARM FOCUS: 7 bottom + 7 top + 7 full", demo: "21s-tricep-ext" },
          { name: "Giant Set: Shoulders", sets: "3 rounds", rest: "3 min", notes: "Press + Lateral + Rear + Upright", demo: "shoulder-giant-set" }
        ]
      }
    },
    "Wednesday - Pull Day + Arms": {
      color: "bg-blue-600",
      exercises: {
        foundation: [
          { name: "Wide-Grip Pull-ups", sets: "4 x 8-12", rest: "3 min", notes: "Full hang, chest to bar", demo: "wide-grip-pullups" },
          { name: "Barbell Rows", sets: "4 x 8-10", rest: "2.5 min", notes: "Pull to lower chest", demo: "barbell-rows" },
          { name: "Cable Rows (Wide Grip)", sets: "3 x 10-12", rest: "2.5 min", notes: "Upper back thickness", demo: "wide-cable-rows" },
          { name: "Lat Pulldown", sets: "3 x 10-12", rest: "2 min", notes: "Pull to upper chest", demo: "lat-pulldown" },
          { name: "Barbell Curls", sets: "4 x 10-12", rest: "2 min", notes: "ARM FOCUS: No swinging", demo: "barbell-curls" },
          { name: "Hammer Curls", sets: "4 x 10-12", rest: "90 sec", notes: "ARM FOCUS: Slow negatives", demo: "hammer-curls" },
          { name: "Cable Curls", sets: "3 x 12-15", rest: "90 sec", notes: "ARM FOCUS: Constant tension", demo: "cable-curls" },
          { name: "Preacher Curls", sets: "3 x 12-15", rest: "90 sec", notes: "ARM FOCUS: Bicep isolation", demo: "preacher-curls" }
        ],
        growth: [
          { name: "Weighted Pull-ups", sets: "5 x 6-8", rest: "3 min", notes: "Add weight when possible", demo: "weighted-pullups" },
          { name: "T-Bar Rows", sets: "4 x 8-10", rest: "2.5 min", notes: "Chest supported, heavy", demo: "t-bar-rows" },
          { name: "Cable Rows (V-Handle)", sets: "4 x 8-10", rest: "2.5 min", notes: "Squeeze shoulder blades", demo: "v-handle-rows" },
          { name: "Reverse Flyes", sets: "3 x 12-15", rest: "90 sec", notes: "Rear delt focus", demo: "reverse-flyes" },
          { name: "Barbell Curls", sets: "5 x 8-10", rest: "2 min", notes: "ARM FOCUS: Progressive overload", demo: "barbell-curls-heavy" },
          { name: "Alternating Dumbbell Curls", sets: "4 x 10-12 each", rest: "2 min", notes: "ARM FOCUS: Peak contraction", demo: "alternating-db-curls" },
          { name: "Cable Hammer Curls", sets: "4 x 10-12", rest: "90 sec", notes: "ARM FOCUS: Rope attachment", demo: "cable-hammer-curls" },
          { name: "Concentration Curls", sets: "3 x 12-15 each", rest: "90 sec", notes: "ARM FOCUS: Isolation", demo: "concentration-curls" },
          { name: "Face Pulls", sets: "3 x 15-20", rest: "60 sec", notes: "High reps, rear delts", demo: "face-pulls" }
        ],
        intensity: [
          { name: "Weighted Pull-up Clusters", sets: "5 x 3+3+3", rest: "15s between, 3min total", notes: "Heavy weight, mini-rests", demo: "pullup-clusters" },
          { name: "Chest-Supported Rows", sets: "5 x 5-7", rest: "3 min", notes: "Maximum weight possible", demo: "chest-supported-rows-heavy" },
          { name: "Single-Arm Dumbbell Rows", sets: "4 x 6-8 each", rest: "2.5 min", notes: "Heavy unilateral work", demo: "single-arm-db-rows" },
          { name: "Wide-Grip Cable Rows", sets: "4 x 8-10", rest: "2.5 min", notes: "Upper back width", demo: "wide-cable-rows-heavy" },
          { name: "21s Barbell Curls", sets: "4 x 21", rest: "2.5 min", notes: "ARM FOCUS: 7+7+7 protocol", demo: "21s-barbell-curls" },
          { name: "Drop Set Hammer Curls", sets: "3 x 8+6+4", rest: "2 min", notes: "ARM FOCUS: Heavy to light", demo: "drop-set-hammers" },
          { name: "Cable Curl 21s", sets: "3 x 21", rest: "2 min", notes: "ARM FOCUS: Cable version", demo: "cable-curl-21s" },
          { name: "Superset: Preacher + Hammer", sets: "3 x 10+10", rest: "2 min", notes: "ARM FOCUS: No rest between", demo: "preacher-hammer-superset" }
        ]
      }
    },
    "Friday - Legs + Cardio + Bonus Arms": {
      color: "bg-green-600",
      exercises: {
        foundation: [
          { name: "Back Squat", sets: "4 x 8-10", rest: "3 min", notes: "Full depth, drive through heels", demo: "back-squat" },
          { name: "Romanian Deadlift", sets: "4 x 8-10", rest: "3 min", notes: "Hinge at hips, feel hamstrings", demo: "romanian-deadlift" },
          { name: "Leg Press", sets: "3 x 12-15", rest: "2.5 min", notes: "Full range of motion", demo: "leg-press" },
          { name: "Walking Lunges", sets: "3 x 12 each leg", rest: "2 min", notes: "Keep torso upright", demo: "walking-lunges" },
          { name: "Leg Curls", sets: "3 x 12-15", rest: "90 sec", notes: "Slow negatives", demo: "leg-curls" },
          { name: "Calf Raises", sets: "4 x 15-20", rest: "90 sec", notes: "Full stretch and squeeze", demo: "calf-raises" },
          { name: "BONUS: Cable Curls", sets: "3 x 12-15", rest: "60 sec", notes: "ARM BONUS: End workout pump", demo: "cable-curls-bonus" },
          { name: "BONUS: Tricep Pushdowns", sets: "3 x 12-15", rest: "60 sec", notes: "ARM BONUS: Tricep pump", demo: "tricep-pushdowns-bonus" }
        ],
        growth: [
          { name: "Front Squats", sets: "4 x 8-10", rest: "3 min", notes: "Quad emphasis, upright torso", demo: "front-squats" },
          { name: "Romanian Deadlift", sets: "5 x 6-8", rest: "3 min", notes: "Progressive overload", demo: "romanian-deadlift-heavy" },
          { name: "Bulgarian Split Squats", sets: "3 x 10-12 each", rest: "2.5 min", notes: "Rear foot elevated", demo: "bulgarian-split-squats" },
          { name: "Hip Thrusts", sets: "4 x 12-15", rest: "2 min", notes: "Squeeze glutes hard", demo: "hip-thrusts" },
          { name: "Stiff-Leg Deadlifts", sets: "3 x 12-15", rest: "2 min", notes: "Hamstring isolation", demo: "stiff-leg-deadlifts" },
          { name: "Single-Leg Calf Raises", sets: "4 x 12-15 each", rest: "90 sec", notes: "Unilateral strength", demo: "single-leg-calves" },
          { name: "Zone 2 Cardio", sets: "15-20 min", rest: "N/A", notes: "Moderate intensity", demo: "zone2-cardio" },
          { name: "BONUS: 21s Curls", sets: "3 x 21", rest: "90 sec", notes: "ARM BONUS: Growth technique", demo: "21s-curls-bonus" },
          { name: "BONUS: Diamond Push-ups", sets: "3 x max", rest: "90 sec", notes: "ARM BONUS: Tricep burnout", demo: "diamond-pushups-bonus" }
        ],
        intensity: [
          { name: "Back Squat", sets: "6 x 4-6", rest: "4 min", notes: "Heavy singles, safety bars", demo: "heavy-back-squats" },
          { name: "Deficit Deadlifts", sets: "5 x 3-5", rest: "3.5 min", notes: "Stand on platform", demo: "deficit-deadlifts" },
          { name: "Pause Squats", sets: "4 x 6-8", rest: "3 min", notes: "3-second pause at bottom", demo: "pause-squats" },
          { name: "Single-Leg Press", sets: "4 x 8-10 each", rest: "2.5 min", notes: "Unilateral leg strength", demo: "single-leg-press" },
          { name: "Jump Squats", sets: "4 x 6", rest: "2 min", notes: "Explosive power", demo: "jump-squats" },
          { name: "1.5 Rep Calf Raises", sets: "4 x 12", rest: "2 min", notes: "Bottom half + full rep", demo: "1-5-rep-calves" },
          { name: "HIIT Cardio", sets: "12 min", rest: "N/A", notes: "30s on / 30s off intervals", demo: "hiit-cardio" },
          { name: "BONUS: Drop Set Curls", sets: "3 x 10+8+6", rest: "2 min", notes: "ARM BONUS: Maximum pump", demo: "drop-set-curls-bonus" },
          { name: "BONUS: Close-Grip Push-ups", sets: "3 x max", rest: "90 sec", notes: "ARM BONUS: Tricep finisher", demo: "close-grip-pushups-bonus" }
        ]
      }
    }
  };

  const workouts = getWorkouts();

  // Get current program duration
  const getCurrentProgramDuration = () => {
    switch (currentProgramId) {
      case 'power-surge-pro':
        return 16;
      case 'beast-mode-elite':
        return 20;
      case 'foundation-builder':
      default:
        return 12;
    }
  };

  // Save current program progress
  const saveCurrentProgramProgress = () => {
    setProgramProgress(prev => ({
      ...prev,
      [currentProgramId]: {
        currentWeek,
        completedExercises,
        exerciseWeights,
        nutritionGoals
      }
    }));
  };

  // Load program progress when switching
  const loadProgramProgress = (programId: string) => {
    const progress = programProgress[programId];
    if (progress) {
      setCurrentWeek(progress.currentWeek);
      setCompletedExercises(progress.completedExercises);
      setExerciseWeights(progress.exerciseWeights);
      setNutritionGoals(progress.nutritionGoals);
    } else {
      // New program - start fresh
      setCurrentWeek(1);
      setCompletedExercises({});
      setExerciseWeights({});
      setNutritionGoals({});
    }
  };

  const updateWeight = async (day: string, exerciseIndex: number, change: number) => {
    const key = `${day}-${exerciseIndex}-week${currentWeek}`;
    const currentValue = exerciseWeights[key] || getLastUsedWeight(day, exerciseIndex, currentWeek);
    const newWeight = Math.max(0, currentValue + change);

    // Update state
    setExerciseWeights(prev => ({
      ...prev,
      [key]: newWeight
    }));

    // Save to Supabase immediately with the new value
    try {
      await DatabaseService.savePreferences({
        current_week: currentWeek,
        completed_exercises: completedExercises,
        exercise_weights: {
          ...exerciseWeights,
          [key]: newWeight
        },
        nutrition_goals: nutritionGoals,
        current_program_id: currentProgramId
      });
    } catch (error) {
      console.error('Failed to save exercise weight:', error);
    }
  };

  const toggleExercise = async (day: string, exerciseIndex: number) => {
    const key = `${day}-${exerciseIndex}-week${currentWeek}`;
    const newValue = !completedExercises[key];

    // Update state
    setCompletedExercises(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Save to Supabase immediately with the new value
    try {
      await DatabaseService.savePreferences({
        current_week: currentWeek,
        completed_exercises: {
          ...completedExercises,
          [key]: newValue
        },
        exercise_weights: exerciseWeights,
        nutrition_goals: nutritionGoals,
        current_program_id: currentProgramId
      });

      // Award XP for completing individual exercises
      if (newValue) {
        await gamification.awardXP(10, 'exercise_completion');
      }
    } catch (error) {
      console.error('Failed to save exercise completion:', error);
    }
  };

  const toggleNutritionGoal = async (day: string, goalIndex: number) => {
    const key = `${day}-nutrition-${goalIndex}-week${currentWeek}`;
    const newValue = !nutritionGoals[key];

    // Update state
    setNutritionGoals(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Save to Supabase immediately with the new value
    try {
      await DatabaseService.savePreferences({
        current_week: currentWeek,
        completed_exercises: completedExercises,
        exercise_weights: exerciseWeights,
        nutrition_goals: {
          ...nutritionGoals,
          [key]: newValue
        },
        current_program_id: currentProgramId
      });

      // Award XP for completing nutrition goals
      if (newValue) {
        await gamification.awardXP(5, 'nutrition_goals');
      }
    } catch (error) {
      console.error('Failed to save nutrition goal:', error);
    }
  };

  // Get the most recent weight used for this exercise across all previous weeks
  const getLastUsedWeight = (dayName: string, exerciseIndex: number, currentWeek: number) => {
    // Check current week first
    const currentKey = `${dayName}-${exerciseIndex}-week${currentWeek}`;
    if (exerciseWeights[currentKey] && exerciseWeights[currentKey] > 0) {
      return exerciseWeights[currentKey];
    }

    // Look through completed sessions for the same exercise
    for (const session of completedSessions) {
      if (session.day_name === dayName && session.exercises && session.exercises[exerciseIndex]) {
        const exercise = session.exercises[exerciseIndex];
        if (exercise.weight && exercise.weight > 0) {
          return exercise.weight;
        }
      }
    }

    // Look through previous weeks in exerciseWeights
    for (let week = currentWeek - 1; week >= 1; week--) {
      const key = `${dayName}-${exerciseIndex}-week${week}`;
      if (exerciseWeights[key] && exerciseWeights[key] > 0) {
        return exerciseWeights[key];
      }
    }

    return 0; // Default if no previous weight found
  };

  const resetWeek = async () => {
    const newCompletedExercises = { ...completedExercises };
    const newNutritionGoals = { ...nutritionGoals };
    Object.keys(newCompletedExercises).forEach(key => {
      if (key.includes(`week${currentWeek}`)) {
        delete newCompletedExercises[key];
      }
    });
    Object.keys(newNutritionGoals).forEach(key => {
      if (key.includes(`week${currentWeek}`)) {
        delete newNutritionGoals[key];
      }
    });
    setCompletedExercises(newCompletedExercises);
    setNutritionGoals(newNutritionGoals);
  };

  const saveSession = async (dayName: string) => {
    setSaving(true);
    try {
      const currentPhase = getPhase(currentWeek);
      const exercises = (workouts as any)[dayName].exercises[currentPhase];

      // Get completed exercises for this day
      const dayExercises = exercises.map((exercise: any, index: number) => ({
        name: exercise.name,
        sets: exercise.sets,
        weight: exerciseWeights[`${dayName}-${index}-week${currentWeek}`] || 0,
        completed: completedExercises[`${dayName}-${index}-week${currentWeek}`] || false
      }));

      // Get completed nutrition goals for this day
      const dayNutrition = dailyNutritionGoals.map((goal, index) => ({
        name: goal.name,
        icon: goal.icon,
        category: goal.category,
        completed: nutritionGoals[`${dayName}-nutrition-${index}-week${currentWeek}`] || false
      }));

      const exercisesCompleted = dayExercises.filter((e: any) => e.completed).length;
      const totalExercises = dayExercises.length;
      const nutritionCompleted = dayNutrition.filter(n => n.completed).length;
      const totalNutrition = dayNutrition.length;

      const sessionData = {
        session_date: new Date().toISOString().split('T')[0],
        session_time: new Date().toTimeString().split(' ')[0],
        week: currentWeek,
        phase: currentPhase,
        day_name: dayName,
        program_id: currentProgramId,
        exercises: dayExercises,
        nutrition: dayNutrition,
        exercises_completed: exercisesCompleted,
        total_exercises: totalExercises,
        nutrition_completed: nutritionCompleted,
        total_nutrition: totalNutrition
      };

      // Calculate XP for display and saving
      const exerciseXP = Math.floor((exercisesCompleted / totalExercises) * 50);
      const nutritionXP = Math.floor((nutritionCompleted / totalNutrition) * 30);
      const totalXP = exerciseXP + nutritionXP;

      // Save session with XP data
      const sessionDataWithXP = {
        ...sessionData,
        xp_earned: totalXP
      };

      // Save session and trigger gamification updates
      const savedSession = await DatabaseService.saveSession(sessionDataWithXP);
      await gamification.logWorkoutCompletion(exercisesCompleted, totalExercises, nutritionCompleted, totalNutrition);

      // Refresh sessions list
      const sessions = await DatabaseService.getSessions();
      setCompletedSessions(sessions);

      // Show success message based on save method
      const saveMethod = savedSession.id?.startsWith('session_') ? 'locally' : 'to cloud';
      alert(`✅ Session saved ${saveMethod}!\n${dayName}\nExercises: ${exercisesCompleted}/${totalExercises}\nNutrition: ${nutritionCompleted}/${totalNutrition}\n🎯 XP Earned: +${totalXP} XP`);
    } catch (error) {
      console.error('Error saving session:', error);
      // Provide more helpful error message
      alert('❌ Failed to save session. Your progress is still tracked locally. Please check your internet connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const getDemoUrl = () => {
    return {
      video: "https://www.youtube.com/results?search_query=",
      guide: "https://www.google.com/search?q="
    };
  };

  // Enhanced mode handlers
  const handleSetComplete = async (setData: SetData) => {
    try {
      const xpEarned = await enhancedTracking.completeSet(setData.id.split('-set')[0], setData);
      await gamification.awardXP(xpEarned, 'set_completion');
    } catch (error) {
      console.error('Error completing set:', error);
    }
  };

  const handleSetUpdate = async (setData: Partial<SetData>) => {
    if (!setData.id) return;
    try {
      await enhancedTracking.updateSetData(setData.id.split('-set')[0], setData);
    } catch (error) {
      console.error('Error updating set:', error);
    }
  };

  const handleExerciseComplete = async (exerciseId: string) => {
    try {
      await enhancedTracking.completeExercise(exerciseId);
      await gamification.awardXP(15, 'exercise_completion');
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const toggleExerciseExpanded = (dayName: string, exerciseIndex: number) => {
    const key = `${dayName}-${exerciseIndex}`;
    setExpandedExercises(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const startGuidedWorkout = (dayName: string) => {
    setGuidedWorkoutDay(dayName);
    setShowGuidedWorkout(true);
  };

  const handleGuidedWorkoutComplete = async (sessionData: WorkoutSessionData) => {
    try {
      await enhancedTracking.saveWorkoutSession(sessionData);
      await gamification.awardXP(sessionData.xpEarned, 'guided_workout_completion');
      setShowGuidedWorkout(false);
      alert(`🎉 Guided workout completed!\nXP Earned: +${sessionData.xpEarned}`);
    } catch (error) {
      console.error('Error saving guided workout:', error);
      alert('❌ Failed to save guided workout session.');
    }
  };

  // Custom workout handlers
  const handleCreateWorkout = () => {
    setEditingWorkout(null);
    setShowWorkoutBuilder(true);
  };

  const handleEditWorkout = (workout: CustomWorkout) => {
    setEditingWorkout(workout);
    setShowWorkoutBuilder(true);
  };

  const handleSaveWorkout = async (workout: CustomWorkout) => {
    try {
      // Save to local state
      setCustomWorkouts(prev => {
        const existingIndex = prev.findIndex(w => w.id === workout.id);
        if (existingIndex >= 0) {
          return prev.map((w, i) => i === existingIndex ? workout : w);
        }
        return [...prev, workout];
      });

      // Save to database (in a real app)
      // await DatabaseService.saveCustomWorkout(workout);

      setShowWorkoutBuilder(false);
      setEditingWorkout(null);

      // Award XP for creating custom workout
      await gamification.awardXP(25, 'custom_workout_creation');
    } catch (error) {
      console.error('Error saving custom workout:', error);
    }
  };

  const handleCancelWorkoutBuilder = () => {
    setShowWorkoutBuilder(false);
    setEditingWorkout(null);
  };

  // Launch workout timer for exercise
  const launchTimer = async (dayName: string, exerciseIndex: number, exercise: any) => {
    const currentWeight = exerciseWeights[`${dayName}-${exerciseIndex}-week${currentWeek}`] || getLastUsedWeight(dayName, exerciseIndex, currentWeek);

    let exerciseSetTracking: ExerciseSetTracking | undefined;

    // If enhanced mode, get or initialize set tracking
    if (enhancedTracking.isEnhancedMode) {
      try {
        exerciseSetTracking = await enhancedTracking.initializeExercise(dayName, exerciseIndex, exercise, currentWeek);
      } catch (error) {
        console.error('Error initializing exercise tracking:', error);
      }
    }

    const timerExercise: TimerExercise = {
      name: exercise.name,
      sets: exercise.sets,
      rest: exercise.rest,
      notes: exercise.notes,
      currentWeight,
      completed: completedExercises[`${dayName}-${exerciseIndex}-week${currentWeek}`] || false,
      exerciseSetTracking
    };

    timerPopup.openPopup({
      exercise: timerExercise,
      dayName,
      exerciseIndex,
      onComplete: async (index: number, weight: number) => {
        // Mark exercise as complete and update weight
        toggleExercise(dayName, index);
        if (weight !== currentWeight) {
          updateWeight(dayName, index, weight - currentWeight);
        }

        // Award XP for completing exercise with timer
        await gamification.awardXP(15, 'timer_completion');
      },
      onWeightChange: (index: number, newWeight: number) => {
        // Update weight in real-time
        updateWeight(dayName, index, newWeight - currentWeight);
      },
      onClose: () => {
        // Timer closed - no additional action needed
      }
    });
  };

  const currentPhase = getPhase(currentWeek) as keyof typeof phaseConfig;
  const phaseInfo = phaseConfig[currentPhase];

  const getCompletionStats = () => {
    const currentWorkouts = Object.values(workouts).map(workout => workout.exercises[currentPhase]);
    const totalExercises = currentWorkouts.reduce((sum, exercises) => sum + exercises.length, 0);
    const completedCount = Object.keys(completedExercises).filter(key =>
      key.includes(`week${currentWeek}`) && completedExercises[key]
    ).length;
    return { completed: completedCount, total: totalExercises };
  };

  const stats = getCompletionStats();
  const completionPercentage = Math.round((stats.completed / stats.total) * 100);

  // Get workout image based on day name
  const getWorkoutImageType = (dayName: string): 'push' | 'pull' | 'legs' => {
    if (dayName.toLowerCase().includes('push')) return 'push';
    if (dayName.toLowerCase().includes('pull')) return 'pull';
    if (dayName.toLowerCase().includes('legs')) return 'legs';
    return 'push'; // Default fallback
  };

  if (loading || authLoading) {
    return (
      <LoadingScreen
        message={authLoading ? "Initializing..." : "Loading your training data..."}
        type="general"
        showProgress={false}
      />
    );
  }

  // Show program selection interface
  if (showProgramSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header with User Level Display */}
        <div className="bg-white shadow-sm border-b sticky pwa-sticky-header z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 pwa-header">
            <UserLevelDisplay />
          </div>
        </div>

        {/* Achievement Badges and Streak Tracker */}
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          <AchievementBadges />
          <StreakTracker />
        </div>

        {/* Program Selection */}
        <ProgramSelection
          onProgramSelect={handleProgramSelect}
          currentProgramId={currentProgramId}
          isAuthenticated={isAuthenticated}
          onAuthRequired={(programId) => {
            setAuthTrigger('program-switch');
            setShowAuthModal(true);
          }}
        />
      </div>
    );
  }

  // Show guided workout flow
  if (showGuidedWorkout && guidedWorkoutDay) {
    const exercises = (workouts as any)[guidedWorkoutDay].exercises[currentPhase];
    return (
      <GuidedWorkoutFlow
        dayName={guidedWorkoutDay}
        exercises={exercises}
        week={currentWeek}
        phase={currentPhase}
        onWorkoutComplete={handleGuidedWorkoutComplete}
        onWorkoutPause={() => {
          // Handle pause logic here
          console.log('Workout paused');
        }}
        onWorkoutResume={() => {
          // Handle resume logic here
          console.log('Workout resumed');
        }}
        onWorkoutAbandon={() => {
          setShowGuidedWorkout(false);
          setGuidedWorkoutDay('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-xl sticky pwa-sticky-header z-10 border-b border-slate-700/50">
        <div className="p-3 sm:p-4 pwa-header">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={handleBackToProgramSelection}
                className="p-2 sm:p-1.5 hover:bg-white/10 rounded-xl transition-all duration-200 group flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Back to Program Selection"
              >
                <ArrowLeft className="text-white/80 group-hover:text-white w-5 h-5 sm:w-4 sm:h-4 transition-colors" />
              </button>
              <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
                <Trophy className="text-white w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-white truncate">3x/Week Aesthetic</h1>
                <p className="text-xs text-blue-200/80 truncate">Build Your Best Physique</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {timerPopup.isOpen && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-medium shadow-lg">
                  <Timer className="w-3 h-3 animate-pulse" />
                  <span>Timer</span>
                </div>
              )}
              <div className="text-right">
                <div className="text-xs text-blue-200/70 font-medium">Progress</div>
                <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  {completionPercentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Streak info moved below */}
          {gamification.currentStreak > 0 && (
            <div className="flex justify-end mb-2">
              <div className="flex items-center gap-1.5 text-xs text-orange-300 bg-orange-500/20 px-2 py-1 rounded-lg">
                <span className="text-sm">🔥</span>
                <span className="font-semibold">{gamification.currentStreak} day streak</span>
              </div>
            </div>
          )}

          {/* Enhanced Phase Info */}
          <div className={`${phaseInfo.color} text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg bg-gradient-to-r ${currentPhase === 'foundation' ? 'from-blue-600 to-blue-700' : currentPhase === 'growth' ? 'from-green-600 to-emerald-700' : 'from-red-600 to-rose-700'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                  <span className="text-lg sm:text-2xl">
                    {currentPhase === 'foundation' && '🏗️'}
                    {currentPhase === 'growth' && '📈'}
                    {currentPhase === 'intensity' && '🔥'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base sm:text-lg truncate">{phaseInfo.name}</h3>
                  <p className="text-xs sm:text-sm opacity-90 font-medium truncate">{phaseInfo.description}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs sm:text-sm opacity-90 font-semibold bg-white/20 px-2 sm:px-3 py-1 rounded-lg">
                  Weeks {currentPhase === 'foundation' ? '1-4' : currentPhase === 'growth' ? '5-8' : '9-12'}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Mobile Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl">
                <Calendar className="text-blue-200 w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-bold text-white">Week {currentWeek}</span>
              </div>
              <select
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/20 border border-white/30 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-white min-w-[80px] sm:min-w-[90px] focus:bg-white/30 focus:outline-none transition-all backdrop-blur-sm"
              >
                {Array.from({ length: getCurrentProgramDuration() }, (_, i) => i + 1).map(week => (
                  <option key={week} value={week} className="bg-slate-800 text-white">Week {week}</option>
                ))}
              </select>

              {/* Enhanced Streak Display */}
              {gamification.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-200 rounded-lg text-xs backdrop-blur-sm border border-orange-400/30">
                  <span className="text-base">🔥</span>
                  <span className="font-bold">{gamification.currentStreak}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCreateWorkout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium group"
                title="Create custom workout"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Create Workout
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => {
                    setPremiumDemoFeature('customization');
                    setShowPremiumDemo(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium group"
                  title="Preview premium features"
                >
                  <Trophy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Premium
                </button>
              )}
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium group"
              >
                <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
                History
              </button>
              <button
                onClick={resetWeek}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium group"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                Reset
              </button>
            </div>
          </div>


          {/* Enhanced Progress Bar */}
          <div className="mt-4 bg-white/20 rounded-full h-3 shadow-inner backdrop-blur-sm">
            <div
              className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
              style={{ width: `${completionPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Mode Toggle */}
      <div className="px-4 pb-6">
        <WorkoutModeToggle
          isEnhancedMode={enhancedTracking.isEnhancedMode}
          onToggle={() => {
            if (!enhancedTracking.isEnhancedMode && !hasEnhancedMode) {
              handleAuthRequired('enhanced-mode');
            } else {
              enhancedTracking.toggleEnhancedMode();
            }
          }}
          showGuidedOption={true}
          onStartGuided={() => {
            // You could show a day selector here or default to current day
            const currentDay = Object.keys(workouts)[0]; // Default to first day for demo
            startGuidedWorkout(currentDay);
          }}
          disabled={enhancedTracking.saving}
        />
      </div>

      {/* Enhanced Workout Days */}
      <div className="px-3 sm:px-4 pb-6 space-y-4 sm:space-y-6">
        {Object.entries(workouts).map(([dayName, workout]) => {
          const exercises = workout.exercises[currentPhase];
          const dayCompleted = exercises.every((_, index) =>
            completedExercises[`${dayName}-${index}-week${currentWeek}`]
          );
          const dayProgress = exercises.filter((_, index) =>
            completedExercises[`${dayName}-${index}-week${currentWeek}`]
          ).length;

          return (
            <div key={dayName} className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-white/50 transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
              {/* Enhanced Day Header with Background Image */}
              <div className="relative h-24 sm:h-32 overflow-hidden">
                {/* Background Image */}
                <ProgressiveImage
                  src={workoutImages.getWorkoutImage(getWorkoutImageType(dayName))?.url || ''}
                  alt={`${dayName} workout background`}
                  className="absolute inset-0 w-full h-full"
                  size="header"
                  lazy={false}
                  overlay={{
                    color: workout.color === 'bg-red-600' ? 'rgba(220, 38, 38, 0.8)' :
                           workout.color === 'bg-blue-600' ? 'rgba(37, 99, 235, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                    opacity: 0.9
                  }}
                />

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${workout.color === 'bg-red-600' ? 'from-red-600/90 via-red-700/90 to-rose-800/90' : workout.color === 'bg-blue-600' ? 'from-blue-600/90 via-blue-700/90 to-indigo-800/90' : 'from-green-600/90 via-green-700/90 to-emerald-800/90'}`}></div>

                {/* Content Overlay - Single Row Layout */}
                <div className="absolute inset-0 p-3 sm:p-5 text-white flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30 shadow-lg flex-shrink-0">
                      <span className="text-sm sm:text-lg drop-shadow-md">
                        {workout.color === 'bg-red-600' && '💪'}
                        {workout.color === 'bg-blue-600' && '🎯'}
                        {workout.color === 'bg-green-600' && '🏃'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm sm:text-lg font-bold leading-tight drop-shadow-lg truncate">
                        {dayName.split(' - ')[0]}
                      </h2>
                      <p className="text-xs opacity-95 font-medium drop-shadow-md truncate">
                        {dayName.split(' - ')[1]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/30 shadow-lg">
                      <div className="text-xs sm:text-sm font-bold drop-shadow-md">
                        {dayProgress}/{exercises.length}
                      </div>
                    </div>
                    {dayCompleted && (
                      <div className="p-1.5 sm:p-2 bg-green-500/40 backdrop-blur-sm rounded-lg border border-green-300/50 shadow-lg">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-200 drop-shadow-md" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Exercises - Enhanced or Standard Mode */}
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {exercises.map((exercise, index) => {
                  const isCompleted = completedExercises[`${dayName}-${index}-week${currentWeek}`];
                  const currentWeight = exerciseWeights[`${dayName}-${index}-week${currentWeek}`] || getLastUsedWeight(dayName, index, currentWeek);
                  const demos = getDemoUrl();
                  const isArmFocus = exercise.notes.includes('ARM FOCUS') || exercise.notes.includes('ARM BONUS');
                  const exerciseKey = `${dayName}-${index}`;

                  // Enhanced mode - use AdvancedExerciseCard
                  if (enhancedTracking.isEnhancedMode) {
                    const exerciseId = `${dayName}-${index}-week${currentWeek}`;
                    const exerciseSetTracking = enhancedTracking.exerciseSetData[exerciseId] || {
                      exerciseId,
                      exerciseName: exercise.name,
                      totalSets: parseInt(exercise.sets.split('x')[0].trim()) || 4,
                      targetRestTime: 90,
                      sets: Array.from({ length: parseInt(exercise.sets.split('x')[0].trim()) || 4 }, (_, setIndex) => ({
                        id: `${exerciseId}-set${setIndex + 1}`,
                        setNumber: setIndex + 1,
                        weight: currentWeight,
                        targetReps: exercise.sets.match(/x\s*(\d+(?:-\d+)?)/)?.[1] || '8-10',
                        completed: false
                      })),
                      currentSet: 1,
                      completed: false
                    };

                    return (
                      <AdvancedExerciseCard
                        key={index}
                        exercise={exercise}
                        exerciseSetTracking={exerciseSetTracking}
                        dayName={dayName}
                        exerciseIndex={index}
                        week={currentWeek}
                        isExpanded={expandedExercises[exerciseKey] || false}
                        onToggleExpanded={() => toggleExerciseExpanded(dayName, index)}
                        onSetComplete={handleSetComplete}
                        onSetUpdate={handleSetUpdate}
                        onExerciseComplete={() => handleExerciseComplete(exerciseId)}
                        onLaunchTimer={() => launchTimer(dayName, index, exercise)}
                        showAnalytics={true}
                      />
                    );
                  }

                  // Standard mode - use existing exercise card

                  return (
                    <div
                      key={index}
                      className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-[1.01] ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-lg'
                          : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 hover:shadow-lg hover:from-blue-50 hover:to-indigo-50'
                      } ${isArmFocus ? 'ring-2 ring-orange-400 ring-opacity-50 bg-gradient-to-r from-orange-50 to-amber-50' : ''}`}
                    >
                      {/* Enhanced Exercise Header */}
                      <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <button
                          onClick={() => toggleExercise(dayName, index)}
                          className="mt-1 flex-shrink-0 touch-manipulation group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                          aria-label={`${isCompleted ? 'Mark as incomplete' : 'Mark as complete'}: ${exercise.name}`}
                        >
                          {isCompleted ? (
                            <div className="p-1.5 bg-green-500 rounded-full shadow-lg">
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                          ) : (
                            <div className="p-1.5 border-2 border-gray-300 rounded-full group-hover:border-blue-400 transition-colors">
                              <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-400" />
                            </div>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 sm:mb-2 gap-2 sm:gap-0">
                            <div className="min-w-0 flex-1">
                              <h3 className={`font-bold text-lg sm:text-xl leading-tight ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
                                {exercise.name}
                                {isArmFocus && (
                                  <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0 inline-flex items-center gap-1 text-xs bg-gradient-to-r from-orange-400 to-amber-500 text-white px-2 py-1 rounded-full font-bold shadow-sm w-fit">
                                    <span>💪</span> ARM
                                  </span>
                                )}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-2 rounded-xl text-sm font-bold shadow-sm">
                                {exercise.sets}
                              </span>
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full font-bold shadow-sm">
                                  <span>✨</span> +10 XP
                                </span>
                              )}
                            </div>
                          </div>

                          {exercise.rest !== "N/A" && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 bg-blue-50 px-2 py-1.5 rounded-lg">
                              <div className="p-0.5 bg-blue-500 rounded-full">
                                <Clock className="w-2.5 h-2.5 text-white" />
                              </div>
                              <span className="font-semibold">Rest: {exercise.rest}</span>
                            </div>
                          )}

                          {/* Exercise Description - Mobile Optimized */}
                          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
                            <div className="flex items-start gap-2 mb-2">
                              <div className="p-1 bg-blue-100 rounded-md flex-shrink-0">
                                <FileText className="w-3 h-3 text-blue-600" />
                              </div>
                              <h4 className="font-semibold text-gray-800 text-xs">Exercise Instructions</h4>
                            </div>
                            <p className="text-sm text-gray-700 leading-snug">{exercise.notes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Weight Tracking & Controls */}
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 space-y-3">
                        {/* Enhanced Weight Tracking */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="p-1 bg-purple-100 rounded-md">
                              <span className="text-sm">🏋️</span>
                            </div>
                            <h4 className="font-semibold text-gray-800 text-xs">Weight Tracking</h4>
                          </div>
                          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                            <span className="text-xs font-medium text-gray-700">Weight:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateWeight(dayName, index, -2.5)}
                                className="w-7 h-7 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600 transition-colors duration-200 touch-manipulation active:scale-95"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-12 text-center font-mono text-sm font-bold bg-white py-1 px-2 rounded-md border border-gray-300">
                                {currentWeight}kg
                              </span>
                              <button
                                onClick={() => updateWeight(dayName, index, 2.5)}
                                className="w-7 h-7 bg-green-500 text-white rounded-md flex items-center justify-center hover:bg-green-600 transition-colors duration-200 touch-manipulation active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Actions */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="p-1 bg-blue-100 rounded-md">
                              <span className="text-sm">⚡</span>
                            </div>
                            <h4 className="font-semibold text-gray-800 text-xs">Quick Actions</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => launchTimer(dayName, index, exercise)}
                              className="flex items-center justify-center gap-1 px-2 py-2 bg-purple-500 text-white text-xs font-medium rounded-md hover:bg-purple-600 transition-colors duration-200 touch-manipulation active:scale-95"
                              title="Open workout timer"
                            >
                              <Timer className="w-3 h-3" />
                              Timer
                            </button>
                            <a
                              href={demos.video + exercise.name.replace(/\s+/g, '+')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1 px-2 py-2 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors duration-200 touch-manipulation active:scale-95"
                            >
                              <Play className="w-3 h-3" />
                              Video
                            </a>
                            <a
                              href={demos.guide + exercise.name.replace(/\s+/g, '+')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors duration-200 touch-manipulation active:scale-95"
                            >
                              <FileText className="w-3 h-3" />
                              Guide
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Nutrition Tracking Section */}
              <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-t-4 border-green-400 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <span className="text-2xl">🍎</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Daily Nutrition Goals</h3>
                      <p className="text-sm text-gray-600">Fuel your transformation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-xl font-bold shadow-lg">
                        {dailyNutritionGoals.filter((_, index) =>
                          nutritionGoals[`${dayName}-nutrition-${index}-week${currentWeek}`]
                        ).length}/{dailyNutritionGoals.length}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold shadow-lg">
                        +{Math.floor((dailyNutritionGoals.filter((_, index) =>
                          nutritionGoals[`${dayName}-nutrition-${index}-week${currentWeek}`]
                        ).length / dailyNutritionGoals.length) * 30)} XP
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Earned</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dailyNutritionGoals.map((goal, index) => {
                    const isCompleted = nutritionGoals[`${dayName}-nutrition-${index}-week${currentWeek}`];
                    const categoryGradients = {
                      protein: 'from-red-500 to-rose-600',
                      hydration: 'from-blue-500 to-blue-600',
                      micronutrients: 'from-green-500 to-emerald-600',
                      fats: 'from-yellow-500 to-amber-600',
                      carbs: 'from-orange-500 to-orange-600',
                      supplements: 'from-purple-500 to-purple-600'
                    };

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 bg-white rounded-xl shadow-lg border-l-4 border-gradient-to-r ${(categoryGradients as any)[goal.category]} transform transition-all duration-300 hover:scale-105 ${
                          isCompleted ? 'bg-gradient-to-r from-green-50 to-emerald-50 shadow-xl ring-2 ring-green-200' : 'hover:shadow-xl'
                        }`}
                        style={{
                          borderLeftColor: goal.category === 'protein' ? '#ef4444' :
                                          goal.category === 'hydration' ? '#3b82f6' :
                                          goal.category === 'micronutrients' ? '#10b981' :
                                          goal.category === 'fats' ? '#f59e0b' :
                                          goal.category === 'carbs' ? '#f97316' : '#8b5cf6'
                        }}
                      >
                        <button
                          onClick={() => toggleNutritionGoal(dayName, index)}
                          className="flex-shrink-0 group"
                        >
                          {isCompleted ? (
                            <div className="p-1 bg-green-500 rounded-full shadow-lg">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="p-1 border-2 border-gray-300 rounded-full group-hover:border-green-400 transition-colors">
                              <Circle className="w-5 h-5 text-gray-400 group-hover:text-green-400" />
                            </div>
                          )}
                        </button>
                        <div className="p-2 bg-gray-100 rounded-xl">
                          <span className="text-xl">{goal.icon}</span>
                        </div>
                        <span className={`text-sm font-bold leading-tight flex-1 ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                          {goal.name}
                        </span>
                        {isCompleted && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced Nutrition Summary */}
                <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl sm:rounded-2xl border border-blue-200 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg sm:rounded-xl">
                      <span className="text-base sm:text-lg">🎯</span>
                    </div>
                    <h4 className="font-bold text-blue-800 text-sm sm:text-base">Nutrition Guidelines</h4>
                  </div>
                  <div className="text-xs sm:text-sm text-blue-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-white/70 p-2.5 sm:p-3 rounded-lg sm:rounded-xl"><strong>Target Protein:</strong> 156g/day</div>
                      <div className="bg-white/70 p-2.5 sm:p-3 rounded-lg sm:rounded-xl"><strong>Meal Timing:</strong> Every 4-5h</div>
                      <div className="bg-white/70 p-2.5 sm:p-3 rounded-lg sm:rounded-xl"><strong>Pre-workout:</strong> Light carbs</div>
                      <div className="bg-white/70 p-2.5 sm:p-3 rounded-lg sm:rounded-xl"><strong>Post-workout:</strong> Protein + carbs</div>
                      <div className="bg-white/70 p-2.5 sm:p-3 rounded-lg sm:rounded-xl"><strong>Supplements:</strong> Daily stack</div>
                      <div className="bg-white/70 p-2.5 sm:p-3 rounded-lg sm:rounded-xl"><strong>Best Time:</strong> With meals</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Save Session Button */}
                <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t-2 border-gray-200">
                  <button
                    onClick={() => saveSession(dayName)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl sm:rounded-2xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 group touch-manipulation"
                  >
                    <Save className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                    <span>{saving ? 'Saving to Cloud...' : 'Save Session to Cloud'}</span>
                    {!saving && <span className="text-base sm:text-lg">☁️</span>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Goals & Stats */}
      <div className="px-3 sm:px-4 pb-6 sm:pb-8 space-y-4 sm:space-y-6">
        {/* Enhanced Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center shadow-xl transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center gap-3 sm:block">
              <div className="text-3xl sm:text-4xl mb-0 sm:mb-2">📅</div>
              <div className="text-left sm:text-center">
                <div className="text-xl sm:text-2xl font-bold mb-1">Week {currentWeek}</div>
                <div className="text-sm opacity-90 font-medium">Current Progress</div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center shadow-xl transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center gap-3 sm:block">
              <div className="text-3xl sm:text-4xl mb-0 sm:mb-2">💪</div>
              <div className="text-left sm:text-center">
                <div className="text-xl sm:text-2xl font-bold mb-1">{stats.completed}</div>
                <div className="text-sm opacity-90 font-medium">Exercises Done</div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center shadow-xl transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center gap-3 sm:block">
              <div className="text-3xl sm:text-4xl mb-0 sm:mb-2">✨</div>
              <div className="text-left sm:text-center">
                <div className="text-xl sm:text-2xl font-bold mb-1">{gamification.totalXP.toLocaleString()}</div>
                <div className="text-sm opacity-90 font-medium">Total XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced 3x/Week Specific Goals */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg sm:rounded-xl shadow-lg">
              <span className="text-lg sm:text-2xl">🎯</span>
            </div>
            <h3 className="font-bold text-blue-800 text-base sm:text-lg">Realistic Targets</h3>
          </div>
          <div className="text-xs sm:text-sm text-blue-700 space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between bg-white/70 p-3 rounded-xl gap-1 sm:gap-0">
              <span className="font-semibold">Arms (Week 0: 34.5cm):</span>
              <span className="font-mono font-bold text-blue-800">Week 12: 36.5cm (+2cm)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between bg-white/70 p-3 rounded-xl gap-1 sm:gap-0">
              <span className="font-semibold">Chest (Week 0: 100.5cm):</span>
              <span className="font-mono font-bold text-blue-800">Week 12: 105cm (+4.5cm)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between bg-white/70 p-3 rounded-xl gap-1 sm:gap-0">
              <span className="font-semibold">Weight (Week 0: 77.4kg):</span>
              <span className="font-mono font-bold text-blue-800">Week 12: 82-83kg (+5kg)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between bg-white/70 p-3 rounded-xl gap-1 sm:gap-0">
              <span className="font-semibold">Daily Protein:</span>
              <span className="font-mono font-bold text-blue-800">156g (39g x 4 meals)</span>
            </div>
            {currentPhase === 'foundation' && (
              <div className="text-sm mt-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏗️</span>
                  <span className="font-bold">Foundation Focus:</span>
                </div>
                <p className="mt-1">Perfect form + arm specialization</p>
              </div>
            )}
            {currentPhase === 'growth' && (
              <div className="text-sm mt-3 bg-gradient-to-r from-green-500 to-emerald-700 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  <span className="font-bold">Growth Focus:</span>
                </div>
                <p className="mt-1">Volume + progressive overload + arm focus</p>
              </div>
            )}
            {currentPhase === 'intensity' && (
              <div className="text-sm mt-3 bg-gradient-to-r from-red-500 to-rose-700 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <span className="font-bold">Intensity Focus:</span>
                </div>
                <p className="mt-1">Heavy lifting + advanced arm techniques</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced 3x/Week Schedule Reminder */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-300 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl shadow-lg">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="font-bold text-orange-800 text-lg">Weekly Schedule</h3>
          </div>
          <div className="text-sm text-orange-700 space-y-3">
            <div className="flex justify-between bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="font-bold flex items-center gap-2">
                <span className="text-lg">💪</span> Monday:
              </span>
              <span className="font-mono">Push Day (90 min)</span>
            </div>
            <div className="flex justify-between bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="font-bold flex items-center gap-2">
                <span className="text-lg">🎯</span> Wednesday:
              </span>
              <span className="font-mono">Pull + Arms (90 min)</span>
            </div>
            <div className="flex justify-between bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="font-bold flex items-center gap-2">
                <span className="text-lg">🏃</span> Friday:
              </span>
              <span className="font-mono">Legs + Cardio + Arms (75 min)</span>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl shadow-lg mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <span className="font-bold">Pro Tip:</span>
              </div>
              <p className="mt-1">Extra arm volume on every session for maximum growth</p>
            </div>
          </div>
        </div>

        {/* Enhanced Success Tips */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="font-bold text-green-800 text-lg">3x/Week Success Keys</h3>
          </div>
          <div className="text-sm text-green-700 space-y-3">
            <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="text-lg">🔄</span>
              <span><strong>Perfect Recovery:</strong> 48h between sessions</span>
            </div>
            <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="text-lg">🍗</span>
              <span><strong>Nutrition Critical:</strong> Hit protein targets daily</span>
            </div>
            <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="text-lg">📈</span>
              <span><strong>Progressive Overload:</strong> Track all weights</span>
            </div>
            <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="text-lg">💪</span>
              <span><strong>Arm Priority:</strong> Orange-marked exercises = growth</span>
            </div>
            <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="text-lg">😴</span>
              <span><strong>Sleep 7-9h:</strong> Recovery is everything</span>
            </div>
            <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl shadow-sm">
              <span className="text-lg">☀️</span>
              <span><strong>Whoop Guidance:</strong> Red days = rest or light</span>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* History Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <h2 className="text-lg font-bold">Session History</h2>
                <span className="text-sm bg-blue-500 px-2 py-1 rounded-full">
                  {completedSessions.length} sessions
                </span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History Content */}
            <div className="overflow-y-auto max-h-[75vh] p-4">
              {completedSessions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed sessions yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Complete a workout and save it to see your history!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedSessions.map((session) => (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-4 border">
                      {/* Session Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{session.day_name}</h3>
                          <p className="text-sm text-gray-600">
                            {session.session_date} at {session.session_time} • Week {session.week} ({session.phase} phase)
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            Exercises: {session.exercises_completed}/{session.total_exercises}
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            Nutrition: {session.nutrition_completed}/{session.total_nutrition}
                          </div>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Exercises */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            💪 Exercises ({session.exercises_completed}/{session.total_exercises})
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {session.exercises.map((exercise: any, index: number) => (
                              <div key={index} className={`text-xs p-2 rounded ${exercise.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                <div className="flex items-center gap-2">
                                  {exercise.completed ? (
                                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="font-medium">{exercise.name}</span>
                                  {exercise.weight > 0 && (
                                    <span className="ml-auto font-mono">{exercise.weight}kg</span>
                                  )}
                                </div>
                                <div className="text-xs opacity-75 ml-5">{exercise.sets}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Nutrition */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            🍎 Nutrition ({session.nutrition_completed}/{session.total_nutrition})
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {session.nutrition.map((nutrition: any, index: number) => (
                              <div key={index} className={`text-xs p-2 rounded ${nutrition.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                <div className="flex items-center gap-2">
                                  {nutrition.completed ? (
                                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="text-sm">{nutrition.icon}</span>
                                  <span className="font-medium">{nutrition.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Footer */}
            <div className="bg-gray-50 p-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total sessions: {completedSessions.length}
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gamification Notifications */}
      <XPGainNotification
        xpGained={gamification.events.xpGained.amount}
        source={gamification.events.xpGained.source}
        show={gamification.events.xpGained.show}
        onComplete={gamification.closeXPNotification}
      />

      <AchievementUnlockModal
        achievement={gamification.events.achievementUnlocked.achievement}
        show={gamification.events.achievementUnlocked.show}
        onClose={gamification.closeAchievementNotification}
      />

      <LevelUpNotification
        newLevel={gamification.events.levelUp.newLevel}
        oldLevel={gamification.events.levelUp.oldLevel}
        show={gamification.events.levelUp.show}
        onComplete={gamification.closeLevelUpNotification}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
        trigger={authTrigger}
      />

      {/* Custom Workout Builder */}
      {showWorkoutBuilder && (
        <WorkoutBuilder
          initialWorkout={editingWorkout || undefined}
          onSave={handleSaveWorkout}
          onCancel={handleCancelWorkoutBuilder}
          isEditing={!!editingWorkout}
        />
      )}

      {/* Premium Feature Demo */}
      {showPremiumDemo && (
        <PremiumFeatureShowcase
          feature={premiumDemoFeature}
          onUpgrade={() => {
            setShowPremiumDemo(false);
            setAuthTrigger('manual');
            setShowAuthModal(true);
          }}
          onClose={() => setShowPremiumDemo(false)}
        />
      )}
    </div>
  );
};

export default TrainingProgram;