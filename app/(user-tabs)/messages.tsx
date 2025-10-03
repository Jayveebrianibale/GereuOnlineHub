import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { get, onValue, orderByChild, query, ref, update } from "firebase/database";
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ADMIN_EMAILS } from '../config/adminConfig';
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

// Admin data will be fetched from Firebase
const ADMIN_USERS: any[] = [];

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
  const [adminStatus, setAdminStatus] = useState<{[key: string]: boolean}>({});
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingProfilePictures, setLoadingProfilePictures] = useState<{[key: string]: boolean}>({});

  // Get current user email from auth context
  const currentUserEmail = user?.email || '';

  // ✅ Fetch admin users from Firebase
  const fetchAdminUsers = async () => {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const adminUsersList: any[] = [];
        
        // Find users with admin emails
        Object.keys(usersData).forEach(userId => {
          const userData = usersData[userId];
          if (ADMIN_EMAILS.includes(userData.email)) {
            adminUsersList.push({
              id: userId,
              name: userData.name || 'Admin',
              email: userData.email,
              avatar: userData.avatar || userData.name?.charAt(0)?.toUpperCase() || 'A',
              role: userData.role || 'admin'
            });
          }
        });
        
        console.log('Fetched admin users:', adminUsersList);
        setAdminUsers(adminUsersList);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  // ✅ Fetch admin users on component mount
  useEffect(() => {
    fetchAdminUsers();
  }, []);

  // ✅ Fetch profile pictures when admin users change
  useEffect(() => {
    if (adminUsers.length > 0) {
      fetchAdminProfilePictures();
    }
  }, [adminUsers]);

  // ✅ Real-time admin status listener
  useEffect(() => {
    const adminStatusRef = ref(db, "adminStatus");
    
    const unsubscribeStatus = onValue(adminStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        const statusData = snapshot.val();
        console.log('Real-time admin status update:', statusData);
        setAdminStatus(statusData);
      } else {
        console.log('No admin status data found, setting all offline');
        // Set all admins as offline by default
        const defaultStatus: {[key: string]: boolean} = {};
        adminUsers.forEach(admin => {
          defaultStatus[admin.email.replace(/\./g, '_')] = false;
        });
        setAdminStatus(defaultStatus);
      }
    });

    return () => unsubscribeStatus();
  }, [adminUsers]);

  // ✅ Set current user as online when component mounts
  useEffect(() => {
    if (currentUserEmail) {
      // Encode email to make it Firebase-safe (replace . with _)
      const encodedEmail = currentUserEmail.replace(/\./g, '_');
      // Set current user as online in adminStatus
      const userStatusRef = ref(db, `adminStatus/${encodedEmail}`);
      update(userStatusRef, { [encodedEmail]: true }).catch(error => {
        console.error('Error setting user status:', error);
      });
    }
  }, [currentUserEmail]);

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
              
              // Get consistent admin name from adminUsers array
              const getAdminName = (email: string) => {
                const admin = adminUsers.find(admin => admin.email === email);
                return admin ? admin.name : 'Admin';
              };

              const chatMessage = {
                id: msg.id,
                name: msg.senderEmail === currentUserEmail ? 
                  getAdminName(msg.recipientEmail || '') : 
                  getAdminName(msg.senderEmail || ''),
                lastMessage: msg.text,
                time: messageTime,
                avatar: msg.senderEmail === currentUserEmail ? 
                  getAdminName(msg.recipientEmail || '').charAt(0).toUpperCase() : 
                  getAdminName(msg.senderEmail || '').charAt(0).toUpperCase(),
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
        
        // Fetch profile pictures for admin users in messages (additional ones not already loaded)
        fetchMessageAdminProfilePictures(fetched);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentUserEmail, adminUsers]);

  // Fetch admin profile pictures from Firebase Database - independent of messages
  const fetchAdminProfilePictures = async () => {
    try {
      if (adminUsers.length === 0) {
        console.log('No admin users to fetch profile pictures for');
        return;
      }

      const profilePictures: {[key: string]: string} = {};
      
      // Only use admin emails from adminUsers (not from messages)
      const adminEmails = adminUsers.map(admin => admin.email);
      
      console.log('Fetching profile pictures for admin emails:', adminEmails);
      
      // Set loading state for all admin emails
      const loadingState: {[key: string]: boolean} = {};
      adminEmails.forEach(email => {
        loadingState[email] = true;
      });
      setLoadingProfilePictures(loadingState);
      
      // Fetch profile pictures for each admin
      const promises = adminEmails.map(async (email) => {
        try {
          // Find admin user ID from email in users collection
          const usersRef = ref(db, 'users');
          const usersSnapshot = await get(usersRef);
          if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();
            for (const userId in usersData) {
              if (usersData[userId].email === email && usersData[userId].role === 'admin') {
                console.log(`Found admin user ${userId} for email ${email}`);
                
                // Try to get profile picture from userProfileImages
                const imageRef = ref(db, `userProfileImages/${userId}/url`);
                const imageSnapshot = await get(imageRef);
                if (imageSnapshot.exists()) {
                  const imageUrl = imageSnapshot.val();
                  if (imageUrl && imageUrl.trim() !== '') {
                    console.log(`Found profile picture for ${email}: ${imageUrl}`);
                    profilePictures[email] = imageUrl;
                  } else {
                    console.log(`Empty profile picture URL for ${email}`);
                  }
                } else {
                  console.log(`No profile picture found for ${email}`);
                }
                break;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching profile picture for ${email}:`, error);
        } finally {
          // Remove loading state for this email
          setLoadingProfilePictures(prev => {
            const updated = { ...prev };
            delete updated[email];
            return updated;
          });
        }
      });
      
      await Promise.all(promises);
      console.log('Final profile pictures:', profilePictures);
      
      // Merge with existing profile pictures to preserve any that might already be loaded
      setAdminProfilePictures(prev => ({
        ...prev,
        ...profilePictures
      }));
    } catch (error) {
      console.error('Error fetching admin profile pictures:', error);
    }
  };

  // Fetch profile pictures for admin users in messages (for message cards)
  const fetchMessageAdminProfilePictures = async (messagesList: any[]) => {
    try {
      const profilePictures: {[key: string]: string} = {};
      
      // Get unique admin emails from messages only
      const adminEmails = new Set<string>();
      messagesList.forEach(message => {
        if (message.senderEmail && message.senderEmail !== currentUserEmail) {
          adminEmails.add(message.senderEmail);
        }
        if (message.recipientEmail && message.recipientEmail !== currentUserEmail) {
          adminEmails.add(message.recipientEmail);
        }
      });
      
      // Only fetch if we don't already have the profile picture
      const emailsToFetch = Array.from(adminEmails).filter(email => 
        !adminProfilePictures[email] && !loadingProfilePictures[email]
      );
      
      if (emailsToFetch.length === 0) {
        console.log('All message admin profile pictures already loaded');
        return;
      }
      
      console.log('Fetching additional profile pictures for message admins:', emailsToFetch);
      
      // Set loading state for emails we need to fetch
      const loadingState: {[key: string]: boolean} = {};
      emailsToFetch.forEach(email => {
        loadingState[email] = true;
      });
      setLoadingProfilePictures(prev => ({ ...prev, ...loadingState }));
      
      // Fetch profile pictures for each admin
      const promises = emailsToFetch.map(async (email) => {
        try {
          // Find admin user ID from email in users collection
          const usersRef = ref(db, 'users');
          const usersSnapshot = await get(usersRef);
          if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();
            for (const userId in usersData) {
              if (usersData[userId].email === email && usersData[userId].role === 'admin') {
                console.log(`Found admin user ${userId} for email ${email}`);
                
                // Try to get profile picture from userProfileImages
                const imageRef = ref(db, `userProfileImages/${userId}/url`);
                const imageSnapshot = await get(imageRef);
                if (imageSnapshot.exists()) {
                  const imageUrl = imageSnapshot.val();
                  if (imageUrl && imageUrl.trim() !== '') {
                    console.log(`Found profile picture for ${email}: ${imageUrl}`);
                    profilePictures[email] = imageUrl;
                  } else {
                    console.log(`Empty profile picture URL for ${email}`);
                  }
                } else {
                  console.log(`No profile picture found for ${email}`);
                }
                break;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching profile picture for ${email}:`, error);
        } finally {
          // Remove loading state for this email
          setLoadingProfilePictures(prev => {
            const updated = { ...prev };
            delete updated[email];
            return updated;
          });
        }
      });
      
      await Promise.all(promises);
      console.log('Additional profile pictures:', profilePictures);
      
      // Merge with existing profile pictures
      setAdminProfilePictures(prev => ({
        ...prev,
        ...profilePictures
      }));
    } catch (error) {
      console.error('Error fetching message admin profile pictures:', error);
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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              Messages
            </ThemedText>
            <View style={[styles.titleUnderline, { backgroundColor: colorPalette.primary }]} />
          </View>
          <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
            Connect with our support team
          </ThemedText>
        </View>

        {/* Enhanced Search and Filter */}
        <View style={[styles.searchContainer, { 
          backgroundColor: cardBgColor, 
          borderColor: isDark ? '#333' : colorPalette.lightest,
          shadowColor: isDark ? '#000' : colorPalette.primary,
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }]}>
          <View style={[styles.searchIconContainer, { backgroundColor: colorPalette.lightest }]}>
            <Ionicons name="search" size={18} color={colorPalette.primary} />
          </View>
          <TextInput
            placeholder="Search conversations..."
            placeholderTextColor={subtitleColor}
            style={[styles.searchInput, { color: textColor }]}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={[styles.filterButton, { 
              backgroundColor: filter === 'unread' ? colorPalette.primary : 'transparent',
            }]}
            onPress={() => setFilter(filter === 'all' ? 'unread' : 'all')}
          >
            <MaterialIcons 
              name={filter === 'unread' ? "mark-email-read" : "mark-email-unread"} 
              size={16} 
              color={filter === 'unread' ? '#fff' : colorPalette.primary} 
            />
            <ThemedText style={{ 
              color: filter === 'unread' ? '#fff' : colorPalette.primary, 
              marginLeft: 4, 
              fontSize: 12,
              fontWeight: '600'
            }}>
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

        {/* Enhanced Admin Section */}
        <View style={styles.adminSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Admin Support
            </ThemedText>
            <View style={[styles.sectionUnderline, { backgroundColor: colorPalette.light }]} />
          </View>
          
          {adminUsers.map((admin, index) => (
            <TouchableOpacity 
              key={admin.id}
              style={[styles.adminCard, { 
                backgroundColor: cardBgColor, 
                borderColor: isDark ? '#333' : colorPalette.lightest,
                opacity: currentUserEmail ? 1 : 0.6,
                shadowColor: isDark ? '#000' : colorPalette.primary,
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
                transform: [{ scale: currentUserEmail ? 1 : 0.98 }],
              }]}
              onPress={() => handleAdminChat(admin)}
              disabled={!currentUserEmail}
              activeOpacity={0.7}
            >
              <View style={styles.adminCardContent}>
                <View style={styles.adminInfo}>
                  <View style={[styles.adminAvatar, { 
                    backgroundColor: colorPalette.primary,
                    shadowColor: colorPalette.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 4,
                  }]}>
                    {loadingProfilePictures[admin.email] ? (
                      <View style={[styles.adminAvatarImage, { justifyContent: 'center', alignItems: 'center' }]}>
                        <ThemedText style={{ color: '#fff', fontSize: 12 }}>...</ThemedText>
                      </View>
                    ) : adminProfilePictures[admin.email] ? (
                      <Image
                        source={{ uri: adminProfilePictures[admin.email] }}
                        style={styles.adminAvatarImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.log(`Error loading profile picture for ${admin.email}:`, error);
                          // Remove the failed image from state
                          setAdminProfilePictures(prev => {
                            const updated = { ...prev };
                            delete updated[admin.email];
                            return updated;
                          });
                        }}
                        onLoad={() => {
                          console.log(`Successfully loaded profile picture for ${admin.email}`);
                        }}
                      />
                    ) : (
                      <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                        {admin.avatar || admin.name?.charAt(0)?.toUpperCase() || 'A'}
                      </ThemedText>
                    )}
                    {adminStatus[admin.email.replace(/\./g, '_')] === true && (
                      <View style={[styles.onlineIndicator, { 
                        backgroundColor: '#4CAF50'
                      }]} />
                    )}
                  </View>
                  <View style={styles.adminDetails}>
                    <ThemedText type="subtitle" style={[styles.adminName, { color: textColor }]}>
                      {admin.name}
                    </ThemedText>
                    <ThemedText 
                      numberOfLines={1} 
                      style={[styles.adminStatus, { color: subtitleColor }]}
                    >
                      {adminStatus[admin.email.replace(/\./g, '_')] === true ? 'Online' : 'Admin • Available to Support'}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.chatButton, { backgroundColor: colorPalette.primary }]}>
                  <MaterialIcons name="chat" size={20} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats removed as requested */}

        {/* Enhanced Message List Header */}
        <View style={styles.conversationSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textColor }]}>
              Recent Conversations
            </ThemedText>
            <View style={[styles.sectionUnderline, { backgroundColor: colorPalette.light }]} />
          </View>

          {/* Enhanced Message List */}
          {filteredMessages.length === 0 ? (
            <View style={[styles.emptyState, { 
              backgroundColor: cardBgColor, 
              borderColor: isDark ? '#333' : colorPalette.lightest,
              shadowColor: isDark ? '#000' : colorPalette.primary,
              shadowOpacity: isDark ? 0.2 : 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }]}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colorPalette.lightest }]}>
                <Ionicons name="chatbubble-outline" size={32} color={colorPalette.primary} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                No conversations yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: subtitleColor }]}>
                Start a conversation with our support team above
              </ThemedText>
            </View>
          ) : (
            filteredMessages.map((message, index) => (
              <TouchableOpacity 
                key={message.id} 
                style={[styles.enhancedMessageCard, { 
                  backgroundColor: cardBgColor, 
                  borderColor: isDark ? '#333' : colorPalette.lightest,
                  borderLeftWidth: message.unread ? 4 : 0,
                  borderLeftColor: message.unread ? colorPalette.primary : 'transparent',
                  shadowColor: isDark ? '#000' : colorPalette.primary,
                  shadowOpacity: isDark ? 0.2 : 0.06,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 4,
                  marginBottom: index === filteredMessages.length - 1 ? 0 : 12,
                }]}
                onPress={() => handleMessageClick(message)}
                onLongPress={() => handleLongPress(message)}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <View style={styles.messageCardContent}>
                  <View style={styles.messageInfo}>
                    <View style={[styles.enhancedAvatar, { 
                      backgroundColor: message.unread ? colorPalette.primary : colorPalette.primaryLight,
                      shadowColor: message.unread ? colorPalette.primary : colorPalette.primaryLight,
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 4,
                    }]}>
                      {(() => {
                        // Determine the admin email for this conversation
                        const adminEmail = message.senderEmail === currentUserEmail ? message.recipientEmail : message.senderEmail;
                        return loadingProfilePictures[adminEmail] ? (
                          <View style={[styles.enhancedAvatarImage, { justifyContent: 'center', alignItems: 'center' }]}>
                            <ThemedText style={{ 
                              color: message.unread ? '#fff' : colorPalette.darkest, 
                              fontSize: 12 
                            }}>...</ThemedText>
                          </View>
                        ) : adminProfilePictures[adminEmail] ? (
                          <Image
                            source={{ uri: adminProfilePictures[adminEmail] }}
                            style={styles.enhancedAvatarImage}
                            resizeMode="cover"
                            onError={(error) => {
                              console.log(`Error loading profile picture for ${adminEmail}:`, error);
                              // Remove the failed image from state
                              setAdminProfilePictures(prev => {
                                const updated = { ...prev };
                                delete updated[adminEmail];
                                return updated;
                              });
                            }}
                            onLoad={() => {
                              console.log(`Successfully loaded profile picture for ${adminEmail}`);
                            }}
                          />
                        ) : (
                          <ThemedText style={{ 
                            color: message.unread ? '#fff' : colorPalette.darkest, 
                            fontWeight: 'bold',
                            fontSize: 16
                          }}>
                            {message.avatar || message.name?.charAt(0)?.toUpperCase() || 'U'}
                          </ThemedText>
                        );
                      })()}
                    </View>
                    <View style={styles.messageDetails}>
                      <View style={styles.messageHeader}>
                        <ThemedText type="subtitle" style={[styles.enhancedUserName, { 
                          color: message.unread ? textColor : subtitleColor,
                          fontWeight: message.unread ? '700' : '600'
                        }]}>
                          {getFirstName(message.name || 'Unknown')}
                        </ThemedText>
                        <ThemedText style={[styles.enhancedTimeText, { color: subtitleColor }]}>
                          {message.time ? new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </ThemedText>
                      </View>
                      <ThemedText 
                        numberOfLines={2} 
                        style={[styles.enhancedLastMessage, { 
                          color: message.unread ? textColor : subtitleColor,
                          fontWeight: message.unread ? '500' : '400'
                        }]}
                      >
                        {message.lastMessage || 'No message'}
                      </ThemedText>
                    </View>
                  </View>
                  {message.unread && (
                    <View style={[styles.enhancedUnreadBadge, { backgroundColor: colorPalette.primary }]}>
                      <ThemedText style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>New</ThemedText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
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
  // Enhanced Header Styles
  header: {
    marginBottom: 28,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    height: 3,
    width: 60,
    borderRadius: 2,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.8,
    fontWeight: '500',
  },
  // Enhanced Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  filterButton: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  // Section Styles
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionUnderline: {
    height: 2,
    width: 40,
    borderRadius: 1,
  },
  // Admin Section Styles
  adminSection: {
    marginBottom: 32,
  },
  adminCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  adminCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  adminAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  adminStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  // Conversation Section Styles
  conversationSection: {
    marginBottom: 20,
  },
  // Empty State Styles
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  // Enhanced Message Card Styles
  enhancedMessageCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  messageCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  enhancedAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  messageDetails: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  enhancedUserName: {
    fontSize: 16,
    flex: 1,
  },
  enhancedTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  enhancedLastMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  enhancedUnreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  // Legacy styles for compatibility
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
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
