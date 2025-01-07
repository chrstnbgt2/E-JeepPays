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
import axios from 'axios';
import { Buffer } from 'buffer';
import { PAYMONGO_SECRET_KEY } from '@env';

global.Buffer = Buffer;

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

 
  const createPaymentSource = async (paymentMethod) => {
    try {
      const payload = {
        data: {
          attributes: {
            type: paymentMethod.toLowerCase(), // 'gcash' or 'paymaya'
            amount: Math.round(amount * 100), // Convert PHP to centavos
            currency: 'PHP',
            redirect: {
              success: 'https://example.com/success', // Replace with your app's success URL
              failed: 'https://example.com/failed',
            },
            billing: {
              email: 'testuser@example.com', // Replace with actual user email
              name: 'John Doe', // Optional name for billing
            },
          },
        },
      };
  
      const encodedKey = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
  
      const response = await axios.post(
        `https://api.paymongo.com/v1/sources`,
        payload,
        {
          headers: {
            Authorization: `Basic ${encodedKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      return response.data.data; // Source data
    } catch (error) {
      console.error('Error creating Payment Source:', error.response?.data || error);
      throw new Error('Failed to create payment source.');
    }
  };
  
  
  const handleCashIn = async () => {
    if (!selectedOption) {
      Alert.alert('Select a Payment Option', 'Please choose a payment method to continue.');
      return;
    }
  
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash-in amount.');
      return;
    }
  
    setLoading(true);
  
    try {
      // Step 1: Create Payment Source for GCash/PayMaya
      const source = await createPaymentSource(selectedOption);
      const checkoutUrl = source.attributes.redirect.checkout_url;
      const sourceId = source.id;
  
      console.log('Source ID:', sourceId);
      console.log('Redirect to:', checkoutUrl);
      console.log('Amount passed:', Number(amount)); // Log to ensure valid value
  
      // Step 2: Navigate to WebView for Payment
      navigation.navigate('WebViewScreen', { checkoutUrl, sourceId, amount: Number(amount) });
    } catch (error) {
      Alert.alert('Error', 'Failed to process cash-in. Please try again.');
      console.error('Error:', error);
      setLoading(false);
    }
  };
  
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color={loading ? '#ccc' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash In</Text>
      </View>

      <Text style={styles.sectionTitle}>Select a Payment Method</Text>
      <View style={styles.card}>
        {['GCash', 'PayMaya'].map((option) => (
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
  cashInButton: {
    backgroundColor: '#00695C',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cashInButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CashInScreen;
