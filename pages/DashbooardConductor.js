import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const HomeScreenConductor = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');  
  const [walletBalance, setWalletBalance] = useState('0.00');  
  const [totalPassengers, setTotalPassengers] = useState(0); 
  const [totalIncome, setTotalIncome] = useState(0.0);  
  const [latestTransactions, setLatestTransactions] = useState([]);
 
  
  useEffect(() => {
    let userRef, jeepneyStatsRef, transactionsRef;

    const fetchUserAndStats = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          console.warn('No user is currently logged in.');
          return;
        }

        const conductorUid = currentUser.uid;
        userRef = database().ref(`users/accounts/${conductorUid}`);

        // Real-time listener for user details
        userRef.on('value', async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUsername(userData.firstName || 'User');
            setWalletBalance(userData.wallet_balance?.toFixed(2) || '0.00');

            const driverUid = userData.creatorUid;
            if (!driverUid) {
              console.warn('No linked driver found.');
              return;
            }

            const driverSnapshot = await database().ref(`/users/accounts/${driverUid}`).once('value');
            if (!driverSnapshot.exists()) {
              console.warn('Driver account not found.');
              return;
            }

            const driverData = driverSnapshot.val();
            const jeepneyUid = driverData.jeep_assigned;
            if (!jeepneyUid) {
              console.warn('No jeepney assigned.');
              return;
            }

            const today = new Date().toISOString().split('T')[0];
            jeepneyStatsRef = database().ref(`/jeepneys/${jeepneyUid}/dailyStats/${today}`);

            // Listener for daily stats (total income and passengers)
            jeepneyStatsRef.on('value', (statsSnapshot) => {
              if (statsSnapshot.exists()) {
                const statsData = statsSnapshot.val();
                setTotalPassengers(statsData.totalPassengers || 0);
                setTotalIncome(parseFloat(statsData.totalIncome || 0).toFixed(2));
              } else {
                setTotalPassengers(0);
                setTotalIncome('0.00');
              }
            });

            // Fetch latest 2 transactions
            transactionsRef = database().ref(`users/accounts/${conductorUid}/transactions`);
            transactionsRef.on('value', (snapshot) => {
              if (snapshot.exists()) {
                const transactionData = snapshot.val();
                const transactionList = Object.keys(transactionData).map((key) => ({
                  id: key,
                  ...transactionData[key],
                }));

                const latestTwoTransactions = transactionList
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 2);

                setLatestTransactions(latestTwoTransactions);
              } else {
                setLatestTransactions([]);
              }
            });
          } else {
            console.warn('No user data found.');
          }
        });
      } catch (error) {
        console.error('Error fetching user and stats:', error);
      }
    };

    fetchUserAndStats();

    return () => {
      if (userRef) userRef.off('value');
      if (jeepneyStatsRef) jeepneyStatsRef.off('value');
      if (transactionsRef) transactionsRef.off('value');
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
  const renderTransactionCard = (item) => {
    const amount = parseFloat(item.amount) || 0;
    const distance = parseFloat(item.distance) || 0;

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
    }

    return (
      <View key={item.id} style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Ionicons name={iconName} size={32} color={color} style={styles.transactionIcon} />
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{transactionTitle}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionAmount, { color }]}>₱{amount.toFixed(2)}</Text>
          {item.type === 'trip' && <Text style={styles.transactionDistance}>Distance: {distance.toFixed(2)} km</Text>}
        </View>
      </View>
    );
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
            <Text style={styles.walletBalance}>₱{walletBalance}</Text>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
          </View>
          <Image
            source={require('../assets/images/wallet-icon.png')}
            style={styles.walletIcon}
          />
           <TouchableOpacity style={styles.cashInButton} onPress={() => navigation.navigate('CashIn')}>
            <Text style={styles.cashInText}>Cash In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cashInButton1} onPress={() => navigation.navigate('Transfer')}>
            <Text style={styles.cashInText}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard Section */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <Image
            source={require('../assets/images/line.png')}
            style={styles.lineImage}
          />
        </View>
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

        {/* Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
        {latestTransactions.length > 0 ? (
          latestTransactions.map((transaction) => renderTransactionCard(transaction))
        ) : (
          <Text style={styles.noTransactionsText}>No recent transactions available.</Text>
        )}
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
   cashInButton1: {
    backgroundColor: '#CCD9B8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft:5,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  transactionDistance: {
    fontSize: 14,
    color: '#777',
  },
  noTransactionsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default HomeScreenConductor;
