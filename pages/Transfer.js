import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const TransferScreen = ({ navigation }) => {
  const [driverName, setDriverName] = useState('');
  const [driverUid, setDriverUid] = useState('');
  const [conductorBalance, setConductorBalance] = useState(0); // Current balance
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDriverInfo = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          Alert.alert('Error', 'You must be logged in to transfer balance.');
          return;
        }

        const conductorUid = currentUser.uid;
        const conductorRef = database().ref(`users/accounts/${conductorUid}`);
        const conductorSnapshot = await conductorRef.once('value');

        if (conductorSnapshot.exists()) {
          const conductorData = conductorSnapshot.val();
          setConductorBalance(conductorData.wallet_balance?.toFixed(2) || '0.00'); // Store balance
          const linkedDriverUid = conductorData.creatorUid; // Get creatorUid (driver UID)
          setDriverUid(linkedDriverUid);

          if (linkedDriverUid) {
            const driverRef = database().ref(`users/accounts/${linkedDriverUid}`);
            const driverSnapshot = await driverRef.once('value');

            if (driverSnapshot.exists()) {
              const driverData = driverSnapshot.val();
              const fullName = `${driverData.firstName || ''} ${driverData.lastName || ''}`.trim();
              setDriverName(fullName || 'Unknown Driver');
            } else {
              setDriverName('Driver not found.');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching driver info:', error);
        Alert.alert('Error', 'Failed to fetch driver information.');
      }
    };

    fetchDriverInfo();
  }, []);

  const handleTransfer = async () => {
    if (!driverUid || !driverName) {
      Alert.alert('Error', 'Driver information not available.');
      return;
    }

    if (!amount) {
      Alert.alert('Error', 'Please enter an amount.');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to transfer balance.');
        setLoading(false);
        return;
      }

      const conductorUid = currentUser.uid;
      const conductorRef = database().ref(`users/accounts/${conductorUid}`);
      const conductorSnapshot = await conductorRef.once('value');

      if (!conductorSnapshot.exists()) {
        Alert.alert('Error', 'Conductor account not found.');
        setLoading(false);
        return;
      }

      const conductorData = conductorSnapshot.val();
      if (conductorData.wallet_balance < transferAmount) {
        Alert.alert('Error', 'Insufficient balance.');
        setLoading(false);
        return;
      }

      const driverRef = database().ref(`users/accounts/${driverUid}`);
      const driverSnapshot = await driverRef.once('value');

      if (!driverSnapshot.exists()) {
        Alert.alert('Error', 'Driver account not found.');
        setLoading(false);
        return;
      }

      const driverData = driverSnapshot.val();
      const newConductorBalance = conductorData.wallet_balance - transferAmount;
      const newDriverBalance = (driverData.wallet_balance || 0) + transferAmount;

      // Update balances
      await conductorRef.update({ wallet_balance: newConductorBalance });
      await driverRef.update({ wallet_balance: newDriverBalance });

      // Record transactions
      const conductorTransactionRef = database().ref(`users/accounts/${conductorUid}/transactions`);
      const driverTransactionRef = database().ref(`users/accounts/${driverUid}/transactions`);

      const timestamp = new Date().toISOString();

      await conductorTransactionRef.push({
        type: 'transferred',
        description: `Transferred to ${driverName}`,
        amount: transferAmount,
        status: 'completed',
        createdAt: timestamp,
        receiver: driverName,
      });

      await driverTransactionRef.push({
        type: 'received',
        description: `Received from ${conductorData.firstName || 'conductor'}`,
        amount: transferAmount,
        status: 'completed',
        createdAt: timestamp,
        sender: `${conductorData.firstName || ''} ${conductorData.lastName || ''}`.trim(),
      });

      const transactionData1 = {
        conductorUid,
        amount: transferAmount,
        status: 'unread',
        createdAt: new Date().toISOString(),
        type: 'transferred',
        message: `Transfer Payment with an amount of ₱${transferAmount}`,
      };
      
      await database().ref(`/notification_user/${conductorUid}`).push(transactionData1);

      const transactionData2 = {
        driverUid,
        amount: transferAmount,
        status: 'unread',
        createdAt: new Date().toISOString(),
        type: 'transferred',
        message: `Transfer Received with an amount of ₱${transferAmount}`,
      };
      
      await database().ref(`/notification_user/${driverUid}`).push(transactionData2);
      


      Alert.alert('Success', `₱${transferAmount.toFixed(2)} has been transferred to ${driverName}.`);
      setAmount('');
      setConductorBalance(newConductorBalance.toFixed(2)); // Update balance displayed
    } catch (error) {
      console.error('Error during transfer:', error);
      Alert.alert('Error', 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Transfer Balance</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Current Balance:</Text>
        <Text style={styles.balanceText}>₱{conductorBalance}</Text>

        <Text style={styles.label}>Driver Name:</Text>
        <Text style={styles.driverName}>{driverName || 'Loading...'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Amount (₱)"
          placeholderTextColor="#777"
          value={amount}
          onChangeText={(text) => setAmount(text)}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: '#9DC8B3' }]}
          onPress={handleTransfer}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.buttonText}>Transfer</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F4F4F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#000',
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#777',
  },
  balanceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4E764E',
    marginBottom: 20,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  button: {
    backgroundColor: '#466B66',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TransferScreen;
