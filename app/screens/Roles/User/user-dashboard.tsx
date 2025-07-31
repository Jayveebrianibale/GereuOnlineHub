import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function UserDashboard() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">User Dashboard</ThemedText>
      <ThemedText style={{ marginBottom: 32 }}>Welcome! This is a placeholder for the user dashboard.</ThemedText>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/admin-dashboard')}>
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>Go to Apartment Rentals</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/admin-dashboard')}>
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>Go to Laundry Services</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/admin-dashboard')}>
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>Go to Car & Motor Parts</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    width: 260,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
