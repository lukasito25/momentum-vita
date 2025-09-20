import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Mail,
  Lock,
  Apple,
  Chrome,
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (userData: {
    email: string;
    goals: string[];
    experience: string;
    provider: 'email' | 'google' | 'apple';
  }) => void;
  onSkip: () => void;
  trigger: 'premium' | 'custom-workout' | 'analytics';
}

type OnboardingStep = 'welcome' | 'goals' | 'experience' | 'auth' | 'premium';

const goalOptions = [
  { id: 'lose-weight', label: 'Lose Weight', icon: TrendingUp },
  { id: 'build-muscle', label: 'Build Muscle', icon: Zap },
  { id: 'get-fit', label: 'Get Fit', icon: Target },
  { id: 'stay-active', label: 'Stay Active', icon: Sparkles },
];

const experienceOptions = [
  { id: 'beginner', label: 'Beginner', description: 'New to working out' },
  { id: 'intermediate', label: 'Intermediate', description: '6+ months experience' },
  { id: 'advanced', label: 'Advanced', description: '2+ years experience' },
];

const premiumFeatures = [
  'AI-powered custom workouts',
  'Detailed progress analytics',
  'Unlimited workout programs',
  'Advanced exercise library',
  'Nutrition tracking & goals',
  'Priority customer support',
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
  trigger,
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const getWelcomeContent = () => {
    switch (trigger) {
      case 'premium':
        return {
          title: 'Unlock Premium Features',
          subtitle: 'Get access to AI-powered workouts and advanced analytics',
          icon: Sparkles,
        };
      case 'custom-workout':
        return {
          title: 'Create Custom Workouts',
          subtitle: 'Build personalized workout plans with AI assistance',
          icon: Target,
        };
      case 'analytics':
        return {
          title: 'Track Your Progress',
          subtitle: 'Get detailed insights into your fitness journey',
          icon: TrendingUp,
        };
      default:
        return {
          title: 'Welcome to Premium',
          subtitle: 'Unlock the full potential of your fitness journey',
          icon: Sparkles,
        };
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('goals');
        break;
      case 'goals':
        setCurrentStep('experience');
        break;
      case 'experience':
        setCurrentStep('auth');
        break;
      case 'auth':
        setCurrentStep('premium');
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'goals':
        setCurrentStep('welcome');
        break;
      case 'experience':
        setCurrentStep('goals');
        break;
      case 'auth':
        setCurrentStep('experience');
        break;
      case 'premium':
        setCurrentStep('auth');
        break;
    }
  };

  const handleAuth = (provider: 'email' | 'google' | 'apple') => {
    if (provider === 'email' && (!email || !password)) {
      return;
    }

    onComplete({
      email: provider === 'email' ? email : `${provider}@example.com`,
      goals: selectedGoals,
      experience: selectedExperience,
      provider,
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'goals':
        return selectedGoals.length > 0;
      case 'experience':
        return selectedExperience !== '';
      case 'auth':
        return true;
      default:
        return false;
    }
  };

  const welcomeContent = getWelcomeContent();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="mobile-container max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button
            onClick={currentStep === 'welcome' ? onSkip : handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
          >
            {currentStep === 'welcome' ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <div className="text-sm font-medium text-gray-600">
            Step {currentStep === 'welcome' ? 1 : currentStep === 'goals' ? 2 : currentStep === 'experience' ? 3 : 4} of 4
          </div>
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  currentStep === 'welcome' ? 25 :
                  currentStep === 'goals' ? 50 :
                  currentStep === 'experience' ? 75 : 100
                }%`
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'welcome' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <welcomeContent.icon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {welcomeContent.title}
              </h1>
              <p className="text-gray-600 mb-8">
                {welcomeContent.subtitle}
              </p>
              <div className="space-y-3 mb-8">
                {premiumFeatures.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'goals' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">What are your goals?</h2>
              <p className="text-gray-600 mb-6">Select all that apply to personalize your experience</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {goalOptions.map(({ id, label, icon: Icon }) => (
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
                    <div className={`text-sm font-medium ${
                      selectedGoals.includes(id) ? 'text-indigo-900' : 'text-gray-700'
                    }`}>
                      {label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'experience' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Experience Level</h2>
              <p className="text-gray-600 mb-6">Help us customize workouts for your fitness level</p>
              <div className="space-y-3 mb-6">
                {experienceOptions.map(({ id, label, description }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedExperience(id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all touch-feedback ${
                      selectedExperience === id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-medium mb-1 ${
                      selectedExperience === id ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {label}
                    </div>
                    <div className={`text-sm ${
                      selectedExperience === id ? 'text-indigo-600' : 'text-gray-600'
                    }`}>
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'auth' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600 mb-6">Sign up to save your progress and access premium features</p>

              {/* Social Login */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleAuth('apple')}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-black text-white rounded-lg touch-feedback"
                >
                  <Apple className="w-5 h-5" />
                  Continue with Apple
                </button>
                <button
                  onClick={() => handleAuth('google')}
                  className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 touch-feedback"
                >
                  <Chrome className="w-5 h-5" />
                  Continue with Google
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Email Form */}
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => handleAuth('email')}
                  disabled={!email || !password}
                  className="w-full btn btn-primary btn-lg touch-feedback disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Create Account
                </button>
              </div>
            </div>
          )}

          {currentStep === 'premium' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Premium!</h2>
              <p className="text-gray-600 mb-6">Your account has been created successfully</p>
              <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-indigo-700 font-medium">
                  🎉 Premium features are now unlocked!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep !== 'premium' && currentStep !== 'auth' && (
          <div className="p-6 pt-0">
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-full btn btn-primary btn-lg touch-feedback disabled:opacity-50"
            >
              {currentStep === 'experience' ? 'Continue' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;