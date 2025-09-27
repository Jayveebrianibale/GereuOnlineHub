import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router'; // Change from useNavigation to useRouter
import { get, onValue, orderByChild, query, ref, update } from "firebase/database";
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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
  senderName?: string;
}

// Admin data - you might want to fetch this from Firebase or another source
const ADMIN_USERS = [
  { id: '1', name: 'Jayvee Briani', email: 'jayveebriani@gmail.com', avatar: 'JB' },
  { id: '2', name: 'Alfredo', email: 'alfredosayson@gmail.com', avatar: 'AS' },
];

export default function MessagesScreen() {
  const getFirstName = (fullName: string) => (fullName || '').split(' ')[0] || '';
  const { colorScheme } = useColorScheme();
  const { width } = Dimensions.get('window');
  const isDark = colorScheme === 'dark';
  const router = useRouter(); // Use Expo Router's useRouter instead of useNavigation
  const { user } = useAuthContext(); // Get current user from auth context

  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';
  const inputBgColor = isDark ? '#2A2A2A' : '#f8f8f8';

  // Firebase messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [adminProfilePictures, setAdminProfilePictures] = useState<{[key: string]: string}>({});

  // Get current user email from auth context
  const currentUserEmail = user?.email || '';

  // ✅ Real-time listener
  useEffect(() => {
    if (!currentUserEmail) return;

    const messagesRef = query(ref(db, "messages"), orderByChild("time"));

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        console.log('User - Raw Firebase data:', data);
        console.log('User email:', currentUserEmail);
        
        // Convert object to array and process messages
        const fetched = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          // Filter messages where user is recipient or sender
          .filter((msg: any) => {
            const isUserRecipient = msg.recipientEmail === currentUserEmail;
            const isUserSender = msg.senderEmail === currentUserEmail;
            
            // Check if this message has been deleted for the user
            const deletedFor = msg.deletedFor || [];
            const isDeletedForUser = deletedFor.includes(currentUserEmail);
            
            console.log('User message filter:', {
              messageId: msg.id,
              recipientEmail: msg.recipientEmail,
              senderEmail: msg.senderEmail,
              userEmail: currentUserEmail,
              isUserRecipient,
              isUserSender,
              isDeletedForUser,
              deletedFor,
              included: (isUserRecipient || isUserSender) && !isDeletedForUser,
              text: msg.text
            });
            
            // Only include messages that are for the user AND haven't been deleted for the user
            return (isUserRecipient || isUserSender) && !isDeletedForUser;
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
                name: msg.senderEmail === currentUserEmail ? msg.recipientName || 'Admin' : msg.senderName || 'Admin',
                lastMessage: msg.text,
                time: messageTime,
                avatar: msg.senderEmail === currentUserEmail ? 
                  (msg.recipientName || 'A').charAt(0).toUpperCase() : 
                  (msg.senderName || 'A').charAt(0).toUpperCase(),
                unread: msg.senderEmail !== currentUserEmail, // Mark as unread if not sent by user
                chatId: msg.chatId,
                senderEmail: msg.senderEmail,
                recipientEmail: msg.recipientEmail,
                recipientName: msg.recipientName,
              };
              
              console.log('User - Adding chat message:', chatMessage);
              
              return [...filtered, chatMessage];
            }
            return acc;
          }, [])
          // Sort by time (newest first)
          .sort((a, b) => b.time - a.time);

        setMessages(fetched);
        
        // Fetch profile pictures for all admins in messages
        fetchAdminProfilePictures(fetched);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentUserEmail]);

  // Fetch admin profile pictures from Firebase Database
  const fetchAdminProfilePictures = async (messagesList: any[]) => {
    try {
      const profilePictures: {[key: string]: string} = {};
      
      // Get unique admin emails from messages
      const adminEmails = new Set<string>();
      messagesList.forEach(message => {
        if (message.senderEmail && message.senderEmail !== currentUserEmail) {
          adminEmails.add(message.senderEmail);
        }
        if (message.recipientEmail && message.recipientEmail !== currentUserEmail) {
          adminEmails.add(message.recipientEmail);
        }
      });
      
      // Also add admin emails from ADMIN_USERS
      ADMIN_USERS.forEach(admin => {
        adminEmails.add(admin.email);
      });
      
      // Fetch profile pictures for each admin
      const promises = Array.from(adminEmails).map(async (email) => {
        try {
          // Find admin user ID from email in users collection
          const usersRef = ref(db, 'users');
          const usersSnapshot = await get(usersRef);
          if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();
            for (const userId in usersData) {
              if (usersData[userId].email === email && usersData[userId].role === 'admin') {
                const imageRef = ref(db, `userProfileImages/${userId}/url`);
                const imageSnapshot = await get(imageRef);
                if (imageSnapshot.exists()) {
                  const imageUrl = imageSnapshot.val();
                  if (imageUrl) {
                    profilePictures[email] = imageUrl;
                  }
                }
                break;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching profile picture for ${email}:`, error);
        }
      });
      
      await Promise.all(promises);
      setAdminProfilePictures(profilePictures);
    } catch (error) {
      console.error('Error fetching admin profile pictures:', error);
    }
  };

  // Filtering
  const filteredMessages = messages.filter(message => {
    // Add null checks and fallbacks for potentially undefined properties
    const messageName = message.name || '';
    const messageLastMessage = message.lastMessage || '';
    
    const matchesSearch =
      messageName.toLowerCase().includes(search.toLowerCase()) ||
      messageLastMessage.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true : message.unread; 
    return matchesSearch && matchesFilter;
  });

  const handleAdminChat = (admin: any) => {
    // Check if user is authenticated
    if (!currentUserEmail) {
      // You might want to show an alert or redirect to login
      return;
    }
    
    // Generate a unique chat ID based on user and admin emails
    const chatId = [currentUserEmail, admin.email].sort().join('_');
    
    // Navigate to the chat route with proper parameters
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: chatId,
        chatId,
        recipientName: admin.name,
        recipientEmail: admin.email,
        currentUserEmail,
      }
    });
  };

  const handleMessageClick = (message: Message) => {
    // Determine the correct recipient (the admin the user is chatting with)
    const recipientEmail = message.senderEmail === currentUserEmail ? message.recipientEmail : message.senderEmail;
    const recipientName = message.senderEmail === currentUserEmail ? message.recipientName || 'Admin' : message.name;
    
    // Navigate to chat with the correct admin
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: message.chatId,
        chatId: message.chatId,
        recipientName: recipientName,
        recipientEmail: recipientEmail || 'admin@example.com',
        currentUserEmail: currentUserEmail,
      }
    });
  };

  const handleLongPress = async (message: Message) => {
    // Add haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const recipientName = message.name || 'Admin';
    
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete the conversation with ${recipientName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(message),
        },
      ]
    );
  };

  const deleteConversation = async (message: Message) => {
    try {
      if (!currentUserEmail) return;

      // Add haptic feedback for deletion
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mark all messages in this chat as deleted for the user
      const messagesRef = ref(db, 'messages');
      const snapshot = await onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const updates: any = {};
          
          // Find all messages in this chat
          Object.keys(data).forEach((key) => {
            const msg = data[key];
            if (msg.chatId === message.chatId) {
              // Add user email to deletedFor array
              const deletedFor = msg.deletedFor || [];
              if (!deletedFor.includes(currentUserEmail)) {
                deletedFor.push(currentUserEmail);
                updates[`messages/${key}/deletedFor`] = deletedFor;
              }
            }
          });
          
          // Apply updates
          if (Object.keys(updates).length > 0) {
            update(ref(db), updates).then(() => {
              console.log('✅ Conversation deleted successfully');
            }).catch((error) => {
              console.error('❌ Error deleting conversation:', error);
            });
          }
        }
      }, { onlyOnce: true });

    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    }
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
            onPress={() => setFilter(filter === 'all' ? 'unread' : 'all')}
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

        {/* Admin Section header removed as requested */}

        {!currentUserEmail && (
          <View style={[styles.messageCard, { 
            backgroundColor: cardBgColor, 
            borderColor,
            opacity: 0.8,
          }]}>
            <View style={styles.messageInfo}>
              <Ionicons name="information-circle" size={24} color={subtitleColor} style={{ marginRight: 12 }} />
              <ThemedText style={{ color: subtitleColor, fontSize: 14 }}>
                Please sign in to chat with admins
              </ThemedText>
            </View>
          </View>
        )}

        {ADMIN_USERS.map((admin) => (
          <TouchableOpacity 
            key={admin.id}
            style={[styles.messageCard, { 
              backgroundColor: cardBgColor, 
              borderColor,
              opacity: currentUserEmail ? 1 : 0.6,
            }]}
            onPress={() => handleAdminChat(admin)}
            disabled={!currentUserEmail}
          >
            <View style={[styles.messageInfo, { flex: 4 }]}>
              <View style={[styles.avatar, { backgroundColor: colorPalette.primary }]}>
                {adminProfilePictures[admin.email] ? (
                  <Image
                    source={{ uri: adminProfilePictures[admin.email] }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                    {admin.avatar}
                  </ThemedText>
                )}
              </View>
              <View style={styles.messageDetails}>
                <ThemedText type="subtitle" style={[styles.userName, { color: textColor }]}>
                  Admin
                </ThemedText>
                <ThemedText 
                  numberOfLines={1} 
                  style={[styles.lastMessage, { color: subtitleColor }]}
                >
                  Available for support
                </ThemedText>
              </View>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <MaterialIcons name="chat" size={20} color={colorPalette.primary} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Stats removed as requested */}

        {/* Message List Header */}
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
            Recent Conversations
          </ThemedText>
        </View>

        {/* Message List */}
        {filteredMessages.length === 0 ? (
          <View style={[styles.messageCard, { 
            backgroundColor: cardBgColor, 
            borderColor,
            opacity: 0.8,
          }]}>
            <View style={styles.messageInfo}>
              <Ionicons name="chatbubble-outline" size={24} color={subtitleColor} style={{ marginRight: 12 }} />
              <ThemedText style={{ color: subtitleColor, fontSize: 14 }}>
                No conversations yet.
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
                borderLeftColor: message.unread ? colorPalette.primary : 'transparent'
              }]}
              onPress={() => handleMessageClick(message)}
              onLongPress={() => handleLongPress(message)}
              delayLongPress={500}
            >
            <View style={[styles.messageInfo, { flex: 4 }]}>
              <View style={[styles.avatar, { backgroundColor: colorPalette.primaryLight }]}>
                {(() => {
                  // Determine the admin email for this conversation
                  const adminEmail = message.senderEmail === currentUserEmail ? message.recipientEmail : message.senderEmail;
                  return adminProfilePictures[adminEmail] ? (
                    <Image
                      source={{ uri: adminProfilePictures[adminEmail] }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <ThemedText style={{ color: colorPalette.darkest, fontWeight: 'bold' }}>
                      {message.avatar || 'U'}
                    </ThemedText>
                  );
                })()}
              </View>
              <View style={styles.messageDetails}>
                <ThemedText type="subtitle" style={[styles.userName, { 
                  color: message.unread ? textColor : subtitleColor,
                  fontWeight: message.unread ? '600' : '400'
                }]}>
                  {getFirstName(message.name || 'Unknown')}
                </ThemedText>
                <ThemedText 
                  numberOfLines={1} 
                  style={[styles.lastMessage, { 
                    color: message.unread ? textColor : subtitleColor,
                    fontWeight: message.unread ? '500' : '400'
                  }]}
                >
                  {message.lastMessage || 'No message'}
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
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 20,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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