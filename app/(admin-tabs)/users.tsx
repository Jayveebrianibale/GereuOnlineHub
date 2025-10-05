// ========================================
// ADMIN USERS TAB - PAMAMAHALA NG USERS
// ========================================
// Ang file na ito ay naghahandle ng admin users management
// May comprehensive features: view, search, filter, delete users
// Real-time user data monitoring at status management

// Import ng React Native components at Firebase
import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { get, onValue, orderByChild, query, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { isMigrationNeeded, migrateExistingUsers } from '../../utils/migrationUtils';
import { autoUpdateUserStatus, deleteUser, formatLastActive, listenToUsers, UserData } from '../../utils/userUtils';
import { useAuthContext } from '../contexts/AuthContext';
import { db } from '../firebaseConfig';

// ========================================
// COLOR PALETTE CONFIGURATION
// ========================================
// Defines the app's color scheme for consistent theming
// Used throughout the users screen for UI elements
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

// ========================================
// ADMIN USERS SCREEN COMPONENT
// ========================================
// Main component na naghahandle ng admin users management
// May comprehensive features para sa user management
export default function UsersScreen() {
  // ========================================
  // HOOKS AT STATE
  // ========================================
  const { colorScheme } = useColorScheme(); // Theme management
  const { width } = Dimensions.get('window'); // Screen width
  const isDark = colorScheme === 'dark'; // Check kung dark mode
  const router = useRouter(); // Navigation router
  const { user } = useAuthContext(); // Current authenticated user

  // ========================================
  // THEME COLORS
  // ========================================
  // Dynamic colors based on theme
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const borderColor = isDark ? '#333' : '#eee';
  const inputBgColor = isDark ? '#2A2A2A' : '#f8f8f8';

  // ========================================
  // STATE VARIABLES
  // ========================================
  // State para sa users data at UI management
  const [users, setUsers] = useState<UserData[]>([]); // List ng users
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [search, setSearch] = useState(''); // Search query
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all'); // Status filter
  const [userProfilePictures, setUserProfilePictures] = useState<{[key: string]: string}>({}); // Profile pictures cache

  // Fetch users from Firebase on component mount
  useEffect(() => {
    const initializeUsers = async () => {
      try {
        setLoading(true);
        
        // Check if migration is needed
        const needsMigration = await isMigrationNeeded();
        if (needsMigration) {
          console.log('Running user migration...');
          await migrateExistingUsers();
        }
        
        // Set up real-time listener
        const unsubscribe = listenToUsers((fetchedUsers) => {
          // Auto-update user statuses based on last active time
          fetchedUsers.forEach(async (user) => {
            if (user.status === 'active') {
              await autoUpdateUserStatus(user.id, user.lastActive);
            }
          });
          
          setUsers(fetchedUsers);
          setLoading(false);
          setError(null);
          
          // Fetch profile pictures for all users immediately
          fetchUserProfilePictures(fetchedUsers);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing users:', error);
        setError('Failed to load users. Please try again.');
        setLoading(false);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | undefined;
    initializeUsers().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Set up periodic refresh to ensure real-time status updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Trigger a refresh by updating the users list
      setUsers(prevUsers => [...prevUsers]);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Set up real-time listener for immediate user data changes
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        // Update the current user's data immediately in the users list
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.uid 
              ? { ...u, ...userData, id: user.uid }
              : u
          )
        );
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch user profile pictures from Firebase Database
  const fetchUserProfilePictures = async (usersList: UserData[]) => {
    try {
      const profilePictures: {[key: string]: string} = {};
      
      // Fetch profile pictures for each user with immediate updates
      const promises = usersList.map(async (user) => {
        try {
          const imageRef = ref(db, `userProfileImages/${user.id}/url`);
          const snapshot = await get(imageRef);
          
          if (snapshot.exists()) {
            const imageUrl = snapshot.val();
            if (imageUrl) {
              profilePictures[user.id] = imageUrl;
              // Update immediately for each user as we fetch them
              setUserProfilePictures(prev => ({
                ...prev,
                [user.id]: imageUrl
              }));
            }
          }
        } catch (error) {
          console.error(`Error fetching profile picture for user ${user.id}:`, error);
        }
      });
      
      await Promise.all(promises);
      // Final update with all collected pictures
      setUserProfilePictures(profilePictures);
    } catch (error) {
      console.error('Error fetching profile pictures:', error);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string, userRole: string) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Prevent deletion of admin users
    if (userRole === 'admin') {
      Alert.alert('Cannot Delete', 'Admin users cannot be deleted for security reasons.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${userName}"?\n\nThis will permanently remove the user from the system. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete user. Please try again.');
              console.error('Error deleting user:', error);
            }
          },
        },
      ]
    );
  };

  // Handle chat with user
  const handleChatWithUser = async (userData: UserData) => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!user?.email) {
      Alert.alert('Error', 'You must be logged in to start a chat.');
      return;
    }

    try {
      // Check if conversation already exists
      const messagesRef = query(ref(db, 'messages'), orderByChild('chatId'));
      const snapshot = await get(messagesRef);
      
      let existingChatId = null;
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Look for existing conversation between admin and user
        for (const messageId in data) {
          const message = data[messageId];
          const chatId = message.chatId;
          
          // Check if this chat involves both admin and user
          if (chatId && (
            (message.senderEmail === user.email && message.recipientEmail === userData.email) ||
            (message.senderEmail === userData.email && message.recipientEmail === user.email)
          )) {
            existingChatId = chatId;
            break;
          }
        }
      }
      
      if (existingChatId) {
        // Navigate to existing conversation
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: existingChatId,
            chatId: existingChatId,
            recipientName: userData.name || 'User',
            recipientEmail: userData.email || '',
            currentUserEmail: user.email,
          }
        });
      } else {
        // Generate new chat ID and navigate to chat screen
        const chatId = `${user.email}_${userData.email}`;
        
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: chatId,
            chatId: chatId,
            recipientName: userData.name || 'User',
            recipientEmail: userData.email || '',
            currentUserEmail: user.email,
          }
        });
      }
    } catch (error) {
      console.error('Error checking for existing conversation:', error);
      // Fallback to creating new chat
      const chatId = `${user.email}_${userData.email}`;
      
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: chatId,
          chatId: chatId,
          recipientName: userData.name || 'User',
          recipientEmail: userData.email || '',
          currentUserEmail: user.email,
        }
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const safeName = (user.name || '').toLowerCase();
    const safeEmail = (user.email || '').toLowerCase();
    const searchText = (search || '').toLowerCase();
    
    // Exclude specific admin users
    const isExcludedAdmin = 
      safeName.includes('alfredo sayson jr') || 
      safeName.includes('jeibii') ||
      safeName.includes('car') ||
      safeName.includes('motor part') ||
      safeName.includes('laundry');
    
    if (isExcludedAdmin) {
      return false;
    }
    
    const matchesSearch =
      safeName.includes(searchText) ||
      safeEmail.includes(searchText);
    const matchesStatus =
      statusFilter === 'all' ? true : user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Show loading state
  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colorPalette.primary} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Loading users...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            {error}
          </ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colorPalette.primary }]}
            onPress={() => {
              setError(null);
              setLoading(true);
              // The useEffect will automatically refetch
            }}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

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

        {/* Real-time Status Indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.statusIndicatorContent}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <ThemedText style={[styles.statusIndicatorText, { color: subtitleColor }]}>
              Real-time status updates enabled
            </ThemedText>
          </View>
          <View style={styles.statusIndicatorContent}>
            <MaterialIcons name="touch-app" size={16} color={subtitleColor} />
            <ThemedText style={[styles.statusIndicatorText, { color: subtitleColor }]}>
              Long press to delete
            </ThemedText>
          </View>
        </View>

        {/* User List Header */}
        <View style={[styles.listHeader, { borderBottomColor: borderColor }]}>
          {/* User first, Status next, Actions last */}
          <ThemedText type="default" style={[styles.headerText1, { color: subtitleColor, flex: 3 }]}>
            User
          </ThemedText>
          <View style={{ flex: 2, alignItems: 'flex-end' }}>
            <ThemedText type="default" style={[styles.headerText, { color: subtitleColor, textAlign: 'right' }]}>
              Status
            </ThemedText>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText type="default" style={[styles.headerText, { color: subtitleColor, textAlign: 'center' }]}>
              Actions
            </ThemedText>
          </View>
        </View>

        {/* User List */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={48} color={subtitleColor} />
            <ThemedText style={[styles.emptyText, { color: subtitleColor }]}>
              {search || statusFilter !== 'all' ? 'No users found matching your criteria' : 'No users found'}
            </ThemedText>
          </View>
        ) : (
          filteredUsers.map((userData) => (
            <Pressable 
              key={userData.id} 
              style={[styles.userCard, { backgroundColor: cardBgColor, borderColor }]}
              onLongPress={() => handleDeleteUser(userData.id, userData.name || 'Unknown User', userData.role)}
            >
              {/* User first */}
              <View style={[styles.userInfo, { flex: 3 }]}>
                <View style={[styles.avatar, { backgroundColor: colorPalette.primaryLight }]}>
                  {userProfilePictures[userData.id] ? (
                    <Image
                      source={{ uri: userProfilePictures[userData.id] }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <ThemedText style={{ color: colorPalette.darkest, fontWeight: 'bold' }}>
                      {userData.avatar}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.userDetails}>
                  <ThemedText type="subtitle" style={[styles.userName, { color: textColor }]}> 
                    {userData.name || 'Unnamed User'}
                  </ThemedText>
                  <ThemedText style={[styles.userEmail, { color: subtitleColor }]}>
                    {userData.email || 'no-email'}
                  </ThemedText>
                  <ThemedText style={[styles.userRole, { color: subtitleColor }]}>
                    {(userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Unknown')}
                  </ThemedText>
                </View>
              </View>
              {/* Status next */}
              <View style={{ flex: 2, }}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: userData.status === 'active' ? '#10B98120' : userData.status === 'inactive' ? '#EF444420' : '#9CA3AF20',
                    }
                  ]}
                >
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: userData.status === 'active' ? '#10B981' : userData.status === 'inactive' ? '#EF4444' : '#9CA3AF' }
                  ]} />
                  <ThemedText style={[
                    styles.statusText,
                    { color: userData.status === 'active' ? '#10B981' : userData.status === 'inactive' ? '#EF4444' : '#9CA3AF' }
                  ]}>
                    {(userData.status ? userData.status.charAt(0).toUpperCase() + userData.status.slice(1) : 'Unknown')}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.lastActiveText, { color: subtitleColor }]}>
                  {formatLastActive(userData.lastActive)}
                </ThemedText>
                {userData.status === 'active' && (
                  <View style={styles.liveIndicator}>
                    <View style={[styles.liveDot, { backgroundColor: '#10B981' }]} />
                    <ThemedText style={[styles.liveText, { color: '#10B981' }]}>
                      Live
                    </ThemedText>
                  </View>
                )}
              </View>
              {/* Actions last */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {user?.email !== userData.email && (
                  <TouchableOpacity
                    style={[styles.chatButton, { 
                      backgroundColor: isDark ? 'transparent' : '#fff',
                      borderColor: colorPalette.primary,
                      borderWidth: 1,
                      shadowColor: isDark ? 'transparent' : colorPalette.primary,
                    }]}
                    onPress={() => handleChatWithUser(userData)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="chatbubble-outline" 
                      size={15} 
                      color={colorPalette.primary} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Pressable>
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
  lastActiveText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
    opacity: 0.7,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '600',
  },
  statusIndicator: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicatorText: {
    fontSize: 12,
    marginLeft: 8,
  },
  chatButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});