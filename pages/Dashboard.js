 import React, { useState, useEffect } from 'react';
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
import auth from '@react-native-firebase/auth'; // Firebase Authentication
import database from '@react-native-firebase/database'; // Firebase Realtime Database

const HomeScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState(''); // State for the username
  const [fareRate, setFareRate] = useState('0.00'); // State for fare rate
  const [walletBalance, setWalletBalance] = useState('0.00'); // State for wallet balance
  const [accType, setAccType] = useState('Regular'); // State for account type

  useEffect(() => {
    let userRef;
    let walletRef;
    let fareRef;

    const fetchData = async () => {
      try {
        // Get the current logged-in user
        const currentUser = auth().currentUser;
        if (!currentUser) {
          console.warn('No user is currently logged in.');
          return;
        }

        const uid = currentUser.uid;

        // Real-time listener for user details
        userRef = database().ref(`users/accounts/${uid}`);
        userRef.on('value', (userSnapshot) => {
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            setUsername(userData.firstName || '');
            setWalletBalance(userData.wallet_balance || '0.00');
            const userAccountType = userData.acc_type || 'Regular';
            setAccType(userAccountType);

            // Real-time listener for fare rate based on account type
            fareRef = database().ref(`fares/${userAccountType.toLowerCase()}/firstKm`);
            fareRef.on('value', (fareSnapshot) => {
              if (fareSnapshot.exists()) {
                setFareRate(fareSnapshot.val());
              } else {
                console.warn('No fare data found for this account type.');
              }
            });
          } else {
            console.warn('No user data found for the current UID.');
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    // Cleanup listeners on unmount
    return () => {
      if (userRef) userRef.off('value');
      if (fareRef) fareRef.off('value');
    };
  }, []);

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
          <TouchableOpacity
            style={styles.cashInButton}
            onPress={() => navigation.navigate('CashIn')}
          >
            <Text style={styles.cashInText}>Cash In</Text>
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
            <Ionicons name="cash-outline" size={40} color="#FFFFFF" />
            <Text style={styles.cardValue}>₱{fareRate}</Text>
            <Text style={styles.cardLabel}>{accType} Fare Rate</Text>
          </ImageBackground>

          {/* Distance Travelled Card */}
          <ImageBackground
            source={require('../assets/images/card-gradient.png')}
            style={styles.card}
            imageStyle={styles.cardImageBackground}
          >
            <MaterialCommunityIcons name="road-variant" size={40} color="#FFFFFF" />
            <Text style={styles.cardValue}>56 kms</Text>
            <Text style={styles.cardLabel}>Distance Travelled</Text>
          </ImageBackground>
        </View>

            {/* Transactions Section */}
            <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Image
            source={require('../assets/images/line.png')}
            style={styles.lineImage}
          />
        </View>
        <View style={styles.transactionList}>
          <View style={styles.transactionItem}></View>
          <View style={styles.transactionItem}></View>
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
    marginTop: 10,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 50,
    marginBottom: 10,
    elevation: 2,
  },
});

export default HomeScreen;
