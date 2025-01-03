import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';

const MyQRScreenShareConductor = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [passengerType, setPassengerType] = useState(null);
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
          const lastNameInitial = userData.lastName
            ? userData.lastName.charAt(0)
            : '';
          setName(`${firstName} ${lastNameInitial}.`);

          const phoneNumber = userData.phone || '';
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
    if (!passengerType) {
      Alert.alert('Error', 'Please select a passenger type.');
      return;
    }

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

      // Generate a random username
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
        type: passengerType, // Regular or Discounted
        username: randomUsername,
      };

      await tempRef.set(tempData);

      console.log(`Temporary QR Code generated: ${generatedUid}`);

      // Navigate to the GeneratedQRPage and pass QR details
      setModalVisible(false); // Close modal after generating
      navigation.navigate('GenerateQR', {
        passengerType,
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Share</Text>
      </View>

      {/* QR Card */}
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View style={styles.card}>
          <Text style={styles.username}>{username}</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue || 'N/A'}
              size={300}
              logo={require('../assets/images/qrlogo.png')}
              logoSize={80}
              logoBackgroundColor="transparent"
              logoMargin={-20}
              quietZone={10}
            />
          </View>
          <Text style={styles.note}>Transfer fees may apply</Text>
        </View>
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Create QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={saveQrCode}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Type of Passenger</Text>
            <TouchableOpacity
              style={
                passengerType === 'Regular'
                  ? styles.selectedOption
                  : styles.option
              }
              onPress={() => setPassengerType('Regular')}
            >
              <Text style={styles.optionText}>REGULAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={
                passengerType === 'Discounted'
                  ? styles.selectedOption
                  : styles.option
              }
              onPress={() => setPassengerType('Discounted')}
            >
              <Text style={styles.optionText}>DISCOUNTED</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
              <Text style={styles.generateButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 70,
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
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
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
  actionButtons: {
    flexDirection: 'column',
    marginHorizontal: 20,
    marginTop: 20,
  },
  createButton: {
    backgroundColor: '#2B393B',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4E764E',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  option: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedOption: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#D6E6CF',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  generateButton: {
    backgroundColor: '#2B393B',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyQRScreenShareConductor;
