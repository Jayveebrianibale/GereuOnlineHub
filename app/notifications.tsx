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
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FirebaseUserReservation, listenToUserReservations } from './services/reservationService';

interface Notification {
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


export default function NotificationsScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#121212' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const cardBgColor = isDark ? '#1E1E1E' : '#F8F9FA';
  const borderColor = isDark ? '#333' : '#E0E0E0';
  const primaryColor = '#007AFF';

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
            title: getReservationTitle(reservation.status),
            message: getReservationMessage(reservation),
            timestamp: new Date(reservation.updatedAt).getTime(),
            isRead: false, // Will be updated based on last seen
            reservationId: reservation.id,
            actionUrl: `/reservation-details/${reservation.id}` as any,
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

  const getReservationTitle = (status: string): string => {
    switch (status) {
      case 'pending': return 'Reservation Pending';
      case 'confirmed': return 'Reservation Confirmed';
      case 'declined': return 'Reservation Declined';
      case 'cancelled': return 'Reservation Cancelled';
      default: return 'Reservation Update';
    }
  };

  const getReservationMessage = (reservation: FirebaseUserReservation): string => {
    const serviceName = reservation.serviceTitle || 'Service';
    switch (reservation.status) {
      case 'pending': return `Your ${serviceName} reservation is pending approval`;
      case 'confirmed': return `Your ${serviceName} reservation has been confirmed`;
      case 'declined': return `Your ${serviceName} reservation has been declined`;
      case 'cancelled': return `Your ${serviceName} reservation has been cancelled`;
      default: return `Update for your ${serviceName} reservation`;
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
      if (notification.actionUrl) {
        console.log('Navigating to:', notification.actionUrl);
        router.push(notification.actionUrl as any);
      } else if (notification.type === 'reservation') {
        console.log('Navigating to bookings');
        router.push('/(user-tabs)/bookings' as any);
      } else if (notification.type === 'message') {
        console.log('Navigating to messages');
        router.push('/(user-tabs)/messages' as any);
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

  const handleNotificationLongPress = (notification: Notification) => {
    // Delete immediately without confirmation
    handleDeleteNotification(notification.id);
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

  const renderNotification = ({ item }: { item: Notification }) => {
    const timeAgo = getTimeAgo(item.timestamp);
    const isUnread = !item.isRead;
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.notificationItem,
          {
            backgroundColor: cardBgColor,
            borderColor: isUnread ? primaryColor : borderColor,
            borderLeftColor: isUnread ? primaryColor : 'transparent',
            borderLeftWidth: isUnread ? 4 : 0,
            shadowColor: isDark ? '#000' : '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: isUnread ? 0.15 : 0.08,
            shadowRadius: isUnread ? 8 : 4,
            elevation: isUnread ? 6 : 2,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          }
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleNotificationLongPress(item)}
      >
        <View style={styles.notificationContent}>
          {/* Header Row */}
          <View style={styles.notificationHeader}>
            <View style={[
              styles.notificationIcon,
              { 
                backgroundColor: getNotificationIconColor(item.type),
                shadowColor: getNotificationIconColor(item.type),
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }
            ]}>
              <MaterialIcons 
                name={getNotificationIcon(item.type)} 
                size={22} 
                color="#fff" 
              />
            </View>
            
            <View style={styles.notificationTextContainer}>
              <View style={styles.titleRow}>
                <ThemedText style={[
                  styles.notificationTitle,
                  { 
                    color: textColor, 
                    fontWeight: isUnread ? '700' : '600',
                    fontSize: isUnread ? 16 : 15,
                  }
                ]}>
                  {item.title}
                </ThemedText>
                {isUnread && (
                  <View style={[styles.unreadBadge, { backgroundColor: primaryColor }]}>
                    <ThemedText style={styles.unreadBadgeText}>NEW</ThemedText>
                  </View>
                )}
              </View>
              
              <ThemedText style={[
                styles.notificationMessage,
                { 
                  color: textColor, 
                  opacity: isUnread ? 0.9 : 0.7,
                  fontWeight: isUnread ? '500' : '400',
                }
              ]} numberOfLines={2}>
                {item.message}
              </ThemedText>
            </View>
          </View>
          
          {/* Footer Row */}
          <View style={styles.notificationFooter}>
            <View style={styles.timeContainer}>
              <MaterialIcons 
                name="schedule" 
                size={14} 
                color={textColor} 
                style={{ opacity: 0.5, marginRight: 4 }}
              />
              <ThemedText style={[
                styles.notificationTime,
                { color: textColor, opacity: 0.6 }
              ]}>
                {timeAgo}
              </ThemedText>
            </View>
            
            <View style={styles.actionIndicator}>
              <MaterialIcons 
                name="chevron-right" 
                size={18} 
                color={textColor} 
                style={{ opacity: 0.4 }}
              />
            </View>
          </View>
        </View>
      </Pressable>
    );
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
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Loading notifications...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={[styles.header, { 
          borderBottomColor: borderColor,
          backgroundColor: bgColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText style={[styles.headerTitle, { color: textColor }]}>
              Notifications
            </ThemedText>
            {unreadCount > 0 && (
              <View style={styles.unreadCountContainer}>
                <View style={[styles.unreadCountBadge, { backgroundColor: primaryColor }]}>
                  <ThemedText style={styles.unreadCountText}>
                    {unreadCount}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.unreadCountLabel, { color: textColor, opacity: 0.7 }]}>
                  unread
                </ThemedText>
              </View>
            )}
          </View>
           <View style={styles.headerActions}>
             {notifications.length > 0 && (
               <TouchableOpacity
                 style={[styles.actionButton, { backgroundColor: '#DC3545' }]}
                 onPress={handleClearAllNotifications}
               >
                 <MaterialIcons name="delete-sweep" size={18} color="#fff" />
               </TouchableOpacity>
             )}
             {unreadCount > 0 && (
               <TouchableOpacity
                 style={[styles.actionButton, { backgroundColor: primaryColor }]}
                 onPress={handleMarkAllRead}
               >
                 <MaterialIcons name="done-all" size={18} color="#fff" />
               </TouchableOpacity>
             )}
           </View>
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          style={styles.notificationsList}
          contentContainerStyle={styles.notificationsContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[primaryColor]}
              tintColor={primaryColor}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={64} color={textColor} style={{ opacity: 0.3 }} />
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                No Notifications
              </ThemedText>
              <ThemedText style={[styles.emptyMessage, { color: textColor, opacity: 0.6 }]}>
                You'll see updates about your reservations here
              </ThemedText>
            </View>
          }
        />
      </ThemedView>
    </GestureHandlerRootView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  unreadCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCountBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  unreadCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  unreadCountLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 16,
  },
  notificationWrapper: {
    marginBottom: 16,
  },
  notificationItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    marginVertical: 8,
    marginBottom: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionIndicator: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
