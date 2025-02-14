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

const HomeScreenDriver = () => {
  const navigation = useNavigation();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [username, setUsername] = useState('User');
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [totalIncome, setTotalIncome] = useState('0.00');
  const [latestTransactions, setLatestTransactions] = useState([]);
  const driverUid = auth().currentUser?.uid; // Get logged-in driver UID
  const watchIdRef = useRef(null);

 
  useEffect(() => {
    if (driverUid) {
      const userRef = database().ref(`users/accounts/${driverUid}`);

      userRef.on('value', async (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUsername(userData.firstName || 'Driver');
          setWalletBalance(userData.wallet_balance || 0);

          const jeepneyUid = userData.jeep_assigned;
          if (!jeepneyUid) {
            console.warn('No jeepney assigned to this driver.');
            return;
          }

          // Fetch daily stats for the assigned jeepney
          const today = new Date().toISOString().split('T')[0]; // Get today's date (YYYY-MM-DD)
          const jeepneyStatsRef = database().ref(`/jeepneys/${jeepneyUid}/dailyStats/${today}`);

          jeepneyStatsRef.on('value', (statsSnapshot) => {
            if (statsSnapshot.exists()) {
              const statsData = statsSnapshot.val();
              setTotalPassengers(statsData.totalPassengers || 0); // Update total passengers
              setTotalIncome(parseFloat(statsData.totalIncome || 0).toFixed(2)); // Update total income
            } else {
              setTotalPassengers(0);
              setTotalIncome('0.00');
            }
          });

          // Fetch latest transactions
          const transactionsRef = database()
            .ref(`users/accounts/${driverUid}/transactions`)
            .orderByKey()
            .limitToLast(2); // Fetch last 2 transactions
          transactionsRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
              const transactionList = Object.values(snapshot.val()).reverse();
              setLatestTransactions(transactionList);
            } else {
              setLatestTransactions([]);
            }
          });
        }
      });

      return () => {
        userRef.off('value');
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

  const renderTransactionCard = (transaction, index) => {
    const amount = parseFloat(transaction.amount) || 0;
    let iconName = 'wallet-outline';
    let transactionTitle = 'Cash In';
    let color = '#466B66';
  
    if (transaction.type === 'trip') {
      iconName = 'car-outline';
      transactionTitle = 'Trip Payment';
    } else if (transaction.type === 'cash_out') {
      iconName = 'arrow-down-outline';
      transactionTitle = 'Cash Out';
      color = '#FF6B6B'; // Red for cash out
    } else if (transaction.type === 'received') {
      iconName = 'arrow-up-outline'; // Icon for received
      transactionTitle = 'Received';
      color = '#4CAF50'; // Green for received
    }
  
    return (
      <View key={index} style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Ionicons name={iconName} size={30} color={color} style={styles.transactionIcon} />
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{transactionTitle}</Text>
            <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionAmount, { color }]}>₱{amount.toFixed(2)}</Text>
          {transaction.type === 'trip' && (
            <Text style={styles.transactionDistance}>
              Distance: {transaction.distance?.toFixed(2) || '0.00'} km
            </Text>
          )}
          {transaction.type === 'received' && transaction.sender && (
            <Text style={styles.transactionDetailsText}>From: {transaction.sender}</Text>
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
          setWalletBalance(userData.wallet_balance || 0); 
          setUsername(userData.firstName || 'Username');  
        }
      });

      return () => {
        userRef.off('value', balanceListener);  
      };
    }
  }, [driverUid]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const result = await request(
          Platform.OS === 'android'
            ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
            : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        );

        if (result === RESULTS.GRANTED) {
          console.log('Location permission granted');

          // Start sharing location
          watchIdRef.current = Geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentLocation([longitude, latitude]);

              if (driverUid) {
                updateDriverLocation(latitude, longitude, driverUid);
              }
            },
            (error) => {
              console.error('Error fetching location:', error);
              Alert.alert('Location Error', 'Unable to fetch current location.');
            },
            { enableHighAccuracy: true, distanceFilter: 10, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to track your location.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => openSettings() },
            ]
          );
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };

    requestLocationPermission();

    return () => {
      if (driverUid) {
        database().ref(`jeep_loc/${driverUid}`).remove();
      }
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [driverUid]);

  const updateDriverLocation = (latitude, longitude, driverUid) => {
    const geohash = geohashForLocation([latitude, longitude]);

    database()
      .ref(`jeep_loc/${driverUid}`)
      .set({
        lat: latitude,
        lng: longitude,
        geohash,
        timestamp: Date.now(),
      })
      .catch((error) => {
        console.error('Error updating driver location:', error);
      });
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            Welcome! <Text style={styles.username}>@{username}</Text>
          </Text>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.walletSection}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletBalance}>₱ {walletBalance.toFixed(2)}</Text>
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
        <View style={styles.dashboard}>
          {/* Total Passenger Card */}
          <ImageBackground
            source={require('../assets/images/card-gradient.png')}
            style={styles.card}
            imageStyle={styles.cardImageBackground}
          >
            <MaterialCommunityIcons name="account-group" size={40} color="#FFFFFF" />
            <Text style={styles.cardValue}>{totalPassengers}</Text>
            <Text style={styles.cardLabel}>Total Passengers</Text>
          </ImageBackground>

          {/* Total Income Card */}
          <ImageBackground
            source={require('../assets/images/card-gradient.png')}
            style={styles.card}
            imageStyle={styles.cardImageBackground}
          >
            <FontAwesome5 name="coins" size={40} color="#FFFFFF" />
            <Text style={styles.cardValue}>₱ {totalIncome}</Text>
            <Text style={styles.cardLabel}>Total Income</Text>
          </ImageBackground>
        </View>

        {/* Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Image source={require('../assets/images/line.png')} style={styles.lineImage} />
        </View>
        <View style={styles.transactionList}>
        {latestTransactions.length > 0 ? (
            latestTransactions.map((transaction, index) => renderTransactionCard(transaction, index))
          ) : (
            <Text style={styles.noTransactionsText}>No recent transactions available.</Text>
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
  },transactionCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  },
  
});

export default HomeScreenDriver;
