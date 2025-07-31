# How to Run the Gereu Smart Services App

## Quick Start

### 1. Start the Development Server
```bash
npm start
```

### 2. Open the App
- **On iOS**: Press `i` in the terminal or scan the QR code with your iPhone camera
- **On Android**: Press `a` in the terminal or scan the QR code with the Expo Go app
- **On Web**: Press `w` in the terminal to open in your browser

## What You'll See

When you start the app, it will automatically:

1. **Show the Onboarding Screens** (3 screens):
   - **Screen 1**: Welcome to Gereu Smart Services
   - **Screen 2**: Everything in One Place  
   - **Screen 3**: Stay Informed, Stay Connected

2. **Navigation Options**:
   - Swipe left/right to navigate between screens
   - Tap "Next" to go to the next screen
   - Tap "Skip" to go directly to sign in
   - Tap "Get Started" on the last screen

3. **After Onboarding**:
   - You'll be taken to the Sign In screen
   - You can sign in or navigate to Sign Up
   - After authentication, you'll see the main app

## Testing Different Routes

You can manually navigate to different screens by changing the URL:

- `/` - Redirects to onboarding
- `/onboarding` - Onboarding screens
- `/signin` - Sign in screen
- `/signup` - Sign up screen
- `/(tabs)` - Main app (after authentication)

## Troubleshooting

### If the app doesn't start:
1. Make sure all dependencies are installed: `npm install`
2. Clear the cache: `npx expo start --clear`
3. Restart the development server

### If you see errors:
1. Check the terminal for error messages
2. Make sure you have the latest version of Expo Go app
3. Try running on a different platform (iOS/Android/Web)

## Development Tips

- **Hot Reload**: Changes to your code will automatically reload in the app
- **Developer Tools**: Shake your device or press `Cmd+D` (iOS) / `Cmd+M` (Android) for developer menu
- **Console Logs**: Check the terminal for any console.log outputs
- **Network Tab**: Use the developer tools to monitor network requests

## File Structure

```
app/
├── index.tsx              # Root route (redirects to onboarding)
├── onboarding.tsx         # Onboarding route
├── signin.tsx             # Sign in route
├── signup.tsx             # Sign up route
├── _layout.tsx            # Navigation layout
└── screens/
    ├── Onboarding/
    │   └── OnboardingScreen.tsx
    └── Auth/
        ├── SigninScreen.tsx
        └── SignupScreen.tsx
```

The app is now ready to run! 🚀 