import { useEffect, useState } from 'react';

export interface ImagePreloadItem {
  src: string;
  alt: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Hook for preloading images with priority-based loading
 */
export function useImagePreloader(images: ImagePreloadItem[], autoStart: boolean = true) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src));
        resolve();
      };

      img.onerror = () => {
        setFailedImages(prev => new Set(prev).add(src));
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  };

  const preloadImages = async (imageList: ImagePreloadItem[]) => {
    if (imageList.length === 0) return;

    setIsLoading(true);
    setProgress(0);

    // Sort by priority: high -> medium -> low
    const sortedImages = [...imageList].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    let loadedCount = 0;
    const totalImages = sortedImages.length;

    // Load high priority images first (in parallel)
    const highPriorityImages = sortedImages.filter(img => img.priority === 'high');
    if (highPriorityImages.length > 0) {
      await Promise.allSettled(
        highPriorityImages.map(async (img) => {
          try {
            await preloadImage(img.src);
            loadedCount++;
            setProgress((loadedCount / totalImages) * 100);
          } catch (error) {
            console.warn(`Failed to preload high priority image: ${img.src}`, error);
            loadedCount++;
            setProgress((loadedCount / totalImages) * 100);
          }
        })
      );
    }

    // Load medium priority images (in parallel, but after high priority)
    const mediumPriorityImages = sortedImages.filter(img => img.priority === 'medium');
    if (mediumPriorityImages.length > 0) {
      await Promise.allSettled(
        mediumPriorityImages.map(async (img) => {
          try {
            await preloadImage(img.src);
            loadedCount++;
            setProgress((loadedCount / totalImages) * 100);
          } catch (error) {
            console.warn(`Failed to preload medium priority image: ${img.src}`, error);
            loadedCount++;
            setProgress((loadedCount / totalImages) * 100);
          }
        })
      );
    }

    // Load low priority images (sequentially to avoid overwhelming the browser)
    const lowPriorityImages = sortedImages.filter(img => img.priority === 'low');
    for (const img of lowPriorityImages) {
      try {
        await preloadImage(img.src);
        loadedCount++;
        setProgress((loadedCount / totalImages) * 100);
      } catch (error) {
        console.warn(`Failed to preload low priority image: ${img.src}`, error);
        loadedCount++;
        setProgress((loadedCount / totalImages) * 100);
      }
    }

    setIsLoading(false);
  };

  const startPreloading = () => {
    preloadImages(images);
  };

  const isImageLoaded = (src: string) => loadedImages.has(src);
  const isImageFailed = (src: string) => failedImages.has(src);

  useEffect(() => {
    if (autoStart && images.length > 0) {
      startPreloading();
    }
  }, [images, autoStart]);

  return {
    loadedImages,
    failedImages,
    isLoading,
    progress,
    startPreloading,
    isImageLoaded,
    isImageFailed,
    totalImages: images.length,
    loadedCount: loadedImages.size,
    failedCount: failedImages.size
  };
}

/**
 * Hook for lazy loading images with intersection observer
 */
export function useLazyLoading() {
  const [observedElements, setObservedElements] = useState<Set<Element>>(new Set());

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without Intersection Observer
      document.querySelectorAll('[data-src]').forEach(img => {
        const element = img as HTMLImageElement;
        if (element.dataset.src) {
          element.src = element.dataset.src;
          element.removeAttribute('data-src');
        }
      });
      return;
    }

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              // Load the image
              img.src = img.dataset.src;
              img.removeAttribute('data-src');

              // Add fade-in effect
              img.classList.add('fade-in');

              // Stop observing this image
              imageObserver.unobserve(img);
              setObservedElements(prev => {
                const newSet = new Set(prev);
                newSet.delete(img);
                return newSet;
              });
            }
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before the image enters viewport
        threshold: 0.01
      }
    );

    // Observe all images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      imageObserver.observe(img);
      setObservedElements(prev => new Set(prev).add(img));
    });

    return () => {
      imageObserver.disconnect();
    };
  }, []);

  const observeElement = (element: Element) => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('fade-in');
                imageObserver.unobserve(img);
              }
            }
          });
        },
        { rootMargin: '50px 0px', threshold: 0.01 }
      );

      imageObserver.observe(element);
      setObservedElements(prev => new Set(prev).add(element));
    }
  };

  return {
    observedElements: observedElements.size,
    observeElement
  };
}

/**
 * Hook for optimizing images based on device capabilities
 */
export function useImageOptimization() {
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    supportsWebP: false,
    supportsAvif: false,
    connectionSpeed: 'unknown' as 'slow' | 'fast' | 'unknown',
    devicePixelRatio: 1
  });

  useEffect(() => {
    // Detect WebP support
    const webpSupport = (() => {
      try {
        return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
      } catch {
        return false;
      }
    })();

    // Detect AVIF support
    const avifSupport = (() => {
      try {
        return document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
      } catch {
        return false;
      }
    })();

    // Detect connection speed
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';

    if (connection) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        connectionSpeed = 'slow';
      } else if (connection.effectiveType === '3g' || connection.effectiveType === '4g') {
        connectionSpeed = 'fast';
      }
    }

    // Get device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1;

    setDeviceCapabilities({
      supportsWebP: webpSupport,
      supportsAvif: avifSupport,
      connectionSpeed,
      devicePixelRatio
    });
  }, []);

  const getOptimalImageFormat = (baseUrl: string): string => {
    if (!baseUrl.includes('unsplash.com')) return baseUrl;

    // Choose format based on support
    let format = 'auto';
    if (deviceCapabilities.supportsAvif) {
      format = 'avif';
    } else if (deviceCapabilities.supportsWebP) {
      format = 'webp';
    }

    // Adjust quality based on connection speed
    const quality = deviceCapabilities.connectionSpeed === 'slow' ? 60 : 80;

    // Add format and quality parameters
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}fm=${format}&q=${quality}`;
  };

  const getOptimalImageSize = (baseWidth: number, baseHeight: number) => {
    const { devicePixelRatio, connectionSpeed } = deviceCapabilities;

    // Adjust size based on device pixel ratio and connection speed
    let multiplier = devicePixelRatio;
    if (connectionSpeed === 'slow') {
      multiplier = Math.min(1.5, devicePixelRatio); // Cap at 1.5x for slow connections
    }

    return {
      width: Math.round(baseWidth * multiplier),
      height: Math.round(baseHeight * multiplier)
    };
  };

  return {
    deviceCapabilities,
    getOptimalImageFormat,
    getOptimalImageSize
  };
}

export default useImagePreloader;