import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ExpoGoTest() {
  const [status, setStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkEnvironment = () => {
      const appOwnership = Constants.appOwnership;
      
      if (appOwnership === 'expo') {
        setStatus('✅ Running in Expo Go - Push notifications disabled gracefully');
      } else {
        setStatus('✅ Running in development build - Push notifications available');
      }
    };

    checkEnvironment();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo Go Compatibility Test</Text>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.info}>
        {Constants.appOwnership === 'expo' 
          ? 'Push notifications are disabled in Expo Go. Use a development build to test notifications.'
          : 'Push notifications should work in this environment.'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  info: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
});
