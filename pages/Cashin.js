import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const CashInScreen = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const handleCashIn = () => {
    if (!selectedOption) {
      Alert.alert('Select a Payment Option', 'Please choose a payment method to continue.');
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash-in amount.');
      return;
    }

    // Example placeholder for gateway integration
    Alert.alert(
      'Confirm Cash In',
      `You are about to cash in ₱${amount} using ${selectedOption}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => processPayment() },
      ]
    );
  };

  const processPayment = () => {
    // Placeholder for payment gateway API call
    Alert.alert(
      'Payment Successful',
      `You have successfully cashed in ₱${amount} via ${selectedOption}.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );

    // TODO: Implement actual payment gateway logic here
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash In</Text>
      </View>

      {/* List of Choices */}
      <Text style={styles.sectionTitle}>Select a Payment Method</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={[
            styles.listItem,
            selectedOption === 'GCash' && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption('GCash')}
        >
          <Text style={styles.listText}>GCash</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.listItem,
            selectedOption === 'PayPal' && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption('PayPal')}
        >
          <Text style={styles.listText}>PayPal</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.listItem,
            selectedOption === 'Bank Transfer' && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption('Bank Transfer')}
        >
          <Text style={styles.listText}>Bank Transfer</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Enter Amount */}
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

      {/* Cash In Button */}
      <TouchableOpacity style={styles.cashInButton} onPress={handleCashIn}>
        <Text style={styles.cashInButtonText}>Cash In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 15,
    marginLeft: 20,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    paddingVertical: 5,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  selectedOption: {
    backgroundColor: '#D8E8D2',
  },
  listText: {
    fontSize: 16,
    color: '#000',
  },
  inputContainer: {
    marginHorizontal: 20,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
  },
  input: {
    fontSize: 18,
    color: '#000',
  },
  cashInButton: {
    backgroundColor: '#4E764E',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  cashInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CashInScreen;



