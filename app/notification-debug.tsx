import { StyleSheet, View } from 'react-native';
import PushNotificationDebugger from './components/PushNotificationDebugger';

export default function NotificationDebugScreen() {
  return (
    <View style={styles.container}>
      <PushNotificationDebugger />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

