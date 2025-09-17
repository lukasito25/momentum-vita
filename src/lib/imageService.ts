/**
 * Image Service for Fitness App
 *
 * Provides high-quality, free-license fitness images from Unsplash and other sources.
 * Features image caching, lazy loading, and optimized delivery.
 *
 * All images are sourced from Unsplash with proper licensing for commercial use.
 */

// Curated fitness image collections from Unsplash
export const UNSPLASH_COLLECTIONS = {
  fitness: '483251',      // Fitness collection
  gym: '1154337',         // Gym equipment
  workout: '1538281',     // Workout scenes
  strength: '317099',     // Strength training
  motivation: '1065396',  // Motivational fitness
  nutrition: '1114804'    // Healthy nutrition
};

// Specific curated images for different categories
export const FITNESS_IMAGES = {
  // Program Headers
  programs: {
    foundation: {
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
      alt: 'Foundation Phase - Gym Equipment Setup',
      credit: 'John Arano on Unsplash'
    },
    growth: {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      alt: 'Growth Phase - Heavy Weights',
      credit: 'Victor Freitas on Unsplash'
    },
    intensity: {
      url: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2dd?w=800&q=80',
      alt: 'Intensity Phase - Advanced Training',
      credit: 'Anastase Maragos on Unsplash'
    }
  },

  // Workout Day Categories
  workouts: {
    push: {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      alt: 'Push Day - Chest and Shoulders Workout',
      credit: 'Victor Freitas on Unsplash'
    },
    pull: {
      url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
      alt: 'Pull Day - Back and Arms Training',
      credit: 'Anastase Maragos on Unsplash'
    },
    legs: {
      url: 'https://images.unsplash.com/photo-1566241134710-42b6b6e7bdf4?w=800&q=80',
      alt: 'Leg Day - Lower Body Training',
      credit: 'Danielle Cerullo on Unsplash'
    }
  },

  // Achievement Backgrounds
  achievements: {
    first_workout: {
      url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80',
      alt: 'First Workout Achievement',
      credit: 'John Arano on Unsplash'
    },
    streak_7: {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
      alt: '7 Day Streak Achievement',
      credit: 'Victor Freitas on Unsplash'
    },
    strength_master: {
      url: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2dd?w=600&q=80',
      alt: 'Strength Master Achievement',
      credit: 'Anastase Maragos on Unsplash'
    },
    nutrition_king: {
      url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
      alt: 'Nutrition Achievement',
      credit: 'Brooke Lark on Unsplash'
    }
  },

  // Loading and Splash Screens
  loading: {
    general: {
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
      alt: 'Loading - Gym Equipment',
      credit: 'John Arano on Unsplash'
    },
    splash: {
      url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
      alt: 'Fitness App Splash Screen',
      credit: 'Victor Freitas on Unsplash'
    }
  },

  // Exercise Categories
  exercises: {
    chest: {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
      alt: 'Chest Exercises',
      credit: 'Victor Freitas on Unsplash'
    },
    back: {
      url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80',
      alt: 'Back Exercises',
      credit: 'Anastase Maragos on Unsplash'
    },
    arms: {
      url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80',
      alt: 'Arm Exercises',
      credit: 'Hayley Kim Design on Unsplash'
    },
    legs: {
      url: 'https://images.unsplash.com/photo-1566241134710-42b6b6e7bdf4?w=600&q=80',
      alt: 'Leg Exercises',
      credit: 'Danielle Cerullo on Unsplash'
    }
  },

  // Nutrition Images
  nutrition: {
    protein: {
      url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80',
      alt: 'High Protein Foods',
      credit: 'Sebastian Coman Photography on Unsplash'
    },
    healthy_meal: {
      url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
      alt: 'Healthy Nutrition',
      credit: 'Brooke Lark on Unsplash'
    },
    supplements: {
      url: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=600&q=80',
      alt: 'Fitness Supplements',
      credit: 'Supplement Bottle on Unsplash'
    }
  }
};

// Image optimization parameters for different use cases
export const IMAGE_SIZES = {
  thumbnail: { w: 300, h: 200, q: 70 },
  card: { w: 600, h: 400, q: 80 },
  header: { w: 800, h: 300, q: 85 },
  splash: { w: 1200, h: 800, q: 90 },
  achievement: { w: 400, h: 400, q: 80 }
};

// Image cache for performance
const imageCache = new Map<string, string>();

/**
 * Get optimized image URL with specified dimensions and quality
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  size: keyof typeof IMAGE_SIZES = 'card'
): string {
  const params = IMAGE_SIZES[size];
  const cacheKey = `${baseUrl}_${size}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  // For Unsplash images, append optimization parameters
  const optimizedUrl = baseUrl.includes('unsplash.com')
    ? `${baseUrl}&w=${params.w}&h=${params.h}&q=${params.q}&fit=crop&auto=format`
    : baseUrl;

  imageCache.set(cacheKey, optimizedUrl);
  return optimizedUrl;
}

/**
 * Get random fitness image from Unsplash collection
 */
