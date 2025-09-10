import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// removed email notifications persistence
import { useState } from 'react';
import { Alert, Image, Linking, Modal, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
// removed user/db usage for email notifications
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useAuthContext } from '../contexts/AuthContext';

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
  const { user } = useAuthContext();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentVersion] = useState('1.2.3');
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{strength: string, color: string}>({strength: '', color: ''});
  
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

  // Admin Help & Support Functions
  const handleHelpSupport = () => {
    setHelpModalVisible(true);
  };

  // Change Password Functions
  const handleChangePassword = () => {
    setChangePasswordModalVisible(true);
  };

  const handlePasswordChange = async () => {
    // Enhanced validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert('Error', 'New password must be at least 6 characters long and contain uppercase, lowercase, and numbers');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Import Firebase Auth
      const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');
      
      if (!user) {
        Alert.alert('Error', 'User not found. Please log in again.');
        setIsChangingPassword(false);
        return;
      }

      if (!user.email) {
        Alert.alert('Error', 'User email not found. Please log in again.');
        setIsChangingPassword(false);
        return;
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      Alert.alert('Success', 'Password updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setChangePasswordModalVisible(false);
            clearPasswordForm();
          }
        }
      ]);

    } catch (error: any) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect. Please check and try again.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log out and log in again before changing your password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/user-token-expired') {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your current password.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setChangePasswordModalVisible(false);
    clearPasswordForm();
  };

  const clearPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
    setPasswordStrength({strength: '', color: ''});
  };

  const handleNewPasswordChange = (password: string) => {
    setNewPassword(password);
    if (password.length > 0) {
      const validation = validatePasswordStrength(password);
      const color = validation.strength === 'strong' ? '#4CAF50' : 
                   validation.strength === 'medium' ? '#FF9800' : '#F44336';
      setPasswordStrength({strength: validation.strength, color});
    } else {
      setPasswordStrength({strength: '', color: ''});
    }
  };

  const validatePasswordStrength = (password: string) => {
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      strength: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar ? 'strong' : 
                hasMinLength && (hasUpperCase || hasLowerCase) && hasNumbers ? 'medium' : 'weak'
    };
  };

  // Photo Upload Functions
  const handleEditProfilePhoto = () => {
    setPhotoModalVisible(true);
  };

  const processImage = async (uri: string) => {
    try {
      setIsProcessingImage(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 300 } }, // Resize to 300px width for profile photo
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } finally {
      setIsProcessingImage(false);
    }
  };

  const pickImageFromDevice = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to choose an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile photo
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processed = await processImage(result.assets[0].uri);
        setProfilePhoto(processed);
        setPhotoModalVisible(false);
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Error picking image: ', error);
      Alert.alert('Error', 'Failed to pick image from device');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile photo
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processed = await processImage(result.assets[0].uri);
        setProfilePhoto(processed);
        setPhotoModalVisible(false);
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Error taking photo: ', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeProfilePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProfilePhoto(null);
            setPhotoModalVisible(false);
            Alert.alert('Success', 'Profile photo removed successfully!');
          }
        }
      ]
    );
  };

  // removed email notifications preference logic

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
      ],
    },
    {
      title: "Security",
      icon: "security",
      items: [
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
          action: (
            <TouchableOpacity onPress={() => router.push('/terms' as any)}>
              <MaterialIcons name="chevron-right" size={24} color={subtitleColor} />
            </TouchableOpacity>
          ),
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
            <TouchableOpacity 
              style={[styles.avatar, { backgroundColor: colorPalette.primaryLight }]}
              onPress={handleEditProfilePhoto}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
              ) : (
              <MaterialIcons name="person" size={24} color={colorPalette.darkest} />
              )}
              <View style={styles.editIconOverlay}>
                <MaterialIcons name="edit" size={16} color="#fff" />
            </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <ThemedText type="subtitle" style={[styles.profileName, { color: textColor }]}>
                {user?.displayName || 'Admin User'}
              </ThemedText>
              <ThemedText style={[styles.profileEmail, { color: subtitleColor }]}>
                {user?.email || 'admin@example.com'}
              </ThemedText>
            </View>
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
                  onPress={() => {
                    // If the item has a touchable action inside, we rely on that; otherwise allow row press
                    if (item.title === 'Terms of Service') {
                      router.push('/terms' as any);
                    } else if (item.title === 'Help & Support') {
                      handleHelpSupport();
                    } else if (item.title === 'Change Password') {
                      handleChangePassword();
                    }
                  }}
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

      {/* Admin Help & Support Modal */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.helpModal, { backgroundColor: cardBgColor }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="admin-panel-settings" size={20} color={textColor} style={{ marginRight: 8 }} />
                <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>
                  Admin Help & Support
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpContent}>
              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={[styles.quickActionCard, { borderColor }]}
                  onPress={() => { setHelpModalVisible(false); router.push('/admin-dashboard' as any); }}>
                  <MaterialIcons name="dashboard" size={22} color={colorPalette.primary} />
                  <ThemedText style={[styles.quickActionText, { color: textColor }]}>Go to Dashboard</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickActionCard, { borderColor }]}
                  onPress={() => { setHelpModalVisible(false); router.push('/(admin-tabs)/reservations' as any); }}>
                  <MaterialIcons name="event-available" size={22} color={colorPalette.primary} />
                  <ThemedText style={[styles.quickActionText, { color: textColor }]}>Manage Reservations</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickActionCard, { borderColor }]}
                  onPress={() => { setHelpModalVisible(false); router.push('/(admin-tabs)/users' as any); }}>
                  <MaterialIcons name="people" size={22} color={colorPalette.primary} />
                  <ThemedText style={[styles.quickActionText, { color: textColor }]}>Manage Users</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                </TouchableOpacity>
              </View>

              {/* Admin FAQ */}
              <View style={styles.helpSection}>
                <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
                  Admin FAQ
                </ThemedText>

                <View style={[styles.faqItem, { borderBottomColor: borderColor }]}>
                  <View style={styles.faqHeader}>
                    <MaterialIcons name="security" size={18} color={colorPalette.primary} />
                    <ThemedText style={[styles.faqQuestion, { color: textColor }]}>How do I change admin roles?</ThemedText>
                  </View>
                  <ThemedText style={[styles.faqAnswer, { color: subtitleColor }]}>
                    Go to Users in Admin Panel, select a user, then update their role to Admin or Staff.
                  </ThemedText>
                </View>

                <View style={[styles.faqItem, { borderBottomColor: borderColor }]}>
                  <View style={styles.faqHeader}>
                    <MaterialIcons name="rate-review" size={18} color={colorPalette.primary} />
                    <ThemedText style={[styles.faqQuestion, { color: textColor }]}>How do I approve or decline reservations?</ThemedText>
                  </View>
                  <ThemedText style={[styles.faqAnswer, { color: subtitleColor }]}>
                    Open Reservations, tap a pending booking, then choose Approve or Decline to update status.
                  </ThemedText>
                </View>

                <View style={[styles.faqItem, { borderBottomColor: borderColor }]}>
                  <View style={styles.faqHeader}>
                    <MaterialIcons name="campaign" size={18} color={colorPalette.primary} />
                    <ThemedText style={[styles.faqQuestion, { color: textColor }]}>How do I send notifications to users?</ThemedText>
                  </View>
                  <ThemedText style={[styles.faqAnswer, { color: subtitleColor }]}>
                    Use the Messages tab to reach out to users or integrate push notifications in Settings.
                  </ThemedText>
                </View>

                <View style={[styles.faqItem, { borderBottomColor: borderColor }]}>
                  <View style={styles.faqHeader}>
                    <MaterialIcons name="build" size={18} color={colorPalette.primary} />
                    <ThemedText style={[styles.faqQuestion, { color: textColor }]}>Where can I manage services (apartment, auto, laundry)?</ThemedText>
                  </View>
                  <ThemedText style={[styles.faqAnswer, { color: subtitleColor }]}>
                    Go to the respective Admin management screens to add, edit, or remove service listings.
                  </ThemedText>
                </View>
              </View>

              {/* Contact Support */}
              <View style={[styles.contactCard, { borderColor }] }>
                <View style={styles.contactHeader}>
                  <View style={[styles.contactIcon, { backgroundColor: colorPalette.primaryLight }]}>
                    <MaterialIcons name="support-agent" size={20} color={colorPalette.darkest} />
                  </View>
                  <ThemedText style={[styles.contactTitle, { color: textColor }]}>Contact Support</ThemedText>
                </View>
                <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
                  Need help with admin tasks? Our support team is here to assist you.
                </ThemedText>
                <View style={styles.contactActions}>
                  <TouchableOpacity 
                    style={[styles.contactButton, { borderColor }]} 
                    onPress={() => Linking.openURL('mailto:support@gereuonlinehub.com?subject=Admin%20Support%20Request')}
                  >
                    <MaterialIcons name="email" size={18} color={colorPalette.primary} />
                    <ThemedText style={[styles.contactButtonText, { color: colorPalette.primary }]}>Email Support</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.contactButton, { borderColor }]}
                    onPress={() => Linking.openURL('https://docs.gereuonlinehub.com')}
                  >
                    <MaterialIcons name="library-books" size={18} color={colorPalette.primary} />
                    <ThemedText style={[styles.contactButtonText, { color: colorPalette.primary }]}>View Docs</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelPasswordChange}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.changePasswordModal, { backgroundColor: cardBgColor }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="lock" size={20} color={textColor} style={{ marginRight: 8 }} />
                <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>
                  Change Password
                </ThemedText>
              </View>
              <TouchableOpacity onPress={handleCancelPasswordChange}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.passwordContent}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  Current Password
                </ThemedText>
                <View style={[styles.inputContainer, { borderColor }] }>
                  <MaterialIcons name="lock-outline" size={20} color={subtitleColor} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={subtitleColor}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  New Password
                </ThemedText>
                <View style={[styles.inputContainer, { borderColor }] }>
                  <MaterialIcons name="lock-reset" size={20} color={subtitleColor} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    placeholder="Enter new password"
                    placeholderTextColor={subtitleColor}
                    secureTextEntry
                  />
                </View>
                {passwordStrength.strength && (
                  <View style={styles.passwordStrengthIndicator}>
                    <ThemedText style={[styles.strengthText, { color: passwordStrength.color }]}>
                      Password strength: {passwordStrength.strength.toUpperCase()}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  Confirm New Password
                </ThemedText>
                <View style={[styles.inputContainer, { borderColor }] }>
                  <MaterialIcons name="lock-clock" size={20} color={subtitleColor} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={subtitleColor}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.passwordRequirements}>
                <ThemedText style={[styles.requirementsTitle, { color: textColor }]}>
                  Password Requirements:
                </ThemedText>
                <ThemedText style={[styles.requirement, { color: subtitleColor }]}>
                  • At least 6 characters long
                </ThemedText>
                 <ThemedText style={[styles.requirement, { color: subtitleColor }]}>
                   • Must contain uppercase and lowercase letters
                 </ThemedText>
                 <ThemedText style={[styles.requirement, { color: subtitleColor }]}>
                   • Must contain at least one number
                 </ThemedText>
                <ThemedText style={[styles.requirement, { color: subtitleColor }]}>
                  • Must match confirmation
                </ThemedText>
                 <ThemedText style={[styles.requirement, { color: subtitleColor }]}>
                   • Must be different from current password
                 </ThemedText>
                 <ThemedText style={[styles.requirement, { color: subtitleColor }]}>
                   • For security, you'll need to enter your current password
                 </ThemedText>
              </View>
            </ScrollView>

            <View style={styles.actionFooter}>
              <View style={styles.passwordActions}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor }]}
                  onPress={handleCancelPasswordChange}
                  disabled={isChangingPassword}
                >
                  <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.changePasswordButton, 
                    { backgroundColor: isChangingPassword ? subtitleColor : colorPalette.primary }
                  ]}
                  onPress={handlePasswordChange}
                  disabled={isChangingPassword}
                >
                  <MaterialIcons name="lock" size={20} color="#fff" />
                  <ThemedText style={styles.changePasswordButtonText}>
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Selection Modal */}
      <Modal
        visible={photoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.photoModal, { backgroundColor: cardBgColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>
                Update Profile Photo
              </ThemedText>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.photoOptions}>
              <TouchableOpacity 
                style={[styles.photoOption, { borderColor }]}
                onPress={takePhotoWithCamera}
                disabled={isProcessingImage}
              >
                <MaterialIcons name="camera-alt" size={32} color={colorPalette.primary} />
                <ThemedText style={[styles.photoOptionText, { color: textColor }]}>
                  Take Photo
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.photoOption, { borderColor }]}
                onPress={pickImageFromDevice}
                disabled={isProcessingImage}
              >
                <MaterialIcons name="photo-library" size={32} color={colorPalette.primary} />
                <ThemedText style={[styles.photoOptionText, { color: textColor }]}>
                  Choose from Gallery
                </ThemedText>
              </TouchableOpacity>

              {profilePhoto && (
                <TouchableOpacity 
                  style={[styles.photoOption, { borderColor, backgroundColor: '#F44336' }]}
                  onPress={removeProfilePhoto}
                  disabled={isProcessingImage}
                >
                  <MaterialIcons name="delete" size={32} color="#fff" />
                  <ThemedText style={[styles.photoOptionText, { color: '#fff' }]}>
                    Remove Photo
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {isProcessingImage && (
              <View style={styles.processingContainer}>
                <ThemedText style={[styles.processingText, { color: subtitleColor }]}>
                  Processing image...
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
  // Help & Support Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpModal: {
    width: '100%',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  helpContent: {
    padding: 20,
  },
  quickActions: {
    marginBottom: 16,
    gap: 10,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  quickActionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  helpSection: {
    marginBottom: 24,
  },
  faqItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  contactText: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactButton: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  contactButtonText: {
    marginLeft: 8,
    fontWeight: '700',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  // Change Password Modal Styles
  changePasswordModal: {
    width: '100%',
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  passwordContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  inputIcon: {
    marginRight: 8,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(0, 178, 255, 0.08)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  requirementsList: {
    gap: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirement: {
    fontSize: 12,
    marginLeft: 8,
  },
  passwordActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 6,
  },
  changePasswordButton: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  changePasswordButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  // Photo Upload Styles
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colorPalette.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoModal: {
    width: '90%',
    borderRadius: 16,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  photoOptions: {
    padding: 20,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  processingContainer: {
    padding: 20,
    alignItems: 'center',
  },
   processingText: {
     fontSize: 14,
     fontStyle: 'italic',
   },
   // Password Strength Indicator Styles
   passwordStrengthIndicator: {
     marginTop: 8,
     paddingHorizontal: 4,
   },
   strengthText: {
     fontSize: 12,
     fontWeight: '600',
     textTransform: 'capitalize',
  },
});