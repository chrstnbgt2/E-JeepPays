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

const CashInScreen = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [userUid, setUserUid] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      setUserUid(currentUser.uid);
    } else {
      Alert.alert('Error', 'You are not logged in.');
      navigation.goBack();
    }
  }, []);

  const handleCashIn = () => {
    if (!selectedOption) {
      Alert.alert('Select a Payment Option', 'Please choose a payment method to continue.');
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash-in amount.');
      return;
    }

    Alert.alert(
      'Confirm Cash In',
      `You are about to cash in ₱${amount} using ${selectedOption}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => mockCashIn() },
      ]
    );
  };

  const mockCashIn = async () => {
    try {
      setLoading(true);

      const cashInAmount = Number(amount);
      const userRef = database().ref(`users/accounts/${userUid}`);

      // Get the current wallet balance
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();
      const currentBalance = userData.wallet_balance || 0;

      // Add cash-in amount to wallet
      const newBalance = currentBalance + cashInAmount;

      // Update wallet balance in Firebase
      await userRef.update({ wallet_balance: newBalance });

      const transactionData = {
        userUid,
        amount: cashInAmount,
        paymentMethod: selectedOption,
        status: 'completed',
        createdAt: new Date().toISOString(),
        type: 'cash_in',
      };

      // Log transaction in user's personal transactions
      await database().ref(`users/accounts/${userUid}/transactions`).push(transactionData);

      // Log transaction globally
      await database().ref(`/transactions`).push(transactionData);

      setLoading(false);
      Alert.alert('Success', `You have successfully cashed in ₱${cashInAmount}.`);
      navigation.goBack();
    } catch (error) {
      console.error('Error processing cash-in:', error);
      Alert.alert('Error', 'Failed to process cash-in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash In</Text>
      </View>

      <Text style={styles.sectionTitle}>Select a Payment Method</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.listItem, selectedOption === 'GCash' && styles.selectedOption]}
          onPress={() => setSelectedOption('GCash')}
        >
          <Text style={styles.listText}>GCash</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, selectedOption === 'PayMaya' && styles.selectedOption]}
          onPress={() => setSelectedOption('PayMaya')}
        >
          <Text style={styles.listText}>PayMaya</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, selectedOption === 'Card' && styles.selectedOption]}
          onPress={() => setSelectedOption('Card')}
        >
          <Text style={styles.listText}>Card</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Enter Amount</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="₱0.00"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00695C" />
      ) : (
        <TouchableOpacity style={styles.cashInButton} onPress={handleCashIn}>
          <Text style={styles.cashInButtonText}>Cash In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  selectedOption: {
    backgroundColor: '#E0F7FA',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cashInButton: {
    backgroundColor: '#00695C',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  cashInButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CashInScreen;
