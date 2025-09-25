# FCM Server Key Setup for Expo Push Notifications

## The Problem
You're getting this error:
```
Unable to retrieve the FCM server key for the recipient's app. Make sure you have provided a server key as directed by the Expo FCM documentation.
```

## The Solution
You need to add your FCM server key to your Expo project configuration.

## Step 1: Get Your FCM Server Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **gereuonlinehub**
3. Click the gear icon → **Project Settings**
4. Go to the **Cloud Messaging** tab
5. Copy the **Server key** (starts with "AAAA...")

## Step 2: Add Server Key to Expo

### Option A: Using Expo CLI (Recommended)
```bash
npx expo credentials:manager
```
- Select your project
- Choose "Android"
- Add your FCM server key

### Option B: Using EAS CLI
```bash
eas credentials
```
- Select your project
- Choose "Android"
- Add your FCM server key

### Option C: Add to app.json
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## Step 3: Test Push Notifications

1. Open your app
2. Go to Admin Dashboard
3. Tap the bug report icon (🔍)
4. Try the notification tests

## Alternative: Test on iOS
If you can't get the FCM server key working immediately, you can test on iOS simulator or device, which doesn't require FCM server key.

## What Each Test Does

- **Test Local Notification**: Tests device notification capability (no network required)
- **Test Expo Push Notification**: Tests Expo's push service (may show FCM warning but should still work)
- **Test User Notification**: Tests your `notifyUser` function
- **Test Admin Notification**: Tests your `notifyAdmins` function

## Expected Results

- ✅ **Local notifications**: Should work immediately
- ⚠️ **Push notifications**: May show FCM warning but should still work
- ✅ **User/Admin notifications**: Should work if tokens are valid

The FCM warning doesn't prevent notifications from working - it just means Expo can't use the optimized FCM path.
