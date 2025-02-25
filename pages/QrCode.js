import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import moment from 'moment';  

const MyQRScreen = () => {
  const navigation = useNavigation();
  const viewShotRef = useRef();
  const [name, setName] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [username, setUsername] = useState('');
  const [qrValue, setQrValue] = useState('');


 const triggerMediaScanner = async (filePath) => {
    try {
      await RNFS.scanFile(filePath);
      console.log('MediaScanner updated for file:', filePath);
    } catch (err) {
      console.error('MediaScanner error:', err);
    }
  };

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
    console.log('Captured URI:', uri);

     const directoryPath = `${RNFS.ExternalStorageDirectoryPath}/Pictures/MyApp`;
    const fileName = `QR_${Date.now()}.png`;
    const filePath = `${directoryPath}/${fileName}`;

    // Ensure the directory exists
    if (!(await RNFS.exists(directoryPath))) {
      console.log('Creating directory:', directoryPath);
      await RNFS.mkdir(directoryPath);
    }

     const base64 = await RNFS.readFile(uri, 'base64');

     await RNFS.writeFile(filePath, base64, 'base64');
    console.log('File successfully written to:', filePath);

     Alert.alert('Success', `QR code saved to: ${filePath}`);

    // Trigger Media Scanner
    await triggerMediaScanner(filePath);
  } catch (error) {
    console.error('Error saving QR code:', error);

    // Handle permission errors
    if (error.message.includes('EACCES')) {
      Alert.alert(
        'Permission Denied',
        'Your app does not have access to write to storage. Please enable storage access in settings.'
      );
    } else {
      // General error handling
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
    }
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
    const todayDate = moment().format('YYYY-MM-DD'); 

    // Reference for the counter storage
    const counterRef = database().ref(`temporary/counter/${todayDate}`);

    // Get the current counter value
    const snapshot = await counterRef.once('value');
    let counter = snapshot.exists() ? snapshot.val() + 1 : 1; // Increment if exists, reset otherwise

    // Update counter in Firebase
    await counterRef.set(counter);

    // Generate an incremental username (e.g., "User_001", "User_002")
    const formattedCounter = String(counter).padStart(3, '0'); // Ensures 3-digit format
    const incrementalUsername = `${formattedCounter}`;

    // Create a new temporary UID in Firebase for this QR
    const tempRef = database().ref(`temporary/${userLoggedUid}`).push();
    const generatedUid = tempRef.key;

    // Save the temporary QR code data in Firebase
    const tempData = {
      createdAt: new Date().toISOString(),
      type: 'Regular',
      username: incrementalUsername, // Use the incremental username
      status: 'enabled',
    };

    await tempRef.set(tempData);

    console.log(`Temporary QR Code generated: ${generatedUid} with Username: ${incrementalUsername}`);

    // Navigate to the GeneratedQRPage and pass QR details
    navigation.navigate('GenerateQR', {
      passengerType: 'Regular',
      userId: userLoggedUid, // Pass the user's ID
      qrValue: JSON.stringify({
        userLoggedUid,
        generatedUid,
        username: incrementalUsername,
        status: 'enabled',
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
