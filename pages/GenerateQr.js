import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert,PermissionsAndroid,Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '@react-native-firebase/database';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
 
const GeneratedQRPage = ({ route, navigation }) => {
  const { passengerType, userId } = route.params;
  const [username, setUsername] = useState('');
  const [qrValue, setQrValue] = useState('');
  const viewShotRef = useRef();

  useEffect(() => {
    const fetchTemporaryData = async () => {
      try {
        if (!userId) {
          console.error('Error: userId is undefined.');
          Alert.alert('Error', 'User ID is missing. Please try again.');
          return;
        }

        // Reference the specific user path in the database
        const tempRef = database().ref(`temporary/${userId}`);
        const snapshot = await tempRef.once('value');

        if (snapshot.exists()) {
          const data = snapshot.val();

          // Loop through the generated UIDs under this userId
          for (const generatedUid in data) {
            if (data[generatedUid]) {
              const userEntry = data[generatedUid];
              setUsername(userEntry.username);
              setQrValue(
                JSON.stringify({
                  type: passengerType,
                  userId,
                  username: userEntry.username,
                })
              );

              console.log('Fetched data:', userEntry); // Log the fetched data
              return; // Exit the function once the first match is found
            }
          }

          // If no data under the user's generated UIDs
          Alert.alert('Error', 'No temporary data found for this user.');
        } else {
          // If no data under the userId
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
      const uri = await viewShotRef.current.capture(); // Capture the view
      const filePath = `${RNFS.DownloadDirectoryPath}/generated-qr-code.png`;

      await RNFS.moveFile(uri, filePath);
      Alert.alert('Success', `QR code saved to ${filePath}`);
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
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
          <Text style={styles.userId}>Username: {username || 'Loading...'}</Text>
          <View style={styles.qrContainer}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={300}
                logo={require('../assets/images/qrlogo.png')}
                logoSize={80}
                logoBackgroundColor="transparent"
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
