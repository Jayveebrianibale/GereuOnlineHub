import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { uploadImageToFirebaseReactNative } from '../services/imageUploadService';

export default function QuickUploadTest() {
  const [isLoading, setIsLoading] = useState(false);

  const testUpload = async () => {
    setIsLoading(true);
    try {
      // Replace this with an actual image URI from your device
      const testImageUri = 'file:///path/to/your/test/image.jpg';
      
      console.log('Testing React Native specific upload method...');
      const result = await uploadImageToFirebaseReactNative(
        testImageUri, 
        'test', 
        'react-native-test.jpg'
      );
      
      Alert.alert(
        'Upload Success!', 
        `Image uploaded successfully!\nURL: ${result.url}\nPath: ${result.path}`
      );
      
      console.log('Upload result:', result);
    } catch (error) {
      Alert.alert(
        'Upload Failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Upload test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Upload Test</Text>
      <Text style={styles.subtitle}>
        This will test the new retry upload mechanism
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testUpload}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Upload'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        Note: Make sure to replace the test image URI with an actual image path from your device
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
