# Session Management Implementation

## Overview
This implementation provides comprehensive session management for the GereuOnlineHub app, including:
- **Automatic logout after 15 minutes of inactivity**
- **App state persistence for quick restoration**
- **User activity tracking**
- **Route state saving and restoration**

## Features

### 1. Session Timeout Management
- **15-minute timeout**: Users are automatically logged out after 15 minutes of inactivity
- **Activity tracking**: Monitors user interactions (clicks, scrolls, touches, etc.)
- **Automatic cleanup**: Clears session data and navigates to login screen on timeout

### 2. App State Persistence
- **Quick restoration**: If user closes and reopens app within 30 seconds, they return to the same page
- **Route tracking**: Automatically saves current route when navigating
- **State validation**: Only restores state if it's recent and valid

### 3. Background/Foreground Handling
- **Background detection**: Saves app state when app goes to background
- **Foreground restoration**: Attempts to restore state when app comes to foreground
- **Smart routing**: Falls back to appropriate dashboard if restoration fails

## Implementation Details

### Core Components

#### 1. `useSessionManager` Hook (`app/hooks/useSessionManager.ts`)
- Main session management logic
- Handles timeout timers and activity tracking
- Manages app state persistence using AsyncStorage
- Provides session state and management functions

#### 2. `SessionContext` (`app/contexts/SessionContext.tsx`)
- React Context for global session state
- Provides session functions to all components
- Wraps the session manager hook

#### 3. `ActivityWrapper` Component (`app/components/ActivityWrapper.tsx`)
- Higher-order component that wraps screens for activity tracking
- Uses TouchableWithoutFeedback to capture user interactions
- Updates session activity on touch events

#### 4. `ActivityTracker` Component (`app/components/ActivityTracker.tsx`)
- Handles app state changes for activity tracking
- Updates session activity when app becomes active
- Lightweight component for background activity monitoring

#### 5. `RouteTracker` Component (`app/components/RouteTracker.tsx`)
- Tracks current route changes
- Saves route state for restoration
- Updates activity on navigation changes
- Integrates with navigation system

#### 6. Updated `AuthGuard` (`app/components/AuthGuard.tsx`)
- Enhanced with app state restoration
- Attempts to restore previous route on login
- Falls back to appropriate dashboard if no saved state

### Integration Points

#### 1. Main App Layout (`app/_layout.tsx`)
- Added `SessionProvider` to provider hierarchy
- Integrated `ActivityWrapper` for user interaction tracking
- Integrated `RouteTracker` for route monitoring
- Positioned after `AuthProvider` for proper dependency order

#### 2. Authentication Flow
- Session starts automatically on successful login
- Session ends on logout or timeout
- App state is cleared on session end

## Configuration

### Timeout Settings
```typescript
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const QUICK_RESTORE_THRESHOLD = 30 * 1000; // 30 seconds
```

### Storage Keys
```typescript
const SESSION_STORAGE_KEY = 'user_session';
const APP_STATE_STORAGE_KEY = 'app_state';
```

## Usage

### Basic Usage
The session management is automatically active once integrated. No additional setup is required.

### Manual Session Control
```typescript
import { useSession } from '../contexts/SessionContext';

const MyComponent = () => {
  const { updateActivity, endSession, sessionState } = useSession();
  
  // Manually update activity
  const handleUserAction = () => {
    updateActivity();
  };
  
  // Manually end session
  const handleLogout = async () => {
    await endSession();
  };
  
  return (
    // Your component JSX
  );
};
```

### Session Status Monitoring
```typescript
import { useSession } from '../contexts/SessionContext';

const MyComponent = () => {
  const { sessionState } = useSession();
  
  console.log('Session active:', sessionState.isActive);
  console.log('Last activity:', new Date(sessionState.lastActivity));
  console.log('Session start:', new Date(sessionState.sessionStartTime));
};
```

## Testing

### Test Session Timeout
1. Login to the app
2. Wait 15 minutes without any interaction
3. User should be automatically logged out

### Test App State Restoration
1. Login to the app
2. Navigate to any page
3. Close the app (don't logout)
4. Reopen the app within 30 seconds
5. Should return to the same page

### Test Background/Foreground
1. Login and navigate to any page
2. Put app in background (home button)
3. Bring app back to foreground
4. Should return to the same page

## Debugging

### Console Logs
The implementation includes comprehensive logging:
- Session state changes
- App state saves and restores
- Activity updates
- Timeout events

### Session Status Component
For development/testing, you can add the `SessionStatus` component to see real-time session information:

```typescript
import { SessionStatus } from '../components/SessionStatus';

// Add to your component
<SessionStatus />
```

## Security Considerations

1. **Session Data**: Stored locally using AsyncStorage (encrypted on device)
2. **Timeout Enforcement**: Server-side validation recommended for production
3. **State Validation**: Only restores recent and valid app states
4. **Cleanup**: All session data is cleared on logout or timeout

## Performance Considerations

1. **Minimal Overhead**: Activity tracking uses efficient event listeners
2. **Async Operations**: All storage operations are asynchronous
3. **Memory Management**: Timers are properly cleaned up
4. **State Optimization**: Only essential data is persisted

## Troubleshooting

### Common Issues

1. **Session not timing out**: Check if activity tracking is working
2. **State not restoring**: Verify AsyncStorage permissions
3. **Navigation issues**: Ensure proper route format in saved state
4. **Memory leaks**: Check timer cleanup in useEffect

### Debug Steps

1. Check console logs for session events
2. Verify AsyncStorage is working
3. Test with shorter timeout values
4. Monitor app state changes

## Future Enhancements

1. **Server-side session validation**
2. **Configurable timeout per user role**
3. **Session analytics and reporting**
4. **Biometric authentication integration**
5. **Multi-device session management**
