import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { ref as dbRef, onValue, set } from 'firebase/database';
// Storage upload removed; we will store data URL directly in Realtime Database
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

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

// Sample user data
const userData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: require('@/assets/images/logo.png'), // Using logo as placeholder avatar
};

const profileMenuItems = [
  {
    id: '1',
    title: 'Personal Information',
    subtitle: 'Update your profile details',
    icon: 'person',
    action: 'edit',
  },
  {
    id: '3',
    title: 'Notifications',
    subtitle: 'Configure notification settings',
    icon: 'notifications',
    action: 'notifications',
  },
  {
    id: '4',
    title: 'Privacy & Security',
    subtitle: 'Manage your privacy settings',
    icon: 'security',
    action: 'settings',
  },
  {
    id: '5',
    title: 'Help & Support',
    subtitle: 'Get help and contact support',
    icon: 'help',
    action: 'support',
  },
  {
    id: '6',
    title: 'About',
    subtitle: 'App version and information',
    icon: 'info',
    action: 'info',
  },
];

export default function Profile() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

   const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: null,
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [personalInfoModalVisible, setPersonalInfoModalVisible] = useState(false);
  const [adminSelectionModalVisible, setAdminSelectionModalVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    services: false,
    mission: false,
    contact: false,
    appInfo: false,
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    reservationUpdates: true,
    serviceAvailability: true,
    adminMessages: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  // Personal information state
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    occupation: '',
    company: '',
    preferences: {
      preferredLanguage: 'English',
      timeZone: 'Asia/Manila',
      currency: 'PHP',
      notifications: true,
    }
  });
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  const uploadAndSaveProfilePhoto = async (localUri: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Not signed in', 'Please sign in to update your profile photo.');
        return;
      }

      // Generate base64 using ImageManipulator (avoids deprecated FileSystem API)
      const base64Result = await ImageManipulator.manipulateAsync(
        localUri,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const base64 = base64Result.base64 || '';
      if (!base64) {
        throw new Error('Failed to convert image to base64');
      }
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      // Optionally update Firebase Auth profile (data URLs may be large; safe to skip)
      try { await updateProfile(user, { photoURL: dataUrl }); } catch {}

      // Save to Realtime Database (legacy path for compatibility)
      await set(dbRef(db, `users/${user.uid}/avatar`), dataUrl);
      await set(dbRef(db, `users/${user.uid}/updatedAt`), new Date().toISOString());

      // Save to separate profile image table
      await set(dbRef(db, `userProfileImages/${user.uid}`), {
        url: dataUrl,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setAvatarUri(dataUrl);
      Alert.alert('Success', 'Profile photo saved.');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', 'Could not upload and save profile photo.');
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserData({
          name: user.displayName || "No Name",
          email: user.email || "No Email",
          avatar: require('@/assets/images/logo.png'),
        });
        
        // Load personal information from database
        const personalInfoRef = dbRef(db, `users/${user.uid}/personalInfo`);
        const personalInfoUnsubscribe = onValue(personalInfoRef, (snap) => {
          const data = snap.val();
          if (data) {
            setPersonalInfo(prev => ({
              ...prev,
              ...data,
              email: user.email || data.email || '',
            }));
          } else {
            // Initialize with user data if no personal info exists
            setPersonalInfo(prev => ({
              ...prev,
              fullName: user.displayName || '',
              email: user.email || '',
            }));
          }
        });
        
        // Prefer separate table value; fallback to Auth photoURL
        const imageRef = dbRef(db, `userProfileImages/${user.uid}/url`);
        const off = onValue(imageRef, (snap) => {
          const url = snap.val();
          if (url) {
            setAvatarUri(url);
          } else if (user.photoURL) {
            setAvatarUri(user.photoURL);
          } else {
            setAvatarUri(null);
          }
        });
        
        return () => {
          personalInfoUnsubscribe();
          off();
        };
      }
    });

    return unsubscribe; // cleanup
  }, []);
  
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';

  const handleLogout = () => {
    console.log('Logout button pressed');
    
    // Navigate back to signin screen
    console.log('Navigating to signin');
    try {
      router.replace('/signin' as any);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/signin' as any);
    }
  };

  const processImage = async (uri: string) => {
    try {
      setIsProcessingImage(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 300 } }],
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
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processed = await processImage(result.assets[0].uri);
        setPhotoModalVisible(false);
        await uploadAndSaveProfilePhoto(processed);
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
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processed = await processImage(result.assets[0].uri);
        setPhotoModalVisible(false);
        await uploadAndSaveProfilePhoto(processed);
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
            (async () => {
              try {
                const auth = getAuth();
                const user = auth.currentUser;
                setAvatarUri(null);
                setPhotoModalVisible(false);
                if (user) {
                  await updateProfile(user, { photoURL: null as any });
                  await set(dbRef(db, `users/${user.uid}/avatar`), '');
                  await set(dbRef(db, `users/${user.uid}/updatedAt`), new Date().toISOString());
                  await set(dbRef(db, `userProfileImages/${user.uid}`), {
                    url: '',
                    updatedAt: new Date().toISOString(),
                  });
                }
                Alert.alert('Success', 'Profile photo removed successfully!');
              } catch (e) {
                console.error('Error removing profile photo:', e);
                Alert.alert('Error', 'Failed to remove photo');
              }
            })();
          }
        }
      ]
    );
  };

  const savePersonalInfo = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Not signed in', 'Please sign in to update your personal information.');
        return;
      }

      // Update Firebase Auth profile
      await updateProfile(user, { 
        displayName: personalInfo.fullName.trim() 
      });

      // Save to Realtime Database - update both personalInfo and main user data
      const updateData = {
        [`users/${user.uid}/personalInfo`]: {
          ...personalInfo,
          updatedAt: new Date().toISOString(),
        },
        [`users/${user.uid}/name`]: personalInfo.fullName.trim(),
        [`users/${user.uid}/updatedAt`]: new Date().toISOString()
      };
      
      // Use a single transaction for faster updates
      await Promise.all(
        Object.entries(updateData).map(([path, data]) => 
          set(dbRef(db, path), data)
        )
      );

      // Update local user data
      setUserData(prev => ({
        ...prev,
        name: personalInfo.fullName.trim(),
        email: personalInfo.email,
      }));

      setIsEditingPersonalInfo(false);
      Alert.alert('Success', 'Personal information updated successfully!');
    } catch (error) {
      console.error('Error saving personal information:', error);
      Alert.alert('Error', 'Failed to save personal information. Please try again.');
    }
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPersonalInfo(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object || {}),
          [child]: value,
        }
      }));
    } else {
      setPersonalInfo(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'info':
        setAboutModalVisible(true);
        break;
      case 'edit':
        setPersonalInfoModalVisible(true);
        break;
      case 'notifications':
        setNotificationModalVisible(true);
        break;
      case 'settings':
        Alert.alert('Coming Soon', 'Privacy & Security settings will be available soon!');
        break;
      case 'support':
        setSupportModalVisible(true);
        break;
      default:
        break;
    }
  };

  const handleLiveChat = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to start a chat.');
      return;
    }

    // Generate chat ID for support chat
    const chatId = `support_${user.uid}`;
    
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: chatId,
        chatId: chatId,
        recipientName: 'Support Team',
        recipientEmail: 'support@gereuonlinehub.com',
        currentUserEmail: user.email || '',
      }
    });
  };

  const handleCallUs = () => {
    setAdminSelectionModalVisible(true);
  };

  const handleCallAdmin = (adminName: string, phone: string) => {
    setAdminSelectionModalVisible(false);
    const phoneUrl = `tel:${phone}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert('Error', 'Unable to open phone dialer');
    });
  };

  const handleEmailUs = () => {
    const admins = [
      { name: 'Jayvee Briani', email: 'jayveebriani@gmail.com' },
      { name: 'Alfredo Sayson', email: 'alfredosayson@gmail.com' },
      { name: 'Sayson Admin', email: 'sayson5@gmail.com' }
    ];

    Alert.alert(
      'Email Support',
      'Choose an admin to email:',
      [
        ...admins.map(admin => ({
          text: admin.name,
          onPress: () => {
            const emailUrl = `mailto:${admin.email}?subject=Support Request - Gereu Online Hub`;
            Linking.openURL(emailUrl).catch(() => {
              Alert.alert('Error', 'Unable to open email client');
            });
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleNotificationToggle = (setting: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const saveNotificationSettings = async () => {
    try {
      // Here you would save to Firebase or local storage
      console.log('Saving notification settings:', notificationSettings);
      Alert.alert('Success', 'Notification settings saved successfully!');
      setNotificationModalVisible(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
 
  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
            Profile
          </ThemedText>
          <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
            Manage your account settings
          </ThemedText>
        </View>

        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.userHeader}>
            <TouchableOpacity 
              onPress={() => setPhotoModalVisible(true)}
              style={styles.avatarContainer}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={24} color="#888" />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <MaterialIcons name="edit" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <ThemedText type="subtitle" style={[styles.userName, { color: textColor }]}>
                {userData.name}
              </ThemedText>
              <ThemedText style={[styles.userEmail, { color: subtitleColor }]}>
                {userData.email}
              </ThemedText>
            </View>
            <View style={styles.buttonRow} />
          </View>
        </View>
        {/* Theme Toggle */}
        <View style={[styles.themeCard, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.themeHeader}>
            <MaterialIcons name="palette" size={20} color={colorPalette.primary} />
            <View style={styles.themeInfo}>
              <ThemedText type="subtitle" style={[styles.themeTitle, { color: textColor }]}>
                Dark Mode
              </ThemedText>
              <ThemedText style={[styles.themeSubtitle, { color: subtitleColor }]}>
                Switch between light and dark themes
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.themeToggle, { backgroundColor: isDark ? colorPalette.primary : '#ccc' }]}
              onPress={toggleColorScheme}
            >
              <MaterialIcons 
                name={isDark ? 'light-mode' : 'dark-mode'} 
                size={16} 
                color={isDark ? '#fff' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>

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
                <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>Update Profile Photo</ThemedText>
                <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.photoOptions}>
                <TouchableOpacity 
                  style={[styles.photoOption, { borderColor }]}
                  onPress={pickImageFromDevice}
                  disabled={isProcessingImage}
                >
                  <MaterialIcons name="file-upload" size={24} color={colorPalette.primary} />
                  <ThemedText style={[styles.photoOptionText, { color: textColor }]}>Upload Photo</ThemedText>
                </TouchableOpacity>

                {avatarUri && (
                  <TouchableOpacity 
                    style={[styles.photoOption, { borderColor, backgroundColor: '#F44336' }]}
                    onPress={removeProfilePhoto}
                    disabled={isProcessingImage}
                  >
                    <MaterialIcons name="delete" size={24} color="#fff" />
                    <ThemedText style={[styles.photoOptionText, { color: '#fff' }]}>Remove Photo</ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {isProcessingImage && (
                <View style={styles.processingContainer}>
                  <ThemedText style={[styles.processingText, { color: subtitleColor }]}>Processing image...</ThemedText>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Personal Information Modal */}
        <Modal
          visible={personalInfoModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPersonalInfoModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.aboutModal, { backgroundColor: cardBgColor }]}>
              {/* Professional Header */}
              <View style={[styles.professionalHeader, { backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA' }]}>
                <View style={styles.headerContent}>
                  <View style={[styles.logoWrapper, { backgroundColor: colorPalette.primary }]}>
                    <MaterialIcons name="person" size={24} color="#fff" />
                  </View>
                  
                  <View style={styles.appInfoContainer}>
                    <ThemedText type="title" style={[styles.appName, { color: textColor }]}>
                      Personal Information
                    </ThemedText>
                    <View style={[styles.versionBadge, { backgroundColor: '#4CAF50' }]}>
                      <ThemedText style={[styles.appVersion, { color: '#fff' }]}>
                        Edit Profile
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: isDark ? '#333' : '#E9ECEF' }]}
                  onPress={() => setPersonalInfoModalVisible(false)}
                >
                  <MaterialIcons name="close" size={20} color={textColor} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.aboutContent} showsVerticalScrollIndicator={false}>
                {/* Basic Information */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <View style={styles.infoHeader}>
                    <MaterialIcons name="account-circle" size={24} color={colorPalette.primary} />
                    <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                      Basic Information
                    </ThemedText>
                  </View>
                  
                  <View style={styles.formField}>
                    <ThemedText style={[styles.fieldLabel, { color: textColor }]}>Full Name</ThemedText>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', color: textColor, borderColor }]}
                      value={personalInfo.fullName}
                      onChangeText={(value) => handlePersonalInfoChange('fullName', value)}
                      placeholder="Enter your full name"
                      placeholderTextColor={subtitleColor}
                    />
                  </View>
                  
                  <View style={styles.formField}>
                    <ThemedText style={[styles.fieldLabel, { color: textColor }]}>Email Address</ThemedText>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', color: textColor, borderColor }]}
                      value={personalInfo.email}
                      onChangeText={(value) => handlePersonalInfoChange('email', value)}
                      placeholder="Enter your email"
                      placeholderTextColor={subtitleColor}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  
                </View>


                {/* Save Button */}
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: colorPalette.primary }]}
                  onPress={savePersonalInfo}
                >
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <ThemedText style={[styles.saveButtonText, { color: '#fff' }]}>
                    Save Personal Information
                  </ThemedText>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* About Modal */}
        <Modal
          visible={aboutModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAboutModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.aboutModal, { backgroundColor: cardBgColor }]}>
              {/* Professional Header with Gradient */}
              <View style={[styles.professionalHeader, { backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA' }]}>
                <View style={styles.headerContent}>
                  <View style={[styles.logoWrapper, { backgroundColor: colorPalette.primary }]}>
                    <Image source={require('@/assets/images/logo.png')} style={styles.appLogo} />
                  </View>
                  
                  <View style={styles.appInfoContainer}>
                    <ThemedText type="title" style={[styles.appName, { color: textColor }]}>
                      Gereu Online Hub
                    </ThemedText>
                    <View style={[styles.versionBadge, { backgroundColor: colorPalette.primaryLight }]}>
                      <ThemedText style={[styles.appVersion, { color: '#fff' }]}>
                        v1.0.0
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: isDark ? '#333' : '#E9ECEF' }]}
                  onPress={() => setAboutModalVisible(false)}
                >
                  <MaterialIcons name="close" size={20} color={textColor} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.aboutContent} showsVerticalScrollIndicator={false}>
                {/* App Information */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <View style={styles.infoHeader}>
                    <MaterialIcons name="info" size={24} color={colorPalette.primary} />
                    <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                      About Gereu Online Hub
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.infoDescription, { color: subtitleColor }]}>
                    Gereu Online Hub is your one-stop platform for apartment rentals, Car and Motor parts, and laundry facilities. 
                    We provide convenient access to essential community services through our mobile app.
                  </ThemedText>
                </View>

                {/* What We Offer */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <TouchableOpacity 
                    style={styles.dropdownHeader}
                    onPress={() => toggleSection('services')}
                  >
                    <View style={styles.infoHeader}>
                      <MaterialIcons name="business" size={24} color={colorPalette.primary} />
                      <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                        What We Offer
                      </ThemedText>
                    </View>
                    <MaterialIcons 
                      name={expandedSections.services ? "expand-less" : "expand-more"} 
                      size={24} 
                      color={subtitleColor} 
                    />
                  </TouchableOpacity>
                  
                  {expandedSections.services && (
                    <View style={styles.serviceList}>
                      <View style={styles.serviceItem}>
                        <MaterialIcons name="apartment" size={20} color={colorPalette.primary} />
                        <View style={styles.serviceContent}>
                          <ThemedText style={[styles.serviceTitle, { color: textColor }]}>
                            Apartment Rentals
                          </ThemedText>
                          <ThemedText style={[styles.serviceDescription, { color: subtitleColor }]}>
                            Browse and book modern apartments with digital amenities, smart home features, and flexible lease options.
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.serviceItem}>
                        <MaterialIcons name="directions-car" size={20} color={colorPalette.primary} />
                        <View style={styles.serviceContent}>
                          <ThemedText style={[styles.serviceTitle, { color: textColor }]}>
                            Car and Motor Services
                          </ThemedText>
                          <ThemedText style={[styles.serviceDescription, { color: subtitleColor }]}>
                            Professional automotive maintenance, repairs, and services with certified technicians and quality parts.
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.serviceItem}>
                        <MaterialIcons name="local-laundry-service" size={20} color={colorPalette.primary} />
                        <View style={styles.serviceContent}>
                          <ThemedText style={[styles.serviceTitle, { color: textColor }]}>
                            Laundry Facilities
                          </ThemedText>
                          <ThemedText style={[styles.serviceDescription, { color: subtitleColor }]}>
                            State-of-the-art laundry facilities with modern equipment, mobile app controls, and flexible scheduling.
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.serviceItem}>
                        <MaterialIcons name="chat" size={20} color={colorPalette.primary} />
                        <View style={styles.serviceContent}>
                          <ThemedText style={[styles.serviceTitle, { color: textColor }]}>
                            Customer Support
                          </ThemedText>
                          <ThemedText style={[styles.serviceDescription, { color: subtitleColor }]}>
                            24/7 customer support with real-time messaging, quick response times, and dedicated assistance.
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* Our Mission */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <TouchableOpacity 
                    style={styles.dropdownHeader}
                    onPress={() => toggleSection('mission')}
                  >
                    <View style={styles.infoHeader}>
                      <MaterialIcons name="flag" size={24} color={colorPalette.primary} />
                      <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                        Our Mission
                      </ThemedText>
                    </View>
                    <MaterialIcons 
                      name={expandedSections.mission ? "expand-less" : "expand-more"} 
                      size={24} 
                      color={subtitleColor} 
                    />
                  </TouchableOpacity>
                  
                  {expandedSections.mission && (
                    <ThemedText style={[styles.infoDescription, { color: subtitleColor }]}>
                      To provide easy access to apartment rentals, Car and Motor parts, and laundry facilities through our mobile app, 
                      making community services more convenient and accessible for everyone.
                    </ThemedText>
                  )}
                </View>

                {/* Contact Information */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <TouchableOpacity 
                    style={styles.dropdownHeader}
                    onPress={() => toggleSection('contact')}
                  >
                    <View style={styles.infoHeader}>
                      <MaterialIcons name="contact-support" size={24} color={colorPalette.primary} />
                      <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                        Contact Us
                      </ThemedText>
                    </View>
                    <MaterialIcons 
                      name={expandedSections.contact ? "expand-less" : "expand-more"} 
                      size={24} 
                      color={subtitleColor} 
                    />
                  </TouchableOpacity>
                  
                  {expandedSections.contact && (
                    <View style={styles.contactInfo}>
                      <View style={styles.contactRow}>
                        <MaterialIcons name="email" size={18} color={colorPalette.primary} />
                        <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
                          support@gereuonlinehub.com
                        </ThemedText>
                      </View>
                      
                      <View style={styles.contactRow}>
                        <MaterialIcons name="phone" size={18} color={colorPalette.primary} />
                        <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
                          +63 (2) 8XXX-XXXX
                        </ThemedText>
                      </View>
                      
                      <View style={styles.contactRow}>
                        <MaterialIcons name="location-on" size={18} color={colorPalette.primary} />
                        <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
                          Gereu Online Hub, Philippines
                        </ThemedText>
                      </View>
                      
                      <View style={styles.contactRow}>
                        <MaterialIcons name="schedule" size={18} color={colorPalette.primary} />
                        <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
                          Monday - Friday: 8:00 AM - 6:00 PM
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* App Details */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <TouchableOpacity 
                    style={styles.dropdownHeader}
                    onPress={() => toggleSection('appInfo')}
                  >
                    <View style={styles.infoHeader}>
                      <MaterialIcons name="settings" size={24} color={colorPalette.primary} />
                      <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                        App Information
                      </ThemedText>
                    </View>
                    <MaterialIcons 
                      name={expandedSections.appInfo ? "expand-less" : "expand-more"} 
                      size={24} 
                      color={subtitleColor} 
                    />
                  </TouchableOpacity>
                  
                  {expandedSections.appInfo && (
                    <View style={styles.appDetails}>
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: textColor }]}>Version:</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: subtitleColor }]}>1.0.0</ThemedText>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: textColor }]}>Platform:</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: subtitleColor }]}>React Native & Expo</ThemedText>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: textColor }]}>Last Updated:</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: subtitleColor }]}>January 2025</ThemedText>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: textColor }]}>Developer:</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: subtitleColor }]}>Gereu Online Hub</ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Footer */}
                <View style={styles.footerSection}>
                  <ThemedText style={[styles.copyright, { color: subtitleColor }]}>
                    © 2025 Gereu Online Hub. All rights reserved.
                  </ThemedText>
                  <ThemedText style={[styles.copyright, { color: subtitleColor }]}>
                    Your trusted platform for apartment rentals, auto services, and laundry facilities
                  </ThemedText>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Help & Support Modal */}
        <Modal
          visible={supportModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSupportModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.aboutModal, { backgroundColor: cardBgColor }]}>
              {/* Professional Header */}
              <View style={[styles.professionalHeader, { backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA' }]}>
                <View style={styles.headerContent}>
                  <View style={[styles.logoWrapper, { backgroundColor: colorPalette.primary }]}>
                    <MaterialIcons name="help" size={24} color="#fff" />
                  </View>
                  
                  <View style={styles.appInfoContainer}>
                    <ThemedText type="title" style={[styles.appName, { color: textColor }]}>
                      Help & Support
                    </ThemedText>
                    <View style={[styles.versionBadge, { backgroundColor: '#4CAF50' }]}>
                      <ThemedText style={[styles.appVersion, { color: '#fff' }]}>
                        24/7 Available
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: isDark ? '#333' : '#E9ECEF' }]}
                  onPress={() => setSupportModalVisible(false)}
                >
                  <MaterialIcons name="close" size={20} color={textColor} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.aboutContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={[styles.heroSection, { backgroundColor: colorPalette.primary }]}>
                  <View style={styles.heroContent}>
                    <MaterialIcons name="support-agent" size={48} color="#fff" />
                    <ThemedText style={[styles.heroTitle, { color: '#fff' }]}>
                      We're Here to Help!
                    </ThemedText>
                    <ThemedText style={[styles.heroSubtitle, { color: '#fff' }]}>
                      Get instant support for all your needs
                    </ThemedText>
                  </View>
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                    onPress={handleLiveChat}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' }]}>
                      <MaterialIcons name="chat" size={24} color="#fff" />
                    </View>
                    <ThemedText style={[styles.quickActionTitle, { color: textColor }]}>
                      Live Chat
                    </ThemedText>
                    <ThemedText style={[styles.quickActionSubtitle, { color: subtitleColor }]}>
                      Instant help
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                    onPress={handleCallUs}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#2196F3' }]}>
                      <MaterialIcons name="phone" size={24} color="#fff" />
                    </View>
                    <ThemedText style={[styles.quickActionTitle, { color: textColor }]}>
                      Call Us
                    </ThemedText>
                    <ThemedText style={[styles.quickActionSubtitle, { color: subtitleColor }]}>
                      Mon-Fri 8AM-6PM
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                    onPress={handleEmailUs}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#FF9800' }]}>
                      <MaterialIcons name="email" size={24} color="#fff" />
                    </View>
                    <ThemedText style={[styles.quickActionTitle, { color: textColor }]}>
                      Email Us
                    </ThemedText>
                    <ThemedText style={[styles.quickActionSubtitle, { color: subtitleColor }]}>
                      2-4 hour response
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#9C27B0' }]}>
                      <MaterialIcons name="help" size={24} color="#fff" />
                    </View>
                    <ThemedText style={[styles.quickActionTitle, { color: textColor }]}>
                      FAQ
                    </ThemedText>
                    <ThemedText style={[styles.quickActionSubtitle, { color: subtitleColor }]}>
                      Common questions
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Popular Topics */}
                <View style={[styles.topicsSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Popular Topics
                  </ThemedText>
                  
                  <View style={styles.topicsList}>
                    <TouchableOpacity style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <View style={styles.topicContent}>
                        <MaterialIcons name="apartment" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            Booking Apartments
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Learn how to find and book your perfect apartment
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <View style={styles.topicContent}>
                        <MaterialIcons name="directions-car" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            Car and Motor Parts
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Schedule maintenance and repairs for your vehicle
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <View style={styles.topicContent}>
                        <MaterialIcons name="local-laundry-service" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            Laundry Services
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Use our smart laundry facilities
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <View style={styles.topicContent}>
                        <MaterialIcons name="account-circle" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            Account Settings
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Manage your profile and preferences
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={[styles.contactSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Get in Touch
                  </ThemedText>
                  
                  <View style={styles.contactGrid}>
                    <View style={[styles.contactItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <MaterialIcons name="email" size={24} color={colorPalette.primary} />
                      <ThemedText style={[styles.contactLabel, { color: textColor }]}>
                        Email
                      </ThemedText>
                      <ThemedText style={[styles.contactValue, { color: subtitleColor }]}>
                        support@gereuonlinehub.com
                      </ThemedText>
                    </View>

                    <View style={[styles.contactItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <MaterialIcons name="phone" size={24} color={colorPalette.primary} />
                      <ThemedText style={[styles.contactLabel, { color: textColor }]}>
                        Phone
                      </ThemedText>
                      <ThemedText style={[styles.contactValue, { color: subtitleColor }]}>
                        +63 (2) 8XXX-XXXX
                      </ThemedText>
                    </View>

                    <View style={[styles.contactItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <MaterialIcons name="schedule" size={24} color={colorPalette.primary} />
                      <ThemedText style={[styles.contactLabel, { color: textColor }]}>
                        Hours
                      </ThemedText>
                      <ThemedText style={[styles.contactValue, { color: subtitleColor }]}>
                        Mon-Fri: 8AM-6PM
                      </ThemedText>
                    </View>

                    <View style={[styles.contactItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <MaterialIcons name="location-on" size={24} color={colorPalette.primary} />
                      <ThemedText style={[styles.contactLabel, { color: textColor }]}>
                        Location
                      </ThemedText>
                      <ThemedText style={[styles.contactValue, { color: subtitleColor }]}>
                        Gereu Online Hub, Philippines
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.footerSection}>
                  <ThemedText style={[styles.copyright, { color: subtitleColor }]}>
                    Need more help? We're here 24/7!
                  </ThemedText>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Notification Settings Modal */}
        <Modal
          visible={notificationModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setNotificationModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.aboutModal, { backgroundColor: cardBgColor }]}>
              {/* Professional Header */}
              <View style={[styles.professionalHeader, { backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA' }]}>
                <View style={styles.headerContent}>
                  <View style={[styles.logoWrapper, { backgroundColor: colorPalette.primary }]}>
                    <MaterialIcons name="notifications" size={24} color="#fff" />
                  </View>
                  
                  <View style={styles.appInfoContainer}>
                    <ThemedText type="title" style={[styles.appName, { color: textColor }]}>
                      Notification Settings
                    </ThemedText>
                    <View style={[styles.versionBadge, { backgroundColor: '#4CAF50' }]}>
                      <ThemedText style={[styles.appVersion, { color: '#fff' }]}>
                        Customize Alerts
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: isDark ? '#333' : '#E9ECEF' }]}
                  onPress={() => setNotificationModalVisible(false)}
                >
                  <MaterialIcons name="close" size={20} color={textColor} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.aboutContent} showsVerticalScrollIndicator={false}>
                {/* Main Notification Toggle */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <View style={styles.infoHeader}>
                    <View style={[styles.notificationIconContainer, { backgroundColor: colorPalette.primaryLight + '20' }]}>
                      <MaterialIcons name="notifications-active" size={24} color={colorPalette.primary} />
                    </View>
                    <View style={styles.notificationToggleContainer}>
                      <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                        Push Notifications
                      </ThemedText>
                      <ThemedText style={[styles.infoDescription, { color: subtitleColor }]}>
                        Enable or disable all push notifications
                      </ThemedText>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggleSwitch, { backgroundColor: notificationSettings.pushNotifications ? colorPalette.primary : '#ccc' }]}
                      onPress={() => handleNotificationToggle('pushNotifications')}
                    >
                      <MaterialIcons 
                        name={notificationSettings.pushNotifications ? 'check' : 'close'} 
                        size={16} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reservation Notifications */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Reservation Updates
                  </ThemedText>
                  
                  <View style={styles.notificationItem}>
                    <View style={styles.notificationItemContent}>
                      <View style={[styles.notificationIconContainer, { backgroundColor: colorPalette.primaryLight + '20' }]}>
                        <MaterialIcons name="apartment" size={20} color={colorPalette.primary} />
                      </View>
                      <View style={styles.notificationItemInfo}>
                        <ThemedText style={[styles.notificationItemTitle, { color: textColor }]}>
                          Apartment Reservations
                        </ThemedText>
                        <ThemedText style={[styles.notificationItemDescription, { color: subtitleColor }]}>
                          Get notified when your apartment reservation is confirmed, declined, or ready
                        </ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggleSwitch, { backgroundColor: notificationSettings.reservationUpdates ? colorPalette.primary : '#ccc' }]}
                      onPress={() => handleNotificationToggle('reservationUpdates')}
                    >
                      <MaterialIcons 
                        name={notificationSettings.reservationUpdates ? 'check' : 'close'} 
                        size={16} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.notificationItem}>
                    <View style={styles.notificationItemContent}>
                      <View style={[styles.notificationIconContainer, { backgroundColor: colorPalette.primaryLight + '20' }]}>
                        <MaterialIcons name="local-laundry-service" size={20} color={colorPalette.primary} />
                      </View>
                      <View style={styles.notificationItemInfo}>
                        <ThemedText style={[styles.notificationItemTitle, { color: textColor }]}>
                          Laundry Services
                        </ThemedText>
                        <ThemedText style={[styles.notificationItemDescription, { color: subtitleColor }]}>
                          Notifications when your laundry is ready for pickup
                        </ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggleSwitch, { backgroundColor: notificationSettings.reservationUpdates ? colorPalette.primary : '#ccc' }]}
                      onPress={() => handleNotificationToggle('reservationUpdates')}
                    >
                      <MaterialIcons 
                        name={notificationSettings.reservationUpdates ? 'check' : 'close'} 
                        size={16} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.notificationItem}>
                    <View style={styles.notificationItemContent}>
                      <View style={[styles.notificationIconContainer, { backgroundColor: colorPalette.primaryLight + '20' }]}>
                        <MaterialIcons name="directions-car" size={20} color={colorPalette.primary} />
                      </View>
                      <View style={styles.notificationItemInfo}>
                        <ThemedText style={[styles.notificationItemTitle, { color: textColor }]}>
                          Car and Motor Parts
                        </ThemedText>
                        <ThemedText style={[styles.notificationItemDescription, { color: subtitleColor }]}>
                          Get notified when your car and motor parts orders are ready
                        </ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggleSwitch, { backgroundColor: notificationSettings.reservationUpdates ? colorPalette.primary : '#ccc' }]}
                      onPress={() => handleNotificationToggle('reservationUpdates')}
                    >
                      <MaterialIcons 
                        name={notificationSettings.reservationUpdates ? 'check' : 'close'} 
                        size={16} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Service Availability */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <View style={styles.infoHeader}>
                    <View style={[styles.notificationIconContainer, { backgroundColor: colorPalette.primaryLight + '20' }]}>
                      <MaterialIcons name="new-releases" size={24} color={colorPalette.primary} />
                    </View>
                    <View style={styles.notificationToggleContainer}>
                      <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                        Service Availability
                      </ThemedText>
                      <ThemedText style={[styles.infoDescription, { color: subtitleColor }]}>
                        Get notified when new apartments, car parts, or laundry services become available
                      </ThemedText>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggleSwitch, { backgroundColor: notificationSettings.serviceAvailability ? colorPalette.primary : '#ccc' }]}
                      onPress={() => handleNotificationToggle('serviceAvailability')}
                    >
                      <MaterialIcons 
                        name={notificationSettings.serviceAvailability ? 'check' : 'close'} 
                        size={16} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Admin Messages */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <View style={styles.infoHeader}>
                    <View style={[styles.notificationIconContainer, { backgroundColor: colorPalette.primaryLight + '20' }]}>
                      <MaterialIcons name="admin-panel-settings" size={24} color={colorPalette.primary} />
                    </View>
                    <View style={styles.notificationToggleContainer}>
                      <ThemedText type="subtitle" style={[styles.infoTitle, { color: textColor }]}>
                        Admin Messages
                      </ThemedText>
                      <ThemedText style={[styles.infoDescription, { color: subtitleColor }]}>
                        Receive important messages from Gereu Online Hub administrators
                      </ThemedText>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggleSwitch, { backgroundColor: notificationSettings.adminMessages ? colorPalette.primary : '#ccc' }]}
                      onPress={() => handleNotificationToggle('adminMessages')}
                    >
                      <MaterialIcons 
                        name={notificationSettings.adminMessages ? 'check' : 'close'} 
                        size={16} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>


                {/* Notification Preferences */}
                <View style={[styles.infoSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Notification Preferences
                  </ThemedText>
                  
                  <View style={styles.notificationItem}>
                    <View style={styles.notificationItemContent}>
                      <View style={[styles.notificationIconContainer, { backgroundColor: colorPalette.primaryLight + '20' }]}>
                        <MaterialIcons name="volume-up" size={20} color={colorPalette.primary} />
                      </View>
                      <View style={styles.notificationItemInfo}>
                        <ThemedText style={[styles.notificationItemTitle, { color: textColor }]}>
                          Sound
                        </ThemedText>
                        <ThemedText style={[styles.notificationItemDescription, { color: subtitleColor }]}>
                          Play sound when notifications arrive
                        </ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggleSwitch, { backgroundColor: notificationSettings.soundEnabled ? colorPalette.primary : '#ccc' }]}
                      onPress={() => handleNotificationToggle('soundEnabled')}
                    >
                      <MaterialIcons 
                        name={notificationSettings.soundEnabled ? 'check' : 'close'} 
                        size={16} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.notificationItem}>
                    <View style={styles.notificationItemContent}>
                      <View style={[styles.notificationIconContainer, { backgroundColor: colorPalette.primaryLight + '20' }]}>
                        <MaterialIcons name="vibration" size={20} color={colorPalette.primary} />
                      </View>
                      <View style={styles.notificationItemInfo}>
                        <ThemedText style={[styles.notificationItemTitle, { color: textColor }]}>
                          Vibration
                        </ThemedText>
                        <ThemedText style={[styles.notificationItemDescription, { color: subtitleColor }]}>
                          Vibrate device when notifications arrive
                        </ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggleSwitch, { backgroundColor: notificationSettings.vibrationEnabled ? colorPalette.primary : '#ccc' }]}
                      onPress={() => handleNotificationToggle('vibrationEnabled')}
                    >
                      <MaterialIcons 
                        name={notificationSettings.vibrationEnabled ? 'check' : 'close'} 
                        size={16} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity 
                  style={[styles.saveButton, { 
                    backgroundColor: colorPalette.primary,
                    shadowColor: colorPalette.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                  }]}
                  onPress={saveNotificationSettings}
                >
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <ThemedText style={[styles.saveButtonText, { color: '#fff' }]}>
                    Save Settings
                  </ThemedText>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Admin Selection Modal */}
        <Modal
          visible={adminSelectionModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAdminSelectionModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.adminSelectionModal, { backgroundColor: cardBgColor }]}>
              {/* Header */}
              <View style={[styles.adminModalHeader, { backgroundColor: isDark ? '#1A1A1A' : '#F8F9FA' }]}>
                <View style={styles.headerContent}>
                  <View style={[styles.logoWrapper, { backgroundColor: colorPalette.primary }]}>
                    <MaterialIcons name="phone" size={24} color="#fff" />
                  </View>
                  
                  <View style={styles.appInfoContainer}>
                    <ThemedText type="title" style={[styles.appName, { color: textColor }]}>
                      Call Support
                    </ThemedText>
                    <View style={[styles.versionBadge, { backgroundColor: '#4CAF50' }]}>
                      <ThemedText style={[styles.appVersion, { color: '#fff' }]}>
                        Choose Admin
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: isDark ? '#333' : '#E9ECEF' }]}
                  onPress={() => setAdminSelectionModalVisible(false)}
                >
                  <MaterialIcons name="close" size={20} color={textColor} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.adminModalContent} showsVerticalScrollIndicator={false}>
                <ThemedText style={[styles.adminSelectionTitle, { color: textColor }]}>
                  Select an admin to call:
                </ThemedText>
                
                {/* Admin List */}
                <View style={styles.adminList}>
                  <TouchableOpacity 
                    style={[styles.adminItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                    onPress={() => handleCallAdmin('Jayvee Briani', '+639100870754')}
                  >
                    <View style={[styles.adminAvatar, { backgroundColor: colorPalette.primary }]}>
                      <ThemedText style={[styles.adminInitials, { color: '#fff' }]}>JB</ThemedText>
                    </View>
                    <View style={styles.adminInfo}>
                      <ThemedText style={[styles.adminName, { color: textColor }]}>
                        Jayvee Briani
                      </ThemedText>
                      <ThemedText style={[styles.adminEmail, { color: subtitleColor }]}>
                        jayveebriani@gmail.com
                      </ThemedText>
                    </View>
                    <MaterialIcons name="phone" size={24} color={colorPalette.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.adminItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                    onPress={() => handleCallAdmin('Alfredo Sayson', '+639100870754')}
                  >
                    <View style={[styles.adminAvatar, { backgroundColor: '#FF9800' }]}>
                      <ThemedText style={[styles.adminInitials, { color: '#fff' }]}>AS</ThemedText>
                    </View>
                    <View style={styles.adminInfo}>
                      <ThemedText style={[styles.adminName, { color: textColor }]}>
                        Alfredo Sayson
                      </ThemedText>
                      <ThemedText style={[styles.adminEmail, { color: subtitleColor }]}>
                        alfredosayson@gmail.com
                      </ThemedText>
                    </View>
                    <MaterialIcons name="phone" size={24} color={colorPalette.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.adminItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                    onPress={() => handleCallAdmin('Sayson Admin', '+639100870754')}
                  >
                    <View style={[styles.adminAvatar, { backgroundColor: '#9C27B0' }]}>
                      <ThemedText style={[styles.adminInitials, { color: '#fff' }]}>SA</ThemedText>
                    </View>
                    <View style={styles.adminInfo}>
                      <ThemedText style={[styles.adminName, { color: textColor }]}>
                        Sayson Admin
                      </ThemedText>
                      <ThemedText style={[styles.adminEmail, { color: subtitleColor }]}>
                        sayson5@gmail.com
                      </ThemedText>
                    </View>
                    <MaterialIcons name="phone" size={24} color={colorPalette.primary} />
                  </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.adminModalFooter}>
                  <ThemedText style={[styles.adminFooterText, { color: subtitleColor }]}>
                    Available Mon-Fri: 8AM-6PM
                  </ThemedText>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Profile Menu */}
        <View style={styles.menuSection}>
          <ThemedText type="subtitle" style={[styles.menuTitle, { color: textColor }]}>
            Account Settings
          </ThemedText>
          
          {profileMenuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuItem, { backgroundColor: cardBgColor, borderColor }]}
              onPress={() => handleMenuAction(item.action)}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name={item.icon as any} size={20} color={colorPalette.primary} />
                <View style={styles.menuItemInfo}>
                  <ThemedText type="subtitle" style={[styles.menuItemTitle, { color: textColor }]}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={[styles.menuItemSubtitle, { color: subtitleColor }]}>
                    {item.subtitle}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
  userCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colorPalette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  editHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colorPalette.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',

  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
  themeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeSubtitle: {
    fontSize: 12,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Photo modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  photoModal: {
    width: '90%',
    borderRadius: 16,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  photoOptions: {
    padding: 16,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: 'transparent',
    gap: 12,
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
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
  // Professional About modal styles
  aboutModal: {
    width: '95%',
    maxWidth: 500,
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  professionalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  appLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  appInfoContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutContent: {
    padding: 20,
    paddingBottom: 10,
  },
  infoSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoDescription: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.9,
  },
  serviceList: {
    gap: 16,
    marginTop: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceContent: {
    flex: 1,
    marginLeft: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  contactInfo: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    marginLeft: 12,
    opacity: 0.9,
  },
  appDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    opacity: 0.8,
  },
  footerSection: {
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
  },
  copyright: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 4,
  },
  // New Help & Support modal styles
  heroSection: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  topicsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  topicsList: {
    gap: 12,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topicText: {
    marginLeft: 12,
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  topicDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  contactSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  // Notification settings styles
  notificationToggleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleSwitch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  notificationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  notificationItemInfo: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationItemDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  // Personal Information Form Styles
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Admin Selection Modal Styles
  adminSelectionModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  adminModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  adminModalContent: {
    padding: 20,
    paddingBottom: 10,
  },
  adminSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  adminList: {
    gap: 12,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adminInitials: {
    fontSize: 16,
    fontWeight: '600',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  adminModalFooter: {
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
  },
  adminFooterText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});