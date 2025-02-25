import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '@react-native-firebase/database';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const GeneratedQRPage = ({ route, navigation }) => {
  const { passengerType, userId } = route.params;
  const [username, setUsername] = useState('');
  const [qrValue, setQrValue] = useState('');
  const viewShotRef = useRef();

 
  const triggerMediaScanner = async (filePath) => {
    try {
      await RNFS.scanFile(filePath);
      console.log('MediaScanner updated for file:', filePath);
    } catch (err) {
      console.error('MediaScanner error:', err);
    }
  };

  
 
  useEffect(() => {
    const fetchTemporaryData = async () => {
      try {
        if (!userId) {
          console.error('Error: userId is undefined.');
          Alert.alert('Error', 'User ID is missing. Please try again.');
          return;
        }
    
        const tempRef = database().ref(`temporary/${userId}`);
        const snapshot = await tempRef.once('value');
    
        if (snapshot.exists()) {
          const data = snapshot.val();
          const entries = Object.entries(data);
          if (entries.length > 0) {
            const [generatedUid, userEntry] = entries[0];
            setUsername(userEntry.username);
            setQrValue(generatedUid);
            console.log('Fetched data:', userEntry);
          } else {
            Alert.alert('Error', 'No valid QR code data found.');
          }
        } else {
          Alert.alert('Error', 'No temporary data available for this user.');
        }
      } catch (error) {
        console.error('Error fetching temporary data:', error);
        Alert.alert('Error', 'Failed to retrieve temporary data. Please try again.');
      }
    };
    

    fetchTemporaryData();
  }, [passengerType, userId]);

  const saveQrCode = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      console.log('Captured URI:', uri);

      const directoryPath = `${RNFS.ExternalStorageDirectoryPath}/Pictures/MyApp`;
      const fileName = `QR_${username || Date.now()}.png`;
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

      if (error.message.includes('EACCES')) {
        Alert.alert(
          'Permission Denied',
          'Your app does not have access to write to storage. Please enable storage access in settings.'
        );
      } else {
        Alert.alert('Error', 'Failed to save QR code. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Share</Text>
      </View>

      {/* QR Card */}
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View style={styles.card}>
          <Text style={styles.passengerType}>{`${passengerType} Passenger`}</Text>
          <Text style={styles.userId}>User Id: {username || 'Loading...'}</Text>
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

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveQrCode}>
        <Text style={styles.saveButtonText}>Save</Text>
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
    paddingHorizontal: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#CCD9B8',
    margin: 20,
    borderRadius: 15,
    alignItems: 'center',
    padding: 20,
    elevation: 5,
  },
  passengerType: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  userId: {
    fontSize: 18,
    color: '#000',
    marginBottom: 20,
  },
  qrContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
  },
  note: {
    fontSize: 14,
    color: '#74A059',
    marginTop: 10,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4E764E',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GeneratedQRPage;