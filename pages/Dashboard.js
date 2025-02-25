import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
  FlatList 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [fareRate, setFareRate] = useState('0.00');
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [accType, setAccType] = useState('Regular');
  const [latestTrip, setLatestTrip] = useState(null);  
  const [transactions, setTransactions] = useState([]); 
  const [totalDistance, setTotalDistance] = useState(0);

  useEffect(() => {
    let userRef, fareRef, transactionsRef, notificationRef;

    const fetchData = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          console.warn("No user is currently logged in.");
          return;
        }

        const uid = currentUser.uid;
        userRef = database().ref(`users/accounts/${uid}`);

        userRef.on("value", (userSnapshot) => {
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            setUsername(userData.firstName || "");
            setWalletBalance(
              userData.wallet_balance ? userData.wallet_balance.toFixed(2) : "0.00"
            );
            const userAccountType = userData.acc_type || "Regular";
            setAccType(userAccountType);

            fareRef = database().ref(`fares/${userAccountType.toLowerCase()}/firstKm`);
            fareRef.on("value", (fareSnapshot) => {
              if (fareSnapshot.exists()) {
                setFareRate(fareSnapshot.val().toFixed(2));
              }
            });
          }
        });

        // Fetch latest 5 transactions
        transactionsRef = database().ref(`users/accounts/${uid}/transactions`);
        transactionsRef.on("value", (snapshot) => {
          if (snapshot.exists()) {
            const transactionData = snapshot.val();
            const transactionList = Object.keys(transactionData).map((key) => ({
              id: key,
              ...transactionData[key],
            }));

            const recentTransactions = transactionList
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 5);

            setTransactions(recentTransactions);

            // Calculate total distance
            const totalDistanceSum = transactionList
              .filter((transaction) => transaction.type === "trip")
              .reduce((sum, trip) => sum + (trip.distance || 0), 0);

            setTotalDistance(totalDistanceSum.toFixed(2));
          } else {
            setTransactions([]);
            setTotalDistance(0);
          }
        });

        // Unread notifications
        notificationRef = database().ref(`notification_user/${uid}`);
        notificationRef.on("value", (snapshot) => {
          if (snapshot.exists()) {
            const notifications = Object.values(snapshot.val());
            const unreadCount = notifications.filter((notif) => notif.status === "unread").length;
            setUnreadNotifications(unreadCount);
          } else {
            setUnreadNotifications(0);
          }
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    return () => {
      if (userRef) userRef.off("value");
      if (fareRef) fareRef.off("value");
      if (transactionsRef) transactionsRef.off("value");
      if (notificationRef) notificationRef.off("value");
    };
  }, []);
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let userRef, notificationRef;

    const fetchData = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          console.warn('No user is currently logged in.');
          return;
        }

        const uid = currentUser.uid;

        // Listener for user details
        userRef = database().ref(`users/accounts/${uid}`);
        userRef.on('value', (userSnapshot) => {
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            setUsername(userData.firstName || '');
            setWalletBalance(userData.wallet_balance ? userData.wallet_balance.toFixed(2) : '0.00');
          } else {
            console.warn('No user data found.');
          }
        });

        // Listener for unread notifications
        notificationRef = database().ref(`notification_user/${uid}`);
        notificationRef.on('value', (snapshot) => {
          if (snapshot.exists()) {
            const notifications = Object.values(snapshot.val());
            const unreadCount = notifications.filter((notif) => notif.status === 'unread').length;
            setUnreadNotifications(unreadCount);
          } else {
            setUnreadNotifications(0);
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    return () => {
      if (userRef) userRef.off('value');
      if (notificationRef) notificationRef.off('value');
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            Welcome! <Text style={styles.username}>@{username}</Text>
          </Text>
                      <TouchableOpacity
              onPress={() => navigation.navigate('Notifications', { uid: auth().currentUser.uid })}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationDot}>
                    <Text style={styles.notificationCount}>
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

        </View>
        <View style={styles.walletSection}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletBalance}>₱{walletBalance}</Text>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
          </View>
          <Image
            source={require('../assets/images/wallet-icon.png')}
            style={styles.walletIcon}
          />
          <TouchableOpacity
            style={styles.cashInButton}
            onPress={() => navigation.navigate('CashIn')}
          >
            <Text style={styles.cashInText}>Cash In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <Image
            source={require('../assets/images/line.png')}
            style={styles.lineImage}
          />
        </View>
        <View style={styles.dashboard}>
          <ImageBackground
            source={require('../assets/images/card-gradient.png')}
            style={styles.card}
            imageStyle={styles.cardImageBackground}
          >
            <Ionicons name="cash-outline" size={40} color="#FFFFFF" />
            <Text style={styles.cardValue}>₱{fareRate}</Text>
            <Text style={styles.cardLabel}>{accType} Fare Rate</Text>
          </ImageBackground>

          <ImageBackground
            source={require('../assets/images/card-gradient.png')}
            style={styles.card}
            imageStyle={styles.cardImageBackground}
          >
             <MaterialCommunityIcons name="road-variant" size={40} color="#FFFFFF" />
            <Text style={styles.cardValue}>{totalDistance} kms</Text>
            <Text style={styles.cardLabel}>Total Distance Travelled</Text>
          </ImageBackground>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Image
            source={require('../assets/images/line.png')}
            style={styles.lineImage}
          />
        </View>

        <View style={styles.transactionList}>
  {transactions.length > 0 ? (
  <FlatList
  data={transactions}
  keyExtractor={(item, index) => item.id || index.toString()}
  renderItem={({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionRow}>
        {item.type === 'trip' ? (
          <MaterialCommunityIcons name="map-marker-path" size={32} color="#466B66" style={styles.transactionIcon} />
        ) : item.type === 'cash_in' ? (
          <Ionicons name="cash-outline" size={32} color="#8FCB81" style={styles.transactionIcon} />
        ) : (
          <Ionicons name="help-circle-outline" size={32} color="#888" style={styles.transactionIcon} />
        )}
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionText}>
            {item.type === 'trip' ? 'Trip Payment:' : item.type === 'cash_in' ? 'Cash-In:' : 'Other Transaction:'}{' '}
            <Text style={styles.transactionAmount}>₱{(item.amount || 0).toFixed(2)}</Text>
          </Text>
          <Text style={styles.transactionDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  )}
  style={{ maxHeight: 165 }} // Limit height for proper scrolling
  showsVerticalScrollIndicator={false} 
  nestedScrollEnabled={true} // Enable nested scrolling to avoid errors
/>

  ) : (
    <Text style={styles.noTransactionsText}>No recent transactions.</Text>
  )}
</View>

        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    backgroundColor: '#466B66',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  username: {
    fontWeight: 'bold',
    color: '#8FCB81',
  },
  walletSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  walletInfo: {
    flex: 1,
  },
  walletBalance: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  walletLabel: {
    fontSize: 14,
    color: '#8FCB81',
  },
  walletIcon: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  cashInButton: {
    backgroundColor: '#8FCB81',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  cashInText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: '#466B66',
    marginRight: 10,
  },
  lineImage: {
    height: 90,
    width: '100%',
    resizeMode: 'contain',
  },
  dashboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    borderRadius: 15,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    overflow: 'hidden',
  },
  cardImageBackground: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  cardLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  transactionList: {
    marginTop: -25,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 50,
    marginBottom: 10,
    elevation: 2,
  }, 
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#466B66',
  },
  transactionAmount: {
    fontWeight: 'bold',
    color: '#8FCB81',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  tripDistance: {
    fontWeight: 'bold',
    color: '#466B66',
  },
  noTransactionsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    marginVertical: 10,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
