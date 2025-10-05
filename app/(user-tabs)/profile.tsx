// ========================================
// PROFILE SCREEN - PAMAMAHALA NG USER PROFILE
// ========================================
// Ang file na ito ay naghahandle ng user profile screen na may mga sumusunod na features:
// - Upload at pamamahala ng profile photo gamit ang Firebase Storage
// - Pag-edit at pag-save ng personal information
// - Pag-switch ng theme (dark/light mode)
// - Pamamahala ng notification settings
// - Help & support system na may FAQ
// - Information tungkol sa app
// - Live chat integration kasama ang admin support

// Import ng React Native core components at hooks
import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { ref as dbRef, onValue, set } from 'firebase/database';
// Tinanggal ang Storage upload; mag-save tayo ng data URL directly sa Realtime Database
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

// ========================================
// COLOR PALETTE CONFIGURATION
// ========================================
// Nagde-define ng color scheme ng app para sa consistent theming
// Ginagamit sa buong profile screen para sa UI elements
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

// ========================================
// SAMPLE USER DATA (FALLBACK)
// ========================================
// Default user data na ginagamit kapag walang Firebase data
// Sinisiguro nito na hindi masisira ang UI during loading states
const userData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: require('@/assets/images/logo.png'), // Ginagamit ang logo bilang placeholder avatar
};

// ========================================
// PROFILE MENU CONFIGURATION
// ========================================
// Nagde-define ng menu items na ipinapakita sa profile screen
// Bawat item ay may action na nag-trigger ng specific modals o functions
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

