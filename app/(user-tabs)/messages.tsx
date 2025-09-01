import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Change from useNavigation to useRouter
import { onValue, orderByChild, query, ref } from "firebase/database";
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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

// Admin data - you might want to fetch this from Firebase or another source
const ADMIN_USERS = [
  { id: '1', name: 'Jayvee Briani', email: 'jayveebriani@gmail.com', avatar: 'JB' },
  { id: '2', name: 'Pedro Admin', email: 'pedro1@gmail.com', avatar: 'PA' },
];

export default function MessagesScreen() {
  const getFirstName = (fullName: string) => (fullName || '').split(' ')[0] || '';
  const { colorScheme } = useColorScheme();
  const { width } = Dimensions.get('window');
  const isDark = colorScheme === 'dark';
  const router = useRouter(); // Use Expo Router's useRouter instead of useNavigation

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

  // Get current user email (you'll need to replace this with your actual auth)
  const currentUserEmail = 'user@example.com'; // Replace with actual user email

  // ✅ Real-time listener
  useEffect(() => {
    const messagesRef = query(ref(db, "messages"), orderByChild("time"));

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert object to array
        const fetched = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          // sort newest first
          .sort((a, b) => b.time - a.time);

        setMessages(fetched as any[]);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filtering
  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.name.toLowerCase().includes(search.toLowerCase()) ||
      message.lastMessage.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true : message.unread; 
    return matchesSearch && matchesFilter;
  });

  const handleAdminChat = (admin: any) => {
    // Generate a unique chat ID based on user and admin emails
    const chatId = [currentUserEmail, admin.email].sort().join('_');
    
    // Use Expo Router's push method instead of navigation.navigate
    router.push({
      pathname: `/`,
      params: {
        chatId,
        recipientName: admin.name,
        recipientEmail: admin.email,
        currentUserEmail,
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

        {ADMIN_USERS.map((admin) => (
          <TouchableOpacity 
            key={admin.id}
            style={[styles.messageCard, { 
              backgroundColor: cardBgColor, 
              borderColor,
            }]}
            onPress={() => handleAdminChat(admin)}
          >
            <View style={[styles.messageInfo, { flex: 4 }]}>
              <View style={[styles.avatar, { backgroundColor: colorPalette.primary }]}>
                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                  {admin.avatar}
                </ThemedText>
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
        {filteredMessages.map((message) => (
          <TouchableOpacity 
            key={message.id} 
            style={[styles.messageCard, { 
              backgroundColor: cardBgColor, 
              borderColor,
              borderLeftWidth: message.unread ? 4 : 0,
              borderLeftColor: message.unread ? colorPalette.primary : 'transparent'
            }]}
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
                {message.time?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </ThemedText>
              {message.unread && (
                <View style={styles.unreadBadge}>
                  <ThemedText style={{ color: '#fff', fontSize: 10 }}>New</ThemedText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
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