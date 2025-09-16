import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { equalTo, onValue, orderByChild, push, query, ref } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { isAdminEmail } from '../config/adminConfig';
import { useAuthContext } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';

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
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(messagesList);
        
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

  // Render message
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderEmail === currentUserEmail;
    const isMessageFromAdmin = item.isAdmin;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isCurrentUser 
              ? (isMessageFromAdmin ? adminBubbleBgColor : userBubbleBgColor)
              : bubbleBgColor,
          }
        ]}>
          <ThemedText style={[styles.messageText, { color: textColor }]}>
            {item.text}
          </ThemedText>
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
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 120, android: 80 }) as number}
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
          <TouchableOpacity style={styles.moreButton}>
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
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    minHeight: 70,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1000,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
});