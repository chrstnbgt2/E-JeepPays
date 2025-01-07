import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,  
  Platform, 
  Linking
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import CameraRoll from '@react-native-camera-roll/camera-roll';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const DisplayAllQR_Conductor = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [passengerType, setPassengerType] = useState(null);
  const [qrList, setQrList] = useState([]);
  const viewShotRefs = useRef({});
  const [name, setName] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');


  const requestManageStoragePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
          if (result === RESULTS.GRANTED) {
            console.log('READ_MEDIA_IMAGES permission granted');
            return true;
          } else {
            Alert.alert('Permission Required', 'Please grant media storage permission in settings.', [
              { text: 'OK', onPress: () => Linking.openSettings() },
            ]);
            return false;
          }
        } else if (Platform.Version >= 30) {
          const result = await request(PERMISSIONS.ANDROID.MANAGE_EXTERNAL_STORAGE);
          if (result === RESULTS.GRANTED) {
            console.log('MANAGE_EXTERNAL_STORAGE permission granted');
            return true;
          } else {
            Alert.alert('Permission Required', 'Please enable storage permission in settings.', [
              { text: 'OK', onPress: () => Linking.openSettings() },
            ]);
            return false;
          }
        }
      }
      return true; // No permissions required for Android 10 or lower
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
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
        } else {
          console.warn('No user data found.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchUserQrCodes = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const userLoggedUid = currentUser.uid;
        const tempRef = database().ref(`temporary/${userLoggedUid}`);
        const snapshot = await tempRef.once('value');

        const qrCodes = [];
        snapshot.forEach((child) => {
          const qrData = child.val();
          if (qrData.status === 'enabled') {
            qrCodes.push({
              key: child.key,
              ...qrData,
            });
          }
        });
        setQrList(qrCodes);
      } catch (error) {
        console.error('Error fetching QR codes:', error);
      }
    };

    fetchUserData();
    fetchUserQrCodes();
  }, []);

  const saveQrCode = async (qrItem) => {
    console.log('saveQrCode function triggered!'); // Log to check if the function is called
  
    const hasPermission = await requestManageStoragePermission();
    if (!hasPermission) {
      console.log('Storage permission not granted!');
      Alert.alert('Permission Denied', 'Storage permission is required to save the QR code.');
      return;
    }
  
    try {
      console.log(`Attempting to capture view for QR item: ${qrItem.username}`); // Log QR item info
      const uri = await viewShotRefs.current[qrItem.key].capture();
      console.log(`Capture successful. File URI: ${uri}`);
  
      const sanitizedUsername = qrItem.username.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `QR_${sanitizedUsername}.png`;
      console.log(`Sanitized file name: ${fileName}`);
  
      if (Platform.OS === 'android' && Platform.Version >= 30) {
        console.log('Saving using CameraRoll (Android 11+ path)...');
        const base64Data = await RNFS.readFile(uri, 'base64');
        const galleryPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        await RNFS.writeFile(galleryPath, base64Data, 'base64');
        console.log(`File written to cache path: ${galleryPath}`);
  
        const savedUri = await CameraRoll.save(galleryPath, {
          type: 'photo',
          album: 'MyQRs',
        });
  
        console.log(`File saved to gallery: ${savedUri}`);
        Alert.alert('Success', `QR code saved to gallery as ${fileName}`);
      } else {
        console.log('Saving to Downloads folder for Android 10 or lower...');
        const folderPath = `${RNFS.DownloadDirectoryPath}/MyQRs`;
        if (!(await RNFS.exists(folderPath))) {
          await RNFS.mkdir(folderPath);
          console.log(`Created folder path: ${folderPath}`);
        }
  
        const filePath = `${folderPath}/${fileName}`;
        await RNFS.moveFile(uri, filePath);
        console.log(`File moved to Downloads: ${filePath}`);
        Alert.alert('Success', `QR code saved to ${filePath}`);
      }
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

      const dailyCountRef = database().ref(`usernameCount/${userLoggedUid}`);
      const currentDate = new Date().toISOString().split('T')[0];

      let newUsernameCount = 1;

      const snapshot = await dailyCountRef.once('value');
      const data = snapshot.val();

      if (data && data.date === currentDate) {
        newUsernameCount = data.count + 1;
      }

      await dailyCountRef.set({
        date: currentDate,
        count: newUsernameCount,
      });

      const tempRef = database().ref(`temporary/${userLoggedUid}`).push();
      const generatedUid = tempRef.key;

      const incrementingUsername = `${newUsernameCount}`;

      const tempData = {
        createdAt: new Date().toISOString(),
        status: 'enabled',
        type: passengerType,
        username: incrementingUsername,
      };

      await tempRef.set(tempData);

      console.log(`Temporary QR Code generated: ${generatedUid}`);
      console.log(`Generated Username: ${incrementingUsername}`);

      setQrList((prevList) => [
        ...prevList,
        {
          key: generatedUid,
          ...tempData,
        },
      ]);

      setModalVisible(false);
      navigation.navigate('GenerateQR', {
        passengerType,
        userId: userLoggedUid,
        qrValue: generatedUid,
      });
    } catch (error) {
      console.error('Error generating temporary QR:', error);
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
    }
  };

  const renderQrItem = ({ item }) => (
    <ViewShot
    ref={(ref) => (viewShotRefs.current[item.key] = ref)}
    options={{ format: 'png', quality: 1 }}
  >
    <View style={styles.qrCard}>
       
      <Text style={styles.qrUsername}>Username: {item.username}</Text>
      <Text style={styles.qrType}>Type: {item.type}</Text>
    
        <QRCode
          value={item.key || 'N/A'}
          size={200}
          logo={require('../assets/images/qrlogo.png')} // Path to your logo
          logoSize={40}
          logoBackgroundColor="transparent"
          logoMargin={-10}
          quietZone={10}
        />
     
     <TouchableOpacity
  style={styles.saveButton}
  onPress={() => saveQrCode(item)}  
>
  <Text style={styles.buttonText}>Save to Phone</Text>
</TouchableOpacity>

    </View>
    </ViewShot>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Share</Text>
      </View>

      <FlatList
  data={qrList}
  keyExtractor={(item) => item.key}
  renderItem={({ item }) => (
    <ViewShot ref={(ref) => (viewShotRefs.current[item.key] = ref)} options={{ format: 'png', quality: 1 }}>
      <View style={styles.qrCard}>
        <Text style={styles.qrUsername}>Username: {item.username}</Text>
        <Text style={styles.qrType}>Type: {item.type}</Text>
        <QRCode
          value={item.key || 'N/A'}
          size={200}
          logo={require('../assets/images/qrlogo.png')}
          logoSize={40}
          logoBackgroundColor="transparent"
        />
        <TouchableOpacity style={styles.saveButton} onPress={() => saveQrCode(item)}>
          <Text style={styles.buttonText}>Save to Gallery</Text>
        </TouchableOpacity>
      </View>
    </ViewShot>
  )}
  ListEmptyComponent={<Text style={styles.emptyText}>No QR codes found.</Text>}
/>


      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Create QR Code</Text>
        </TouchableOpacity>
      </View>

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
                passengerType === 'Discount'
                  ? styles.selectedOption
                  : styles.option
              }
              onPress={() => setPassengerType('Discount')}
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
  qrCard: {
    backgroundColor: '#CCD9B8',
    margin: 20,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  qrUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  qrType: {
    fontSize: 16,
    color: '#555',
  },
  saveButton: {
    backgroundColor: '#4E764E',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
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
  generateButton: {
    backgroundColor: '#2B393B',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default DisplayAllQR_Conductor;