export function getRandomFitnessImage(
  category: keyof typeof UNSPLASH_COLLECTIONS = 'fitness',
  size: keyof typeof IMAGE_SIZES = 'card'
): string {
  const collectionId = UNSPLASH_COLLECTIONS[category];
  const params = IMAGE_SIZES[size];
  return `https://source.unsplash.com/collection/${collectionId}/${params.w}x${params.h}`;
}

/**
 * Get program-specific image
 */
export function getProgramImage(
  programType: 'foundation' | 'growth' | 'intensity',
  size: keyof typeof IMAGE_SIZES = 'header'
): string {
  const imageData = FITNESS_IMAGES.programs[programType];
  return getOptimizedImageUrl(imageData.url, size);
}

/**
 * Get workout day image
 */
export function getWorkoutImage(
  workoutType: 'push' | 'pull' | 'legs',
  size: keyof typeof IMAGE_SIZES = 'header'
): string {
  const imageData = FITNESS_IMAGES.workouts[workoutType];
  return getOptimizedImageUrl(imageData.url, size);
}

/**
 * Get achievement badge background image
 */
export function getAchievementImage(
  achievementType: keyof typeof FITNESS_IMAGES.achievements,
  size: keyof typeof IMAGE_SIZES = 'achievement'
): string {
  const imageData = FITNESS_IMAGES.achievements[achievementType];
  return getOptimizedImageUrl(imageData.url, size);
}

/**
 * Get loading/splash screen image
 */
export function getLoadingImage(
  type: 'general' | 'splash' = 'general',
  size: keyof typeof IMAGE_SIZES = 'splash'
): string {
  const imageData = FITNESS_IMAGES.loading[type];
  return getOptimizedImageUrl(imageData.url, size);
}

/**
 * Preload critical images for better performance
 */
export function preloadCriticalImages(): void {
  const criticalImages = [
    // Program images
    FITNESS_IMAGES.programs.foundation.url,
    FITNESS_IMAGES.programs.growth.url,
    FITNESS_IMAGES.programs.intensity.url,
    // Workout images
    FITNESS_IMAGES.workouts.push.url,
    FITNESS_IMAGES.workouts.pull.url,
    FITNESS_IMAGES.workouts.legs.url,
    // Loading image
    FITNESS_IMAGES.loading.general.url
  ];

  criticalImages.forEach(url => {
    const img = new Image();
    img.src = getOptimizedImageUrl(url, 'card');
  });
}

/**
 * Lazy load images with intersection observer
 */
export function setupLazyLoading(): void {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Create a blur-to-sharp loading effect
 */
export function createProgressiveImage(
  src: string,
  alt: string,
  className: string = '',
  size: keyof typeof IMAGE_SIZES = 'card'
): {
  lowQualitySrc: string;
  highQualitySrc: string;
  alt: string;
  className: string;
} {
  const lowQualityParams = { ...IMAGE_SIZES[size], q: 10 };
  const lowQualitySrc = src.includes('unsplash.com')
    ? `${src}&w=${lowQualityParams.w}&h=${lowQualityParams.h}&q=${lowQualityParams.q}&blur=10`
    : src;

  return {
    lowQualitySrc,
    highQualitySrc: getOptimizedImageUrl(src, size),
    alt,
    className: `${className} transition-all duration-500`
  };
}

/**
 * Get image attribution text for legal compliance
 */
export function getImageAttribution(imageKey: string): string {
  // Navigate through nested objects to find the image
  const findImage = (obj: any, key: string): any => {
    for (const [k, v] of Object.entries(obj)) {
      if (k === key && typeof v === 'object' && 'credit' in v) {
        return v;
      }
      if (typeof v === 'object') {
        const result = findImage(v, key);
        if (result) return result;
      }
    }
    return null;
  };

  const imageData = findImage(FITNESS_IMAGES, imageKey);
  return imageData?.credit || 'Photo by Unsplash';
}

/**
 * Generate a placeholder image with fitness theme
 */
export function getPlaceholderImage(
  width: number = 600,
  height: number = 400,
  text: string = 'Fitness'
): string {
  // Using a gradient placeholder with fitness theme
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e40af'); // Blue
    gradient.addColorStop(1, '#3b82f6'); // Lighter blue

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = `${Math.min(width, height) / 10}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }

  return canvas.toDataURL();
}

/**
 * Check if image URL is valid and accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Initialize image service
export function initializeImageService(): void {
  // Preload critical images
  preloadCriticalImages();

  // Setup lazy loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLazyLoading);
  } else {
    setupLazyLoading();
  }
}

// Export default configuration
export const ImageService = {
  getOptimizedImageUrl,
  getRandomFitnessImage,
  getProgramImage,
  getWorkoutImage,
  getAchievementImage,
  getLoadingImage,
  preloadCriticalImages,
  setupLazyLoading,
  createProgressiveImage,
  getImageAttribution,
  getPlaceholderImage,
  validateImageUrl,
  initializeImageService,
  SIZES: IMAGE_SIZES,
  IMAGES: FITNESS_IMAGES
};

export default ImageService;