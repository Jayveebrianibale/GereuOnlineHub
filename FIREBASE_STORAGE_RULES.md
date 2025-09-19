# Firebase Storage Rules Configuration

## Current Issue
The "storage/unknown" error typically indicates Firebase Storage permission issues. Here are the recommended Firebase Storage rules for your project.

## Recommended Storage Rules

### For Development (Permissive)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### For Production (More Secure)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload images to specific folders
    match /apartments/{imageId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
                     request.resource.size < 10 * 1024 * 1024 && // 10MB limit
                     request.resource.contentType.matches('image/.*');
    }
    
    match /auto-services/{imageId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
                     request.resource.size < 10 * 1024 * 1024 && // 10MB limit
                     request.resource.contentType.matches('image/.*');
    }
    
    match /laundry-services/{imageId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
                     request.resource.size < 10 * 1024 * 1024 && // 10MB limit
                     request.resource.contentType.matches('image/.*');
    }
    
    // Test folder for debugging
    match /test/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## How to Update Firebase Storage Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `gereuonlinehub`
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with one of the configurations above
6. Click **Publish**

## Testing Storage Rules

You can test your Firebase Storage configuration using the test functions in `app/services/firebaseStorageTest.ts`:

```typescript
import { testFirebaseStorage, testImageUpload } from './services/firebaseStorageTest';

// Test basic connectivity
const result = await testFirebaseStorage();
console.log('Storage test result:', result);

// Test image upload
const imageResult = await testImageUpload('file://path/to/image.jpg');
console.log('Image upload test result:', imageResult);
```

## Common Issues and Solutions

### 1. "storage/unknown" Error
- **Cause**: Usually indicates permission issues or configuration problems
- **Solution**: Update Firebase Storage rules and ensure user is authenticated

### 2. "storage/bucket-not-found" Error
- **Cause**: Incorrect storage bucket configuration
- **Solution**: Verify storage bucket name matches `google-services.json`

### 3. "storage/object-not-found" Error
- **Cause**: Trying to access non-existent storage object
- **Solution**: Check file path and ensure file exists

### 4. Authentication Issues
- **Cause**: User not authenticated when trying to upload
- **Solution**: Ensure user is signed in before attempting upload

## Configuration Verification

Your current configuration should be:
- **Storage Bucket**: `gereuonlinehub.firebasestorage.app`
- **API Key**: `AIzaSyCaD98fD30lBNQ37UlbHPcy12sx0IYnOy8`
- **Project ID**: `gereuonlinehub`

## Next Steps

1. Update Firebase Storage rules using one of the configurations above
2. Test the upload functionality
3. If issues persist, check Firebase Console for detailed error logs
4. Consider implementing retry logic for network-related errors
