import React from 'react';
import ProgressiveImage from './ProgressiveImage';
import { useFitnessImages } from '../hooks/useFitnessImages';
import { Trophy, Dumbbell, Target } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  type?: 'splash' | 'general';
  showProgress?: boolean;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading your training data...',
  type = 'general',
  showProgress = false,
  progress = 0
}) => {
  const fitnessImages = useFitnessImages();

  const loadingImage = type === 'splash'
    ? fitnessImages.getImage('splash', 'splash')
    : fitnessImages.getImage('general', 'splash');

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <ProgressiveImage
        src={loadingImage?.url || ''}
        alt="Fitness loading background"
        className="absolute inset-0 w-full h-full"
        size="splash"
        lazy={false}
        overlay={{
          color: 'rgba(0, 0, 0, 0.6)',
          opacity: 0.8
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/80 to-indigo-900/80"></div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-8 px-4 max-w-md">
          {/* Logo/Icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <Trophy className="w-12 h-12 text-white" />
            </div>

            {/* Floating Icons Animation */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <Target className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              3x/Week Aesthetic
            </h1>
            <p className="text-blue-200 text-lg font-medium drop-shadow-md">
              Build Your Best Physique
            </p>
          </div>

          {/* Loading Animation */}
          <div className="space-y-4">
            {/* Spinning Animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
              </div>
            </div>

            {/* Loading Message */}
            <p className="text-white/90 text-lg font-medium drop-shadow-md">
              {message}
            </p>

            {/* Progress Bar (optional) */}
            {showProgress && (
              <div className="w-full max-w-xs mx-auto">
                <div className="bg-white/20 rounded-full h-2 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <div className="text-white/80 text-sm mt-2 font-medium">
                  {Math.round(progress)}%
                </div>
              </div>
            )}

            {/* Loading Dots Animation */}
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          {/* Motivational Text */}
          <div className="space-y-2 text-center">
            <p className="text-blue-200/80 text-sm font-medium drop-shadow-md">
              "Your body can do it. It's your mind you need to convince."
            </p>
            <p className="text-white/60 text-xs drop-shadow-md">
              Preparing your personalized training experience...
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent"></div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-10 w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

export default LoadingScreen;