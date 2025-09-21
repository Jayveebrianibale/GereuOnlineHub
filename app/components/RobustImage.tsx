import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';
import { getImageSource, getImageSourceAsync } from '../utils/imageUtils';

interface RobustImageProps extends Omit<ImageProps, 'source'> {
  source: string | ImageSourcePropType;
  fallbackSource?: ImageSourcePropType;
}

export const RobustImage: React.FC<RobustImageProps> = ({ 
  source, 
  fallbackSource,
  onError,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [currentSource, setCurrentSource] = useState<ImageSourcePropType>(() => {
    try {
      // Only use fallback for truly problematic paths, not recently selected images
      if (typeof source === 'string' && 
          source.includes('/cache/ImageManipulator/') && 
          source.includes('ImageManipulator/') &&
          !source.includes('recent')) {
        // This is a recently processed image, try to load it first
        console.log('📸 Loading recently processed image:', source);
        return getImageSource(source);
      }
      return getImageSource(source);
    } catch (error) {
      console.error('❌ Error getting image source:', error);
      return fallbackSource || require('@/assets/images/apartment1.webp');
    }
  });

  const handleError = (error: any) => {
    // Only log errors for non-cache files
    if (typeof source === 'string' && 
        !source.includes('/cache/ImageManipulator/')) {
      console.error('❌ Image load error:', error.nativeEvent?.error || error);
    } else {
      console.warn('⚠️ Cache file not found, using fallback');
    }
    
    setHasError(true);
    
    // Use fallback image
    if (fallbackSource) {
      console.log('🔄 Switching to fallback image');
      setCurrentSource(fallbackSource);
    } else {
      // Use default apartment image as ultimate fallback
      setCurrentSource(require('@/assets/images/apartment1.webp'));
    }
    
    // Call the original onError if provided
    if (onError) {
      onError(error);
    }
  };

  // Update current source when source prop changes
  useEffect(() => {
    const updateSource = async () => {
      try {
        // Try to load recently processed images first
        if (typeof source === 'string' && 
            source.includes('/cache/ImageManipulator/') && 
            source.includes('ImageManipulator/')) {
          console.log('📸 Attempting to load recently processed image:', source);
          const newSource = getImageSource(source);
          setCurrentSource(newSource);
          setHasError(false);
          return;
        }

        // Check if this is a problematic local file URI
        if (typeof source === 'string' && 
            source.startsWith('file://') && 
            (source.includes('/cache/ImageManipulator/') || source.includes('/data/user/0/host.exp.exponent/cache/'))) {
          console.log('🔄 Using async conversion for problematic URI:', source);
          const newSource = await getImageSourceAsync(source);
          setCurrentSource(newSource);
        } else {
          const newSource = getImageSource(source);
          setCurrentSource(newSource);
        }
        setHasError(false);
      } catch (error) {
        console.error('❌ Error updating image source:', error);
        // Use fallback or default image
        setCurrentSource(fallbackSource || require('@/assets/images/apartment1.webp'));
      }
    };
    
    updateSource();
  }, [source, fallbackSource]);

  const handleLoad = () => {
    console.log('✅ Image loaded successfully');
    setHasError(false);
  };

  return (
    <Image
      {...props}
      source={currentSource}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};
