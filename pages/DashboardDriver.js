import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Geolocation from 'react-native-geolocation-service';
import database from '@react-native-firebase/database';
import { geohashForLocation } from 'geofire-common';
import auth from '@react-native-firebase/auth';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native-gesture-handler';
 
const HomeScreenDriver = () => {
  const navigation = useNavigation();
 
  const [currentLocation, setCurrentLocation] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [username, setUsername] = useState('User');
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [totalIncome, setTotalIncome] = useState('0.00');
  const [latestTransactions, setLatestTransactions] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [jeepneyStatus, setJeepneyStatus] = useState(null);

  const driverUid = auth().currentUser?.uid;
  const watchIdRef = useRef(null);
  const jeepneyStatusRef = useRef(null);
  const [cashPayment, setCashIncome] = useState(0.0);
  const [cashlessPayment, setCashlessIncome] = useState(0.0);
  const [isCashPayment, setIsCashPayment] = useState(true); // Toggle for Cash/Cashless


 //FETCH DETAILS
  useEffect(() => {
    if (driverUid) {
      const userRef = database().ref(`users/accounts/${driverUid}`);
  
      userRef.on('value', async (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUsername(userData.firstName || 'Driver');
          setWalletBalance(parseFloat(userData.wallet_balance) || 0);
  
          const jeepneyUid = userData.jeep_assigned;
          if (!jeepneyUid) {
            console.warn('No jeepney assigned to this driver.');
            return;
          }
  
          // Fetch total passengers & income (NOT reset daily)
          const today = new Date().toISOString().split('T')[0];
          const jeepneyStatsRef = database().ref(`/jeepneys/${jeepneyUid}/dailyStats/${today}`);
  
          jeepneyStatsRef.on("value", (statsSnapshot) => {
            if (statsSnapshot.exists()) {
              const statsData = statsSnapshot.val();
              setTotalPassengers(statsData.totalPassengers || 0);
              setTotalIncome(parseFloat(statsData.totalIncome || 0).toFixed(2));
              setCashIncome(parseFloat(statsData.cashPayment || 0));
              setCashlessIncome(parseFloat(statsData.cashlessPayment || 0));
            } else {
              setTotalPassengers(0);
              setTotalIncome("0.00");
              setCashIncome("0.00");
              setCashlessIncome("0.00");
            }
          });
  
          // Fetch last 5 transactions (sorted by `createdAt`, latest first)
          const transactionsRef = database()
            .ref(`users/accounts/${driverUid}/transactions`)
            .orderByChild("createdAt") // ✅ Order by timestamp
            .limitToLast(5); // ✅ Limit to latest 5
  
          transactionsRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
              const transactions = Object.values(snapshot.val());
  
              // ✅ Sort transactions in descending order (newest first)
              const sortedTransactions = transactions.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              );
  
              setLatestTransactions(sortedTransactions);
            } else {
              setLatestTransactions([]);
            }
          });
  
          // Cleanup listener on unmount
          return () => {
            userRef.off();
            transactionsRef.off();
          };
        }
      });
  
      return () => {
        userRef.off();
      };
    }
  }, [driverUid]);
  

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

  const renderTransactionCard = ({ item }) => {
    const amount = parseFloat(item.amount) || 0;
    let iconName = 'wallet-outline';
    let transactionTitle = 'Cash In';
    let color = '#466B66';
  
    if (item.type === 'trip') {
      iconName = 'car-outline';
      transactionTitle = 'Trip Payment';
    } else if (item.type === 'cash_out') {
      iconName = 'arrow-down-outline';
      transactionTitle = 'Cash Out';
      color = '#FF6B6B';
    } else if (item.type === 'received') {
      iconName = 'arrow-up-outline';
      transactionTitle = 'Received';
      color = '#4CAF50';
    }
  
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Ionicons name={iconName} size={30} color={color} style={styles.transactionIcon} />
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{transactionTitle}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionAmount, { color }]}>₱{amount.toFixed(2)}</Text>
          {item.type === 'trip' && (
            <Text style={styles.transactionDistance}>
              Distance: {item.distance?.toFixed(2) || '0.00'} km
            </Text>
          )}
          {item.type === 'received' && item.sender && (
            <Text style={styles.transactionDetailsText}>From: {item.sender}</Text>
          )}
        </View>
      </View>
    );
  };
  
 
  useEffect(() => {
    if (driverUid) {
      // Subscribe to the user's balance
      const userRef = database().ref(`users/accounts/${driverUid}`);
      const balanceListener = userRef.on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          setWalletBalance(parseFloat(userData.wallet_balance) || 0);

          setUsername(userData.firstName || 'Username');  
        }
      });

      return () => {
        userRef.off('value', balanceListener);  
      };
    }
  }, [driverUid]);

 //NOTIFICATION
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


  useEffect(() => {
    if (!driverUid) return;
  
    const userRef = database().ref(`users/accounts/${driverUid}`);
  
    userRef.once('value').then((snapshot) => {
      if (!snapshot.exists()) return;
      const userData = snapshot.val();
      const jeepneyUid = userData.jeep_assigned;
  
      if (!jeepneyUid) {
        console.warn('No jeepney assigned.');
        return;
      }
  
      // ✅ Listen for real-time jeepney status updates
      jeepneyStatusRef.current = database().ref(`jeepneys/${jeepneyUid}/status`);
      jeepneyStatusRef.current.on('value', (statusSnapshot) => {
        if (statusSnapshot.exists()) {
          const status = statusSnapshot.val();
          setJeepneyStatus(status);
  
          console.log(`(NOBRIDGE) LOG 🚗 Jeepney status changed: ${status}`);
  
          if (status === 'in-service') {
            console.log('🚗 Jeepney is in-service. Ensuring tracking is running...');
            requestLocationPermission(); // 🚀 Always request permission before tracking
          } else if (status === 'out-of-service') {
            console.warn('⛔ Jeepney is out-of-service. Stopping tracking.');
            stopLocationTracking();
          }
        }
      });
    });
  
    return () => {
      if (jeepneyStatusRef.current) {
        jeepneyStatusRef.current.off();
      }
      stopLocationTracking();
    };
  }, [driverUid]);
  

  const requestLocationPermission = async () => {
    try {
      const result = await request(
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      );
  
      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for real-time tracking.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openSettings() },
          ]
        );
        return;
      }
  
      console.log('✅ Location permission granted');
      startLocationTracking(); // Start tracking immediately
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
    }
  };
  

  const startLocationTracking = () => {
    console.log("📍 Attempting to start real-time location tracking...");
  
    // Clear existing watchID before starting a new one
    if (watchIdRef.current !== null) {
      console.warn("⛔ Existing tracking detected, stopping first...");
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  
    console.log("✅ Starting fresh tracking...");
  
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([longitude, latitude]);
  
        console.log(`📡 Location updated: ${latitude}, ${longitude}`);
  
        if (driverUid) {
          updateDriverLocation(latitude, longitude, driverUid);
        }
      },
      (error) => {
        console.error("❌ GPS Error:", error);
        Alert.alert("GPS Error", "Unable to fetch current location. Ensure GPS is enabled.");
  
        // Reset watchID to allow reattempting tracking
        watchIdRef.current = null;
      },
      { enableHighAccuracy: true, distanceFilter: 5, interval: 5000, fastestInterval: 2000 }
    );
  };
  


  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      console.warn('⛔ Stopping location tracking...');
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  
    if (driverUid) {
      database().ref(`jeep_loc/${driverUid}`).remove()
        .then(() => console.log('🗑️ Driver location removed from Firebase'))
        .catch((error) => console.error('❌ Error removing driver location:', error));
    }
  };
  

  const updateDriverLocation = (latitude, longitude, driverUid) => {
    const geohash = geohashForLocation([latitude, longitude]);
  
    console.log('🔄 Updating Firebase location...');
    database()
      .ref(`jeep_loc/${driverUid}`)
      .set({
        lat: latitude,
        lng: longitude,
        geohash,
        timestamp: Date.now(),
      })
      .then(() => console.log('✅ Location saved to Firebase'))
      .catch((error) => console.error('❌ Error updating driver location:', error));
  };
  


  

  return (
    <View style={styles.container}>
      {/* Header Section */}
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
          <Text style={styles.walletBalance}>₱ {parseFloat(walletBalance).toFixed(2)}</Text>

            <Text style={styles.walletLabel}>Wallet Balance</Text>
          </View>
          <Image
            source={require('../assets/images/wallet-icon.png')}
            style={styles.walletIcon}
          />
          <TouchableOpacity
            style={styles.cashOutButton}
            onPress={() => navigation.navigate('Cashout')}
          >
            <Text style={styles.cashOutText}>Cash Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard Section */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <Image source={require('../assets/images/line.png')} style={styles.lineImage} />
        </View>

               <View>
         {/* Toggle Button */}
      
         <MaterialCommunityIcons  style={styles.toggleButton}
         onPress={() => setIsCashPayment(prev => !prev)} 
         name="swap-horizontal-circle" size={30} color="#466B66" />
     
       
         {/* Dashboard Section */}
         {isCashPayment ? (
           // Cash Payment View
           <View style={styles.dashboard}>
             {/* Fare Rate Card */}
             <ImageBackground
               source={require('../assets/images/card-gradient.png')}
               style={styles.card}
               imageStyle={styles.cardImageBackground}
             >
               <MaterialCommunityIcons name="account-group" size={40} color="#FFFFFF" />
               <Text style={styles.cardValue}>{totalPassengers}</Text>
               <Text style={styles.cardLabel}>Total Passenger</Text>
             </ImageBackground>
       
             {/* Total Income Card */}
             <ImageBackground
               source={require('../assets/images/card-gradient.png')}
               style={styles.card}
               imageStyle={styles.cardImageBackground}
             >
               <FontAwesome5 name="coins" size={40} color="#FFFFFF" />
               <Text style={styles.cardValue}>₱{totalIncome}</Text>
               <Text style={styles.cardLabel}>Total Income</Text>
             </ImageBackground>
           </View>
         ) : (
           // Cashless Payment View
           <View style={styles.dashboard}>
             {/* Fare Rate Card */}
             <ImageBackground
               source={require('../assets/images/card-gradient.png')}
               style={styles.card}
               imageStyle={styles.cardImageBackground}
             >
               <MaterialCommunityIcons name="cash" size={40} color="#FFFFFF" />
               <Text style={styles.cardValue}>₱{cashlessPayment}</Text>
               <Text style={styles.cardLabel}>Total Cashless</Text>
             </ImageBackground>
       
             {/* Total Income Card */}
             <ImageBackground
               source={require('../assets/images/card-gradient.png')}
               style={styles.card}
               imageStyle={styles.cardImageBackground}
             >
               <FontAwesome5 name="coins" size={40} color="#FFFFFF" />
               <Text style={styles.cardValue}>₱{cashPayment}</Text>
               <Text style={styles.cardLabel}>Total Cash</Text>
             </ImageBackground>
           </View>
         )}
       </View>

        {/* Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Image source={require('../assets/images/line.png')} style={styles.lineImage} />
        </View>
        <View style={styles.transactionList}>
        {latestTransactions.length > 0 ? (
      <FlatList
        data={latestTransactions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderTransactionCard} // ✅ **Now correctly used**
        style={{ maxHeight: 170 }} // Limit height for proper scrolling
  showsVerticalScrollIndicator={false} 
  nestedScrollEnabled={true} // Enable nested scrolling to avoid errors
      />
    ) : (
      <Text style={styles.noTransactionsText}>No recent transactions available.</Text>
    )}

        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  toggleButton: {
     
   marginRight:-40,
    marginTop: -35,
    width: '20%', // Matches card width
   alignSelf: 'flex-end'
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
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
  cashOutButton: {
    backgroundColor: '#8FCB81',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  cashOutText: {
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
    marginBottom: -10,
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
    fontSize: 35,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  cardLabel: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  transactionList: {
    marginTop: 10,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 50,
    marginBottom: 10,
    elevation: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#466B66',
    height: 70,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
  transactionCard: {
    backgroundColor: '#FFF',
    padding: 4,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
   
   
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
 
  },
  transactionIcon: {
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#466B66',
  },
  transactionDate: {
    fontSize: 12,
    color: '#777',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#466B66',
  },
  transactionDistance: {
    fontSize: 14,
    color: '#777',
  },
  noTransactionsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },notificationDot: {
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

export default HomeScreenDriver;
