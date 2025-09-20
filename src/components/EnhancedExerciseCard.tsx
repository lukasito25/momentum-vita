import React, { useState } from 'react';
import {
  Play,
  Clock,
  CheckCircle2,
  Circle,
  Info,
  ExternalLink,
  Volume2,
  Eye,
  Target,
  Zap,
} from 'lucide-react';
import { useFitnessImages, FitnessImageCategory } from '../hooks/useFitnessImages';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  rest: string;
  notes: string;
  demo?: string;
  videoUrl?: string;
  imageCategory?: FitnessImageCategory;
}

interface EnhancedExerciseCardProps {
  exercise: Exercise;
  index: number;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  onShowGuide?: () => void;
  onPlayVideo?: () => void;
  showActions?: boolean;
  isActive?: boolean;
}

// Exercise name to image category mapping
const getExerciseImageCategory = (exerciseName: string): FitnessImageCategory => {
  const name = exerciseName.toLowerCase();

  if (name.includes('push') || name.includes('press') || name.includes('chest')) {
    return 'chest';
  } else if (name.includes('pull') || name.includes('row') || name.includes('back')) {
    return 'back';
  } else if (name.includes('curl') || name.includes('tricep') || name.includes('arm')) {
    return 'arms';
  } else if (name.includes('squat') || name.includes('lunge') || name.includes('leg')) {
    return 'legs';
  } else {
    return 'general';
  }
};

// Generate demo video URL based on exercise name
const getVideoUrl = (exerciseName: string, demoId?: string): string => {
  const searchQuery = exerciseName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '+');
  return `https://www.youtube.com/results?search_query=how+to+${searchQuery}+exercise+form+tutorial`;
};

const EnhancedExerciseCard: React.FC<EnhancedExerciseCardProps> = ({
  exercise,
  index,
  isCompleted = false,
  onToggleComplete,
  onShowGuide,
  onPlayVideo,
  showActions = true,
  isActive = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { getImage } = useFitnessImages();

  const imageCategory = exercise.imageCategory || getExerciseImageCategory(exercise.name);
  const imageData = getImage(imageCategory, 'card');
  const videoUrl = exercise.videoUrl || getVideoUrl(exercise.name, exercise.demo);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleVideoClick = () => {
    if (onPlayVideo) {
      onPlayVideo();
    } else {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleGuideClick = () => {
    if (onShowGuide) {
      onShowGuide();
    }
  };

  return (
    <div className={`card transition-all duration-200 ${
      isActive ? 'border-indigo-500 bg-indigo-50 shadow-lg' : ''
    } ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
      <div className="card-body p-4">
        {/* Exercise Image */}
        <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
          {!imageError && imageData ? (
            <>
              {/* Placeholder while loading */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 rounded-full animate-pulse" />
                </div>
              )}

              {/* Actual image */}
              <img
                src={imageData.optimizedUrl}
                alt={imageData.alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />

              {/* Video play overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handleVideoClick}
                  className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 hover:bg-white transition-colors shadow-lg"
                  aria-label="Play exercise video"
                >
                  <Play className="w-6 h-6 ml-0.5" />
                </button>
              </div>
            </>
          ) : (
            // Fallback when no image available
            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm text-indigo-700 font-medium">Exercise</p>
              </div>
            </div>
          )}

          {/* Exercise number badge */}
          <div className="absolute top-2 left-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
            {index + 1}
          </div>

          {/* Completion status badge */}
          {showActions && (
            <div className="absolute top-2 right-2">
              <button
                onClick={onToggleComplete}
                className="w-6 h-6 rounded-full transition-colors"
                aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 bg-white rounded-full" />
                ) : (
                  <Circle className="w-6 h-6 text-white bg-black/30 rounded-full p-0.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Exercise Info */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-semibold text-lg leading-tight ${
                isCompleted ? 'text-green-900' : isActive ? 'text-indigo-900' : 'text-gray-900'
              }`}>
                {exercise.name}
              </h3>
              <div className="mt-1">
                <span className={`text-sm font-medium ${
                  isCompleted ? 'text-green-600' : isActive ? 'text-indigo-600' : 'text-gray-600'
                }`}>
                  {exercise.sets}
                </span>
              </div>
            </div>
          </div>

          {/* Exercise Notes */}
          {exercise.notes && (
            <div className={`text-sm p-3 rounded-lg border ${
              isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
              isCompleted ? 'bg-green-50 border-green-200 text-green-800' :
              'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed">{exercise.notes}</p>
              </div>
            </div>
          )}

          {/* Rest Time */}
          <div className={`flex items-center justify-center gap-2 p-2 rounded-lg border ${
            isActive ? 'bg-indigo-50 border-indigo-200' :
            isCompleted ? 'bg-green-50 border-green-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <Clock className={`w-4 h-4 ${
              isActive ? 'text-indigo-600' :
              isCompleted ? 'text-green-600' :
              'text-gray-500'
            }`} />
            <span className={`text-sm font-medium ${
              isActive ? 'text-indigo-700' :
              isCompleted ? 'text-green-700' :
              'text-gray-700'
            }`}>
              Rest: {exercise.rest}
            </span>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2">
              <button
                onClick={handleVideoClick}
                className="flex-1 btn btn-secondary text-xs py-2 touch-feedback"
              >
                <Play className="w-3 h-3 mr-1" />
                Watch Demo
              </button>
              <button
                onClick={handleGuideClick}
                className="flex-1 btn btn-primary text-xs py-2 touch-feedback"
              >
                <Eye className="w-3 h-3 mr-1" />
                Guide
              </button>
            </div>
          )}

          {/* Progress Indicator for Active Exercise */}
          {isActive && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-indigo-600 mb-1">
                <span>Current Exercise</span>
                <Target className="w-3 h-3" />
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-1">
                <div className="bg-indigo-600 h-1 rounded-full animate-pulse" style={{ width: '40%' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedExerciseCard;