import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;

export function initializeFirebaseAdmin() {
  if (adminApp) {
    return adminApp;
  }

  try {
    // Path to your service account key file
    const serviceAccountPath = path.join(process.cwd(), 'gereuonlinehub-firebase-adminsdk-fbsvc-9ad1f6a162.json');
    
    // Initialize the admin app
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      databaseURL: 'https://gereuonlinehub-default-rtdb.firebaseio.com',
      projectId: 'gereuonlinehub'
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

export function getFirebaseAdmin() {
  if (!adminApp) {
    return initializeFirebaseAdmin();
  }
  return adminApp;
}

export function getMessaging() {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
}

// Send push notification using Firebase Admin SDK
export async function sendPushNotification(
  tokens: string | string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const messaging = getMessaging();
    
    // Convert single token to array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    
    // Filter out invalid tokens
    const validTokens = tokenArray.filter(token => 
      token && typeof token === 'string' && token.length > 0
    );

    if (validTokens.length === 0) {
      console.warn('No valid FCM tokens provided');
      return { success: false, error: 'No valid tokens' };
    }

    console.log(`Sending push notification to ${validTokens.length} tokens`);

    // Create the message
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: validTokens,
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Send the message - use sendAll for older versions or sendMulticast for newer
    let response: any;
    if ((messaging as any).sendMulticast) {
      // Newer version with sendMulticast
      response = await (messaging as any).sendMulticast(message);
      console.log(`✅ Successfully sent ${response.successCount} messages`);
      
      if (response.failureCount > 0) {
        console.warn(`⚠️ ${response.failureCount} messages failed to send`);
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            console.error(`Token ${validTokens[idx]} failed:`, resp.error);
          }
        });
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } else {
      // Older version - send individual messages
      const results: any[] = [];
      let successCount = 0;
      let failureCount = 0;
      
      for (const token of validTokens) {
        try {
          const singleMessage: admin.messaging.Message = {
            ...message,
            token: token
          } as admin.messaging.Message;
          delete (singleMessage as any).tokens; // Remove tokens array for single message
          
          const result = await messaging.send(singleMessage);
          results.push({ success: true, messageId: result });
          successCount++;
        } catch (error: any) {
          results.push({ success: false, error: error.message });
          failureCount++;
          console.error(`Token ${token} failed:`, error.message);
        }
      }
      
      console.log(`✅ Successfully sent ${successCount} messages`);
      if (failureCount > 0) {
        console.warn(`⚠️ ${failureCount} messages failed to send`);
      }

      return {
        success: true,
        successCount,
        failureCount,
        responses: results
      };
    }

  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    return { success: false, error: error.message };
  }
}

// Send to a single token
export async function sendToToken(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  return sendPushNotification([token], title, body, data);
}

// Send to multiple tokens
export async function sendToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  return sendPushNotification(tokens, title, body, data);
}

// Send to a topic
export async function sendToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const messaging = getMessaging();
    
    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic,
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log('✅ Successfully sent message to topic:', response);
    
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Failed to send message to topic:', error);
    return { success: false, error: error.message };
  }
}
