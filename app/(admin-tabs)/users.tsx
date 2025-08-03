import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

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

export default function UsersScreen() {
  return (
    <ThemedView style={[styles.container, { backgroundColor: '#fff' }]}>
      <View style={styles.content}>
        <MaterialIcons name="people" size={64} color={colorPalette.primary} />
        <ThemedText type="title" style={[styles.title, { color: colorPalette.darkest }]}>
          Users
        </ThemedText>
        <ThemedText type="default" style={[styles.subtitle, { color: colorPalette.dark }]}>
          Manage user accounts and permissions
        </ThemedText>
        <ThemedText type="default" style={[styles.info, { color: colorPalette.dark }]}>
          This is the Users tab. Bottom tabs should be visible below.
        </ThemedText>
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
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 