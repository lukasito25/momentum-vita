import React, { useState, useRef, useEffect } from 'react';
import { ImageService } from '../lib/imageService';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'card' | 'header' | 'splash' | 'achievement';
  fallbackText?: string;
  showAttribution?: boolean;
  lazy?: boolean;
  overlay?: {
    color?: string;
    opacity?: number;
    content?: React.ReactNode;
  };
  onLoad?: () => void;
  onError?: () => void;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  size = 'card',
  fallbackText,
  showAttribution = false,
  lazy = true,
  overlay,
  onLoad,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const [lowQualityLoaded, setLowQualityLoaded] = useState(false);

  // Get optimized URLs
  const optimizedSrc = ImageService.getOptimizedImageUrl(src, size);
  const progressiveImage = ImageService.createProgressiveImage(src, alt, className, size);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [lazy]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  const handleLowQualityLoad = () => {
    setLowQualityLoaded(true);
  };

  // Generate fallback placeholder if image fails to load
  const fallbackImage = imageError
    ? ImageService.getPlaceholderImage(400, 300, fallbackText || 'Fitness')
    : null;

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {/* Low quality placeholder (blur effect) */}
      {inView && !imageError && (
        <img
          src={progressiveImage.lowQualitySrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            lowQualityLoaded && !imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLowQualityLoad}
          loading="eager"
        />
      )}

      {/* High quality main image */}
      {inView && !imageError && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={lazy ? 'lazy' : 'eager'}
        />
      )}

      {/* Fallback placeholder */}
      {imageError && fallbackImage && (
        <img
          src={fallbackImage}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Loading skeleton */}
      {!inView || (!imageLoaded && !imageError && !lowQualityLoaded) && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gray-400 rounded animate-pulse"></div>
              <div className="text-sm">Loading...</div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {overlay && imageLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor: overlay.color || 'rgba(0, 0, 0, 0.4)',
            opacity: overlay.opacity || 0.6
          }}
        >
          {overlay.content}
        </div>
      )}

      {/* Attribution */}
      {showAttribution && imageLoaded && !imageError && (
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          {ImageService.getImageAttribution(src)}
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;