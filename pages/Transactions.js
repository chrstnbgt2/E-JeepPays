import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const HistoryScreen = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]); // State for transactions
  const [loading, setLoading] = useState(true); // Loading indicator

  useEffect(() => {
    let transactionsRef;

    const fetchTransactions = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('No user is logged in.');
        return;
      }

      const uid = currentUser.uid;

      // Real-time listener for transactions
      transactionsRef = database().ref(`users/accounts/${uid}/transactions`);
      transactionsRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
          const transactionData = snapshot.val();
          const transactionList = Object.keys(transactionData).map((key) => ({
            id: key,
            ...transactionData[key],
          }));
          setTransactions(transactionList.reverse()); // Show latest transactions first
        } else {
          setTransactions([]);
        }
        setLoading(false);
      });
    };

    fetchTransactions();

    // Cleanup listener on unmount
    return () => {
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

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionText}>
        {item.type === 'trip'
          ? `Trip: ₱${item.amount?.toFixed(2) || '0.00'} for a distance of ${item.distance?.toFixed(2) || '0.00'} km`
          : `You Received: ₱${item.amount?.toFixed(2) || '0.00'}`}
      </Text>
      <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Recent Transactions</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {loading ? (
        <ActivityIndicator size="large" color="#8FCB81" style={{ marginTop: 20 }} />
      ) : transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.transactionsList}
        />
      ) : (
        <Text style={styles.noTransactionsText}>No transactions available.</Text>
      )}
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
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  transactionText: {
    fontSize: 16,
    color: '#000',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  noTransactionsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default HistoryScreen;
