import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const colorPalette = {
  lightest: '#C3F5FF',
  light: '#7FE6FF',
  primaryLight: '#4AD0FF',
  primary: '#00B2FF',
  primaryDark: '#007BE5',
  dark: '#0051C1',
  darker: '#002F87',
  darkest: '#001A5C',
};

export default function TestAdmin() {
  return (
    <ThemedView style={[styles.container, { backgroundColor: '#fff' }]}>
      <View style={styles.content}>
        <MaterialIcons name="admin-panel-settings" size={64} color={colorPalette.primary} />
        <ThemedText type="title" style={[styles.title, { color: colorPalette.darkest }]}>
          Admin Test Screen
        </ThemedText>
        <ThemedText type="default" style={[styles.subtitle, { color: colorPalette.dark }]}>
          This confirms admin navigation is working
        </ThemedText>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colorPalette.primary }]}
          onPress={() => router.push('/(admin-tabs)')}
        >
          <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
            Go to Admin Dashboard
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 