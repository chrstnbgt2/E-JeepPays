import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';
const HistoryScreen = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [filter, setFilter] = useState('all'); 
  const [modalVisible, setModalVisible] = useState(false); 
  const filterLabels = {
    day: 'Today',
    week: 'This Week',
    month: 'This Month',
    all: 'All Transactions', 
  };
  
  useEffect(() => {
    let transactionsRef;

    const fetchTransactions = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('No user is logged in.');
        return;
      }

      const uid = currentUser.uid;
      transactionsRef = database().ref(`users/accounts/${uid}/transactions`);

      transactionsRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
          const transactionData = snapshot.val();
          const transactionList = Object.keys(transactionData).map((key) => ({
            id: key,
            ...transactionData[key],
          }));

          const filteredTransactions = filterTransactions(transactionList, filter);

          const sortedTransactions = filteredTransactions.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          setTransactions(sortedTransactions);
        } else {
          setTransactions([]);
        }
        setLoading(false);
      });
    };

    fetchTransactions();

    return () => {
      if (transactionsRef) transactionsRef.off('value');
    };
  }, [filter]); // Re-run when filter changes

  const filterTransactions = (transactions, filterType) => {
    const now = new Date();
  
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
  
      if (filterType === 'day') {
        return transactionDate.toDateString() === now.toDateString();
      }
      if (filterType === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return transactionDate >= oneWeekAgo;
      }
      if (filterType === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return transactionDate >= oneMonthAgo;
      }
      if (filterType === 'all') {
        return true; // No filter, return all transactions
      }
      return true;
    });
  };

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

  const handleFilterSelection = (selectedFilter) => {
    setFilter(selectedFilter);
    setModalVisible(false);
  };

  const renderTransactionItem = ({ item }) => {
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
    } else if (item.type === 'transferred') {
      iconName = 'swap-horizontal-outline';
      transactionTitle = 'Transferred';
      color = '#FFC107';
    } else if (item.type === 'received') {
      iconName = 'arrow-down-circle-outline';
      transactionTitle = 'Received';
      color = '#74A059';
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
          <Text style={[styles.transactionAmount, { color: color }]}>
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
        {item.conductorName && (
          <Text style={styles.transactionByText}>Transacted by: {item.conductorName}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Recent Transactions with Filter Icon */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Recent Transactions</Text>

        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.filterButton}>
  <Ionicons name="filter-outline" size={24} color="#000" />
</TouchableOpacity>
  
      </View>

      {/* Filter Modal */}
 
    <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Sort By</Text>

      {['day', 'week', 'month', 'all'].map((option) => (
  <TouchableOpacity
    key={option}
    style={[
      styles.modalOption,
      filter === option && styles.selectedOption // Add background for selected filter
    ]}
    onPress={() => handleFilterSelection(option)}
  >
    <Text style={[styles.modalText, filter === option && styles.selectedText]}>
      {filterLabels[option]}
    </Text>
  </TouchableOpacity>
))}


      <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
        <Text style={styles.closeButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

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
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, width: 300, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalOption: { padding: 10, width: '100%', alignItems: 'center' },
  modalText: { fontSize: 16 },
  closeButton: { marginTop: 10, backgroundColor: '#FF6B6B', padding: 10, borderRadius: 5 },
  closeButtonText: { color: '#FFF', fontWeight: 'bold' },
  filterButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8, 
    backgroundColor: '#E0E0E0' 
  },
  filterText: { 
    fontSize: 16, 
    marginRight: 5, 
    color: '#000' 
  },
  selectedText: { 
    fontSize:16,
    color: '#466D6A', 
    fontWeight: 'bold' 
  }, selectedOption: { 
    backgroundColor: '#f7f2f2', 
    borderRadius: 5,
  },
  modalOption: { 
    padding: 10, 
    width: '100%', 
    alignItems: 'center', 
    borderRadius: 5, 
    marginBottom: 5 
  },

});

export default HistoryScreen;
