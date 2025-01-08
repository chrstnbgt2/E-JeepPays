import React from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { Buffer } from 'buffer';
import database from '@react-native-firebase/database';  
import { PAYMONGO_SECRET_KEY } from '@env';
import auth from '@react-native-firebase/auth';  

const WebViewScreen = ({ route, navigation }) => {
  const { checkoutUrl, sourceId, amount } = route.params; // Get the amount passed from CashInScreen

  const waitForSourceProcessing = async (sourceId) => {
    for (let i = 0; i < 5; i++) { // Poll up to 5 times
      const response = await axios.get(`https://api.paymongo.com/v1/sources/${sourceId}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });
      const sourceStatus = response.data.data.attributes.status;
  
      if (sourceStatus === 'chargeable') {
        console.log('Source is chargeable! Waiting an additional 4 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 4000)); // Wait 4 seconds after polling confirms chargeable
        return;
      }
  
      console.log('Source still processing... waiting 1 second');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second wait for next poll
    }
    throw new Error('Source not ready after polling.');
  };
  
  const createPayment = async (sourceId) => {
    const maxRetries = 3; // Number of retries
    for (let i = 0; i < maxRetries; i++) {
      try {
        const payload = {
          data: {
            attributes: {
              source: { id: sourceId, type: 'source' },
              amount: Math.round(amount * 100),
              currency: 'PHP',
              description: 'Cash-in for Ejeepay App',
            },
          },
        };
  
        const encodedKey = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
  
        const response = await axios.post(
          'https://api.paymongo.com/v1/payments',
          payload,
          {
            headers: {
              Authorization: `Basic ${encodedKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        return response.data.data; // Payment success
      } catch (error) {
        if (error.response?.data?.errors[0]?.code === 'resource_processing_state') {
          console.log(`Payment still processing... Retrying in 2 seconds (${i + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        } else {
          console.error('Error creating Payment:', error.response?.data || error);
          throw new Error('Failed to create payment.');
        }
      }
    }
    throw new Error('Payment failed after retries.');
  };

  const updateWalletBalance = async (cashInAmount) => {
    if (!cashInAmount || isNaN(cashInAmount)) {
      console.error('Invalid cash-in amount:', cashInAmount);
      Alert.alert('Error', 'Invalid amount detected. Please try again.');
      return;
    }

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User is not logged in.');
      }

      const userUid = currentUser.uid;  
      console.log(`Updating wallet for user UID: ${userUid}`);

      const userRef = database().ref(`users/accounts/${userUid}`);

      const snapshot = await userRef.once('value');
      const userData = snapshot.val();
      const currentBalance = userData?.wallet_balance || 0;

      const newBalance = currentBalance + cashInAmount;

      await userRef.update({ wallet_balance: newBalance });

      const transactionData = {
        userUid,
        amount: cashInAmount,
        paymentMethod: 'GCash/PayMaya',
        status: 'completed',
        createdAt: new Date().toISOString(),
        type: 'cash_in',
      };

      await database().ref(`users/accounts/${userUid}/transactions`).push(transactionData);

      console.log(`Wallet updated: New Balance: ₱${newBalance}`);
      Alert.alert('Payment Successful', `₱${cashInAmount} has been added to your wallet.`);
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      Alert.alert('Error', 'Failed to update wallet balance.');
    }
  };

  const handleWebViewNavigationStateChange = async (newNavState) => {
    const { url } = newNavState;

    if (url.includes('success')) {
      try {
        console.log('Polling source for status...');
        await waitForSourceProcessing(sourceId);  
        const payment = await createPayment(sourceId);  
        await updateWalletBalance(Number(amount));  
        Alert.alert('Payment Successful', `₱${amount} has been added to your wallet.`);
        navigation.goBack();
      } catch (error) {
        // console.error('Error:', error);
        // Alert.alert('Payment Confirmation Error', 'The payment has been processed, but confirmation failed. Please try again.');
        navigation.goBack();
      }
    }

    if (url.includes('failed') || url.includes('cancelled')) {
      Alert.alert('Payment Failed', 'Please try again.');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.webview}
        javaScriptEnabled
        onNavigationStateChange={handleWebViewNavigationStateChange}
        startInLoadingState
        renderLoading={() => <ActivityIndicator size="large" color="#00695C" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;
