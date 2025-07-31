import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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

// Sample message data
const messages = [
  {
    id: '1',
    name: 'Alex Johnson',
    lastMessage: 'Hey, just checking in about the apartment',
    time: '2 hours ago',
    avatar: 'AJ',
    unread: true,
  },
  {
    id: '2',
    name: 'Maria Garcia',
    lastMessage: 'Your laundry will be ready by 5pm',
    time: '1 day ago',
    avatar: 'MG',
    unread: false,
  },
  {
    id: '3',
    name: 'James Wilson',
    lastMessage: 'Your car service is complete',
    time: '1 week ago',
    avatar: 'JW',
    unread: false,
  },
  {
    id: '4',
    name: 'Sarah Lee',
    lastMessage: 'The rent payment was received, thank you!',
    time: '3 hours ago',
    avatar: 'SL',
    unread: true,
  },
  {
    id: '5',
    name: 'David Kim',
    lastMessage: 'Need to schedule another cleaning',
    time: '5 minutes ago',
    avatar: 'DK',
    unread: true,
  },
];

export default function MessagesScreen() {
  const { colorScheme } = useColorScheme();
  const { width } = Dimensions.get('window');
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';
  const inputBgColor = isDark ? '#2A2A2A' : '#f8f8f8';

  // Filtering state and logic
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.name.toLowerCase().includes(search.toLowerCase()) ||
      message.lastMessage.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true : message.unread;
    return matchesSearch && matchesFilter;
  });

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
          <TouchableOpacity style={[styles.newMessageButton, { backgroundColor: colorPalette.primary }]}>
            <MaterialIcons name="message" size={24} color="#fff" />
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

        {/* Message Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
              Total Messages
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: textColor }]}>
              {filteredMessages.length}
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
              Unread
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: '#00B2FF' }]}>
              {filteredMessages.filter(m => m.unread).length}
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
              Today
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: textColor }]}>
              {filteredMessages.filter(m => m.time.includes('minute') || m.time.includes('hour')).length}
            </ThemedText>
          </View>
        </View>

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
                  {message.name}
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
                {message.time}
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