import { useEffect, useState } from 'react';
import { ImageService, FITNESS_IMAGES } from '../lib/imageService';

// Image categories for the fitness app
export type FitnessImageCategory =
  | 'foundation' | 'growth' | 'intensity'  // Programs
  | 'push' | 'pull' | 'legs'               // Workouts
  | 'first_workout' | 'streak_7' | 'strength_master' | 'nutrition_king'  // Achievements
  | 'general' | 'splash'                   // Loading
  | 'chest' | 'back' | 'arms'             // Exercises
  | 'protein' | 'healthy_meal' | 'supplements';  // Nutrition

export interface FitnessImageData {
  url: string;
  alt: string;
  credit: string;
  optimizedUrl: string;
  isLoaded: boolean;
  hasError: boolean;
}

/**
 * Hook for managing fitness-themed images with preloading and optimization
 */
export function useFitnessImages() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize image service on mount
  useEffect(() => {
    ImageService.initializeImageService();
    setIsInitialized(true);
  }, []);

  /**
   * Get image data for a specific category
   */
  const getImage = (
    category: FitnessImageCategory,
    size: keyof typeof ImageService.SIZES = 'card'
  ): FitnessImageData | null => {
    let imageData;

    // Navigate to the correct image based on category
    if (['foundation', 'growth', 'intensity'].includes(category)) {
      imageData = FITNESS_IMAGES.programs[category as keyof typeof FITNESS_IMAGES.programs];
    } else if (['push', 'pull', 'legs'].includes(category)) {
      imageData = FITNESS_IMAGES.workouts[category as keyof typeof FITNESS_IMAGES.workouts];
    } else if (['first_workout', 'streak_7', 'strength_master', 'nutrition_king'].includes(category)) {
      imageData = FITNESS_IMAGES.achievements[category as keyof typeof FITNESS_IMAGES.achievements];
    } else if (['general', 'splash'].includes(category)) {
      imageData = FITNESS_IMAGES.loading[category as keyof typeof FITNESS_IMAGES.loading];
    } else if (['chest', 'back', 'arms', 'legs'].includes(category)) {
      imageData = FITNESS_IMAGES.exercises[category as keyof typeof FITNESS_IMAGES.exercises];
    } else if (['protein', 'healthy_meal', 'supplements'].includes(category)) {
      imageData = FITNESS_IMAGES.nutrition[category as keyof typeof FITNESS_IMAGES.nutrition];
    }

    if (!imageData) return null;

    return {
      url: imageData.url,
      alt: imageData.alt,
      credit: imageData.credit,
      optimizedUrl: ImageService.getOptimizedImageUrl(imageData.url, size),
      isLoaded: loadedImages.has(imageData.url),
      hasError: errorImages.has(imageData.url)
    };
  };

  /**
   * Get program-specific image
   */
  const getProgramImage = (
    phase: 'foundation' | 'growth' | 'intensity',
    size: keyof typeof ImageService.SIZES = 'header'
  ): FitnessImageData | null => {
    return getImage(phase, size);
  };

  /**
   * Get workout day image
   */
  const getWorkoutImage = (
    type: 'push' | 'pull' | 'legs',
    size: keyof typeof ImageService.SIZES = 'header'
  ): FitnessImageData | null => {
    return getImage(type, size);
  };

  /**
   * Get achievement image
   */
  const getAchievementImage = (
    achievement: 'first_workout' | 'streak_7' | 'strength_master' | 'nutrition_king',
    size: keyof typeof ImageService.SIZES = 'achievement'
  ): FitnessImageData | null => {
    return getImage(achievement, size);
  };

  /**
   * Get random fitness image from Unsplash collection
   */
  const getRandomImage = (
    category: 'fitness' | 'gym' | 'workout' | 'strength' | 'motivation' | 'nutrition' = 'fitness',
    size: keyof typeof ImageService.SIZES = 'card'
  ): string => {
    return ImageService.getRandomFitnessImage(category, size);
  };

  /**
   * Preload specific images for better performance
   */
  const preloadImages = (categories: FitnessImageCategory[]) => {
    categories.forEach(category => {
      const imageData = getImage(category);
      if (imageData) {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(imageData.url));
        };
        img.onerror = () => {
          setErrorImages(prev => new Set(prev).add(imageData.url));
        };
        img.src = imageData.optimizedUrl;
      }
    });
  };

  /**
   * Preload critical images for the app
   */
  const preloadCriticalImages = () => {
    const criticalCategories: FitnessImageCategory[] = [
      'foundation', 'growth', 'intensity',  // Program images
      'push', 'pull', 'legs',               // Workout images
      'general'                             // Loading image
    ];
    preloadImages(criticalCategories);
  };

  /**
   * Get image with gradient overlay for better text readability
   */
  const getImageWithOverlay = (
    category: FitnessImageCategory,
    overlayColor: string = 'rgba(0, 0, 0, 0.4)',
    size: keyof typeof ImageService.SIZES = 'card'
  ) => {
    const imageData = getImage(category, size);
    if (!imageData) return null;

    return {
      ...imageData,
      style: {
        backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url(${imageData.optimizedUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    };
  };

  /**
   * Create a progressive loading setup for an image
   */
  const createProgressiveImage = (
    category: FitnessImageCategory,
    size: keyof typeof ImageService.SIZES = 'card'
  ) => {
    const imageData = getImage(category, size);
    if (!imageData) return null;

    return ImageService.createProgressiveImage(
      imageData.url,
      imageData.alt,
      '',
      size
    );
  };

  return {
    // State
    isInitialized,
    loadedImages,
    errorImages,

    // Core functions
    getImage,
    getProgramImage,
    getWorkoutImage,
    getAchievementImage,
    getRandomImage,

    // Enhancement functions
    getImageWithOverlay,
    createProgressiveImage,

    // Performance functions
    preloadImages,
    preloadCriticalImages,

    // Utility
    validateImage: ImageService.validateImageUrl,
    getPlaceholder: ImageService.getPlaceholderImage
  };
}

/**
 * Hook specifically for program images with phase progression
 */
export function useProgramImages(currentWeek: number) {
  const images = useFitnessImages();

  const getPhase = (week: number): 'foundation' | 'growth' | 'intensity' => {
    if (week <= 4) return 'foundation';
    if (week <= 8) return 'growth';
    return 'intensity';
  };

  const currentPhase = getPhase(currentWeek);
  const currentPhaseImage = images.getProgramImage(currentPhase);

  // Preload next phase image for smooth transitions
  useEffect(() => {
    const nextWeek = currentWeek + 1;
    if (nextWeek <= 12) {
      const nextPhase = getPhase(nextWeek);
      if (nextPhase !== currentPhase) {
        images.preloadImages([nextPhase]);
      }
    }
  }, [currentWeek, currentPhase, images]);

  return {
    currentPhase,
    currentPhaseImage,
    getAllPhaseImages: () => ({
      foundation: images.getProgramImage('foundation'),
      growth: images.getProgramImage('growth'),
      intensity: images.getProgramImage('intensity')
    }),
    getPhaseImage: (phase: 'foundation' | 'growth' | 'intensity') =>
      images.getProgramImage(phase)
  };
}

/**
 * Hook for workout-specific images
 */
export function useWorkoutImages() {
  const images = useFitnessImages();

  useEffect(() => {
    // Preload all workout images
    images.preloadImages(['push', 'pull', 'legs']);
  }, [images]);

  return {
    pushImage: images.getWorkoutImage('push'),
    pullImage: images.getWorkoutImage('pull'),
    legsImage: images.getWorkoutImage('legs'),
    getWorkoutImage: images.getWorkoutImage
  };
}

export default useFitnessImages;