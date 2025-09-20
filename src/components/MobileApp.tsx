import React, { useState, useEffect } from 'react';
import BottomNavigation, { TabType } from './BottomNavigation';
import WorkoutDashboard from './WorkoutDashboard';
import ExerciseFlow from './ExerciseFlow';
import OnboardingFlow from './OnboardingFlow';
import ProgressView from './ProgressView';
import CustomWorkoutGenerator from './CustomWorkoutGenerator';
import ProgramSelectionModal from './ProgramSelectionModal';
import WorkoutLibrary from './WorkoutLibrary';
import { workoutPrograms, getTodaysWorkout, getWorkoutProgram } from '../data/workout-programs';
import { User, BarChart3, Settings, Crown } from 'lucide-react';

// Sample workout data
const sampleWorkout = [
  {
    id: 'push-ups',
    name: 'Push-ups',
    sets: '3 x 8-12',
    rest: '60 sec',
    notes: 'Keep your core tight and maintain a straight line from head to heels.',
  },
  {
    id: 'squats',
    name: 'Bodyweight Squats',
    sets: '3 x 12-15',
    rest: '60 sec',
    notes: 'Lower down until your thighs are parallel to the ground.',
  },
  {
    id: 'plank',
    name: 'Plank Hold',
    sets: '3 x 30-45s',
    rest: '60 sec',
    notes: 'Keep your body straight and breathe normally.',
  },
];

interface User {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google' | 'apple';
  isPremium: boolean;
  goals: string[];
  experience: string;
}

const MobileApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [user, setUser] = useState<User | null>(null);
  const [showWorkoutFlow, setShowWorkoutFlow] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingTrigger, setOnboardingTrigger] = useState<'premium' | 'custom-workout' | 'analytics'>('premium');
  const [showCustomWorkoutGenerator, setShowCustomWorkoutGenerator] = useState(false);
  const [showProgramSelection, setShowProgramSelection] = useState(false);
  const [currentProgramId, setCurrentProgramId] = useState('foundation-builder');
  const [currentWorkout, setCurrentWorkout] = useState(sampleWorkout);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('momentum_vita_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }

    // Load saved program
    const savedProgram = localStorage.getItem('current_program_id');
    if (savedProgram) {
      setCurrentProgramId(savedProgram);
    }
  }, []);

  // Update current workout when program changes
  useEffect(() => {
    const todaysWorkout = getTodaysWorkout(currentProgramId);
    if (todaysWorkout) {
      const exercisesWithIds = todaysWorkout.exercises.map((exercise, index) => ({
        id: `${todaysWorkout.dayName}-${index}`,
        ...exercise
      }));
      setCurrentWorkout(exercisesWithIds);
    }
  }, [currentProgramId]);

  const handleStartWorkout = () => {
    setShowWorkoutFlow(true);
  };

  const handleExitWorkout = () => {
    setShowWorkoutFlow(false);
  };

  const handleCompleteWorkout = () => {
    setShowWorkoutFlow(false);
    // Could show completion celebration here
  };

  const handleUpgrade = (trigger: 'premium' | 'custom-workout' | 'analytics' = 'premium') => {
    setOnboardingTrigger(trigger);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (userData: {
    email: string;
    goals: string[];
    experience: string;
    provider: 'email' | 'google' | 'apple';
  }) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.email.split('@')[0],
      isPremium: true, // All signups get premium for now
      ...userData,
    };

    setUser(newUser);
    localStorage.setItem('momentum_vita_user', JSON.stringify(newUser));
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const handleShowProgramSelection = () => {
    setShowProgramSelection(true);
  };

  const handleSelectProgram = (programId: string) => {
    const program = getWorkoutProgram(programId);
    if (program?.isPremium && !user) {
      setOnboardingTrigger('premium');
      setShowOnboarding(true);
      setShowProgramSelection(false);
      return;
    }

    setCurrentProgramId(programId);
    localStorage.setItem('current_program_id', programId);
    setShowProgramSelection(false);
  };

  const handleCreateCustomWorkout = () => {
    if (!user) {
      setOnboardingTrigger('custom-workout');
      setShowOnboarding(true);
      return;
    }
    setShowCustomWorkoutGenerator(true);
  };

  const handleCustomWorkoutComplete = (workout: any) => {
    // Convert generated workout to our exercise format
    const customExercises = workout.exercises.map((exercise: any) => ({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets,
      rest: exercise.rest,
      notes: exercise.notes
    }));

    setCurrentWorkout(customExercises);
    setShowCustomWorkoutGenerator(false);
    setShowWorkoutFlow(true);
  };

  const handleCustomWorkoutCancel = () => {
    setShowCustomWorkoutGenerator(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        const currentProgram = getWorkoutProgram(currentProgramId);
        return (
          <WorkoutDashboard
            currentProgram={currentProgram?.name || "Foundation Builder"}
            currentWeek={1}
            todaysWorkout={currentWorkout}
            onStartWorkout={handleStartWorkout}
            isAuthenticated={!!user}
            onUpgrade={() => handleUpgrade('premium')}
            onShowProgramSelection={handleShowProgramSelection}
            onCreateCustomWorkout={handleCreateCustomWorkout}
          />
        );

      case 'workout':
        return (
          <WorkoutLibrary
            onSelectProgram={handleSelectProgram}
            onStartCustomWorkout={handleCreateCustomWorkout}
            onStartTodaysWorkout={handleStartWorkout}
            currentProgramId={currentProgramId}
            isAuthenticated={!!user}
            onUpgrade={() => handleUpgrade('premium')}
          />
        );

      case 'progress':
        return (
          <ProgressView
            isAuthenticated={!!user}
            onUpgrade={() => handleUpgrade('analytics')}
          />
        );

      case 'profile':
        return (
          <div className="page-content">
            {user ? (
              <div className="space-y-6">
                {/* User Info */}
                <div className="card">
                  <div className="card-body text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {user.name}
                    </h2>
                    <p className="text-gray-600 mb-3">{user.email}</p>
                    {user.isPremium && (
                      <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-medium rounded-full">
                        <Crown className="w-4 h-4 mr-1" />
                        Premium
                      </div>
                    )}
                  </div>
                </div>

                {/* Goals */}
                {user.goals.length > 0 && (
                  <div className="card">
                    <div className="card-body">
                      <h3 className="font-semibold text-gray-900 mb-3">Your Goals</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.goals.map((goal) => (
                          <span
                            key={goal}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                          >
                            {goal.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <span>Notifications</span>
                        <Settings className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <span>Privacy</span>
                        <Settings className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          setUser(null);
                          localStorage.removeItem('momentum_vita_user');
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg text-red-600"
                      >
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In</h2>
                <p className="text-gray-600 mb-6">Create an account to save your progress and access premium features</p>
                <button
                  onClick={() => handleUpgrade('premium')}
                  className="btn btn-primary btn-lg touch-feedback"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (showWorkoutFlow) {
    return (
      <ExerciseFlow
        exercises={currentWorkout}
        onComplete={handleCompleteWorkout}
        onExit={handleExitWorkout}
      />
    );
  }

  return (
    <div className="mobile-container relative">
      {/* Page Header */}
      <div className="page-header px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {activeTab === 'home' && 'Momentum Vita'}
            {activeTab === 'workout' && 'Workouts'}
            {activeTab === 'progress' && 'Progress'}
            {activeTab === 'profile' && 'Profile'}
          </h1>
          {user?.isPremium && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-medium rounded-full">
              <Crown className="w-3 h-3" />
              Pro
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-labelledby={`${activeTab}-tab`}
        className="animate-fade-in"
      >
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          trigger={onboardingTrigger}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Program Selection Modal */}
      {showProgramSelection && (
        <ProgramSelectionModal
          onSelectProgram={handleSelectProgram}
          onClose={() => setShowProgramSelection(false)}
          onUpgrade={() => handleUpgrade('premium')}
          isAuthenticated={!!user}
          currentProgramId={currentProgramId}
        />
      )}

      {/* Custom Workout Generator */}
      {showCustomWorkoutGenerator && (
        <CustomWorkoutGenerator
          onComplete={handleCustomWorkoutComplete}
          onClose={handleCustomWorkoutCancel}
        />
      )}
    </div>
  );
};

export default MobileApp;