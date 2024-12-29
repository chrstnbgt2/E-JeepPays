 
import React from 'react';
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

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            Welcome! <Text style={styles.username}>@username</Text>
          </Text>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.walletSection}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletBalance}>₱ 0.00</Text>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
          </View>
          <Image
            source={require('../assets/images/wallet-icon.png')} 
            style={styles.walletIcon}
          />
          <TouchableOpacity style={styles.cashInButton}>
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
            <Text style={styles.cardValue}>14.00</Text>
            <Text style={styles.cardLabel}>Fare Rate</Text>
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
            source={require('../assets/images/line.png')} // Replace with your line.png path
            style={styles.lineImage}
          />
        </View>
        <View style={styles.transactionList}>
          <View style={styles.transactionItem}></View>
          <View style={styles.transactionItem}></View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#8FCB81" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}  onPress={() => router.push('/jeeptracker')}>
          <Ionicons name="location-outline" size={24} color="#FFFFFF" />
          <Text style={styles.navText}>Tracker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
          <Text style={styles.navText}>My QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="time-outline" size={24} color="#FFFFFF" />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#FFFFFF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
});

export default HomeScreen;
