import React, { useState,useContext  } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { Buffer } from 'buffer';
import database from '@react-native-firebase/database';
import { PAYMONGO_SECRET_KEY } from '@env';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

const WebViewScreen = ({ route }) => {
  const { role } = useContext(AuthContext);


  const { checkoutUrl, sourceId, amount } = route.params;
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);

  const waitForSourceProcessing = async (sourceId) => {
    for (let i = 0; i < 2; i++) {
      const response = await axios.get(`https://api.paymongo.com/v1/sources/${sourceId}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });

      const sourceStatus = response.data.data.attributes.status;

      if (sourceStatus === 'chargeable') {
        console.log('✅ Source is chargeable!');
        return;
      }

      console.log('⏳ Still processing, waiting 1 second...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Source not ready after polling.');
  };

  const createPayment = async (sourceId) => {
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

    return response.data.data;
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
        paymentMethod: 'GCash',
        status: 'completed',
        createdAt: new Date().toISOString(),
        type: 'cash_in',
      };

      await database().ref(`users/accounts/${userUid}/transactions`).push(transactionData);

      const transactionData1 = {
        userUid,
        amount: cashInAmount,
        status: 'unread',
        createdAt: new Date().toISOString(),
        message: `Cashin Successful with an amount of ₱${cashInAmount}`,
        type: 'cash_in',
      };

      await database().ref(`/notification_user/${userUid}`).push(transactionData1);

      console.log(`Wallet updated: New Balance: ₱${newBalance}`);
      Alert.alert('Payment Successful', `₱${cashInAmount} has been added to your wallet.`);
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      Alert.alert('Error', 'Failed to update wallet balance.');
    }
  };

  const handleWebViewNavigationStateChange = async (newNavState) => {
    const { url } = newNavState;
  
    if (url.includes("success")) {
      setIsProcessing(true);
  
      try {
        console.log("Polling source for status...");
        await waitForSourceProcessing(sourceId);
        await createPayment(sourceId);
        await updateWalletBalance(Number(amount));
  
        Alert.alert("Payment Successful", `₱${amount} has been added to your wallet.`);
  
        setTimeout(() => {
          if (navigation && navigation.reset) {
            setIsProcessing(false);
  
            // ✅ Remove WebView from stack and navigate to main screen based on role
            navigation.reset({
              index: 0,
              routes: [{ name: role === "user" ? "User" : role === "driver" ? "Driver" : "Conductor" }],
            });
          }
        }, 1500);
  
      } catch (error) {
        console.error("❌ Payment Confirmation Error:", error);
        Alert.alert("Payment Confirmed, but there was an issue updating your balance.");
  
        setTimeout(() => {
          if (navigation && navigation.reset) {
            setIsProcessing(false);
            navigation.reset({
              index: 0,
              routes: [{ name: "User" }], // Default fallback
            });
          }
        }, 1500);
      }
    }
  
    if (url.includes("failed") || url.includes("cancelled")) {
      Alert.alert("Payment Failed", "Please try again.");
      setTimeout(() => {
        if (navigation && navigation.reset) {
          navigation.reset({
            index: 0,
            routes: [{ name: "User" }], // Default fallback
          });
        }
      }, 1000);
    }
  };
  
  
  
  

  return (
    <View style={styles.container}>
      {isProcessing ? (
        // ✅ Custom Landing Page While Processing
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.processingText}>Processing your payment...</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: checkoutUrl }}
          style={styles.webview}
          javaScriptEnabled
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState
          renderLoading={() => <ActivityIndicator size="large" color="#00695C" />}
        />
      )}
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
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  processingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
});

export default WebViewScreen;
