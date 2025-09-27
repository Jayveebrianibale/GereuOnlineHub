import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cleanupInvalidTokens } from '../services/notificationService';

export default function TokenCleanup() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      await cleanupInvalidTokens();
      Alert.alert('Success', 'Token cleanup completed successfully!');
    } catch (error) {
      console.error('Token cleanup failed:', error);
      Alert.alert('Error', 'Token cleanup failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Token Cleanup</Text>
      <Text style={styles.description}>
        This will remove invalid FCM tokens and non-Expo push tokens from the database.
        Run this if you're experiencing FCM server key errors.
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleCleanup}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Cleaning up...' : 'Clean Up Tokens'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