// ========================================
// MAIN PROFILE COMPONENT
// ========================================
// Ito ang main component na naghahandle ng buong profile screen
export default function Profile() {
  // ========================================
  // HOOKS AT ROUTER SETUP
  // ========================================
  const { colorScheme, toggleColorScheme } = useColorScheme(); // Para sa theme switching
  const isDark = colorScheme === 'dark'; // Check kung dark mode ang current theme
  const router = useRouter(); // Para sa navigation

  // ========================================
  // STATE VARIABLES - USER DATA
  // ========================================
  // State para sa user information na naka-display sa UI
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: null,
  });
  
  // State para sa profile photo URI (URL ng image)
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  // ========================================
  // STATE VARIABLES - MODAL VISIBILITY
  // ========================================
  // Mga state para sa pag-control ng visibility ng different modals
  const [photoModalVisible, setPhotoModalVisible] = useState(false); // Modal para sa photo selection
  const [isProcessingImage, setIsProcessingImage] = useState(false); // Loading state para sa image processing
  const [aboutModalVisible, setAboutModalVisible] = useState(false); // Modal para sa about app
  const [supportModalVisible, setSupportModalVisible] = useState(false); // Modal para sa help & support
  const [notificationModalVisible, setNotificationModalVisible] = useState(false); // Modal para sa notification settings
  const [personalInfoModalVisible, setPersonalInfoModalVisible] = useState(false); // Modal para sa personal info editing
  
  // State para sa expandable sections sa about modal
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    services: false,
    mission: false,
    contact: false,
    appInfo: false,
  });
  
  // ========================================
  // STATE VARIABLES - NOTIFICATION SETTINGS
  // ========================================
  // State para sa notification preferences ng user
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true, // Main toggle para sa lahat ng notifications
    reservationUpdates: true, // Notifications para sa reservations
    serviceAvailability: true, // Notifications para sa new services
    adminMessages: true, // Notifications para sa admin messages
    soundEnabled: true, // Sound effect para sa notifications
    vibrationEnabled: true, // Vibration para sa notifications
  });

  // ========================================
  // STATE VARIABLES - PERSONAL INFORMATION
  // ========================================
  // State para sa personal information ng user
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
  
  // State para sa pag-track kung nag-e-edit ang user ng personal info
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  // ========================================
  // FUNCTION: UPLOAD AT SAVE NG PROFILE PHOTO
  // ========================================
  // Ang function na ito ay naghahandle ng pag-upload at pag-save ng profile photo
  // Ginagamit ang ImageManipulator para sa image processing at Firebase para sa storage
  const uploadAndSaveProfilePhoto = async (localUri: string) => {
    try {
      // Kunin ang current authenticated user
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Not signed in', 'Please sign in to update your profile photo.');
        return;
      }

      // I-convert ang image to base64 gamit ang ImageManipulator (para iwasan ang deprecated FileSystem API)
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

      // Optionally i-update ang Firebase Auth profile (data URLs ay maaaring malaki; safe na i-skip)
      try { await updateProfile(user, { photoURL: dataUrl }); } catch {}

      // I-save sa Realtime Database (legacy path para sa compatibility)
      await set(dbRef(db, `users/${user.uid}/avatar`), dataUrl);
      await set(dbRef(db, `users/${user.uid}/updatedAt`), new Date().toISOString());

      // I-save sa separate profile image table
      await set(dbRef(db, `userProfileImages/${user.uid}`), {
        url: dataUrl,
        updatedAt: new Date().toISOString(),
      });

      // I-update ang local state
      setAvatarUri(dataUrl);
      Alert.alert('Success', 'Profile photo saved.');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', 'Could not upload and save profile photo.');
    }
  };

  // ========================================
  // USEEFFECT: LOAD USER DATA FROM FIREBASE
  // ========================================
  // Ang useEffect na ito ay naglo-load ng user data mula sa Firebase
  // Kapag nag-login ang user, automatic na ma-load ang profile information
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // I-set ang basic user data mula sa Firebase Auth
        setUserData({
          name: user.displayName || "No Name",
          email: user.email || "No Email",
          avatar: require('@/assets/images/logo.png'),
        });
        
        // I-load ang personal information mula sa database
        const personalInfoRef = dbRef(db, `users/${user.uid}/personalInfo`);
        const personalInfoUnsubscribe = onValue(personalInfoRef, (snap) => {
          const data = snap.val();
          if (data) {
            // Kung may existing personal info, i-merge sa current state
            setPersonalInfo(prev => ({
              ...prev,
              ...data,
              email: user.email || data.email || '',
            }));
          } else {
            // Kung walang personal info, i-initialize gamit ang user data
            setPersonalInfo(prev => ({
              ...prev,
              fullName: user.displayName || '',
              email: user.email || '',
            }));
          }
        });
        
        // I-load ang profile image - prefer separate table value; fallback to Auth photoURL
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
        
        // Cleanup function para sa real-time listeners
        return () => {
          personalInfoUnsubscribe();
          off();
        };
      }
    });

    return unsubscribe; // cleanup ng main auth listener
  }, []);
  
  // ========================================
  // THEME COLORS CONFIGURATION
  // ========================================
  // Dynamic colors na nagba-base sa current theme (dark/light)
  const bgColor = isDark ? '#121212' : '#fff'; // Background color ng main container
  const cardBgColor = isDark ? '#1E1E1E' : '#fff'; // Background color ng cards
  const textColor = isDark ? '#fff' : colorPalette.darkest; // Main text color
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark; // Subtitle text color
  const borderColor = isDark ? '#333' : '#eee'; // Border color para sa cards

  // ========================================
  // FUNCTION: HANDLE LOGOUT
  // ========================================
  // Ang function na ito ay naghahandle ng user logout
  // Nag-navigate back sa signin screen pagkatapos mag-logout
  const handleLogout = () => {
    console.log('Logout button pressed');
    
    // Mag-navigate back sa signin screen
    console.log('Navigating to signin');
    try {
      router.replace('/signin' as any);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/signin' as any);
    }
  };

  // ========================================
  // FUNCTION: PROCESS IMAGE
  // ========================================
  // Ang function na ito ay nagpo-process ng image bago i-upload
  // Nag-resize at nag-compress ng image para sa better performance
  const processImage = async (uri: string) => {
    try {
      setIsProcessingImage(true); // I-set ang loading state
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 300 } }], // I-resize ang image sa 300px width
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } // I-compress sa 80% quality
      );
      return manipResult.uri;
    } finally {
      setIsProcessingImage(false); // I-reset ang loading state
    }
  };

  // ========================================
  // FUNCTION: PICK IMAGE FROM DEVICE
  // ========================================
  // Ang function na ito ay naghahandle ng pag-pick ng image mula sa device gallery
  // Nag-request ng permission at nag-launch ng image picker
  const pickImageFromDevice = async () => {
    try {
      // Mag-request ng permission para sa photo library access
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to choose an image.');
        return;
      }

      // I-launch ang image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio para sa profile photo
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

  // ========================================
  // FUNCTION: TAKE PHOTO WITH CAMERA
  // ========================================
  // Ang function na ito ay naghahandle ng pag-take ng photo gamit ang camera
  // Nag-request ng camera permission at nag-launch ng camera
  const takePhotoWithCamera = async () => {
    try {
      // Mag-request ng permission para sa camera access
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow camera access to take a photo.');
        return;
      }

      // I-launch ang camera
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio para sa profile photo
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

    // Use the first admin from admin configuration
    const adminEmail = 'xxc49540@gmail.com'; // Primary admin email
    const adminName = 'Admin Support';
    
    // Generate chat ID based on user and admin emails
    const chatId = [user.email, adminEmail].sort().join('_');
    
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: chatId,
        chatId: chatId,
        recipientName: adminName,
        recipientEmail: adminEmail,
        currentUserEmail: user.email || '',
      }
    });
  };


  const handleFAQPress = (faqType: string) => {
    switch (faqType) {
      case 'apartment-booking':
        Alert.alert(
          'How to Book an Apartment',
          '1. Go to the Home tab\n2. Scroll to "Apartment Rentals" section\n3. Tap on an available apartment\n4. Review details and tap "Book Now"\n5. Fill in your information and confirm booking\n\nYou will receive a confirmation notification once your booking is processed.',
          [{ text: 'Got it!', style: 'default' }]
        );
        break;
      case 'laundry-services':
        Alert.alert(
          'How to Use Laundry Services',
          '1. Go to the Home tab\n2. Scroll to "Laundry Services" section\n3. Select your preferred laundry service\n4. Choose your service type and schedule\n5. Drop off your clothes at the designated area\n6. Track your laundry status in the Bookings tab\n\nYou will be notified when your laundry is ready for pickup.',
          [{ text: 'Got it!', style: 'default' }]
        );
        break;
      case 'car-services':
        Alert.alert(
          'How to Schedule Car Services',
          '1. Go to the Home tab\n2. Scroll to "Car and Motor Services" section\n3. Select the service you need\n4. Choose your preferred date and time\n5. Provide vehicle details and service description\n6. Confirm your appointment\n\nOur technicians will contact you to confirm the appointment and location.',
          [{ text: 'Got it!', style: 'default' }]
        );
        break;
      case 'view-bookings':
        router.push('/(user-tabs)/bookings');
        break;
      case 'payment-billing':
        Alert.alert(
          'Payment and Billing',
          'Payment Methods:\n• Cash on service\n• Bank transfer\n• Mobile payment apps\n\nBilling:\n• You will receive a receipt after service completion\n• All prices are displayed before booking\n• No hidden fees or charges\n\nFor billing questions, contact support.',
          [{ text: 'Got it!', style: 'default' }]
        );
        break;
      case 'notification-settings':
        setNotificationModalVisible(true);
        break;
      default:
        break;
    }
  };

  const handleHelpCenterPress = () => {
    Alert.alert(
      'Help Center',
      'Choose a topic for detailed guides:',
      [
        {
          text: 'Apartment Booking Guide',
          onPress: () => handleFAQPress('apartment-booking')
        },
        {
          text: 'Laundry Services Guide',
          onPress: () => handleFAQPress('laundry-services')
        },
        {
          text: 'Car Services Guide',
          onPress: () => handleFAQPress('car-services')
        },
        {
          text: 'Payment & Billing Info',
          onPress: () => handleFAQPress('payment-billing')
        },
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
                      style={[styles.textInput, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5', color: subtitleColor, borderColor }]}
                      value={personalInfo.email}
                      editable={false}
                      placeholder="Email address"
                      placeholderTextColor={subtitleColor}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <ThemedText style={[styles.helpText, { color: subtitleColor }]}>
                      Email address cannot be changed
                    </ThemedText>
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
                    Gereu Online Hub is your comprehensive mobile platform for apartment rentals, laundry services, and car maintenance within the Gereu Building. 
                    We provide convenient access to essential community services, real-time booking management, and seamless communication with service providers.
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
                            Browse available apartments in the Gereu Building with real-time availability, detailed photos, pricing, and instant booking capabilities.
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.serviceItem}>
                        <MaterialIcons name="local-laundry-service" size={20} color={colorPalette.primary} />
                        <View style={styles.serviceContent}>
                          <ThemedText style={[styles.serviceTitle, { color: textColor }]}>
                            Laundry Services
                          </ThemedText>
                          <ThemedText style={[styles.serviceDescription, { color: subtitleColor }]}>
                            Professional laundry services with pickup/delivery options, status tracking, and notifications when your laundry is ready.
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
                            Professional automotive maintenance and repair services with certified technicians, quality parts, and convenient scheduling.
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.serviceItem}>
                        <MaterialIcons name="notifications" size={20} color={colorPalette.primary} />
                        <View style={styles.serviceContent}>
                          <ThemedText style={[styles.serviceTitle, { color: textColor }]}>
                            Real-time Notifications
                          </ThemedText>
                          <ThemedText style={[styles.serviceDescription, { color: subtitleColor }]}>
                            Stay updated with instant notifications for booking confirmations, service updates, and important announcements.
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.serviceItem}>
                        <MaterialIcons name="chat" size={20} color={colorPalette.primary} />
                        <View style={styles.serviceContent}>
                          <ThemedText style={[styles.serviceTitle, { color: textColor }]}>
                            Live Support
                          </ThemedText>
                          <ThemedText style={[styles.serviceDescription, { color: subtitleColor }]}>
                            Get instant help through live chat, phone support, and email assistance for all your service needs.
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
                      To revolutionize community living in the Gereu Building by providing seamless access to apartment rentals, laundry services, and car maintenance through our innovative mobile platform. 
                      We aim to make essential services more convenient, transparent, and accessible for all residents and users.
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
                          09100870754
                        </ThemedText>
                      </View>
                      
                      <View style={styles.contactRow}>
                        <MaterialIcons name="location-on" size={18} color={colorPalette.primary} />
                        <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
                          Gereu Building, Philippines
                        </ThemedText>
                      </View>
                      
                      <View style={styles.contactRow}>
                        <MaterialIcons name="schedule" size={18} color={colorPalette.primary} />
                        <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
                          Monday - Friday: 8:00 AM - 6:00 PM
                        </ThemedText>
                      </View>
                      
                      <View style={styles.contactRow}>
                        <MaterialIcons name="chat" size={18} color={colorPalette.primary} />
                        <ThemedText style={[styles.contactText, { color: subtitleColor }]}>
                          Live chat available 24/7 in the app
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
                        <ThemedText style={[styles.detailLabel, { color: textColor }]}>Services:</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: subtitleColor }]}>Apartments, Laundry, Car Services</ThemedText>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: textColor }]}>Last Updated:</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: subtitleColor }]}>January 2025</ThemedText>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: textColor }]}>Location:</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: subtitleColor }]}>Gereu Building, Philippines</ThemedText>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <ThemedText style={[styles.detailLabel, { color: textColor }]}>Developer:</ThemedText>
                        <ThemedText style={[styles.detailValue, { color: subtitleColor }]}>Gereu Online Hub Team</ThemedText>
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
                    Your trusted platform for apartment rentals, laundry services, and car maintenance in the Gereu Building
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
                      Get support for apartments, laundry, and car services
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
                      Instant support
                    </ThemedText>
                  </TouchableOpacity>


                  <TouchableOpacity 
                    style={[styles.quickActionCard, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                    onPress={handleHelpCenterPress}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#9C27B0' }]}>
                      <MaterialIcons name="help" size={24} color="#fff" />
                    </View>
                    <ThemedText style={[styles.quickActionTitle, { color: textColor }]}>
                      Help Center
                    </ThemedText>
                    <ThemedText style={[styles.quickActionSubtitle, { color: subtitleColor }]}>
                      Guides & tutorials
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Popular Topics */}
                <View style={[styles.topicsSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor }]}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    Frequently Asked Questions
                  </ThemedText>
                  
                  <View style={styles.topicsList}>
                    <TouchableOpacity 
                      style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                      onPress={() => handleFAQPress('apartment-booking')}
                    >
                      <View style={styles.topicContent}>
                        <MaterialIcons name="apartment" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            How to Book an Apartment?
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Step-by-step guide to finding and reserving apartments
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                      onPress={() => handleFAQPress('laundry-services')}
                    >
                      <View style={styles.topicContent}>
                        <MaterialIcons name="local-laundry-service" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            How to Use Laundry Services?
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Learn how to book and track your laundry
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                      onPress={() => handleFAQPress('car-services')}
                    >
                      <View style={styles.topicContent}>
                        <MaterialIcons name="directions-car" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            How to Schedule Car Services?
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Book maintenance and repair services for your vehicle
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                      onPress={() => handleFAQPress('view-bookings')}
                    >
                      <View style={styles.topicContent}>
                        <MaterialIcons name="receipt" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            How to View My Bookings?
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Check your reservation status and history
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                      onPress={() => handleFAQPress('payment-billing')}
                    >
                      <View style={styles.topicContent}>
                        <MaterialIcons name="payment" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            Payment and Billing
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Information about payment methods and billing
                          </ThemedText>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={subtitleColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.topicItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}
                      onPress={() => handleFAQPress('notification-settings')}
                    >
                      <View style={styles.topicContent}>
                        <MaterialIcons name="notifications" size={20} color={colorPalette.primary} />
                        <View style={styles.topicText}>
                          <ThemedText style={[styles.topicTitle, { color: textColor }]}>
                            Notification Settings
                          </ThemedText>
                          <ThemedText style={[styles.topicDescription, { color: subtitleColor }]}>
                            Manage your notification preferences
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
                    Contact Support
                  </ThemedText>
                  
                  <View style={styles.contactGrid}>
                    <View style={[styles.contactItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <MaterialIcons name="email" size={24} color={colorPalette.primary} />
                      <ThemedText style={[styles.contactLabel, { color: textColor }]}>
                        Email Support
                      </ThemedText>
                      <ThemedText style={[styles.contactValue, { color: subtitleColor }]}>
                        support@gereuonlinehub.com
                      </ThemedText>
                    </View>

                    <View style={[styles.contactItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <MaterialIcons name="phone" size={24} color={colorPalette.primary} />
                      <ThemedText style={[styles.contactLabel, { color: textColor }]}>
                        Phone Support
                      </ThemedText>
                      <ThemedText style={[styles.contactValue, { color: subtitleColor }]}>
                        09100870754
                      </ThemedText>
                    </View>

                    <View style={[styles.contactItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <MaterialIcons name="schedule" size={24} color={colorPalette.primary} />
                      <ThemedText style={[styles.contactLabel, { color: textColor }]}>
                        Support Hours
                      </ThemedText>
                      <ThemedText style={[styles.contactValue, { color: subtitleColor }]}>
                        Mon-Fri: 8AM-6PM
                      </ThemedText>
                    </View>

                    <View style={[styles.contactItem, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA', borderColor }]}>
                      <MaterialIcons name="location-on" size={24} color={colorPalette.primary} />
                      <ThemedText style={[styles.contactLabel, { color: textColor }]}>
                        Service Area
                      </ThemedText>
                      <ThemedText style={[styles.contactValue, { color: subtitleColor }]}>
                        Gereu Building, Philippines
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.footerSection}>
                  <ThemedText style={[styles.copyright, { color: subtitleColor }]}>
                    Need help with apartments, laundry, or car services? We're here to help!
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
  helpText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
});