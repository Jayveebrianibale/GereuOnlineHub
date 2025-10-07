#!/usr/bin/env node

/**
 * Firebase Database Rules Deployment Script
 * 
 * This script helps deploy Firebase Realtime Database rules
 * to fix the "Index not defined" error for the logs collection.
 * 
 * Usage:
 * 1. Make sure you have Firebase CLI installed: npm install -g firebase-tools
 * 2. Login to Firebase: firebase login
 * 3. Set your project: firebase use your-project-id
 * 4. Run this script: node deploy-firebase-rules.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Deploying Firebase Database Rules...\n');

try {
  // Check if firebase CLI is installed
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI found');
} catch (error) {
  console.error('❌ Firebase CLI not found. Please install it first:');
  console.error('   npm install -g firebase-tools');
  process.exit(1);
}

try {
  // Check if firebase-database-rules.json exists
  const rulesPath = path.join(__dirname, 'firebase-database-rules.json');
  if (!fs.existsSync(rulesPath)) {
    console.error('❌ firebase-database-rules.json not found');
    process.exit(1);
  }
  console.log('✅ Rules file found');

  // Deploy the rules
  console.log('🚀 Deploying rules to Firebase...');
  execSync('firebase deploy --only database', { stdio: 'inherit' });
  
  console.log('\n✅ Firebase Database Rules deployed successfully!');
  console.log('🎉 The logs should now work without the "Index not defined" error.');
  
} catch (error) {
  console.error('❌ Error deploying rules:', error.message);
  console.log('\n📝 Manual steps:');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com');
  console.log('2. Select your project');
  console.log('3. Go to Realtime Database > Rules');
  console.log('4. Replace the rules with the content from firebase-database-rules.json');
  console.log('5. Click "Publish"');
}
