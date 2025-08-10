# Firebase Authentication Implementation

This project now includes a complete Firebase authentication system with sign-up, sign-in, and role-based access control.

## Features

- ✅ User registration with email/password
- ✅ User sign-in with email/password
- ✅ Automatic role detection (admin/user)
- ✅ Protected routes based on authentication status
- ✅ Loading states and error handling
- ✅ User-friendly error messages
- ✅ Sign-out functionality
- ✅ Authentication state management

## File Structure

```
app/
├── firebaseConfig.ts          # Firebase configuration
├── utils/
│   └── authUtils.ts          # Authentication utility functions
├── hooks/
│   └── useAuth.ts            # Custom hook for auth state
├── contexts/
│   └── AuthContext.tsx       # Authentication context provider
├── components/
│   ├── ProtectedRoute.tsx    # Route protection component
│   └── SignOutButton.tsx     # Sign-out button component
└── screens/Auth/
    ├── SigninScreen.tsx      # Sign-in screen
    └── SignupScreen.tsx      # Sign-up screen
```

## Setup

### 1. Firebase Configuration

The Firebase configuration is already set up in `app/firebaseConfig.ts` with your project credentials.

### 2. Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication > Sign-in method
4. Enable Email/Password authentication

## Usage

### Basic Authentication

#### Sign Up
```typescript
import { signUp } from '../utils/authUtils';

const handleSignUp = async () => {
  try {
    const user = await signUp({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'John Doe'
    });
    console.log('User created:', user);
  } catch (error) {
    console.error('Sign up failed:', error.message);
  }
};
```

#### Sign In
```typescript
import { signIn } from '../utils/authUtils';

const handleSignIn = async () => {
  try {
    const user = await signIn({
      email: 'user@example.com',
      password: 'password123'
    });
    console.log('User signed in:', user);
  } catch (error) {
    console.error('Sign in failed:', error.message);
  }
};
```

#### Sign Out
```typescript
import { signOutUser } from '../utils/authUtils';

const handleSignOut = async () => {
  try {
    await signOutUser();
    console.log('User signed out');
  } catch (error) {
    console.error('Sign out failed:', error.message);
  }
};
```

### Authentication State Management

#### Using the useAuth Hook
```typescript
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { user, role, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <SignInPrompt />;
  }

  return (
    <View>
      <Text>Welcome, {user?.displayName}!</Text>
      <Text>Role: {role}</Text>
    </View>
  );
};
```

#### Using the AuthContext
```typescript
import { useAuthContext } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, signOut } = useAuthContext();

  return (
    <View>
      <Text>Hello, {user?.displayName}!</Text>
      <SignOutButton onPress={signOut} />
    </View>
  );
};
```

### Route Protection

#### Basic Protection
```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';

const AdminScreen = () => (
  <ProtectedRoute>
    <AdminDashboard />
  </ProtectedRoute>
);
```

#### Role-Based Protection
```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';

const AdminScreen = () => (
  <ProtectedRoute requiredRole="admin">
    <AdminDashboard />
  </ProtectedRoute>
);
```

#### Custom Fallback
```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';

const AdminScreen = () => (
  <ProtectedRoute 
    requiredRole="admin"
    fallback={<CustomAccessDenied />}
  >
    <AdminDashboard />
  </ProtectedRoute>
);
```

### Validation

#### Email Validation
```typescript
import { validateEmail } from '../utils/authUtils';

const emailValidation = validateEmail('user@example.com');
if (!emailValidation.isValid) {
  console.log('Email errors:', emailValidation.errors);
}
```

#### Password Validation
```typescript
import { validatePassword } from '../utils/authUtils';

const passwordValidation = validatePassword('password123');
if (!passwordValidation.isValid) {
  console.log('Password errors:', passwordValidation.errors);
}
```

## User Roles

The system automatically detects user roles based on the display name:

- **Admin**: Users with "admin" in their display name (case-insensitive)
- **User**: All other authenticated users

### Setting User Role

When creating a user account, the role is determined by the full name:

```typescript
// This user will be assigned the "admin" role
await signUp({
  email: 'admin@example.com',
  password: 'admin123',
  fullName: 'Admin User'
});

// This user will be assigned the "user" role
await signUp({
  email: 'user@example.com',
  password: 'user123',
  fullName: 'Regular User'
});
```

## Error Handling

The system provides user-friendly error messages for common authentication errors:

- `auth/user-not-found`: No account found with this email
- `auth/wrong-password`: Incorrect password
- `auth/invalid-email`: Invalid email address
- `auth/email-already-in-use`: Email already registered
- `auth/weak-password`: Password too weak
- `auth/too-many-requests`: Too many failed attempts
- `auth/network-request-failed`: Network error

## Security Features

- Password minimum length: 6 characters
- Email format validation
- Rate limiting protection
- Secure Firebase configuration
- Protected route access

## Integration with Existing Screens

The authentication system is already integrated with:

- `SigninScreen.tsx` - Firebase sign-in with error handling
- `SignupScreen.tsx` - Firebase user creation with validation
- Navigation routing based on user role
- Loading states and user feedback

## Testing

To test the authentication system:

1. **Create a new account**: Use the sign-up screen
2. **Sign in**: Use existing credentials
3. **Role testing**: Create accounts with "admin" in the name to test admin access
4. **Error handling**: Try invalid credentials to see error messages

## Troubleshooting

### Common Issues

1. **Firebase not initialized**: Check `firebaseConfig.ts` and ensure Firebase is properly configured
2. **Authentication not working**: Verify that Email/Password authentication is enabled in Firebase Console
3. **Role not detected**: Ensure the display name contains "admin" for admin role assignment

### Debug Mode

Enable console logging to debug authentication issues:

```typescript
// In firebaseConfig.ts
if (__DEV__) {
  console.log('Firebase initialized:', app);
}
```

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Social authentication (Google, Facebook)
- [ ] Multi-factor authentication
- [ ] User profile management
- [ ] Session persistence
- [ ] Offline authentication support

## Support

For issues or questions about the Firebase authentication implementation, check:

1. Firebase Console for authentication logs
2. React Native Firebase documentation
3. Project error logs and console output
