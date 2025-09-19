import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig';
import { testFirebaseStorage, testImageUpload } from '../services/firebaseStorageTest';
import { uploadImageToFirebaseSmart } from '../services/imageUploadService';

export default function FirebaseStorageDebugger() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runBasicTest = async () => {
    setIsLoading(true);
    try {
      const result = await testFirebaseStorage();
      setTestResults({ type: 'basic', result });
      Alert.alert('Test Complete', `Success: ${result.success}\nMessage: ${result.message}`);
    } catch (error) {
      Alert.alert('Test Failed', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runImageTest = async () => {
    setIsLoading(true);
    try {
      // Use a sample image URI - replace with actual image URI from your device
      const sampleImageUri = 'file:///path/to/sample/image.jpg'; // Replace with actual path
      const result = await testImageUpload(sampleImageUri);
      setTestResults({ type: 'image', result });
      Alert.alert('Image Test Complete', `Success: ${result.success}\nMessage: ${result.message}`);
    } catch (error) {
      Alert.alert('Image Test Failed', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runSmartUploadTest = async () => {
    setIsLoading(true);
    try {
      // Use a sample image URI - replace with actual image URI from your device
      const sampleImageUri = 'file:///path/to/sample/image.jpg'; // Replace with actual path
      const result = await uploadImageToFirebaseSmart(sampleImageUri, 'test', 'debug-test.jpg');
      setTestResults({ type: 'smart', result });
      Alert.alert('Smart Upload Test Complete', `Success: true\nURL: ${result.url}`);
    } catch (error) {
      Alert.alert('Smart Upload Test Failed', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = () => {
    const user = auth.currentUser;
    Alert.alert(
      'Authentication Status',
      user ? `Authenticated as: ${user.email || user.uid}` : 'Not authenticated'
    );
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Firebase Storage Debugger
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Current Configuration:
        </Text>
        <Text>Storage Bucket: gereuonlinehub.firebasestorage.app</Text>
        <Text>Project ID: gereuonlinehub</Text>
        <Text>API Key: AIzaSyCaD98fD30lBNQ37UlbHPcy12sx0IYnOy8</Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={checkAuthStatus}
        disabled={isLoading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Check Authentication Status
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#34C759',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={runBasicTest}
        disabled={isLoading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Run Basic Storage Test
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#FF9500',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={runImageTest}
        disabled={isLoading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Run Image Upload Test
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#AF52DE',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
        onPress={runSmartUploadTest}
        disabled={isLoading}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Run Smart Upload Test
        </Text>
      </TouchableOpacity>

      {isLoading && (
        <Text style={{ textAlign: 'center', fontSize: 16, color: '#666' }}>
          Running test...
        </Text>
      )}

      {testResults && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Test Results:
          </Text>
          <Text style={{ backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5 }}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}

      <View style={{ marginTop: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Important Notes:
        </Text>
        <Text style={{ marginBottom: 5 }}>
          1. Make sure you're signed in before running tests
        </Text>
        <Text style={{ marginBottom: 5 }}>
          2. Update Firebase Storage rules to allow uploads
        </Text>
        <Text style={{ marginBottom: 5 }}>
          3. Replace sample image URI with actual image path
        </Text>
        <Text style={{ marginBottom: 5 }}>
          4. Check console logs for detailed error information
        </Text>
      </View>
    </ScrollView>
  );
}