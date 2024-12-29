import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
 
const HistoryScreen = () => {

const navigation = useNavigation();
  // Dummy data for transactions
  const transactions = Array(7).fill(null); // Seven blank transactions

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Recent Transaction</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={() => <View style={styles.transactionItem} />}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.transactionsList}
      />

      {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="home" size={24} color="#FFFFFF" onPress={() => navigation.navigate('Home')}/>
              <Text style={styles.navText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem}   onPress={() => navigation.navigate('Tracker')}>
              <Ionicons name="location-outline" size={24} color="#FFFFFF" />
              <Text style={styles.navText}>Tracker</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('MyQR')}>
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
              <Text style={styles.navText}>My QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('History')}>
              <Ionicons name="time-outline" size={24} color="#8FCB81" />
              <Text style={styles.navText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
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
    backgroundColor: '#FFFF',
  },
  header: {
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  transactionsList: {
    paddingHorizontal: 20,
  },
  transactionItem: {
    backgroundColor: '#CCD9B8',
    height: 50,
    borderRadius: 10,
    marginBottom: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#466B66',
    height: 70,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginTop: 'auto',
  },
  navItem: {
    alignItems: 'center',
  },
  activeNavItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
  activeNavText: {
    fontSize: 12,
    color: '#8FCB81',
    marginTop: 5,
    fontWeight: 'bold',
  },
});

export default HistoryScreen;
