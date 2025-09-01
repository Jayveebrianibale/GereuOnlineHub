import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { equalTo, off, onValue, orderByChild, push, query, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
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

  const renderMessage = ({ item }: { item: Message }) => {
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
    
    return (
      <View style={[
        styles.messageBubble, 
        (isCurrentUser || isCurrentUserFallback) ? styles.currentUserBubble : styles.otherUserBubble,
        { backgroundColor: (isCurrentUser || isCurrentUserFallback) ? adminBubbleBgColor : bubbleBgColor }
      ]}>
        <ThemedText style={[styles.messageText, { color: textColor }]}>
          {item.text}
        </ThemedText>
        <ThemedText style={[styles.timestamp, { color: isDark ? '#aaa' : '#666' }]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
        <ThemedText style={[styles.senderLabel, { color: isDark ? '#aaa' : '#666', fontSize: 10 }]}>
          {(isCurrentUser || isCurrentUserFallback) ? 'You' : (item.senderName || 'User')}
        </ThemedText>
      </View>
    );
  };

  return (
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
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
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
      </KeyboardAvoidingView>
    </ThemedView>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
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
});