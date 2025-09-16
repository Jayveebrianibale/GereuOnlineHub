import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onValue, orderByChild, query, ref } from "firebase/database";
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { db } from "../firebaseConfig";

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

// Interface for real-time messages
interface Message {
  id: string;
  name: string;
  lastMessage: string;
  time: number;
  avatar: string;
  unread: boolean;
  chatId: string;
  senderEmail: string;
  recipientEmail?: string;
  recipientName?: string;
}

export default function MessagesScreen() {
  const getFirstName = (fullName: string) => (fullName || '').split(' ')[0] || '';
  const { colorScheme } = useColorScheme();
  const { width } = Dimensions.get('window');
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuthContext();

  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';
  const inputBgColor = isDark ? '#2A2A2A' : '#f8f8f8';

  // Firebase messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // ✅ Real-time listener for admin messages
  useEffect(() => {
    if (!user?.email) return;

    const messagesRef = query(ref(db, "messages"), orderByChild("time"));

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        console.log('Admin - Raw Firebase data:', data);
        console.log('Admin email:', user.email);
        
        // Convert object to array and process messages
        const fetched = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          // Filter messages where admin is recipient or sender
          .filter((msg: any) => {
            // Include messages where admin is the recipient (from users)
            // or where admin is the sender (admin's own messages)
            const isAdminRecipient = msg.recipientEmail === user.email;
            const isAdminSender = msg.senderEmail === user.email;
            
            console.log('Admin message filter:', {
              messageId: msg.id,
              recipientEmail: msg.recipientEmail,
              senderEmail: msg.senderEmail,
              adminEmail: user.email,
              isAdminRecipient,
              isAdminSender,
              included: isAdminRecipient || isAdminSender,
              text: msg.text
            });
            
            return isAdminRecipient || isAdminSender;
          })
          // Group by chatId and get the latest message from each chat
          .reduce((acc: any[], msg: any) => {
            const existingChat = acc.find(chat => chat.chatId === msg.chatId);
            const messageTime = msg.timestamp || msg.time;
            
            if (!existingChat || messageTime > existingChat.time) {
              // Remove existing chat and add this one
              const filtered = acc.filter(chat => chat.chatId !== msg.chatId);
              
              const chatMessage = {
                id: msg.id,
                name: msg.senderEmail === user.email ? msg.recipientName || 'User' : msg.senderName || 'User',
                lastMessage: msg.text,
                time: messageTime,
                avatar: msg.senderEmail === user.email ? 
                  (msg.recipientName || 'U').charAt(0).toUpperCase() : 
                  (msg.senderName || 'U').charAt(0).toUpperCase(),
                unread: msg.senderEmail !== user.email, // Mark as unread if not sent by admin
                chatId: msg.chatId,
                senderEmail: msg.senderEmail,
                recipientEmail: msg.recipientEmail,
                recipientName: msg.recipientName,
              };
              
              console.log('Admin - Adding chat message:', chatMessage);
              
              return [...filtered, chatMessage];
            }
            return acc;
          }, [])
          // Sort by time (newest first)
          .sort((a, b) => b.time - a.time);

        setMessages(fetched);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [user?.email]);

  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.name.toLowerCase().includes(search.toLowerCase()) ||
      message.lastMessage.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true : message.unread;
    return matchesSearch && matchesFilter;
  });

  const handleMessageClick = (message: Message) => {
    // Navigate to chat with the user
    const recipientEmail = message.senderEmail === user?.email ? message.recipientEmail : message.senderEmail;
    const recipientName = message.senderEmail === user?.email ? message.recipientName || 'User' : message.name;
    
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: message.chatId,
        chatId: message.chatId,
        recipientName: recipientName,
        recipientEmail: recipientEmail || 'user@example.com',
        currentUserEmail: user?.email || '',
      }
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              Messages
            </ThemedText>
            <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
              Your recent conversations
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.newMessageButton, { backgroundColor: colorPalette.primary }]}
            onPress={() => {
              // For now, show an alert. In a real app, you'd navigate to a user selection screen
              Alert.alert(
                'New Chat',
                'To start a new chat, users need to message you first. You can then reply to them from this list.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={[styles.searchContainer, { backgroundColor: cardBgColor, borderColor }]}>
          <Ionicons name="search" size={20} color={subtitleColor} style={styles.searchIcon} />
          <TextInput
            placeholder="Search messages..."
            placeholderTextColor={subtitleColor}
            style={[styles.searchInput, { color: textColor }]}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() =>
              setFilter(
                filter === 'all' ? 'unread' : 'all'
              )
            }
          >
            <MaterialIcons 
              name={filter === 'unread' ? "mark-email-read" : "mark-email-unread"} 
              size={20} 
              color={colorPalette.primary} 
            />
            <ThemedText style={{ color: subtitleColor, marginLeft: 4, fontSize: 12 }}>
              {filter === 'unread' ? 'Unread' : 'All'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Message Stats removed as requested */}

        {/* Message List Header */}
        <View style={[styles.listHeader, { borderBottomColor: borderColor }]}>
          <ThemedText type="default" style={[styles.headerText, { color: subtitleColor, flex: 4 }]}>
            Conversation
          </ThemedText>
          <ThemedText type="default" style={[styles.headerText, { color: subtitleColor, flex: 1, textAlign: 'right' }]}>
            Time
          </ThemedText>
        </View>

        {/* Message List */}
        {filteredMessages.length === 0 ? (
          <View style={[styles.messageCard, { 
            backgroundColor: cardBgColor, 
            borderColor,
            opacity: 0.8,
            paddingLeft: 9
          }]}>
            <View style={[styles.messageInfo, { flex: 1 }]}> 
              <Ionicons name="chatbubble-outline" size={24} color={subtitleColor} style={{ marginRight: 12 }} />
              <ThemedText style={{ color: subtitleColor, fontSize: 14, flexShrink: 1 }}>
                {search ? 'No messages found matching your search.' : 'No messages yet. Users will appear here when they message you.'}
              </ThemedText>
            </View>
          </View>
        ) : (
          filteredMessages.map((message) => (
          <TouchableOpacity 
            key={message.id} 
            style={[styles.messageCard, { 
              backgroundColor: cardBgColor, 
              borderColor,
              borderLeftWidth: message.unread ? 4 : 0,
              borderLeftColor: message.unread ? colorPalette.primary : 'transparent',
              paddingLeft: message.unread ? 16 : 12
            }]}
            onPress={() => handleMessageClick(message)}
          >
            <View style={[styles.messageInfo, { flex: 4 }]}>
              <View style={[styles.avatar, { backgroundColor: colorPalette.primaryLight }]}>
                <ThemedText style={{ color: colorPalette.darkest, fontWeight: 'bold' }}>
                  {message.avatar}
                </ThemedText>
              </View>
              <View style={styles.messageDetails}>
                <ThemedText type="subtitle" style={[styles.userName, { 
                  color: message.unread ? textColor : subtitleColor,
                  fontWeight: message.unread ? '600' : '400'
                }]}>
                  {getFirstName(message.name)}
                </ThemedText>
                <ThemedText 
                  numberOfLines={1} 
                  style={[styles.lastMessage, { 
                    color: message.unread ? textColor : subtitleColor,
                    fontWeight: message.unread ? '500' : '400'
                  }]}
                >
                  {message.lastMessage}
                </ThemedText>
              </View>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <ThemedText style={[styles.timeText, { color: subtitleColor }]}>
                {message.time ? new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </ThemedText>
              {message.unread && (
                <View style={styles.unreadBadge}>
                  <ThemedText style={{ color: '#fff', fontSize: 10 }}>New</ThemedText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
        )}
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
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  newMessageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '32%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 12,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: colorPalette.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});