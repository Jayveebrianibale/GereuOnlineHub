import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { equalTo, get, onValue, orderByChild, push, query, ref, update } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { isAdminEmail } from '../config/adminConfig';
import { useAuthContext } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';
import { convertAndStoreImageAsBase64 } from '../services/base64ImageService';
import { notifyAdminByEmail, notifyUserByEmail } from '../services/notificationService';
import { formatPHP } from '../utils/currency';

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

interface Message {
  id: string;
  text: string;
  sender: string;
  senderEmail: string;
  timestamp: number;
  isAdmin: boolean;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  imageUrl?: string;
  image?: string; // For apartment inquiry images
  base64Image?: string; // For base64 encoded images stored in RTDB
  messageType?: 'text' | 'image' | 'apartment_inquiry' | 'laundry_inquiry' | 'auto_inquiry';
  deletedFor?: string[]; // Array of user emails who have deleted this message
  readBy?: string[]; // Array of user emails who have read this message
  // Apartment inquiry fields
  apartmentTitle?: string;
  apartmentPrice?: number;
  apartmentLocation?: string;
  // Laundry inquiry fields
  laundryTitle?: string;
  laundryPrice?: number;
  laundryTurnaround?: string;
  // Auto inquiry fields
  autoTitle?: string;
  autoPrice?: number;
  autoDuration?: string;
  category?: string;
  serviceId?: string;
}

interface ChatScreenProps {
  route: any;
  navigation?: any;
}

interface RecipientProfile {
  name: string;
  email: string;
  profileImageUrl?: string;
  isOnline?: boolean;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { user } = useAuthContext();
  const { chatId, recipientName, recipientEmail } = route.params;
  const currentUserEmail = user?.email || '';
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  
  // Refs for stability
  const textInputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  
  const isDark = colorScheme === 'dark';
  const isAdmin = isAdminEmail(currentUserEmail);

  // Colors
  const bgColor = isDark ? '#121212' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const inputBgColor = isDark ? '#2A2A2A' : '#f8f8f8';
  const bubbleBgColor = isDark ? '#2A2A2A' : '#e6e6e6';
  const adminBubbleBgColor = isDark ? '#004d40' : '#b2dfdb';
  const userBubbleBgColor = isDark ? '#1b5e20' : '#81c784';

