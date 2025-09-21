import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { AdminReservation, useAdminReservation } from './contexts/AdminReservationContext';

interface AdminNotification {
  id: string;
  type: 'reservation' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  isDeleted?: boolean;
  reservationId?: string;
  chatId?: string;
  actionUrl?: string;
}

export default function AdminNotificationsScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { adminReservations } = useAdminReservation();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#0A0A0A' : '#F8FAFC';
  const textColor = isDark ? '#FFFFFF' : '#1A202C';
  const cardBgColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? '#2D3748' : '#E2E8F0';
  const subtitleColor = isDark ? '#A0AEC0' : '#718096';

  // Beautiful color palette
  const colors = {
    primary: '#667EEA',
    primaryLight: '#764BA2',
    success: '#48BB78',
    warning: '#ED8936',
    error: '#F56565',
    info: '#4299E1',
    gradient: isDark ? ['#667EEA', '#764BA2'] : ['#667EEA', '#764BA2'],
  };

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      // Check last seen timestamp for admin reservations
      const storageKey = `admin:lastSeenAdminReservations`;
      const lastSeen = await AsyncStorage.getItem(storageKey);
      const lastSeenTime = lastSeen ? Number(lastSeen) : 0;

      // Get deleted notification IDs
      const deletedKey = `admin:deletedNotifications`;
      const deletedNotifications = await AsyncStorage.getItem(deletedKey);
      const deletedIds = deletedNotifications ? JSON.parse(deletedNotifications) : [];

      // Convert admin reservations to notifications
      const notificationList: AdminNotification[] = adminReservations
        .filter(reservation => 
          reservation.status === 'pending' || 
          reservation.status === 'confirmed' || 
          reservation.status === 'declined' || 
          reservation.status === 'cancelled'
        )
        .map(reservation => ({
          id: `reservation_${reservation.id}`,
          type: 'reservation' as const,
          title: getReservationTitle(reservation.status),
          message: getReservationMessage(reservation),
          timestamp: new Date(reservation.updatedAt).getTime(),
          isRead: false, // Will be updated based on last seen
          reservationId: reservation.id,
        }))
        .filter(notification => !deletedIds.includes(notification.id)) // Filter out deleted notifications
        .sort((a, b) => b.timestamp - a.timestamp);

      // Mark notifications as read/unread
      const updatedNotifications = notificationList.map(notification => ({
        ...notification,
        isRead: notification.timestamp <= lastSeenTime,
      }));

      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.isRead).length);
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error loading admin notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminReservations]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const getReservationTitle = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'New Reservation Request';
      case 'confirmed':
        return 'Reservation Confirmed';
      case 'declined':
        return 'Reservation Declined';
      case 'cancelled':
        return 'Reservation Cancelled';
      default:
        return 'Reservation Update';
    }
  };

  const getReservationMessage = (reservation: AdminReservation): string => {
    const userName = reservation.userName || 'Unknown User';
    const serviceTitle = reservation.serviceTitle || 'Service';
    
    switch (reservation.status) {
      case 'pending':
        return `${userName} has requested a reservation for ${serviceTitle}`;
      case 'confirmed':
        return `Reservation for ${serviceTitle} by ${userName} has been confirmed`;
      case 'declined':
        return `Reservation for ${serviceTitle} by ${userName} has been declined`;
      case 'cancelled':
        return `Reservation for ${serviceTitle} by ${userName} has been cancelled`;
      default:
        return `Reservation for ${serviceTitle} by ${userName} has been updated`;
    }
  };

  const handleNotificationPress = async (notification: AdminNotification) => {
    try {
      // Mark as read
      const updatedNotifications = notifications.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.isRead).length);

      // Update last seen timestamp
      const storageKey = `admin:lastSeenAdminReservations`;
      await AsyncStorage.setItem(storageKey, String(notification.timestamp));

      // Navigate based on notification type
      if (notification.type === 'reservation') {
        console.log('Navigating to admin reservations tab');
        router.push('/(admin-tabs)/reservations' as any);
      } else if (notification.type === 'message') {
        console.log('Navigating to admin messages');
        router.push('/(admin-tabs)/messages' as any);
      } else if (notification.actionUrl) {
        console.log('Navigating to:', notification.actionUrl);
        router.push(notification.actionUrl as any);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
      Alert.alert('Navigation Error', 'Unable to navigate to the notification details. Please try again.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const storageKey = `admin:lastSeenAdminReservations`;
      await AsyncStorage.setItem(storageKey, String(Date.now()));

      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      Alert.alert(
        'Clear All Notifications',
        'Are you sure you want to delete all notifications? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: async () => {
              try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) return;

                const deletedKey = `admin:deletedNotifications`;
                const deletedIds = notifications.map(n => n.id);
                await AsyncStorage.setItem(deletedKey, JSON.stringify(deletedIds));

                setNotifications([]);
                setUnreadCount(0);
              } catch (error) {
                console.error('Error clearing notifications:', error);
                Alert.alert('Error', 'Failed to clear notifications');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing clear confirmation:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications();
  };

  const renderNotification = ({ item, index }: { item: AdminNotification; index: number }) => {
    const isUnread = !item.isRead;
    const statusColor = getStatusColor(item.type, item.title);
    
    return (
      <Animated.View
        style={[
          styles.notificationItem,
          { 
            backgroundColor: cardBgColor,
            borderColor: borderColor,
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
          isUnread && styles.unreadNotification
        ]}
      >
        <Pressable
          style={styles.notificationPressable}
          onPress={() => handleNotificationPress(item)}
          android_ripple={{ color: colors.primary + '20' }}
        >
          <View style={styles.notificationContent}>
            {/* Status Indicator */}
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
              <MaterialIcons 
                name={getStatusIcon(item.type, item.title)} 
                size={16} 
                color="#FFFFFF" 
              />
            </View>

            {/* Main Content */}
            <View style={styles.notificationMain}>
              <View style={styles.notificationHeader}>
                <ThemedText style={[styles.notificationTitle, { color: textColor }]}>
                  {item.title}
                </ThemedText>
                {isUnread && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              
              <ThemedText style={[styles.notificationMessage, { color: subtitleColor }]}>
                {item.message}
              </ThemedText>
              
              <View style={styles.notificationFooter}>
                <View style={styles.timeContainer}>
                  <MaterialIcons name="schedule" size={12} color={subtitleColor} />
                  <ThemedText style={[styles.notificationTime, { color: subtitleColor }]}>
                    {formatTime(item.timestamp)}
                  </ThemedText>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <ThemedText style={[styles.statusText, { color: statusColor }]}>
                    {getStatusText(item.title)}
                  </ThemedText>
                </View>
              </View>
            </View>
            
            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <MaterialIcons 
                name="chevron-right" 
                size={20} 
                color={subtitleColor} 
                style={{ opacity: 0.6 }} 
              />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const getStatusColor = (type: string, title: string): string => {
    if (title.includes('pending') || title.includes('New')) return colors.warning;
    if (title.includes('confirmed')) return colors.success;
    if (title.includes('declined')) return colors.error;
    if (title.includes('cancelled')) return colors.info;
    return colors.primary;
  };

  const getStatusIcon = (type: string, title: string): string => {
    if (title.includes('pending') || title.includes('New')) return 'schedule';
    if (title.includes('confirmed')) return 'check-circle';
    if (title.includes('declined')) return 'cancel';
    if (title.includes('cancelled')) return 'block';
    return 'notifications';
  };

  const getStatusText = (title: string): string => {
    if (title.includes('pending') || title.includes('New')) return 'Pending';
    if (title.includes('confirmed')) return 'Confirmed';
    if (title.includes('declined')) return 'Declined';
    if (title.includes('cancelled')) return 'Cancelled';
    return 'Update';
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    // Show actual time for recent notifications (within 24 hours)
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Show date for older notifications
    if (days < 7) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={[styles.loadingText, { color: textColor }]}>
              Loading notifications...
            </ThemedText>
          </Animated.View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Beautiful Header with Gradient */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            backgroundColor: cardBgColor,
            borderBottomColor: borderColor,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                Notifications
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: subtitleColor }]}>
                {notifications.length} total • {unreadCount} unread
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            {notifications.length > 0 && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error }]}
                onPress={handleClearAllNotifications}
              >
                <MaterialIcons name="delete-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleMarkAllRead}
              >
                <MaterialIcons name="done-all" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={cardBgColor}
          />
        }
        ListEmptyComponent={
          <Animated.View 
            style={[
              styles.emptyContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.emptyIconContainer}>
              <MaterialIcons 
                name="notifications-none" 
                size={80} 
                color={colors.primary} 
                style={{ opacity: 0.6 }} 
              />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              No Notifications Yet
            </ThemedText>
            <ThemedText style={[styles.emptyMessage, { color: subtitleColor }]}>
              You'll see reservation updates and important alerts here when they arrive
            </ThemedText>
            <View style={styles.emptyActionContainer}>
              <TouchableOpacity 
                style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                onPress={handleRefresh}
              >
                <MaterialIcons name="refresh" size={20} color="#fff" />
                <ThemedText style={styles.emptyActionText}>Refresh</ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Header Styles
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // List Styles
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Notification Item Styles
  notificationItem: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#667EEA',
    shadowOpacity: 0.15,
    elevation: 6,
  },
  notificationPressable: {
    padding: 0,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
  },
  
  // Status Indicator
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Main Content
  notificationMain: {
    flex: 1,
    marginRight: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Arrow
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionContainer: {
    alignItems: 'center',
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
