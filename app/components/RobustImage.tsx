import React, { useState } from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';
import { getImageSource } from '../utils/imageUtils';

interface RobustImageProps extends Omit<ImageProps, 'source'> {
  source: string | ImageSourcePropType;
  fallbackSource?: ImageSourcePropType;
}

export const RobustImage: React.FC<RobustImageProps> = ({ 
  source, 
  fallbackSource = require('@/assets/images/apartment1.webp'),
  onError,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [currentSource, setCurrentSource] = useState<ImageSourcePropType>(() => {
    try {
      return getImageSource(source);
    } catch (error) {
      console.error('❌ Error getting image source:', error);
      return fallbackSource;
    }
  });

  const handleError = (error: any) => {
    console.error('❌ Image load error:', error.nativeEvent.error);
    setHasError(true);
    
    // If the current source is a URI and it failed, try the fallback
    if (!hasError && typeof source === 'string' && source.startsWith('file:')) {
      console.log('🔄 Switching to fallback image due to URI error');
      setCurrentSource(fallbackSource);
    }
    
    // Call the original onError if provided
    if (onError) {
      onError(error);
    }
  };

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