  // Function to fetch recipient profile data
  const fetchRecipientProfile = useCallback(async (email: string) => {
    if (!email) return;
    
    try {
      // Find user ID by email
      const usersRef = ref(db, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (usersSnapshot.exists()) {
        const usersData = usersSnapshot.val();
        for (const userId in usersData) {
          if (usersData[userId].email === email) {
            const userData = usersData[userId];
            
            // Get profile image
            let profileImageUrl = null;
            try {
              const imageRef = ref(db, `userProfileImages/${userId}/url`);
              const imageSnapshot = await get(imageRef);
              if (imageSnapshot.exists()) {
                profileImageUrl = imageSnapshot.val();
              }
            } catch (imageError) {
              console.log('No profile image found for user:', email);
            }
            
            setRecipientProfile({
              name: userData.name || userData.displayName || email.split('@')[0],
              email: email,
              profileImageUrl: profileImageUrl,
              isOnline: userData.status === 'active'
            });
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching recipient profile:', error);
      // Set fallback profile data
      setRecipientProfile({
        name: recipientName || email.split('@')[0],
        email: email,
        profileImageUrl: undefined,
        isOnline: false
      });
    }
  }, [recipientName]);

  // Function to mark messages as read
  const markMessagesAsRead = async (messagesList: Message[], userEmail: string) => {
    try {
      const updates: { [key: string]: any } = {};
      
      messagesList.forEach(message => {
        // Only mark messages as read if user is the recipient and hasn't read them yet
        if (message.recipientEmail === userEmail) {
          const readBy = message.readBy || [];
          if (!readBy.includes(userEmail)) {
            updates[`messages/${message.id}/readBy`] = [...readBy, userEmail];
          }
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
        console.log('Messages marked as read for:', userEmail);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Load messages
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = query(
      ref(db, 'messages'),
      orderByChild('chatId'),
      equalTo(chatId)
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messagesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }))
        .filter(message => {
          // Filter out messages that have been deleted for the current user
          return !message.deletedFor || !message.deletedFor.includes(currentUserEmail);
        })
        .sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(messagesList);
        
        // Mark messages as read if current user is the recipient
        if (currentUserEmail) {
          markMessagesAsRead(messagesList, currentUserEmail);
        }
        
        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        setMessages([]);
      }
    }, (error) => {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please check your connection.');
    });

    return () => unsubscribe();
  }, [chatId]);

  // Fetch recipient profile when component mounts
  useEffect(() => {
    if (recipientEmail) {
      fetchRecipientProfile(recipientEmail);
    }
  }, [recipientEmail, fetchRecipientProfile]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Send message function
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !currentUserEmail || isLoading) return;

    setIsLoading(true);
    const messageText = inputText.trim();

    try {
      const messageData = {
        text: messageText,
        sender: isAdmin ? 'Admin' : 'User',
        senderEmail: currentUserEmail,
        timestamp: Date.now(),
        chatId: chatId,
        isAdmin: isAdmin,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        senderName: isAdmin ? 'Admin' : currentUserEmail.split('@')[0],
        messageType: 'text',
      };

      await push(ref(db, 'messages'), messageData);
      
      // Send push notification to recipient
      if (recipientEmail) {
        try {
          const notificationTitle = isAdmin ? 'New message from Admin' : 'New message from User';
          const notificationBody = messageText.length > 50 
            ? `${messageText.substring(0, 50)}...` 
            : messageText;
          
          const notificationData = {
            type: 'message',
            chatId: chatId,
            senderEmail: currentUserEmail,
            senderName: isAdmin ? 'Admin' : currentUserEmail.split('@')[0],
            messageId: (messageData as any).id || 'unknown'
          };

          console.log('📱 Sending text message notification:', {
            recipientEmail,
            notificationTitle,
            notificationBody,
            isAdmin,
            messageText: messageText.substring(0, 20) + '...'
          });

          if (isAdmin) {
            // Admin sending to user
            console.log('📤 Admin sending notification to user:', recipientEmail);
            await notifyUserByEmail(recipientEmail, notificationTitle, notificationBody, notificationData);
          } else {
            // User sending to admin
            console.log('📤 User sending notification to admin:', recipientEmail);
            await notifyAdminByEmail(recipientEmail, notificationTitle, notificationBody, notificationData);
          }
          
          console.log('✅ Text message notification sent successfully');
        } catch (notificationError) {
          console.error('❌ Failed to send push notification for text message:', notificationError);
          // Don't fail the message send if notification fails
        }
      } else {
        console.warn('⚠️ No recipient email provided, skipping text message notification');
      }
      
      // Clear input and refocus
      setInputText('');
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, currentUserEmail, chatId, recipientEmail, recipientName, isLoading, isAdmin]);

  // Send image function using base64 storage
  const sendImage = useCallback(async (imageUri: string) => {
    if (!currentUserEmail || isLoading) return;

    setIsLoading(true);

    try {
      console.log('📸 Starting base64 image send process...');
      
      // Convert image to base64 and store in Firebase Realtime Database
      const result = await convertAndStoreImageAsBase64(
        imageUri,
        chatId,
        currentUserEmail,
        recipientEmail,
        '📷 Image',
        0.8 // 80% quality
      );
      
      console.log('✅ Base64 image sent successfully', { messageId: result.messageId });
      
      // Send push notification to recipient
      if (recipientEmail) {
        try {
          const senderName = isAdmin ? 'Admin' : currentUserEmail.split('@')[0];
          const notificationTitle = isAdmin ? 'New image from Admin' : 'New image from User';
          const notificationBody = `📷 ${senderName} sent an image`;
          
          const notificationData = {
            type: 'message',
            chatId: chatId,
            senderEmail: currentUserEmail,
            senderName: senderName,
            messageId: result.messageId,
            messageType: 'image'
          };

          console.log('📱 Sending image message notification:', {
            recipientEmail,
            notificationTitle,
            notificationBody,
            isAdmin,
            senderName
          });

          if (isAdmin) {
            // Admin sending to user
            console.log('📤 Admin sending image notification to user:', recipientEmail);
            await notifyUserByEmail(recipientEmail, notificationTitle, notificationBody, notificationData);
          } else {
            // User sending to admin
            console.log('📤 User sending image notification to admin:', recipientEmail);
            await notifyAdminByEmail(recipientEmail, notificationTitle, notificationBody, notificationData);
          }
          
          console.log('✅ Image message notification sent successfully');
        } catch (notificationError) {
          console.error('❌ Failed to send push notification for image:', notificationError);
          // Don't fail the image send if notification fails
        }
      } else {
        console.warn('⚠️ No recipient email provided, skipping image message notification');
      }
      
    } catch (error) {
      console.error('Error sending base64 image:', error);
      Alert.alert('Error', 'Failed to send image. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserEmail, chatId, recipientEmail, recipientName, isLoading, isAdmin]);

  // Show image preview
  const showPreview = (imageUri: string) => {
    setPreviewImageUri(imageUri);
    setShowImagePreview(true);
  };

  // Send full image
  const sendFullImage = async () => {
    if (previewImageUri) {
      await sendImage(previewImageUri);
      setShowImagePreview(false);
      setPreviewImageUri(null);
    }
  };

  // Crop image
  const cropImage = async () => {
    if (!previewImageUri) return;
    
    try {
      // Close the preview first
      setShowImagePreview(false);
      
      // Use Expo ImagePicker with editing enabled
      Alert.alert(
        'Crop Image',
        'Please select the same image again to crop it.',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                const editResult = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                  base64: false,
                });

                if (!editResult.canceled && editResult.assets[0]) {
                  await sendImage(editResult.assets[0].uri);
                  setPreviewImageUri(null);
                }
              } catch (editError: any) {
                console.error('Error editing image:', editError);
                Alert.alert('Error', 'Failed to edit image. Please try again.');
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowImagePreview(true)
          }
        ]
      );
    } catch (editError: any) {
      console.error('Error editing image:', editError);
      Alert.alert('Error', 'Failed to edit image. Please try again.');
      setShowImagePreview(true);
    }
  };

  // Image picker function
  const pickImage = useCallback(async () => {
    try {
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          {
            text: 'Camera',
            onPress: async () => {
              try {
                // Request camera permissions
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
                  return;
                }

                // Launch camera without editing first
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: false,
                  quality: 0.8,
                  base64: false,
                });

                if (!result.canceled && result.assets[0]) {
                  showPreview(result.assets[0].uri);
                }
              } catch (error) {
                console.error('Error taking photo:', error);
                Alert.alert('Error', 'Failed to take photo. Please try again.');
              }
            }
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              try {
                // Request media library permissions
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission Required', 'Please grant camera roll permissions to select images.');
                  return;
                }

                // Launch image picker without editing first
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: false,
                  quality: 0.8,
                  base64: false,
                });

