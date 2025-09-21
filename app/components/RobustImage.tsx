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
      return getImageSource(source);
    } catch (error) {
      console.error('❌ Error getting image source:', error);
      // Only use fallback if provided, otherwise use the original source
      return fallbackSource || (typeof source === 'string' ? { uri: source } : source);
    }
  });

  const handleError = (error: any) => {
    console.error('❌ Image load error:', error.nativeEvent.error);
    setHasError(true);
    
    // Only use fallback if provided
    if (fallbackSource && !hasError) {
      console.log('🔄 Switching to fallback image due to URI error');
      setCurrentSource(fallbackSource);
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
        // Only use fallback if provided, otherwise use the original source
        setCurrentSource(fallbackSource || (typeof source === 'string' ? { uri: source } : source));
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
