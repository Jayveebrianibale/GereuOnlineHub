import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { equalTo, off, onValue, orderByChild, push, query, ref, remove } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const isDark = colorScheme === 'dark';

  // Debug logging for user context
  console.log('ChatScreen - User context:', {
    user: user,
    currentUserEmail: currentUserEmail,
    chatId: chatId,
    recipientName: recipientName,
    recipientEmail: recipientEmail
  });

  // Check if user is authenticated
  if (!currentUserEmail) {
    console.warn('No current user email found - user may not be authenticated');
  }

  const bgColor = isDark ? '#121212' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const inputBgColor = isDark ? '#2A2A2A' : '#f8f8f8';
  const bubbleBgColor = isDark ? '#2A2A2A' : '#e6e6e6';
  const adminBubbleBgColor = isDark ? '#004d40' : '#b2dfdb';

  useEffect(() => {
    // Only set navigation options if navigation is available
    if (navigation) {
      navigation.setOptions({
        title: recipientName,
      });
    }

    const messagesRef = query(
      ref(db, 'messages'),
      orderByChild('chatId'),
      equalTo(chatId)
    );

    console.log('Querying messages for chatId:', chatId);

    const handleData = (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messagesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        // Debug logging for messages
        console.log('Fetched messages:', messagesList);
        console.log('Current user email:', currentUserEmail);
        
        // Filter messages to only show those for the current chat
        const chatMessages = messagesList.filter(msg => msg.chatId === chatId);
        console.log('Filtered chat messages:', chatMessages);
        console.log('Chat ID being filtered:', chatId);
        
        // Sort messages by timestamp (oldest first for chat flow)
        const sortedMessages = chatMessages.sort((a, b) => (a.timestamp || a.time) - (b.timestamp || b.time));
        console.log('Sorted messages:', sortedMessages);
        
        setMessages(sortedMessages);
      } else {
        setMessages([]);
      }
    };

    onValue(messagesRef, handleData);

    return () => {
      off(messagesRef);
    };
  }, [chatId]);

  const sendMessage = async () => {
    if (newMessage.trim() === '' || !currentUserEmail) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        sender: isAdminEmail(currentUserEmail) ? 'Admin' : 'User',
        senderEmail: currentUserEmail,
        timestamp: Date.now(),
        chatId: chatId,
        isAdmin: isAdminEmail(currentUserEmail),
        // Add recipient information for admin messages
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        // Add sender name for user messages
        senderName: isAdminEmail(currentUserEmail) ? 'Admin' : currentUserEmail.split('@')[0],
        // Add time field for proper sorting
        time: Date.now(),
      };

      console.log('Sending message:', messageData);
      console.log('Current user email:', currentUserEmail);
      console.log('Chat ID:', chatId);
      console.log('Recipient email:', recipientEmail);

      await push(ref(db, 'messages'), messageData);
      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error(error);
    }
  };

  const confirmAndDeleteMessage = (messageId: string) => {
    Alert.alert(
      'Delete message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(ref(db, `messages/${messageId}`));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
              console.error('Failed to delete message', error);
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    // Determine if this message is from the current user
    const isCurrentUser = item.senderEmail === currentUserEmail;
    
    // Debug logging to see what's happening
    console.log('Message:', {
      senderEmail: item.senderEmail,
      currentUserEmail: currentUserEmail,
      isCurrentUser: isCurrentUser,
      text: item.text
    });
    
    // Ensure we have valid data for positioning
    if (!item.senderEmail || !currentUserEmail) {
      console.warn('Missing email data for message positioning');
    }
    
    // Add case-insensitive comparison as fallback
    const isCurrentUserFallback = item.senderEmail?.toLowerCase() === currentUserEmail?.toLowerCase();
    
    // Day divider logic
    let showDayDivider = false;
    if (index === 0) {
      showDayDivider = true;
    } else {
      const prev = messages[index - 1];
      const d1 = new Date(item.timestamp);
      const d0 = new Date(prev.timestamp);
      showDayDivider = d1.toDateString() !== d0.toDateString();
    }

    return (
      <View>
        {showDayDivider && (
          <View style={styles.dayDivider}> 
            <ThemedText style={styles.dayDividerText}>
              {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </ThemedText>
          </View>
        )}
        <View style={[styles.messageRow, (isCurrentUser || isCurrentUserFallback) ? styles.rowRight : styles.rowLeft]}>
          {!(isCurrentUser || isCurrentUserFallback) && (
            <View style={[styles.avatar, { backgroundColor: isDark ? '#333' : '#e5e7eb' }]}>
              <ThemedText style={styles.avatarText}>{(item.senderName || 'U').charAt(0).toUpperCase()}</ThemedText>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => {
              if (isCurrentUser || isCurrentUserFallback) {
                confirmAndDeleteMessage(item.id);
              }
            }}
          >
          <View style={[
            styles.messageBubble, 
            (isCurrentUser || isCurrentUserFallback) ? styles.currentUserBubble : styles.otherUserBubble,
            { backgroundColor: (isCurrentUser || isCurrentUserFallback) ? adminBubbleBgColor : bubbleBgColor }
          ]}>
            <ThemedText style={[styles.messageText, { color: textColor }]}>
              {item.text}
            </ThemedText>
            <View style={styles.bubbleMetaRow}>
              <ThemedText style={[styles.timestamp, { color: isDark ? '#aaa' : '#666' }]}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </ThemedText>
              <ThemedText style={[styles.senderLabel, { color: isDark ? '#aaa' : '#666' }]}>
                {(isCurrentUser || isCurrentUserFallback) ? 'You' : (item.senderName || 'User')}
              </ThemedText>
            </View>
          </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const listRef = useRef<FlatList>(null);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 }) as number}
    >
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
            {recipientName}
          </ThemedText>
          <ThemedText type="default" style={[styles.headerSubtitle, { color: isDark ? '#aaa' : '#666' }]}>
            {recipientEmail}
          </ThemedText>
        </View>
      </View>
      
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        ref={listRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setShowScrollToBottom(y > 100);
        }}
      />

      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollFab}
          onPress={() => listRef.current?.scrollToEnd({ animated: true })}
        >
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={() => Alert.alert('Coming soon', 'Attachments support will be added')}>
          <Ionicons name="attach" size={22} color={isDark ? '#aaa' : '#666'} />
        </TouchableOpacity>
        <TextInput
          style={[
            styles.textInput, 
            { 
              backgroundColor: inputBgColor, 
              color: textColor 
            }
          ]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={isDark ? '#aaa' : '#666'}
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            { backgroundColor: newMessage.trim() ? '#007AFF' : '#ccc' }
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 50, // Account for status bar
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  messagesList: {
    padding: 16,
  },
  dayDivider: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  dayDividerText: {
    fontSize: 12,
    opacity: 0.7,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  senderLabel: {
    fontSize: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
    opacity: 0.7,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    backgroundColor: 'transparent',
  },
  attachButton: {
    marginRight: 8,
    padding: 6,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollFab: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});