                if (!result.canceled && result.assets[0]) {
                  showPreview(result.assets[0].uri);
                }
              } catch (error) {
                console.error('Error picking image:', error);
                Alert.alert('Error', 'Failed to pick image. Please try again.');
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error in image picker:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  }, []);

  // Menu functions
  const handleClearChat = async () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages in this chat for yourself?\n\nThis will only clear the chat from your view. The other person will still see all messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear for Me',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all messages for this chat
              const messagesRef = query(
                ref(db, 'messages'),
                orderByChild('chatId'),
                equalTo(chatId)
              );
              
              const snapshot = await get(messagesRef);
              if (snapshot.exists()) {
                const data = snapshot.val();
                const messageIds = Object.keys(data);
                
                // Update each message to add current user to deletedFor array
                const updatePromises = messageIds.map(async (messageId) => {
                  const messageRef = ref(db, `messages/${messageId}`);
                  const messageSnapshot = await get(messageRef);
                  
                  if (messageSnapshot.exists()) {
                    const messageData = messageSnapshot.val();
                    const deletedFor = messageData.deletedFor || [];
                    
                    // Add current user to deletedFor array if not already present
                    if (!deletedFor.includes(currentUserEmail)) {
                      deletedFor.push(currentUserEmail);
                      await update(messageRef, { deletedFor });
                    }
                  }
                });
                
                await Promise.all(updatePromises);
                
                // Clear local state
                setMessages([]);
                
                Alert.alert('Success', 'Chat cleared for you successfully!');
              } else {
                Alert.alert('Info', 'No messages to clear.');
              }
            } catch (error) {
              console.error('Error clearing chat:', error);
              Alert.alert('Error', 'Failed to clear chat. Please try again.');
            } finally {
              setShowMenu(false);
            }
          }
        }
      ]
    );
  };


  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${recipientName || 'this user'}? You won't be able to receive messages from them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'User blocked successfully!');
            setShowMenu(false);
          }
        }
      ]
    );
  };

  const handleChatInfo = () => {
    Alert.alert(
      'Chat Information',
      `Chat with: ${recipientName || 'Unknown'}\nEmail: ${recipientEmail || 'N/A'}\nMessages: ${messages.length}`,
      [{ text: 'OK', onPress: () => setShowMenu(false) }]
    );
  };

  // Handle message deletion (delete for me only)
  const handleDeleteMessage = async (messageId: string, messageText: string) => {
    Alert.alert(
      'Delete Message',
      `Are you sure you want to delete this message for yourself?\n\n"${messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText}"\n\nThis message will only be deleted from your view.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete for Me',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get the current message to check if deletedFor array exists
              const messageRef = ref(db, `messages/${messageId}`);
              const snapshot = await get(messageRef);
              
              if (snapshot.exists()) {
                const messageData = snapshot.val();
                const deletedFor = messageData.deletedFor || [];
                
                // Add current user to deletedFor array if not already present
                if (!deletedFor.includes(currentUserEmail)) {
                  deletedFor.push(currentUserEmail);
                  
                  // Update the message with the new deletedFor array
                  await update(messageRef, { deletedFor });
                  console.log('Message deleted for current user');
                }
              }
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle image tap to view full screen
  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowImageViewer(true);
  };

  // Render message
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderEmail === currentUserEmail;
    const isMessageFromAdmin = item.isAdmin;
    const isImageMessage = item.messageType === 'image' && (item.imageUrl || item.base64Image);
    const isApartmentInquiry = item.messageType === 'apartment_inquiry' && (item.image || item.imageUrl);
    const isLaundryInquiry = item.messageType === 'laundry_inquiry' && (item.image || item.imageUrl);
    const isAutoInquiry = item.messageType === 'auto_inquiry' && (item.image || item.imageUrl);
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <TouchableOpacity
          style={[
            styles.messageBubble,
            isImageMessage ? styles.imageMessageBubble : {},
            isApartmentInquiry ? styles.apartmentInquiryBubble : {},
            isLaundryInquiry ? styles.laundryInquiryBubble : {},
            isAutoInquiry ? styles.autoInquiryBubble : {},
            {
              backgroundColor: isCurrentUser 
                ? (isMessageFromAdmin ? adminBubbleBgColor : userBubbleBgColor)
                : bubbleBgColor,
            }
          ]}
          onLongPress={() => handleDeleteMessage(item.id, item.text)}
          activeOpacity={0.7}
          delayLongPress={500}
        >
          {isImageMessage ? (
            <View style={styles.imageContainer}>
              <TouchableOpacity
                onPress={() => handleImagePress(item.imageUrl || `data:image/jpeg;base64,${item.base64Image}`)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ 
                    uri: item.imageUrl || `data:image/jpeg;base64,${item.base64Image}` 
                  }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          ) : isApartmentInquiry ? (
            <View style={styles.apartmentInquiryContainer}>
              <View style={styles.apartmentInquiryHeader}>
                <ThemedText style={[styles.apartmentInquiryTitle, { color: textColor }]}>
                  🏠 Apartment Inquiry
                </ThemedText>
              </View>
              
              {(item.image || item.imageUrl) && (
                <TouchableOpacity
                  onPress={() => handleImagePress(item.image || item.imageUrl!)}
                  activeOpacity={0.8}
                  style={styles.apartmentImageContainer}
                >
                  <Image
                    source={{ uri: item.image || item.imageUrl }}
                    style={styles.apartmentInquiryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              
              <View style={styles.apartmentInquiryDetails}>
                <ThemedText style={[styles.apartmentInquiryName, { color: textColor }]}>
                  {item.apartmentTitle || 'Apartment'}
                </ThemedText>
                
                {item.apartmentPrice && (
                  <ThemedText style={[styles.apartmentInquiryPrice, { color: colorPalette.primary }]}>
                    {formatPHP(item.apartmentPrice)}
                  </ThemedText>
                )}
                
                {item.apartmentLocation && (
                  <View style={styles.apartmentLocationRow}>
                    <MaterialIcons name="location-on" size={14} color={isDark ? subtitleColor : colorPalette.dark} />
                    <ThemedText style={[styles.apartmentLocationText, { color: isDark ? subtitleColor : colorPalette.dark }]}>
                      {item.apartmentLocation}
                    </ThemedText>
                  </View>
                )}
              </View>
              
              <ThemedText style={[styles.messageText, { color: textColor, marginTop: 8, fontStyle: 'italic' }]}>
                {item.text}
              </ThemedText>
            </View>
          ) : isLaundryInquiry ? (
            <View style={styles.laundryInquiryContainer}>
              <View style={styles.laundryInquiryHeader}>
                <ThemedText style={[styles.laundryInquiryTitle, { color: textColor }]}>
                  🧺 Laundry Inquiry
                </ThemedText>
              </View>
              
              {(item.image || item.imageUrl) && (
                <TouchableOpacity
                  onPress={() => handleImagePress(item.image || item.imageUrl!)}
                  activeOpacity={0.8}
                  style={styles.laundryImageContainer}
                >
                  <Image
                    source={{ uri: item.image || item.imageUrl }}
                    style={styles.laundryInquiryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              
              <View style={styles.laundryInquiryDetails}>
                <ThemedText style={[styles.laundryInquiryName, { color: textColor }]}>
                  {item.laundryTitle || 'Laundry Service'}
                </ThemedText>
                
                {item.laundryPrice && (
                  <ThemedText style={[styles.laundryInquiryPrice, { color: colorPalette.primary }]}>
                    {formatPHP(item.laundryPrice)}
                  </ThemedText>
                )}
                
                {item.laundryTurnaround && (
                  <View style={styles.laundryTurnaroundRow}>
                    <MaterialIcons name="schedule" size={14} color={isDark ? subtitleColor : colorPalette.dark} />
                    <ThemedText style={[styles.laundryTurnaroundText, { color: isDark ? subtitleColor : colorPalette.dark }]}>
                      {item.laundryTurnaround}
                    </ThemedText>
                  </View>
                )}
              </View>
              
              <ThemedText style={[styles.messageText, { color: textColor, marginTop: 8, fontStyle: 'italic' }]}>
                {item.text}
              </ThemedText>
            </View>
          ) : isAutoInquiry ? (
            <View style={styles.autoInquiryContainer}>
              <View style={styles.autoInquiryHeader}>
                <ThemedText style={[styles.autoInquiryTitle, { color: textColor }]}>
                  🚗 Car and Motor Services Inquiry
                </ThemedText>
              </View>
              
              {(item.image || item.imageUrl) && (
                <TouchableOpacity
                  onPress={() => handleImagePress(item.image || item.imageUrl!)}
                  activeOpacity={0.8}
                  style={styles.autoImageContainer}
                >
                  <Image
                    source={{ uri: item.image || item.imageUrl }}
                    style={styles.autoInquiryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              
              <View style={styles.autoInquiryDetails}>
                <ThemedText style={[styles.autoInquiryName, { color: textColor }]}>
                  {item.autoTitle || 'Car and Motor Parts Service'}
                </ThemedText>
                
                {item.autoPrice && (
                  <ThemedText style={[styles.autoInquiryPrice, { color: colorPalette.primary }]}>
                    {formatPHP(item.autoPrice)}
                  </ThemedText>
                )}
                
                {item.autoDuration && (
                  <View style={styles.autoDurationRow}>
                    <MaterialIcons name="schedule" size={14} color={isDark ? subtitleColor : colorPalette.dark} />
                    <ThemedText style={[styles.autoDurationText, { color: isDark ? subtitleColor : colorPalette.dark }]}>
                      {item.autoDuration}
                    </ThemedText>
                  </View>
                )}
              </View>
              
              <ThemedText style={[styles.messageText, { color: textColor, marginTop: 8, fontStyle: 'italic' }]}>
                {item.text}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={[styles.messageText, { color: textColor }]}>
              {item.text}
            </ThemedText>
          )}
          <View style={styles.messageFooter}>
            <ThemedText style={[styles.messageTime, { color: textColor, opacity: 0.6 }]}>
              {new Date(item.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </ThemedText>
            {isCurrentUser && (
              <Ionicons 
                name="checkmark-done" 
                size={12} 
                color={textColor} 
                style={{ opacity: 0.6, marginLeft: 4 }}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 2, android: 0 }) as number}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          
          {/* Profile Section */}
          <TouchableOpacity style={styles.profileSection} activeOpacity={0.7}>
            <View style={styles.profileImageContainer}>
              {recipientProfile?.profileImageUrl ? (
                <Image
                  source={{ uri: recipientProfile.profileImageUrl }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: colorPalette.primary }]}>
                  <ThemedText style={styles.profileImageText}>
                    {(recipientProfile?.name || recipientName || 'U').charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
              )}
              {recipientProfile?.isOnline && (
                <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
              )}
            </View>
            
            <View style={styles.headerInfo}>
              <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                {recipientProfile?.name || recipientName || 'Chat'}
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: textColor, opacity: 0.6 }]}>
                {recipientProfile?.isOnline ? 'Online' : (isAdmin ? 'Admin Chat' : 'User Chat')}
              </ThemedText>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
        
        {/* Messages List */}
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color={textColor} style={{ opacity: 0.3 }} />
              <ThemedText style={[styles.emptyText, { color: textColor, opacity: 0.6 }]}>
                Start a conversation...
              </ThemedText>
            </View>
          }
        />
        
        {/* Enhanced Input Container */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderTopColor: isDark ? '#2A2A2A' : '#E0E0E0',
            borderTopWidth: 1,
            shadowColor: isDark ? '#000' : '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: isDark ? 0.2 : 0.08,
            shadowRadius: isDark ? 6 : 8,
            elevation: isDark ? 6 : 8,
          }
        ]}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={[
                styles.imageButton,
                {
                  backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA',
                  borderColor: isDark ? '#444' : '#E1E5E9',
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: isDark ? 0.2 : 0.1,
                  shadowRadius: isDark ? 4 : 6,
                  elevation: isDark ? 4 : 6,
                }
              ]}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Ionicons 
                name="camera" 
                size={22} 
                color={isDark ? '#FFFFFF' : '#007AFF'} 
              />
            </TouchableOpacity>
            
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA',
                  color: textColor,
                  borderColor: isInputFocused 
                    ? (isDark ? '#007AFF' : '#007AFF') 
                    : (isDark ? '#444' : '#E1E5E9'),
                  borderWidth: isInputFocused ? 2 : 1,
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: isDark ? 0.2 : 0.08,
                  shadowRadius: isDark ? 4 : 8,
                  elevation: isDark ? 4 : 8,
                }
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Message ${recipientName || 'user'}...`}
              placeholderTextColor={isDark ? '#AAA' : '#8E8E93'}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
              editable={!isLoading}
              autoCorrect={false}
              autoCapitalize="sentences"
              onFocus={() => {
                console.log('TextInput focused');
                setIsInputFocused(true);
                // Auto-scroll to bottom when input is focused
                setTimeout(() => {
                  listRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              onBlur={() => {
                console.log('TextInput blurred');
                setIsInputFocused(false);
              }}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() && !isLoading 
                    ? (isDark ? '#007AFF' : '#007AFF') 
                    : (isDark ? '#444' : '#C7C7CC'),
                  shadowColor: inputText.trim() && !isLoading 
                    ? (isDark ? '#007AFF' : '#007AFF') 
                    : (isDark ? '#000' : '#000'),
                  shadowOffset: {
                    width: 0,
                    height: 3,
                  },
                  shadowOpacity: inputText.trim() && !isLoading 
                    ? (isDark ? 0.4 : 0.3) 
                    : (isDark ? 0.2 : 0.1),
                  shadowRadius: inputText.trim() && !isLoading 
                    ? (isDark ? 6 : 8) 
                    : (isDark ? 4 : 6),
                  elevation: inputText.trim() && !isLoading 
                    ? (isDark ? 6 : 8) 
                    : (isDark ? 4 : 6),
                  opacity: isLoading ? 0.6 : 1,
                }
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={22} 
                  color="#fff" 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Menu Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity 
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={[styles.menuContainer, { backgroundColor: bgColor, borderColor: isDark ? '#333' : '#e0e0e0' }]}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleChatInfo}
              >
                <Ionicons name="information-circle" size={20} color={textColor} />
                <ThemedText style={[styles.menuText, { color: textColor }]}>Chat Info</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleClearChat}
              >
                <Ionicons name="trash" size={20} color="#F44336" />
                <ThemedText style={[styles.menuText, { color: '#F44336' }]}>Clear Chat</ThemedText>
              </TouchableOpacity>
              
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleBlockUser}
              >
                <Ionicons name="ban" size={20} color="#F44336" />
                <ThemedText style={[styles.menuText, { color: '#F44336' }]}>Block User</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Full Screen Image Viewer Modal */}
        <Modal
          visible={showImageViewer}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageViewer(false)}
        >
          <View style={styles.imageViewerOverlay}>
            <TouchableOpacity 
              style={styles.imageViewerCloseArea}
              activeOpacity={1}
              onPress={() => setShowImageViewer(false)}
            >
              <View style={styles.imageViewerContainer}>
                <TouchableOpacity 
                  style={styles.imageViewerCloseButton}
                  onPress={() => setShowImageViewer(false)}
                >
                  <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>
                {selectedImageUrl && (
                  <Image
                    source={{ uri: selectedImageUrl }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
        
        {/* Image Preview Modal */}
        <Modal
          visible={showImagePreview}
          transparent
          animationType="slide"
          onRequestClose={() => setShowImagePreview(false)}
        >
          <View style={styles.imagePreviewOverlay}>
            <View style={styles.imagePreviewContainer}>
              {/* Header */}
              <View style={[styles.imagePreviewHeader, { backgroundColor: bgColor, borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
                <TouchableOpacity 
                  style={styles.imagePreviewCloseButton}
                  onPress={() => setShowImagePreview(false)}
                >
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
                <ThemedText style={[styles.imagePreviewTitle, { color: textColor }]}>
                  Preview Image
                </ThemedText>
                <View style={{ width: 24 }} />
              </View>
              
              {/* Image */}
              <View style={styles.imagePreviewImageContainer}>
                {previewImageUri && (
                  <Image
                    source={{ uri: previewImageUri }}
                    style={styles.imagePreviewImage}
                    resizeMode="contain"
                  />
                )}
              </View>
              
              {/* Action Buttons */}
              <View style={[styles.imagePreviewActions, { backgroundColor: bgColor, borderTopColor: isDark ? '#333' : '#e0e0e0' }]}>
                <TouchableOpacity
                  style={[styles.imagePreviewButton, styles.cropButton]}
                  onPress={cropImage}
                >
                  <Ionicons name="crop" size={20} color="#fff" />
                  <ThemedText style={styles.imagePreviewButtonText}>Crop Image</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.imagePreviewButton, styles.previewSendButton]}
                  onPress={sendFullImage}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                  <ThemedText style={styles.imagePreviewButtonText}>Send Full Image</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  currentUserMessage: {
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  imageMessageBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: 'transparent',
  },
  imageContainer: {
    alignItems: 'center',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderWidth: 2,
    borderColor: 'white',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    minHeight: 80,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1000,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  imageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxHeight: 120,
    minHeight: 48,
    fontSize: 16,
    textAlignVertical: 'top',
    includeFontPadding: false,
    fontWeight: '400',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 60,
    paddingRight: 20,
  },
  menuContainer: {
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  imagePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  imagePreviewCloseButton: {
    padding: 8,
  },
  imagePreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  imagePreviewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  imagePreviewActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  imagePreviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cropButton: {
    backgroundColor: '#FF9800',
  },
  previewSendButton: {
    backgroundColor: '#007AFF',
  },
  imagePreviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Apartment inquiry message styles
  apartmentInquiryBubble: {
    maxWidth: '85%',
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  apartmentInquiryContainer: {
    padding: 12,
  },
  apartmentInquiryHeader: {
    marginBottom: 8,
  },
  apartmentInquiryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B2FF',
  },
  apartmentImageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  apartmentInquiryImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  apartmentInquiryDetails: {
    marginBottom: 8,
    backgroundColor: 'rgba(0, 178, 255, 0.05)',
    padding: 8,
    borderRadius: 6,
  },
  apartmentInquiryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  apartmentInquiryPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  apartmentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  apartmentLocationText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Laundry inquiry message styles
  laundryInquiryBubble: {
    maxWidth: '85%',
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  laundryInquiryContainer: {
    padding: 12,
  },
  laundryInquiryHeader: {
    marginBottom: 8,
  },
  laundryInquiryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B2FF',
  },
  laundryImageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  laundryInquiryImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  laundryInquiryDetails: {
    marginBottom: 8,
    backgroundColor: 'rgba(0, 178, 255, 0.05)',
    padding: 8,
    borderRadius: 6,
  },
  laundryInquiryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  laundryInquiryPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  laundryTurnaroundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  laundryTurnaroundText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Auto inquiry message styles
  autoInquiryBubble: {
    maxWidth: '85%',
    padding: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  autoInquiryContainer: {
    padding: 12,
  },
  autoInquiryHeader: {
    marginBottom: 8,
  },
  autoInquiryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B2FF',
  },
  autoImageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  autoInquiryImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  autoInquiryDetails: {
    marginBottom: 8,
    backgroundColor: 'rgba(0, 178, 255, 0.05)',
    padding: 8,
    borderRadius: 6,
  },
  autoInquiryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  autoInquiryPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  autoDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  autoDurationText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
});