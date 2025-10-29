// ========================================
// PERSISTENT AUTH TEST SCREEN
// ========================================
// Ang screen na ito ay para sa testing ng persistent authentication
// I-display ang PersistentAuthTest component

import { SafeAreaView, StyleSheet } from 'react-native';
import { PersistentAuthTest } from './components/PersistentAuthTest';

export default function PersistentAuthTestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <PersistentAuthTest />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
