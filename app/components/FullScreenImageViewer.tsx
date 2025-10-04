import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    ImageSourcePropType,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    GestureHandlerRootView,
    PanGestureHandler,
    PinchGestureHandler,
    TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { RobustImage } from './RobustImage';

interface FullScreenImageViewerProps {
  visible: boolean;
  imageSource: string | ImageSourcePropType;
  onClose: () => void;
  title?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  imageSource,
  onClose,
  title = 'Image Preview'
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);

  const handleBackButtonPress = () => {
    console.log('Back button pressed');
    onClose();
  };


  const resetZoom = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    setIsZoomed(false);
  };

  const handleDoubleTap = () => {
    if (scale.value > 1) {
      // Reset zoom
      resetZoom();
    } else {
      // Zoom in
      scale.value = withSpring(2);
      setIsZoomed(true);
    }
  };

  const pinchGestureHandler = (event: any) => {
    'worklet';
    const newScale = Math.max(1, Math.min(3, event.nativeEvent.scale));
    scale.value = newScale;
    
    if (newScale > 1) {
      runOnJS(setIsZoomed)(true);
    } else {
      runOnJS(setIsZoomed)(false);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }
  };

  const panGestureHandler = (event: any) => {
    'worklet';
    if (scale.value > 1) {
      // Apply translation with smooth scaling for natural movement
      const sensitivity = 0.8; // Smooth sensitivity for natural feel
      const newTranslateX = translateX.value + (event.nativeEvent.translationX * sensitivity);
      
      // Only allow horizontal movement (left-right), keep vertical position fixed
      const maxTranslateX = (screenWidth * (scale.value - 1)) / 2;
      
      // Constrain only horizontal movement
      translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
      // Keep vertical position at center (no up-down movement)
      translateY.value = 0;
    }
  };

  const panEndHandler = () => {
    'worklet';
    // Add smooth spring animation when horizontal panning ends
    if (scale.value > 1) {
      translateX.value = withSpring(translateX.value, {
        damping: 15,
        stiffness: 200,
      });
      // Ensure vertical position stays centered
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <StatusBar hidden={true} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleBackButtonPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Image Container */}
          <View style={styles.imageContainer}>
            <TapGestureHandler
              ref={doubleTapRef}
              numberOfTaps={2}
              onActivated={handleDoubleTap}
            >
              <Animated.View style={styles.imageWrapper}>
                <PanGestureHandler
                  ref={panRef}
                  onGestureEvent={panGestureHandler}
                  onHandlerStateChange={panEndHandler}
                  minPointers={1}
                  maxPointers={1}
                  avgTouches
                >
                  <Animated.View>
                    <PinchGestureHandler
                      ref={pinchRef}
                      onGestureEvent={pinchGestureHandler}
                    >
                      <Animated.View style={animatedStyle}>
                        <RobustImage
                          source={imageSource}
                          style={styles.fullScreenImage}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </PinchGestureHandler>
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>
            </TapGestureHandler>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight - 120, // Account for header and instructions
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight - 120, // Account for header and instructions
    backgroundColor: 'transparent',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});
