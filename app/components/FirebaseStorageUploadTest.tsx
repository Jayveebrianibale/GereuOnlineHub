import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { uploadImageToFirebaseReal, uploadImageToFirebaseSmart } from '../services/firebaseStorageReal';
import { uploadImageToFirebaseWithRetry } from '../services/imageUploadService';

/**
 * Firebase Storage Upload Test
 * This will test if images are actually uploaded to Firebase Storage
 */
export const FirebaseStorageUploadTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testRealFirebaseUpload = async () => {
    setIsLoading(true);
    setResult('Testing REAL Firebase Storage upload...\n');
    
    try {
      // Use the same image URI from your error
      const testImageUri = 'file:///data/user/0/host.exp.exponent/cache/ImageManipulator/a39336a6-ae88-4534-b4a6-3867c447fa65.jpg';
      
      setResult(prev => prev + '🔥 Testing REAL Firebase Storage upload...\n');
      
      // Test the real Firebase Storage upload
      const uploadResult = await uploadImageToFirebaseReal(testImageUri, 'apartments');
      
      setResult(prev => prev + `✅ REAL FIREBASE UPLOAD SUCCESS!\n`);
      setResult(prev => prev + `Firebase URL: ${uploadResult.url}\n`);
      setResult(prev => prev + `Firebase Path: ${uploadResult.path}\n`);
      
      Alert.alert('Success!', 'Image uploaded to Firebase Storage!');
      
    } catch (error) {
      setResult(prev => prev + `❌ REAL FIREBASE UPLOAD FAILED: ${error}\n`);
      Alert.alert('Error', `Firebase upload failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testSmartUpload = async () => {
    setIsLoading(true);
    setResult('Testing SMART upload (Firebase + fallback)...\n');
    
    try {
      // Use the same image URI from your error
      const testImageUri = 'file:///data/user/0/host.exp.exponent/cache/ImageManipulator/a39336a6-ae88-4534-b4a6-3867c447fa65.jpg';
      
      setResult(prev => prev + '🧠 Testing SMART upload...\n');
      
      // Test the smart upload method
      const uploadResult = await uploadImageToFirebaseSmart(testImageUri, 'apartments');
      
      setResult(prev => prev + `✅ SMART UPLOAD SUCCESS!\n`);
      setResult(prev => prev + `URL: ${uploadResult.url}\n`);
      setResult(prev => prev + `Path: ${uploadResult.path}\n`);
      
      if (uploadResult.url.includes('firebasestorage')) {
        Alert.alert('Success!', 'Image uploaded to Firebase Storage!');
      } else {
        Alert.alert('Fallback', 'Firebase failed, using local storage');
      }
      
    } catch (error) {
      setResult(prev => prev + `❌ SMART UPLOAD FAILED: ${error}\n`);
      Alert.alert('Error', `Smart upload failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testServiceUpload = async () => {
    setIsLoading(true);
    setResult('Testing service upload (used by apartment/auto/laundry)...\n');
    
    try {
      // Use the same image URI from your error
      const testImageUri = 'file:///data/user/0/host.exp.exponent/cache/ImageManipulator/a39336a6-ae88-4534-b4a6-3867c447fa65.jpg';
      
      setResult(prev => prev + '🚀 Testing service upload method...\n');
      
      // Test the service method (used by apartmentService, autoService, etc.)
      const uploadResult = await uploadImageToFirebaseWithRetry(testImageUri, 'apartments');
      
      setResult(prev => prev + `✅ SERVICE UPLOAD SUCCESS!\n`);
      setResult(prev => prev + `URL: ${uploadResult.url}\n`);
      setResult(prev => prev + `Path: ${uploadResult.path}\n`);
      
      if (uploadResult.url.includes('firebasestorage')) {
        Alert.alert('Success!', 'Service upload to Firebase Storage worked!');
      } else {
        Alert.alert('Fallback', 'Firebase failed, using local storage');
      }
      
    } catch (error) {
      setResult(prev => prev + `❌ SERVICE ERROR: ${error}\n`);
      Alert.alert('Error', `Service upload failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const clearResult = () => {
    setResult('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Storage Upload Test</Text>
      <Text style={styles.subtitle}>Test if images are uploaded to Firebase Storage</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testRealFirebaseUpload}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Real Firebase Upload</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testSmartUpload}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Smart Upload</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testServiceUpload}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Service Upload</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.clearButton} 
        onPress={clearResult}
      >
        <Text style={styles.clearButtonText}>Clear Results</Text>
      </TouchableOpacity>
      
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Results:</Text>
        <Text style={styles.resultText}>{result || 'No tests run yet'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
