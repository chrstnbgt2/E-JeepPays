import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import axios from 'axios';
import { Buffer } from 'buffer';
import { PAYMONGO_SECRET_KEY } from '@env';

global.Buffer = Buffer;

const CashOutScreen = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [userUid, setUserUid] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      setUserUid(currentUser.uid);
      fetchWalletBalance(currentUser.uid);
    } else {
      Alert.alert('Error', 'You are not logged in.');
      navigation.goBack();
    }
  }, []);

  const fetchWalletBalance = async (uid) => {
    try {
      const userRef = database().ref(`users/accounts/${uid}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();
      const balance = userData?.wallet_balance || 0;
      setCurrentBalance(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleCashOut = async () => {
    if (!selectedOption) {
      Alert.alert('Select a Payment Option', 'Please choose a cash-out method.');
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash-out amount.');
      return;
    }

    if (Number(amount) > currentBalance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance to cash out this amount.');
      return;
    }

    setLoading(true);

    try {
      // Mock API call to create cash-out request
      await createCashOutTransaction(selectedOption, Number(amount));

      Alert.alert('Cash-Out Request Sent', `Your ₱${amount} cash-out request has been submitted.`);
      navigation.goBack(); // Navigate back after success
    } catch (error) {
      Alert.alert('Error', 'Failed to process cash-out. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCashOutTransaction = async (method, cashOutAmount) => {
    try {
      const userRef = database().ref(`users/accounts/${userUid}`);

      // Subtract cash-out amount from wallet balance
      const newBalance = currentBalance - cashOutAmount;
      await userRef.update({ wallet_balance: newBalance });

      // Log the cash-out transaction
      const transactionData = {
        userUid,
        amount: cashOutAmount,
        paymentMethod: method,
        status: 'completed', 
        createdAt: new Date().toISOString(),
        type: 'cash_out',
      };

      await database().ref(`users/accounts/${userUid}/transactions`).push(transactionData);
      await database().ref('/transactions').push(transactionData); // Log globally

      console.log('Cash-out transaction logged:', transactionData);
    } catch (error) {
      console.error('Error creating cash-out transaction:', error);
      throw new Error('Failed to create cash-out transaction.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color={loading ? '#ccc' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Out</Text>
      </View>

      <Text style={styles.sectionTitle}>Available Balance: ₱{currentBalance.toFixed(2)}</Text>

      <Text style={styles.sectionTitle}>Select a Cash-Out Method</Text>
      <View style={styles.card}>
        {['GCash', 'PayMaya', 'Bank Transfer'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.listItem, selectedOption === option && styles.selectedOption]}
            onPress={() => setSelectedOption(option)}
            disabled={loading}
          >
            <Text style={styles.listText}>{option}</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#000" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Enter Amount</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="₱0.00"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          editable={!loading}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00695C" />
      ) : (
        <TouchableOpacity style={styles.cashOutButton} onPress={handleCashOut}>
          <Text style={styles.cashOutButtonText}>Cash Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  listItem: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: '#e0f7fa',
  },
  listText: {
    fontSize: 16,
  },
  inputContainer: {
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  input: {
    fontSize: 18,
    padding: 8,
  },
  cashOutButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cashOutButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CashOutScreen;
