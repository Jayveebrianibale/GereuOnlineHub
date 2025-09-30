import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive breakpoints
export const breakpoints = {
  small: 375,    // iPhone SE, small phones
  medium: 414,   // iPhone 12, 13, 14
  large: 768,    // iPhone Plus, larger phones
  tablet: 1024,  // iPads, tablets
  desktop: 1200, // Desktop screens
};

// Device type detection
export const isSmallScreen = SCREEN_WIDTH < breakpoints.small;
export const isMediumScreen = SCREEN_WIDTH >= breakpoints.small && SCREEN_WIDTH < breakpoints.medium;
export const isLargeScreen = SCREEN_WIDTH >= breakpoints.medium && SCREEN_WIDTH < breakpoints.large;
export const isTablet = SCREEN_WIDTH >= breakpoints.tablet;
export const isDesktop = SCREEN_WIDTH >= breakpoints.desktop;

// Responsive font scaling
const scale = SCREEN_WIDTH / 375; // Base width is iPhone X/11/12/13/14
const verticalScale = SCREEN_HEIGHT / 812; // Base height is iPhone X/11/12/13/14

export const normalize = (size: number): number => {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const normalizeVertical = (size: number): number => {
  const newSize = size * verticalScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive values for different components
export const responsiveValues = {
  // Tab Bar
  tabBar: {
    height: isSmallScreen ? 55 : isTablet ? 80 : 65,
    iconSize: isSmallScreen ? 20 : isTablet ? 28 : 24,
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    paddingVertical: isSmallScreen ? 6 : isTablet ? 12 : 8,
    paddingHorizontal: isSmallScreen ? 4 : isTablet ? 8 : 6,
    badgeSize: isSmallScreen ? 16 : isTablet ? 24 : 18,
    badgeFontSize: isSmallScreen ? 8 : isTablet ? 12 : 10,
  },
  
  // Typography
  typography: {
    h1: normalize(isTablet ? 32 : 28),
    h2: normalize(isTablet ? 28 : 24),
    h3: normalize(isTablet ? 24 : 20),
    h4: normalize(isTablet ? 20 : 18),
    h5: normalize(isTablet ? 18 : 16),
    h6: normalize(isTablet ? 16 : 14),
    body: normalize(isTablet ? 16 : 14),
    caption: normalize(isTablet ? 14 : 12),
    small: normalize(isTablet ? 12 : 10),
  },
  
  // Spacing
  spacing: {
    xs: normalize(4),
    sm: normalize(8),
    md: normalize(16),
    lg: normalize(24),
    xl: normalize(32),
    xxl: normalize(48),
  },
  
  // Border radius
  borderRadius: {
    sm: normalize(4),
    md: normalize(8),
    lg: normalize(12),
    xl: normalize(16),
    xxl: normalize(24),
  },
  
  // Button sizes
  button: {
    small: {
      height: normalize(32),
      paddingHorizontal: normalize(12),
      fontSize: normalize(12),
    },
    medium: {
      height: normalize(40),
      paddingHorizontal: normalize(16),
      fontSize: normalize(14),
    },
    large: {
      height: normalize(48),
      paddingHorizontal: normalize(20),
      fontSize: normalize(16),
    },
    xlarge: {
      height: normalize(56),
      paddingHorizontal: normalize(24),
      fontSize: normalize(18),
    },
  },
  
  // Card dimensions
  card: {
    padding: normalize(isTablet ? 24 : 16),
    margin: normalize(isTablet ? 16 : 12),
    borderRadius: normalize(isTablet ? 16 : 12),
  },
  
  // Input fields
  input: {
    height: normalize(isTablet ? 56 : 48),
    fontSize: normalize(isTablet ? 16 : 14),
    paddingHorizontal: normalize(isTablet ? 20 : 16),
    borderRadius: normalize(isTablet ? 12 : 8),
  },
  
  // Modal dimensions
  modal: {
    padding: normalize(isTablet ? 32 : 24),
    borderRadius: normalize(isTablet ? 20 : 16),
    margin: normalize(isTablet ? 40 : 20),
  },
  
  // Grid columns based on screen size
  grid: {
    columns: isTablet ? 3 : isLargeScreen ? 2 : 1,
    gap: normalize(isTablet ? 20 : 16),
  },
  
  // Image dimensions
  image: {
    avatar: {
      small: normalize(32),
      medium: normalize(48),
      large: normalize(64),
      xlarge: normalize(80),
    },
    thumbnail: {
      width: normalize(isTablet ? 120 : 80),
      height: normalize(isTablet ? 120 : 80),
    },
    cover: {
      height: normalize(isTablet ? 200 : 150),
    },
  },
  
  // Icon sizes
  icon: {
    small: normalize(16),
    medium: normalize(20),
    large: normalize(24),
    xlarge: normalize(32),
    xxlarge: normalize(48),
  },
};

// Responsive width percentage
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Responsive height percentage
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Get responsive font size
export const getFontSize = (size: keyof typeof responsiveValues.typography): number => {
  return responsiveValues.typography[size];
};

// Get responsive spacing
export const getSpacing = (size: keyof typeof responsiveValues.spacing): number => {
  return responsiveValues.spacing[size];
};

// Get responsive icon size
export const getIconSize = (size: keyof typeof responsiveValues.icon): number => {
  return responsiveValues.icon[size];
};

// Get responsive button size
export const getButtonSize = (size: keyof typeof responsiveValues.button) => {
  return responsiveValues.button[size];
};

// Check if device is in landscape mode
export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

// Get safe area dimensions
export const getSafeAreaDimensions = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
    isDesktop,
    isLandscape: isLandscape(),
  };
};

// Responsive shadow styles
export const getShadowStyle = (elevation: number = 2) => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.1,
      shadowRadius: elevation * 2,
    };
  } else {
    return {
      elevation: elevation,
    };
  }
};

// Responsive container styles
export const getContainerStyle = () => {
  return {
    flex: 1,
    paddingHorizontal: responsiveValues.spacing.md,
    paddingVertical: responsiveValues.spacing.sm,
  };
};

// Responsive card styles
export const getCardStyle = () => {
  return {
    backgroundColor: '#fff',
    borderRadius: responsiveValues.borderRadius.lg,
    padding: responsiveValues.card.padding,
    margin: responsiveValues.card.margin,
    ...getShadowStyle(2),
  };
};

// Responsive text styles
export const getTextStyle = (variant: keyof typeof responsiveValues.typography) => {
  return {
    fontSize: responsiveValues.typography[variant],
    lineHeight: responsiveValues.typography[variant] * 1.4,
  };
};

export default {
  breakpoints,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  isTablet,
  isDesktop,
  normalize,
  normalizeVertical,
  responsiveValues,
  wp,
  hp,
  getFontSize,
  getSpacing,
  getIconSize,
  getButtonSize,
  isLandscape,
  getSafeAreaDimensions,
  getShadowStyle,
  getContainerStyle,
  getCardStyle,
  getTextStyle,
};
