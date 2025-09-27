# Firebase Admin SDK Push Notifications - Complete Setup

## 🎯 Overview

You're using Firebase Admin SDK with service account JSON file (not FCM server key). This requires a server-side implementation since Firebase Admin SDK can't run in React Native.

## 🏗️ Architecture

```
React Native App → Server Endpoint → Firebase Admin SDK → FCM
```

## 📁 Files Created

### 1. `server/firebase-admin-server.js`
- Express server with Firebase Admin SDK
- Handles push notifications using your service account
- Provides REST API endpoints

### 2. `server/package.json`
- Dependencies for the server
- Includes Firebase Admin SDK, Express, CORS

### 3. Updated `app/services/notificationService.ts`
- Calls your server endpoints instead of FCM directly
- Falls back to Expo Push if server is unavailable

### 4. Updated `app/components/PushNotificationDiagnostic.tsx`
- Checks if your server is running
- Tests Firebase Admin SDK functionality

## 🚀 Setup Instructions

### Step 1: Setup Server Dependencies
```bash
cd server
npm install
```

### Step 2: Copy Service Account File
```bash
# Copy your service account JSON file to the server directory
cp ../gereuonlinehub-firebase-adminsdk-fbsvc-9ad1f6a162.json ./server/
```

### Step 3: Start the Server
```bash
cd server
npm start
```

You should see:
```
🚀 Firebase Admin SDK server running on port 3001
📱 Endpoints available:
  POST /api/send-notification - Send to multiple tokens
  POST /api/notify-admins - Send to all admins
  POST /api/notify-user - Send to specific user
```

### Step 4: Update Server URL
In `app/services/notificationService.ts`, update the SERVER_URL:
```typescript
const SERVER_URL = 'http://localhost:3001'; // Change to your server URL
```

For production, use your actual server URL:
```typescript
const SERVER_URL = 'https://your-server.com'; // Your production server
```

### Step 5: Test Your Setup
1. Add the diagnostic component to your app
2. Run the diagnostic to check if everything is working
3. Test sending notifications

## 🔧 Server Endpoints

### Send to Multiple Tokens
```bash
POST /api/send-notification
Content-Type: application/json

{
  "tokens": ["token1", "token2"],
  "title": "Notification Title",
  "body": "Notification Body",
  "data": { "key": "value" }
}
```

### Send to All Admins
```bash
POST /api/notify-admins
Content-Type: application/json

{
  "title": "Admin Notification",
  "body": "Message for all admins",
  "data": { "type": "admin" }
}
```

### Send to Specific User
```bash
POST /api/notify-user
Content-Type: application/json

{
  "userId": "user123",
  "title": "User Notification",
  "body": "Message for specific user",
  "data": { "type": "user" }
}
```

## 🧪 Testing

### Test Server Connection
```bash
curl -X POST http://localhost:3001/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"tokens":[],"title":"test","body":"test"}'
```

Expected response (400 is expected for empty tokens):
```json
{"error":"No tokens provided"}
```

### Test from React Native
Use the diagnostic component to test:
1. Server connection
2. Token registration
3. Notification sending

## 🔍 Troubleshooting

### Issue 1: Server Not Starting
**Error**: `Cannot find module 'firebase-admin'`
**Fix**: Run `npm install` in the server directory

### Issue 2: Service Account Error
**Error**: `Failed to initialize Firebase Admin SDK`
**Fix**: Ensure the JSON file is in the server directory and has correct permissions

### Issue 3: Server Not Accessible
**Error**: `Firebase Admin SDK server not accessible`
**Fix**: 
1. Check if server is running on port 3001
2. Update SERVER_URL in notificationService.ts
3. Check firewall/network settings

### Issue 4: No FCM Tokens
**Error**: `No admin FCM tokens found`
**Fix**: Ensure FCMRegistrar is working and tokens are being saved

## 📱 Production Deployment

### Option 1: Deploy to Cloud Service
- Deploy server to Heroku, Vercel, or AWS
- Update SERVER_URL to your production URL
- Use environment variables for sensitive data

### Option 2: Self-Hosted Server
- Run server on your own infrastructure
- Use PM2 for process management
- Set up reverse proxy with nginx

### Option 3: Serverless Functions
- Convert to AWS Lambda or Google Cloud Functions
- Use Firebase Functions for serverless deployment

## 🎉 Benefits of This Setup

1. **✅ Uses Firebase Admin SDK** - Full Firebase Admin SDK functionality
2. **✅ Reliable** - Server-side implementation is more stable
3. **✅ Scalable** - Can handle high-volume notifications
4. **✅ Secure** - Service account credentials stay on server
5. **✅ Fallback** - Falls back to Expo Push if server is down

## 📝 Next Steps

1. **Start the server** and test locally
2. **Deploy to production** when ready
3. **Monitor server logs** for any issues
4. **Scale as needed** based on usage

Your push notifications should now work perfectly with Firebase Admin SDK! 🚀
