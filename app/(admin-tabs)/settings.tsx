import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

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

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [currentVersion] = useState('1.2.3');
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const handleLogout = () => {
    console.log('Logout button pressed');
    
    // Simple direct logout without confirmation for now
    console.log('Directly navigating to signin');
    try {
      router.replace('/signin' as any);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/signin' as any);
    }
  };

  const settingsSections = [
    {
      title: "Appearance",
      icon: "palette",
      items: [
        {
          title: "Dark Mode",
          icon: "brightness-4",
          action: (
            <Switch
              value={isDark}
              onValueChange={toggleColorScheme}
              thumbColor={isDark ? colorPalette.primary : '#f4f3f4'}
              trackColor={{ false: '#767577', true: colorPalette.primaryLight }}
            />
          ),
        },
        {
          title: "Theme Color",
          icon: "color-lens",
          value: "Blue",
          action: <MaterialIcons name="chevron-right" size={24} color={subtitleColor} />,
        },
      ],
    },
    {
      title: "Notifications",
      icon: "notifications",
      items: [
        {
          title: "Push Notifications",
          icon: "notifications-active",
          action: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={notificationsEnabled ? colorPalette.primary : '#f4f3f4'}
              trackColor={{ false: '#767577', true: colorPalette.primaryLight }}
            />
          ),
        },
        {
          title: "Email Notifications",
          icon: "email",
          action: <MaterialIcons name="chevron-right" size={24} color={subtitleColor} />,
        },
      ],
    },
    {
      title: "Security",
      icon: "security",
      items: [
        {
          title: "Biometric Login",
          icon: "fingerprint",
          action: (
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              thumbColor={biometricEnabled ? colorPalette.primary : '#f4f3f4'}
              trackColor={{ false: '#767577', true: colorPalette.primaryLight }}
            />
          ),
        },
        {
          title: "Change Password",
          icon: "lock",
          action: <MaterialIcons name="chevron-right" size={24} color={subtitleColor} />,
        },
      ],
    },
    {
      title: "About",
      icon: "info",
      items: [
        {
          title: "Version",
          icon: "code",
          value: currentVersion,
        },
        {
          title: "Help & Support",
          icon: "help",
          action: <MaterialIcons name="chevron-right" size={24} color={subtitleColor} />,
        },
        {
          title: "Terms of Service",
          icon: "description",
          action: <MaterialIcons name="chevron-right" size={24} color={subtitleColor} />,
        },
      ],
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              Settings
            </ThemedText>
            <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
              Manage your account and preferences
            </ThemedText>
          </View>
          <View style={[styles.profileCard, { backgroundColor: cardBgColor, borderColor }]}>
            <View style={[styles.avatar, { backgroundColor: colorPalette.primaryLight }]}>
              <MaterialIcons name="person" size={24} color={colorPalette.darkest} />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="subtitle" style={[styles.profileName, { color: textColor }]}>
                Admin User
              </ThemedText>
              <ThemedText style={[styles.profileEmail, { color: subtitleColor }]}>
                admin@example.com
              </ThemedText>
            </View>
            <TouchableOpacity>
              <MaterialIcons name="edit" size={20} color={colorPalette.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name={section.icon as any} size={20} color={colorPalette.primary} />
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                {section.title}
              </ThemedText>
            </View>
            
            <View style={[styles.sectionItems, { backgroundColor: cardBgColor, borderColor }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity 
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex !== section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <MaterialIcons name={item.icon as any} size={20} color={colorPalette.primary} style={styles.itemIcon} />
                    <ThemedText style={[styles.itemTitle, { color: textColor }]}>
                      {item.title}
                    </ThemedText>
                  </View>
                  <View style={styles.settingRight}>
                    {item.value && (
                      <ThemedText style={[styles.itemValue, { color: subtitleColor }]}>
                        {item.value}
                      </ThemedText>
                    )}
                    {item.action}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#F44336' }]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
          <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    marginTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionItems: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 14,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});