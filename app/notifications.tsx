// ========================================
// NOTIFICATIONS SCREEN - PAMAMAHALA NG NOTIFICATIONS
// ========================================
// Ang file na ito ay naghahandle ng notifications screen
// May comprehensive features: view notifications, mark as read, delete notifications
// Real-time notification updates at haptic feedback

// Import ng React Native components at Firebase
import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
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
import { FirebaseUserReservation, listenToUserReservations } from './services/reservationService';

// ========================================
// INTERFACE DEFINITIONS
// ========================================
// Type definitions para sa notification system

// Interface para sa notification data structure
interface Notification {
  id: string; // Unique notification identifier
  type: 'reservation' | 'message' | 'system'; // Notification type
  title: string; // Notification title
  message: string; // Notification message content
  timestamp: number; // Notification timestamp
  isRead: boolean; // Read status
  isDeleted?: boolean; // Deleted status (optional)
  reservationId?: string; // Related reservation ID (optional)
  chatId?: string; // Related chat ID (optional)
  actionUrl?: string; // Action URL (optional)
}

// ========================================
// NOTIFICATIONS SCREEN COMPONENT
// ========================================
// Main component na naghahandle ng notifications management
// May comprehensive features para sa notification management
export default function NotificationsScreen() {
  // ========================================
  // HOOKS AT STATE
  // ========================================
  const { colorScheme } = useColorScheme(); // Theme management
  const router = useRouter(); // Navigation router
  const [notifications, setNotifications] = useState<Notification[]>([]); // Notifications list
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [isRefreshing, setIsRefreshing] = useState(false); // Refresh state
  const [unreadCount, setUnreadCount] = useState(0); // Unread count

  // ========================================
  // THEME COLORS
  // ========================================
  // Dynamic colors based on theme
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#0F0F0F' : '#FAFBFC';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const cardBgColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#F2F2F7';
  const subtitleColor = isDark ? '#8E8E93' : '#6D6D70';

  // Professional color palette
  const colors = {
    primary: '#007AFF',
    primaryLight: '#5AC8FA',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5856D6',
    accent: '#AF52DE',
    neutral: isDark ? '#8E8E93' : '#6D6D70',
    surface: isDark ? '#1C1C1E' : '#FFFFFF',
    background: isDark ? '#0F0F0F' : '#FAFBFC',
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

      // Check last seen timestamp
      const storageKey = `user:lastSeenReservations:${user.uid}`;
      const lastSeen = await AsyncStorage.getItem(storageKey);
      const lastSeenTime = lastSeen ? Number(lastSeen) : 0;

      // Get deleted notification IDs
      const deletedKey = `user:deletedNotifications:${user.uid}`;
      const deletedNotifications = await AsyncStorage.getItem(deletedKey);
      const deletedIds = deletedNotifications ? JSON.parse(deletedNotifications) : [];

      const unsubscribe = listenToUserReservations(user.uid, (reservations: FirebaseUserReservation[]) => {
        // Convert reservations to notifications
        const notificationList: Notification[] = reservations
          .filter(reservation => 
            reservation.status === 'pending' || 
            reservation.status === 'confirmed' || 
            reservation.status === 'declined' || 
            reservation.status === 'cancelled'
          )
          .map(reservation => ({
            id: `reservation_${reservation.id}`,
            type: 'reservation' as const,
            title: getReservationTitle(reservation.status, reservation.serviceType),
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
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: any;
    loadNotifications().then((unsub) => {
      unsubscribe = unsub;
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadNotifications]);

  const getReservationTitle = (status: string, serviceType?: string): string => {
    const getServiceTypeName = (type?: string): string => {
      switch (type) {
        case 'apartment': return 'Apartment Rentals';
        case 'laundry': return 'Laundry Services';
        case 'auto': return 'Car and Motor Parts';
        default: return 'Service';
      }
    };

    const serviceName = getServiceTypeName(serviceType);
    
    switch (status) {
      case 'pending': return `${serviceName} Pending`;
      case 'confirmed': return `${serviceName} Confirmed`;
      case 'declined': return `${serviceName} Declined`;
      case 'cancelled': return `${serviceName} Cancelled`;
      default: return `${serviceName} Update`;
    }
  };

  const getReservationMessage = (reservation: FirebaseUserReservation): string => {
    const serviceName = reservation.serviceTitle || 'Service';
    const actionText = getActionText(reservation.serviceType);
    
    switch (reservation.status) {
      case 'pending': return `Your ${serviceName} ${actionText} is pending approval`;
      case 'confirmed': return `Your ${serviceName} ${actionText} has been confirmed`;
      case 'declined': return `Your ${serviceName} ${actionText} has been declined`;
      case 'cancelled': return `Your ${serviceName} ${actionText} has been cancelled`;
      default: return `Update for your ${serviceName} ${actionText}`;
    }
  };

  const getActionText = (serviceType?: string): string => {
    switch (serviceType) {
      case 'laundry': return 'avail';
      case 'auto': return 'avail';
      case 'apartment': return 'reservation';
      default: return 'reservation';
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const storageKey = `user:lastSeenReservations:${user.uid}`;
      await AsyncStorage.setItem(storageKey, String(Date.now()));

      // Navigate based on notification type
      if (notification.type === 'reservation') {
        console.log('Navigating to bookings tab');
        router.push('/(user-tabs)/bookings' as any);
      } else if (notification.type === 'message') {
        console.log('Navigating to messages');
        router.push('/(user-tabs)/messages' as any);
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

      const storageKey = `user:lastSeenReservations:${user.uid}`;
      await AsyncStorage.setItem(storageKey, String(Date.now()));

      // Update local state
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      Alert.alert(
        'Delete Notification',
        'Are you sure you want to delete this notification?',
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
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) return;

                // Save deleted notification ID to AsyncStorage
                const deletedKey = `user:deletedNotifications:${user.uid}`;
                const deletedNotifications = await AsyncStorage.getItem(deletedKey);
                const deletedIds = deletedNotifications ? JSON.parse(deletedNotifications) : [];
                
                if (!deletedIds.includes(notificationId)) {
                  deletedIds.push(notificationId);
                  await AsyncStorage.setItem(deletedKey, JSON.stringify(deletedIds));
                }

                // Update notifications list to hide deleted ones
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                
                // Update unread count
                setUnreadCount(prev => {
                  const deletedNotification = notifications.find(n => n.id === notificationId);
                  return deletedNotification && !deletedNotification.isRead ? prev - 1 : prev;
                });
              } catch (error) {
                console.error('Error saving deleted notification:', error);
                Alert.alert('Error', 'Failed to delete notification');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
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

                // Save all current notification IDs as deleted
                const deletedKey = `user:deletedNotifications:${user.uid}`;
                const deletedNotifications = await AsyncStorage.getItem(deletedKey);
                const deletedIds = deletedNotifications ? JSON.parse(deletedNotifications) : [];
                
                // Add all current notification IDs to deleted list
                const currentIds = notifications.map(n => n.id);
                const newDeletedIds = [...new Set([...deletedIds, ...currentIds])];
                await AsyncStorage.setItem(deletedKey, JSON.stringify(newDeletedIds));

                // Clear notifications list
                setNotifications([]);
                setUnreadCount(0);
              } catch (error) {
                console.error('Error saving deleted notifications:', error);
                Alert.alert('Error', 'Failed to clear notifications');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications();
  };

  const handleNotificationLongPress = async (notification: Notification) => {
    // Add haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Delete Notification',
      `Are you sure you want to delete this notification? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification(notification),
        },
      ]
    );
  };

  const deleteNotification = async (notification: Notification) => {
    try {
      // Add haptic feedback for deletion
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      // Get existing deleted notifications
      const deletedKey = `user:deletedNotifications:${user.uid}`;
      const existingDeleted = await AsyncStorage.getItem(deletedKey);
      const deletedIds = existingDeleted ? JSON.parse(existingDeleted) : [];
      
      // Add this notification ID to deleted list
      if (!deletedIds.includes(notification.id)) {
        deletedIds.push(notification.id);
        await AsyncStorage.setItem(deletedKey, JSON.stringify(deletedIds));
      }

      // Remove from current notifications list
      const updatedNotifications = notifications.filter(n => n.id !== notification.id);
      setNotifications(updatedNotifications);
      
      // Update unread count
      const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount);

      console.log('✅ Notification deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification. Please try again.');
    }
  };

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
    const isUnread = !item.isRead;
    const statusColor = getStatusColor(item.title);
    
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
          onLongPress={() => handleNotificationLongPress(item)}
          android_ripple={{ color: colors.primary + '20' }}
        >
          <View style={styles.notificationContent}>
            {/* Status Indicator */}
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
              {/* ========================================
                   STATUS ICON - NOTIFICATION TYPE INDICATOR
                   ========================================
                   I-display ang status icon based sa notification type
                   Ginagamit para sa visual indication ng notification status */}
              <MaterialIcons 
                name={getStatusIcon(item.title)} // Dynamic icon based sa notification title
                size={18} // Icon size - 18px
                color="#FFFFFF" // White color para sa contrast
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
                  {/* ========================================
                       SCHEDULE ICON - TIMESTAMP INDICATOR
                       ========================================
                       I-display ang schedule icon para sa timestamp
                       Ginagamit para sa visual indication ng time */}
                  <MaterialIcons name="schedule" size={12} color={subtitleColor} />
                  <ThemedText style={[styles.notificationTime, { color: subtitleColor }]}>
                    {formatTime(item.timestamp)}
                  </ThemedText>
                </View>
                
                <View style={[styles.statusBadge, { 
                  backgroundColor: isDark ? statusColor + '20' : '#FFFFFF', 
                  borderColor: statusColor, 
                  borderWidth: 0.5 
                }]}>
                  <ThemedText style={[styles.statusText, { color: statusColor, fontWeight: '700' }]}>
                    {getStatusText(item.title)}
                  </ThemedText>
                </View>
              </View>
            </View>
            
            {/* Arrow */}
            <View style={styles.arrowContainer}>
              {/* ========================================
                   CHEVRON RIGHT ICON - NAVIGATION INDICATOR
                   ========================================
                   I-display ang chevron right icon para sa navigation
                   Ginagamit para sa visual indication na clickable ang notification */}
              <MaterialIcons 
                name="chevron-right" // Chevron right icon para sa navigation
                size={20} // Icon size - 20px
                color={subtitleColor} // Subtitle color para sa subtle appearance
                style={{ opacity: 0.6 }} // Opacity para sa subtle effect
              />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const getStatusColor = (title: string): string => {
    if (title.includes('pending') || title.includes('Pending')) return '#FF9500'; // Orange for pending
    if (title.includes('confirmed') || title.includes('Confirmed')) return '#34C759'; // Green for confirmed
    if (title.includes('declined') || title.includes('Declined')) return '#FF3B30'; // Red for declined
    if (title.includes('cancelled') || title.includes('Cancelled')) return '#8E8E93'; // Gray for cancelled
    return colors.primary;
  };

  // ========================================
  // GET STATUS ICON FUNCTION - ICON SELECTION
  // ========================================
  // Function na nagde-determine ng appropriate icon based sa notification title
  // Ginagamit para sa visual indication ng notification status
  const getStatusIcon = (title: string) => {
    // ========================================
    // ICON MAPPING - NOTIFICATION STATUS ICONS
    // ========================================
    // I-map ang different status types sa appropriate icons
    
    if (title.includes('pending') || title.includes('Pending')) 
      return 'access-time' as const; // Clock icon para sa pending status
    if (title.includes('confirmed') || title.includes('Confirmed')) 
      return 'check-circle' as const; // Check circle icon para sa confirmed status
    if (title.includes('declined') || title.includes('Declined')) 
      return 'cancel' as const; // Cancel icon para sa declined status
    if (title.includes('cancelled') || title.includes('Cancelled')) 
      return 'block' as const; // Block icon para sa cancelled status
    return 'notifications' as const; // Default notifications icon
  };

  const getStatusText = (title: string): string => {
    if (title.includes('pending') || title.includes('Pending')) return 'Pending';
    if (title.includes('confirmed') || title.includes('Confirmed')) return 'Confirmed';
    if (title.includes('declined') || title.includes('Declined')) return 'Declined';
    if (title.includes('cancelled') || title.includes('Cancelled')) return 'Cancelled';
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation': return 'event';
      case 'message': return 'message';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'reservation': return '#4CAF50';
      case 'message': return '#2196F3';
      case 'system': return '#FF9800';
      default: return '#9E9E9E';
    }
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
      {/* Professional Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.surface,
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
              {/* ========================================
                   ARROW BACK ICON - BACK NAVIGATION
                   ========================================
                   I-display ang arrow back icon para sa back navigation
                   Ginagamit para sa pag-navigate pabalik sa previous screen */}
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
                {/* ========================================
                     DELETE OUTLINE ICON - CLEAR ALL NOTIFICATIONS
                     ========================================
                     I-display ang delete outline icon para sa clear all action
                     Ginagamit para sa pag-clear ng lahat ng notifications */}
                <MaterialIcons name="delete-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleMarkAllRead}
              >
                {/* ========================================
                     DONE ALL ICON - MARK ALL AS READ
                     ========================================
                     I-display ang done all icon para sa mark all as read action
                     Ginagamit para sa pag-mark ng lahat ng notifications as read */}
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
                {/* ========================================
                     NOTIFICATIONS NONE ICON - EMPTY STATE
                     ========================================
                     I-display ang notifications none icon para sa empty state
                     Ginagamit para sa visual indication na walang notifications */}
                <MaterialIcons 
                  name="notifications-none" // Notifications none icon para sa empty state
                  size={80} // Large icon size - 80px para sa prominence
                  color={colors.primary} // Primary color para sa brand consistency
                  style={{ opacity: 0.6 }} // Opacity para sa subtle effect
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
                  {/* ========================================
                       REFRESH ICON - REFRESH ACTION
                       ========================================
                       I-display ang refresh icon para sa refresh action
                       Ginagamit para sa pag-refresh ng notifications list */}
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
    borderLeftColor: '#007AFF',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
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
    shadowColor: '#007AFF',
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
