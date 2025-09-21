import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
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
import { uploadImageToFirebaseWithRetry } from '../services/imageUploadService';

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
  messageType?: 'text' | 'image';
  deletedFor?: string[]; // Array of user emails who have deleted this message
  readBy?: string[]; // Array of user emails who have read this message
}

interface ChatScreenProps {
  route: any;
  navigation?: any;
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
  
  // Refs for stability
  const textInputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  
  const isDark = colorScheme === 'dark';
  const isAdmin = isAdminEmail(currentUserEmail);

  // Colors
  const bgColor = isDark ? '#121212' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const inputBgColor = isDark ? '#2A2A2A' : '#f8f8f8';
  const bubbleBgColor = isDark ? '#2A2A2A' : '#e6e6e6';
  const adminBubbleBgColor = isDark ? '#004d40' : '#b2dfdb';
  const userBubbleBgColor = isDark ? '#1e3a8a' : '#3b82f6';

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

  // Send image function
  const sendImage = useCallback(async (imageUri: string) => {
    if (!currentUserEmail || isLoading) return;

    setIsLoading(true);

    try {
      // Upload image to Firebase Storage
      const uploadResult = await uploadImageToFirebaseWithRetry(imageUri, 'chat-images');
      
      const messageData = {
        text: '📷 Image',
        sender: isAdmin ? 'Admin' : 'User',
        senderEmail: currentUserEmail,
        timestamp: Date.now(),
        chatId: chatId,
        isAdmin: isAdmin,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        senderName: isAdmin ? 'Admin' : currentUserEmail.split('@')[0],
        imageUrl: uploadResult.url,
        messageType: 'image',
      };

      await push(ref(db, 'messages'), messageData);
      
    } catch (error) {
      console.error('Error sending image:', error);
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

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      `Are you sure you want to report ${recipientName || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'User reported successfully!');
            setShowMenu(false);
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
    const isImageMessage = item.messageType === 'image' && item.imageUrl;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <TouchableOpacity
          style={[
            styles.messageBubble,
            isImageMessage ? styles.imageMessageBubble : {},
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
                onPress={() => handleImagePress(item.imageUrl!)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <ThemedText style={[styles.messageText, { color: textColor, marginTop: 8 }]}>
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
          <View style={styles.headerInfo}>
            <ThemedText style={[styles.headerTitle, { color: textColor }]}>
              {recipientName || 'Chat'}
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: textColor, opacity: 0.6 }]}>
              {isAdmin ? 'Admin Chat' : 'User Chat'}
            </ThemedText>
          </View>
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
        
        {/* Input Container */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: bgColor, 
            borderTopColor: isDark ? '#333' : '#e0e0e0',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          }
        ]}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={[
                styles.imageButton,
                {
                  backgroundColor: inputBgColor,
                  borderColor: isDark ? '#444' : '#ddd',
                }
              ]}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Ionicons 
                name="camera" 
                size={20} 
                color={textColor} 
              />
            </TouchableOpacity>
            
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: inputBgColor,
                  color: textColor,
                  borderColor: isInputFocused ? '#007AFF' : (isDark ? '#444' : '#ddd'),
                }
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Message ${recipientName || 'user'}...`}
              placeholderTextColor={isDark ? '#aaa' : '#666'}
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
                  backgroundColor: inputText.trim() && !isLoading ? '#007AFF' : '#ccc',
                  opacity: isLoading ? 0.5 : 1,
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
                  size={20} 
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
                onPress={handleReportUser}
              >
                <Ionicons name="flag" size={20} color="#FF9800" />
                <ThemedText style={[styles.menuText, { color: '#FF9800' }]}>Report User</ThemedText>
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
  headerInfo: {
    flex: 1,
    paddingTop: 24,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  imageContainer: {
    alignItems: 'center',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 2 : 1,
    minHeight: 60,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1000,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    minHeight: 44,
    fontSize: 16,
    textAlignVertical: 'top',
    includeFontPadding: false,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
});