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

          // Sort transactions by `createdAt` in descending order
          const sortedTransactions = transactionList.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Descending order (latest first)
          });

          setTransactions(sortedTransactions); // Set sorted list
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

  const renderTransactionItem = ({ item }) => {
    const amount = parseFloat(item.amount) || 0; // Ensure amount is a number
    const distance = parseFloat(item.distance) || 0; // Ensure distance is a number

    // Icon and Title for each transaction type
    let iconName = 'wallet-outline';
    let transactionTitle = 'Cash In';
    let color = '#466B66'; // Default color for text

    if (item.type === 'trip') {
      iconName = 'car-outline';
      transactionTitle = 'Trip Payment';
    } else if (item.type === 'cash_out') {
      iconName = 'arrow-down-outline'; // Arrow down for cash out
      transactionTitle = 'Cash Out';
      color = '#FF6B6B'; // Red for cash out
    } else if (item.type === 'transferred') {
      iconName = 'swap-horizontal-outline'; // Icon for transferred
      transactionTitle = 'Transferred';
      color = '#FFC107'; // Yellow for transferred
    } else if (item.type === 'received') {
      iconName = 'arrow-down-circle-outline'; // Icon for received
      transactionTitle = 'Received';
      color = '#74A059'; // Green for received
    }

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Ionicons
            name={iconName}
            size={30}
            color={color} // Color based on transaction type
            style={styles.transactionIcon}
          />
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{transactionTitle}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionDetails}>
          <Text
            style={[
              styles.transactionAmount,
              { color: color }, // Apply same color to the amount text
            ]}
          >
            {item.type === 'cash_out' || item.type === 'transferred'
              ? `- ₱${amount.toFixed(2)}`
              : `₱${amount.toFixed(2)}`}
          </Text>
          {item.type === 'trip' && (
            <Text style={styles.transactionDistance}>Distance: {distance.toFixed(2)} km</Text>
          )}
          {item.type === 'transferred' && item.receiver && (
            <Text style={styles.transactionDetailsText}>To: {item.receiver}</Text>
          )}
          {item.type === 'received' && item.sender && (
            <Text style={styles.transactionDetailsText}>From: {item.sender}</Text>
          )}
        </View>
        {/* Display Conductor/Transaction creator name if available */}
        {item.conductorName && (
          <Text style={styles.transactionByText}>Transacted by: {item.conductorName}</Text>
        )}
      </View>
    );
  };

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
    backgroundColor: '#F9F9F9',
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
    marginBottom: 15,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#466B66',
  },
  transactionsList: {
    paddingHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
    marginTop: 2,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  transactionDistance: {
    fontSize: 14,
    color: '#777',
  },
  transactionDetailsText: {
    fontSize: 14,
    color: '#777',
  },
  noTransactionsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  transactionByText: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default HistoryScreen;
