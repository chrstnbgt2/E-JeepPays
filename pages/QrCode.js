import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';

const MyQRScreen = () => {
  const navigation = useNavigation();
  const viewShotRef = useRef();
  const [name, setName] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [username, setUsername] = useState('');
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          console.warn('No user is currently logged in.');
          return;
        }
  
        const uid = currentUser.uid;
        setQrValue(uid);
  
        const userRef = database().ref(`users/accounts/${uid}`);
        const snapshot = await userRef.once('value');
  
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const firstName = userData.firstName || '';
          const lastNameInitial = userData.lastName ? userData.lastName.charAt(0) : '';
          setName(`${firstName} ${lastNameInitial}.`);
          
          const phoneNumber = userData.phoneNumber || '';
          const masked = phoneNumber.replace(/(\d{2})\d{5}(\d{2})/, '$1XXXXX$2');
          setMaskedPhone(masked);
  
          setUsername(`@${firstName}`);
        } else {
          console.warn('No user data found.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchUserData();
  }, []);
  
  const saveQrCode = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      const filePath = `${RNFS.DownloadDirectoryPath}/my-qr-code.png`;
  
      await RNFS.moveFile(uri, filePath);
      Alert.alert('Success', `QR code saved to ${filePath}`);
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
    }
  };
  
  const handleGenerate = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to generate a QR code.');
        return;
      }
  
      const userLoggedUid = currentUser.uid;
  
      // Create a new temporary UID in Firebase
      const tempRef = database().ref(`temporary/${userLoggedUid}`).push();
      const generatedUid = tempRef.key;
  
      // Generate a random unique username
      const generateRandomUsername = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let username = 'User_';
        for (let i = 0; i < 8; i++) {
          username += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return username;
      };
  
      const randomUsername = generateRandomUsername();
  
      // Save the temporary QR code data in Firebase
      const tempData = {
        createdAt: new Date().toISOString(),
        type: 'Regular',
        username: randomUsername, // Add the random username here
      };
  
      await tempRef.set(tempData);
  
      console.log(`Temporary QR Code generated: ${generatedUid}`);
  
      // Navigate to the GeneratedQRPage and pass QR details
      navigation.navigate('GenerateQR', {
        passengerType: 'Regular',
        userId: userLoggedUid, // Pass the user's ID
        qrValue: JSON.stringify({
          userLoggedUid,
          generatedUid,
          username: randomUsername,
        }),
      });
    } catch (error) {
      console.error('Error generating temporary QR:', error);
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
    }
  };
  
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My QR</Text>
      </View>

      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View style={styles.card}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.details}>Mobile No.: {maskedPhone}</Text>
          <Text style={styles.details}>Username: {username}</Text>
          <View style={styles.qrContainer}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={300}
                logo={require('../assets/images/qrlogo.png')}
                logoSize={80}
                logoBackgroundColor="transparent"
                logoMargin={-20}
                quietZone={10}
              />
            ) : (
              <Text style={styles.loadingText}>Generating QR...</Text>
            )}
          </View>
          <Text style={styles.note}>Transfer fees may apply</Text>
        </View>
      </ViewShot>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.button1} onPress={handleGenerate}>
          <Text style={styles.buttonText}>Generate QRCode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button2} onPress={saveQrCode}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  card: {
    backgroundColor: '#CCD9B8',
    marginHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    padding: 20,
    elevation: 5,
  },
  name: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  details: {
    fontSize: 20,
    color: '#555',
    marginBottom: 5,
  },
  qrContainer: {
    marginVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
  },
  note: {
    fontSize: 15,
    color: '#74A059',
    marginTop: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },
  button1: {
    flex: 1,
    backgroundColor: '#74A059',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  button2: {
    flex: 1,
    backgroundColor: '#4E764E',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyQRScreen;
