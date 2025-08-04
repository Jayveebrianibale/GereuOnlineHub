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

// Sample user data
const users = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    role: 'Admin',
    status: 'active',
    lastActive: '2 hours ago',
    avatar: 'AJ',
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria.g@example.com',
    role: 'Manager',
    status: 'active',
    lastActive: '1 day ago',
    avatar: 'MG',
  },
  {
    id: '3',
    name: 'James Wilson',
    email: 'james.w@example.com',
    role: 'Staff',
    status: 'inactive',
    lastActive: '1 week ago',
    avatar: 'JW',
  },
  {
    id: '4',
    name: 'Sarah Lee',
    email: 'sarah.lee@example.com',
    role: 'Staff',
    status: 'active',
    lastActive: '3 hours ago',
    avatar: 'SL',
  },
  {
    id: '5',
    name: 'David Kim',
    email: 'david.kim@example.com',
    role: 'Customer',
    status: 'active',
    lastActive: '5 minutes ago',
    avatar: 'DK',
  },
];

export default function UsersScreen() {
  const { colorScheme } = useColorScheme();
  const { width } = Dimensions.get('window');
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';
  const inputBgColor = isDark ? '#2A2A2A' : '#f8f8f8';

  // Temporary filtering state and logic
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              User Management
            </ThemedText>
            <ThemedText type="default" style={[styles.subtitle, { color: subtitleColor }]}>
              Manage user accounts and permissions
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colorPalette.primary }]}>
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={[styles.searchContainer, { backgroundColor: cardBgColor, borderColor }]}>
          <Ionicons name="search" size={20} color={subtitleColor} style={styles.searchIcon} />
          <TextInput
            placeholder="Search users..."
            placeholderTextColor={subtitleColor}
            style={[styles.searchInput, { color: textColor }]}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() =>
              setStatusFilter(
                statusFilter === 'all'
                  ? 'active'
                  : statusFilter === 'active'
                  ? 'inactive'
                  : 'all'
              )
            }
          >
            <MaterialIcons name="filter-list" size={20} color={colorPalette.primary} />
            <ThemedText style={{ color: subtitleColor, marginLeft: 4, fontSize: 12 }}>
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
              Total Users
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: textColor }]}>
              {filteredUsers.length}
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
              Active
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: '#10B981' }]}>
              {filteredUsers.filter(u => u.status === 'active').length}
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
            <ThemedText type="default" style={[styles.statLabel, { color: subtitleColor }]}>
              Inactive
            </ThemedText>
            <ThemedText type="title" style={[styles.statValue, { color: '#EF4444' }]}>
              {filteredUsers.filter(u => u.status === 'inactive').length}
            </ThemedText>
          </View>
        </View>

        {/* User List Header */}
        <View style={[styles.listHeader, { borderBottomColor: borderColor }]}>
          {/* User first, Status next */}
          <ThemedText type="default" style={[styles.headerText1, { color: subtitleColor, flex: 3 }]}>
            User
          </ThemedText>
          <View style={{ flex: 2, alignItems: 'flex-end' }}>
            <ThemedText type="default" style={[styles.headerText, { color: subtitleColor, textAlign: 'right' }]}>
              Status
            </ThemedText>
          </View>
          <View style={{ flex: 1 }} />
        </View>

        {/* User List */}
        {filteredUsers.map((user) => (
          <View key={user.id} style={[styles.userCard, { backgroundColor: cardBgColor, borderColor }]}>
            {/* User first */}
            <View style={[styles.userInfo, { flex: 3 }]}>
              <View style={[styles.avatar, { backgroundColor: colorPalette.primaryLight }]}>
                <ThemedText style={{ color: colorPalette.darkest, fontWeight: 'bold' }}>
                  {user.avatar}
                </ThemedText>
              </View>
              <View style={styles.userDetails}>
                <ThemedText type="subtitle" style={[styles.userName, { color: textColor }]}>
                  {user.name}
                </ThemedText>
                <ThemedText style={[styles.userEmail, { color: subtitleColor }]}>
                  {user.email}
                </ThemedText>
              </View>
            </View>
            {/* Status next */}
            <View style={{ flex: 2, }}>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: user.status === 'active' ? '#10B98120' : '#EF444420',
                }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: user.status === 'active' ? '#10B981' : '#EF4444' }
                ]} />
                <ThemedText style={[
                  styles.statusText,
                  { color: user.status === 'active' ? '#10B981' : '#EF4444' }
                ]}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </ThemedText>
              </View>
            </View>
            {/* No 3 dots icon */}
          </View>
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
  addButton: {
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
    headerText1: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  userInfo: {
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
  userDetails: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
  },
  paginationButton: {
    padding: 8,
  },
  pageInfo: {
    marginHorizontal: 16,
    fontSize: 14,
  },
});