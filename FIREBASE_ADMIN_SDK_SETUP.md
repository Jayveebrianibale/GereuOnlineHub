# FCM Push Notifications - Complete Setup Guide

## 🎯 What Was Fixed

Your push notifications weren't working because:

1. **Firebase Admin SDK is server-side only** - can't run in React Native/Expo
2. **Missing FCM REST API implementation** - now implemented
3. **No direct FCM token handling** - now supports FCM tokens
4. **No hybrid approach** - now supports both FCM and Expo fallback

## 📁 New Files Created

### 1. `app/services/notificationService.ts` (Updated)
- Direct FCM REST API implementation
- FCM token management
- Hybrid approach (FCM + Expo fallback)
- Proper error handling and logging

### 2. `app/components/FCMNotificationTester.tsx`
- Test component for FCM notifications
- Hybrid notification testing
- Real-time logging and debugging

## 🔧 Key Changes

### 1. **Removed Firebase Admin SDK**
- Firebase Admin SDK is for server-side only
- Now using FCM REST API directly from client

### 2. **Updated Notification Service**
- Direct FCM API calls using REST endpoints
- FCM token support alongside Expo tokens
- Hybrid approach for maximum reliability

## 🚀 How to Use FCM Notifications

### Method 1: Direct FCM (Recommended)
```typescript
import { sendFCMNotificationDirect, sendFCMNotificationMulticast } from '../services/notificationService';

// Send to specific FCM token
await sendFCMNotificationDirect(
  fcmToken,
  'Title',
  'Message body',
  { customData: 'value' }
);

// Send to multiple FCM tokens
await sendFCMNotificationMulticast(
  [token1, token2],
  'Title',
  'Message body',
  { customData: 'value' }
);
```

### Method 2: Hybrid Approach (FCM + Expo Fallback)
```typescript
import { notifyUser, notifyAdmins } from '../services/notificationService';

// This will try FCM first, then fallback to Expo
await notifyUser(userId, 'Title', 'Message', { type: 'user' });
await notifyAdmins('Title', 'Message', { type: 'admin' });
```

## 🧪 Testing Your Setup

### 1. Add the Test Component
Add this to your admin dashboard or create a test screen:

```typescript
import FCMNotificationTester from '../components/FCMNotificationTester';

// In your component
<FCMNotificationTester />
```

### 2. Test Steps
1. **Run the app** and navigate to the test component
2. **Check FCM Configuration** - See if FCM tokens are available
3. **Test Direct FCM** - Replace test tokens with real FCM tokens
4. **Test FCM to Admins** - Should work if admins have FCM tokens
5. **Test Hybrid Notifications** - Tests both FCM and Expo fallback

## 🔑 Required Setup Steps

### 1. Configure FCM Server Key
Run this command to add your FCM server key:
```bash
node configure-fcm.js --key YOUR_FCM_SERVER_KEY
```

### 2. FCM Tokens Must Be Registered
Make sure your users have FCM tokens stored in the database:
```typescript
// In your FCMRegistrar component
const fcmToken = await getToken(messaging);
await saveFcmToken(userId, fcmToken);
```

### 3. Database Structure
Ensure your users have both token types:
```json
{
  "users": {
    "userId": {
      "expoPushToken": "ExpoPushToken[...]",
      "fcmToken": "fcm-token-string",
      "role": "admin" // or "user"
    }
  }
}
```

## 🐛 Troubleshooting

### Issue 1: "FCM server key not configured"
**Solution**: Run `node configure-fcm.js --key YOUR_SERVER_KEY`

### Issue 2: "No FCM tokens found"
**Solution**: 
1. Ensure FCM tokens are being registered in `FCMRegistrar`
2. Check that tokens are saved to the database
3. Verify users have valid FCM tokens

### Issue 3: "FCM API error"
**Solution**:
1. Check FCM server key is correct
2. Verify FCM tokens are valid
3. Check Firebase project configuration

### Issue 4: "Invalid FCM token"
**Solution**:
1. FCM tokens expire - users need to re-register
2. Check token format and validity
3. Ensure tokens are not corrupted

## 📊 Monitoring and Debugging

### Console Logs
The implementation provides detailed logging:
- ✅ Success messages
- ⚠️ Warning messages  
- ❌ Error messages
- 📱 Notification sending status

### Test Component Logs
The test component shows real-time logs of all operations.

## 🔄 Migration Strategy

### Phase 1: Test FCM
1. Use the test component to verify FCM works
2. Check console logs for any errors
3. Ensure FCM tokens are being registered

### Phase 2: Update Existing Code
Replace existing notification calls:
```typescript
// Old way (Expo only)
await sendExpoPushAsync({ to: token, title, body });

// New way (FCM + Expo fallback)
await notifyUser(userId, title, body, data);
```

### Phase 3: Monitor and Optimize
1. Monitor success rates
2. Check which method (FCM vs Expo) works better
3. Optimize based on your specific use case

## 🎉 Benefits of This Setup

1. **Reliability**: FCM + Expo fallback ensures notifications are delivered
2. **Performance**: FCM is faster and more reliable than Expo Push
3. **Client-side**: No server required - works directly from your app
4. **Debugging**: Comprehensive logging and testing tools
5. **Flexibility**: Can use either method or both

## 📝 Next Steps

1. **Configure FCM server key** using the configure script
2. **Test the setup** using the test component
3. **Update your existing notification calls** to use the hybrid approach
4. **Monitor the logs** to ensure everything works correctly
5. **Remove the test component** once you're confident it works

Your push notifications should now work reliably with FCM! 🚀
