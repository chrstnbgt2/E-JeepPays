import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('No user is logged in.');
        return;
      }
  
      const uid = currentUser.uid;
      const notificationRef = database().ref(`/notification_user/${uid}`);
  
      notificationRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const notificationsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
  
          // Convert createdAt timestamps to numbers (if stored as a string)
          notificationsArray.forEach((notif) => {
            notif.createdAt = notif.createdAt ? new Date(notif.createdAt).getTime() : 0;
          });
  
          // Get timestamp for 1 week ago
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const cutoffTimestamp = oneWeekAgo.getTime();
  
          // Filter to include only notifications from the last 7 days
          const recentNotifications = notificationsArray.filter(
            (notif) => notif.createdAt > cutoffTimestamp
          );
  
          // Separate unread and read notifications
          const unreadNotifications = recentNotifications.filter((notif) => notif.status === 'unread');
          const readNotifications = recentNotifications.filter((notif) => notif.status === 'read');
  
          // Sort unread notifications by newest first
          unreadNotifications.sort((a, b) => b.createdAt - a.createdAt);
          // Sort read notifications by newest first
          readNotifications.sort((a, b) => b.createdAt - a.createdAt);
  
          // Combine sorted unread + sorted read notifications
          const finalSortedNotifications = [...unreadNotifications, ...readNotifications];
  
          // Update state
          setNotifications(finalSortedNotifications);
          setUnreadCount(unreadNotifications.length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
        setLoading(false);
      });
  
      return () => notificationRef.off();
    };
  
    fetchNotifications();
  }, []);
  
  const markAsRead = async (notificationId) => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;
  
    const uid = currentUser.uid;
    const notificationRef = database().ref(`/notification_user/${uid}/${notificationId}`);
  
    try {
      await notificationRef.update({ status: 'read' });
  
      // Update state instantly without re-fetching from Firebase
      setNotifications((prevNotifications) => {
        return prevNotifications
          .map((notif) =>
            notif.id === notificationId ? { ...notif, status: 'read' } : notif
          )
          .sort((a, b) => {
            if (a.status === 'unread' && b.status === 'read') return -1; // Unread first
            if (a.status === 'read' && b.status === 'unread') return 1; // Read later
            return b.createdAt - a.createdAt; // Sort by newest first
          });
      });
  
      setUnreadCount((prevCount) => Math.max(prevCount - 1, 0)); // Reduce unread count
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  

  const renderNotificationItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.notificationCard, item.status === 'unread' && styles.unreadNotification]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.notificationHeader}>
          <Ionicons
            name="notifications-outline"
            size={30}
            color={item.status === 'unread' ? '#FF6B6B' : '#466B66'}
          />
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationDate}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{unreadCount}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#466B66" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#466B66',
    padding: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    padding: 5,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  notificationCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF6B6B',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationInfo: {
    marginLeft: 10,
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationDate: {
    fontSize: 12,
    color: '#777',
  },
});

export default NotificationScreen;
