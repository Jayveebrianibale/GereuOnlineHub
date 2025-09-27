// Firebase Admin SDK Server Implementation
// This should run on your server (Node.js/Express) not in React Native

const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin SDK with your service account
const serviceAccount = require('./gereuonlinehub-firebase-adminsdk-fbsvc-9ad1f6a162.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://gereuonlinehub-default-rtdb.firebaseio.com',
});

const app = express();
app.use(cors());
app.use(express.json());

// Send notification using Firebase Admin SDK
app.post('/api/send-notification', async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;
    
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'No tokens provided' });
    }
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: tokens,
      android: {
        notification: {
          channelId: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    console.log('📱 Sending FCM notification via Admin SDK:', {
      tokenCount: tokens.length,
      title,
      body,
      data
    });

    const response = await admin.messaging().sendMulticast(message);
    
    console.log('✅ FCM notification sent successfully:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // Log individual results
    response.responses.forEach((resp, index) => {
      if (resp.success) {
        console.log(`✅ Token ${index}: ${resp.messageId}`);
      } else {
        console.error(`❌ Token ${index}: ${resp.error?.message}`);
      }
    });

    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      messageId: response.multicastId,
    });

  } catch (error) {
    console.error('❌ Failed to send FCM notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send notification to all admins
app.post('/api/notify-admins', async (req, res) => {
  try {
    const { title, body, data } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Get admin FCM tokens from database
    const db = admin.database();
    const usersSnapshot = await db.ref('users').once('value');
    const users = usersSnapshot.val() || {};
    
    const adminTokens = Object.values(users)
      .filter((u) => {
        const isAdmin = u.role === 'admin';
        const hasFcmToken = typeof u.fcmToken === 'string' && u.fcmToken.length > 0;
        return isAdmin && hasFcmToken;
      })
      .map((u) => u.fcmToken);

    if (adminTokens.length === 0) {
      return res.status(400).json({ error: 'No admin FCM tokens found' });
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: { ...data, type: 'admin' },
      tokens: adminTokens,
      android: {
        notification: {
          channelId: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    console.log(`📱 Sending admin notification to ${adminTokens.length} admins`);

    const response = await admin.messaging().sendMulticast(message);
    
    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      messageId: response.multicastId,
      adminCount: adminTokens.length,
    });

  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send notification to specific user
app.post('/api/notify-user', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body are required' });
    }

    // Get user FCM token from database
    const db = admin.database();
    const userSnapshot = await db.ref(`users/${userId}/fcmToken`).once('value');
    const fcmToken = userSnapshot.val();

    if (!fcmToken) {
      return res.status(400).json({ error: 'User FCM token not found' });
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: { ...data, type: 'user' },
      token: fcmToken,
      android: {
        notification: {
          channelId: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    console.log(`📱 Sending user notification to ${userId}`);

    const response = await admin.messaging().send(message);
    
    res.json({
      success: true,
      messageId: response,
      userId,
    });

  } catch (error) {
    console.error('❌ Failed to send user notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Firebase Admin SDK server running on port ${PORT}`);
  console.log('📱 Endpoints available:');
  console.log('  POST /api/send-notification - Send to multiple tokens');
  console.log('  POST /api/notify-admins - Send to all admins');
  console.log('  POST /api/notify-user - Send to specific user');
});

module.exports = app;
