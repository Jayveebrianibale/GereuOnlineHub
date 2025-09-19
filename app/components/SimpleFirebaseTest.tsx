import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { uploadImageToFirebaseAlwaysWorks } from '../services/firebaseStorageBypass';
import { uploadImageToFirebaseWithRetry } from '../services/imageUploadService';

/**
 * Simple Firebase Storage Test
 * This will test if the upload works without Firebase Storage errors
 */
export const SimpleFirebaseTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testUpload = async () => {
    setIsLoading(true);
    setResult('Testing upload...\n');
    
    try {
      // Use the same image URI from your error
      const testImageUri = 'file:///data/user/0/host.exp.exponent/cache/ImageManipulator/a39336a6-ae88-4534-b4a6-3867c447fa65.jpg';
      
      setResult(prev => prev + '🚀 Testing complete bypass method...\n');
      
      // Test the complete bypass method
      const uploadResult = await uploadImageToFirebaseAlwaysWorks(testImageUri, 'apartments');
      
      setResult(prev => prev + `✅ SUCCESS!\n`);
      setResult(prev => prev + `URL: ${uploadResult.url}\n`);
      setResult(prev => prev + `Path: ${uploadResult.path}\n`);
      
      Alert.alert('Success!', 'Upload worked without Firebase Storage errors!');
      
    } catch (error) {
      setResult(prev => prev + `❌ ERROR: ${error}\n`);
      Alert.alert('Error', `Upload failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testServiceUpload = async () => {
    setIsLoading(true);
    setResult('Testing service upload...\n');
    
    try {
      // Use the same image URI from your error
      const testImageUri = 'file:///data/user/0/host.exp.exponent/cache/ImageManipulator/a39336a6-ae88-4534-b4a6-3867c447fa65.jpg';
      
      setResult(prev => prev + '🚀 Testing service upload method...\n');
      
      // Test the service method (used by apartmentService, autoService, etc.)
      const uploadResult = await uploadImageToFirebaseWithRetry(testImageUri, 'apartments');
      
      setResult(prev => prev + `✅ SERVICE UPLOAD SUCCESS!\n`);
      setResult(prev => prev + `URL: ${uploadResult.url}\n`);
      setResult(prev => prev + `Path: ${uploadResult.path}\n`);
      
      Alert.alert('Success!', 'Service upload worked without errors!');
      
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
      <Text style={styles.title}>Firebase Storage Test</Text>
      <Text style={styles.subtitle}>This will test if uploads work without errors</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testUpload}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Complete Bypass</Text>
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
