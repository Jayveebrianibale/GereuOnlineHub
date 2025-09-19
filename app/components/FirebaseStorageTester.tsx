import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { testFirebaseStorage, testImageUpload } from '../services/firebaseStorageTest';
import { uploadImageToFirebaseEmergency, uploadImageToFirebaseUltimate } from '../services/firebaseStorageUltimate';
import { uploadImageToFirebaseBypass } from '../services/imageUploadService';

/**
 * Firebase Storage Test Component
 * Use this to test if your Firebase Storage fix is working
 */
export const FirebaseStorageTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string>('');

  const runBasicTest = async () => {
    setIsLoading(true);
    setTestResults('Running basic Firebase Storage test...\n');
    
    try {
      const result = await testFirebaseStorage();
      
      if (result.success) {
        setTestResults(prev => prev + `✅ SUCCESS: ${result.message}\n`);
        setTestResults(prev => prev + `Storage Bucket: ${result.storageBucket}\n`);
        setTestResults(prev => prev + `User ID: ${result.userId}\n`);
        setTestResults(prev => prev + `Download URL: ${result.downloadURL}\n`);
      } else {
        setTestResults(prev => prev + `❌ FAILED: ${result.message}\n`);
        if (result.errorAnalysis) {
          setTestResults(prev => prev + `Analysis: ${result.errorAnalysis}\n`);
        }
      }
    } catch (error) {
      setTestResults(prev => prev + `❌ ERROR: ${error}\n`);
    }
    
    setIsLoading(false);
  };

  const runImageTest = async () => {
    setIsLoading(true);
    setTestResults('Running image upload test...\n');
    
    // Use a test image URI - replace with an actual image URI from your device
    const testImageUri = 'file:///data/user/0/host.exp.exponent/cache/ImageManipulator/a39336a6-ae88-4534-b4a6-3867c447fa65.jpg';
    
    try {
      const result = await testImageUpload(testImageUri);
      
      if (result.success) {
        setTestResults(prev => prev + `✅ IMAGE UPLOAD SUCCESS: ${result.message}\n`);
        setTestResults(prev => prev + `Image Size: ${result.imageSize} bytes\n`);
        setTestResults(prev => prev + `Download URL: ${result.downloadURL}\n`);
      } else {
        setTestResults(prev => prev + `❌ IMAGE UPLOAD FAILED: ${result.message}\n`);
        if (result.errorAnalysis) {
          setTestResults(prev => prev + `Analysis: ${result.errorAnalysis}\n`);
        }
      }
    } catch (error) {
      setTestResults(prev => prev + `❌ IMAGE UPLOAD ERROR: ${error}\n`);
    }
    
    setIsLoading(false);
  };

  const testActualUpload = async () => {
    setIsLoading(true);
    setTestResults('Testing actual image upload method...\n');
    
    // Use a test image URI - replace with an actual image URI from your device
    const testImageUri = 'file:///data/user/0/host.exp.exponent/cache/ImageManipulator/a39336a6-ae88-4534-b4a6-3867c447fa65.jpg';
    
    try {
      setTestResults(prev => prev + '🚀 Trying ULTIMATE upload method...\n');
      const result = await uploadImageToFirebaseUltimate(testImageUri, 'apartments');
      setTestResults(prev => prev + `✅ ULTIMATE UPLOAD SUCCESS!\n`);
      setTestResults(prev => prev + `URL: ${result.url}\n`);
      setTestResults(prev => prev + `Path: ${result.path}\n`);
    } catch (error) {
      setTestResults(prev => prev + `❌ ULTIMATE UPLOAD FAILED: ${error}\n`);
      
      // Try emergency method
      try {
        setTestResults(prev => prev + '🚨 Trying emergency method...\n');
        const emergencyResult = await uploadImageToFirebaseEmergency(testImageUri, 'apartments');
        setTestResults(prev => prev + `✅ EMERGENCY SUCCESS: ${emergencyResult.url}\n`);
        setTestResults(prev => prev + `Path: ${emergencyResult.path}\n`);
      } catch (emergencyError) {
        setTestResults(prev => prev + `❌ EMERGENCY ALSO FAILED: ${emergencyError}\n`);
        
        // Try bypass method as last resort
        try {
          setTestResults(prev => prev + '🔄 Trying bypass method...\n');
          const bypassResult = await uploadImageToFirebaseBypass(testImageUri, 'apartments');
          setTestResults(prev => prev + `✅ BYPASS SUCCESS: ${bypassResult.url}\n`);
        } catch (bypassError) {
          setTestResults(prev => prev + `❌ ALL METHODS FAILED: ${bypassError}\n`);
        }
      }
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Storage Tester</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={runBasicTest}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Basic Storage</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={runImageTest}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Image Upload</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testActualUpload}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Actual Upload Method</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.clearButton} 
        onPress={clearResults}
      >
        <Text style={styles.clearButtonText}>Clear Results</Text>
      </TouchableOpacity>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        <Text style={styles.resultsText}>{testResults || 'No tests run yet'}</Text>
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
    marginBottom: 20,
    textAlign: 'center',
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
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
