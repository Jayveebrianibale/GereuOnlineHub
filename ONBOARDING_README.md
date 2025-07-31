# Gereu Smart Services - Onboarding Screens

## Overview

This project includes a beautiful onboarding experience for the Gereu Smart Services mobile app, featuring three informative screens that introduce users to the platform's key features.

## Onboarding Screens

### Screen 1: Welcome to Gereu Smart Services
- **Title**: Welcome to Gereu Smart Services
- **Description**: Your one-stop mobile platform for apartment rentals, laundry services, and hardware assistance — all within the Gereu Building.
- **Icon**: Building icon
- **Gradient**: Blue to purple gradient

### Screen 2: Everything in One Place
- **Title**: Everything in One Place
- **Description**: Access available apartment units, laundry options, and hardware services with real-time updates and transparent pricing — all from your phone.
- **Icon**: Grid icon
- **Gradient**: Pink to red gradient

### Screen 3: Stay Informed, Stay Connected
- **Title**: Stay Informed, Stay Connected
- **Description**: Get notified when your laundry is ready, book apartments, or connect with hardware service providers. All without waiting in line.
- **Icon**: Notifications icon
- **Gradient**: Blue to cyan gradient

## Features

- **Smooth Animations**: Horizontal swipe navigation with smooth transitions
- **Progress Indicators**: Dot indicators showing current screen position
- **Skip Option**: Users can skip the onboarding process
- **Navigation Controls**: Next button and Get Started button on the final screen
- **Responsive Design**: Adapts to different screen sizes
- **Dark/Light Mode Support**: Automatically adapts to system theme
- **Beautiful Gradients**: Each screen has a unique gradient background
- **Modern UI**: Clean, modern design with proper spacing and typography

## Navigation Flow

1. **Onboarding** (`/onboarding`) → Users see the three onboarding screens
2. **Skip/Get Started** → Navigate to Sign In screen
3. **Sign In** (`/signin`) → Users can sign in or navigate to Sign Up
4. **Sign Up** (`/signup`) → Users can create account or navigate to Sign In
5. **Main App** (`/(tabs)`) → After successful authentication

## Testing the Onboarding

### To test the onboarding screens:

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Navigate to the onboarding screen**:
   - Open your app and navigate to `/onboarding`
   - Or modify the default route in `app/_layout.tsx` to start with onboarding

3. **Test the navigation**:
   - Swipe left/right to navigate between screens
   - Tap "Next" to go to the next screen
   - Tap "Skip" to go directly to sign in
   - Tap "Get Started" on the last screen to go to sign in

### Available Routes:

- `/onboarding` - Onboarding screens
- `/signin` - Sign in screen
- `/signup` - Sign up screen
- `/(tabs)` - Main app tabs

## Technical Implementation

### Dependencies Used:
- `expo-linear-gradient` - For beautiful gradient backgrounds
- `@expo/vector-icons` - For Ionicons
- `expo-router` - For navigation
- `react-native` - Core React Native components

### Key Components:
- `OnboardingScreen` - Main onboarding component with swipe navigation
- `SigninScreen` - Authentication screen with form validation
- `SignupScreen` - Registration screen with form validation

### Styling:
- Uses the app's color scheme system
- Responsive design with proper safe areas
- Modern UI with shadows and proper spacing
- Gradient backgrounds for visual appeal

## Customization

### Adding More Screens:
1. Add new screen data to the `onboardingData` array in `OnboardingScreen.tsx`
2. Each screen should have: `id`, `title`, `description`, `icon`, and `gradientColors`

### Changing Colors:
- Modify the `Colors` object in `constants/Colors.ts`
- Update gradient colors in the `onboardingData` array

### Changing Icons:
- Use any Ionicons from `@expo/vector-icons`
- Update the `icon` property in the `onboardingData` array

## File Structure

```
app/
├── onboarding.tsx              # Onboarding route
├── signin.tsx                  # Sign in route
├── signup.tsx                  # Sign up route
├── screens/
│   ├── Onboarding/
│   │   └── OnboardingScreen.tsx
│   └── Auth/
│       ├── SigninScreen.tsx
│       └── SignupScreen.tsx
└── _layout.tsx                 # Navigation layout
```

The onboarding screens are now ready to use and provide a professional introduction to the Gereu Smart Services platform! 