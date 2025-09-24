#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 FCM Server Key Configuration Helper');
console.log('=====================================');
console.log('');

// Read current app.json
const appJsonPath = path.join(__dirname, 'app.json');
let appConfig;

try {
  const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
  appConfig = JSON.parse(appJsonContent);
} catch (error) {
  console.error('❌ Error reading app.json:', error.message);
  process.exit(1);
}

// Check if FCM server key is already configured
if (appConfig.expo.extra && appConfig.expo.extra.fcmServerKey) {
  console.log('✅ FCM server key is already configured!');
  console.log('Current key:', appConfig.expo.extra.fcmServerKey.substring(0, 20) + '...');
  console.log('');
  console.log('To update it, run: node configure-fcm.js --key YOUR_NEW_KEY');
  process.exit(0);
}

// Get FCM server key from command line or prompt
const args = process.argv.slice(2);
let fcmServerKey = null;

if (args.includes('--key') && args.length > 1) {
  const keyIndex = args.indexOf('--key');
  fcmServerKey = args[keyIndex + 1];
}

if (!fcmServerKey) {
  console.log('📋 To configure FCM server key:');
  console.log('');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project: gereuonlinehub');
  console.log('3. Go to Project Settings → Cloud Messaging');
  console.log('4. Copy the Server key (starts with "AAAA...")');
  console.log('');
  console.log('Then run: node configure-fcm.js --key YOUR_SERVER_KEY');
  console.log('');
  console.log('Example: node configure-fcm.js --key AAAA...');
  process.exit(0);
}

// Validate FCM server key format
if (!fcmServerKey.startsWith('AAAA')) {
  console.error('❌ Invalid FCM server key format. Should start with "AAAA"');
  process.exit(1);
}

// Add FCM server key to app.json
if (!appConfig.expo.extra) {
  appConfig.expo.extra = {};
}

appConfig.expo.extra.fcmServerKey = fcmServerKey;

// Write updated app.json
try {
  fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2));
  console.log('✅ FCM server key added to app.json successfully!');
  console.log('Key:', fcmServerKey.substring(0, 20) + '...');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Restart your Expo development server');
  console.log('2. Test push notifications again');
  console.log('3. The FCM warning should be gone!');
} catch (error) {
  console.error('❌ Error writing app.json:', error.message);
  process.exit(1);
}
