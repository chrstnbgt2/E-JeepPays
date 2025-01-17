import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';

const DisplayAllQR_Conductor = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [passengerType, setPassengerType] = useState(null);
  const [qrList, setQrList] = useState([]);
  const [filteredQrList, setFilteredQrList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const viewShotRefs = useRef({});
  const [name, setName] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

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
        setFilteredQrList(qrCodes);
      } catch (error) {
        console.error('Error fetching QR codes:', error);
      }
    };

    fetchUserData();
    fetchUserQrCodes();
  }, []);

  const handleSearch = (query) => {
    if (/[^0-9]/.test(query)) {
      Alert.alert('Invalid Input', 'Please enter numbers only.');
      return;
    }
    setSearchQuery(query);
    if (query === '') {
      setFilteredQrList(qrList);
    } else {
      const filteredList = qrList.filter((item) =>
        item.username.includes(query) || item.type.includes(query)
      );
      setFilteredQrList(filteredList);
    }
  };

  const saveQrCode = async (qrItem) => {
    try {
      const uri = await viewShotRefs.current[qrItem.key].capture();
      const sanitizedUsername = qrItem.username.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `QR_${sanitizedUsername}.png`;
      const directoryPath = `${RNFS.ExternalStorageDirectoryPath}/Pictures/MyApp`;
      const filePath = `${directoryPath}/${fileName}`;

      if (!(await RNFS.exists(directoryPath))) {
        await RNFS.mkdir(directoryPath);
      }

      const base64 = await RNFS.readFile(uri, 'base64');
      await RNFS.writeFile(filePath, base64, 'base64');
      console.log('File successfully written to:', filePath);

      Alert.alert('Success', `QR code saved to: ${filePath}`);
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
    }
  };

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

      <TextInput
        style={styles.searchBar}
        placeholder="Search by username or type"
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearch}
        keyboardType="numeric"
      />

      <FlatList
        data={filteredQrList}
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

     
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F4F4F4',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBar: {
    margin: 10,
    padding: 10,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: '#F9F9F9',
    placeholderTextColor: '#888',
  },
  qrCard: {
    padding: 20,
    backgroundColor: '#CCD9B8',
    borderRadius: 15,
    margin: 10,
    alignItems: 'center',
  },
  qrUsername: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrType: {
    fontSize: 14,
    color: '#555',
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#4E764E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  createButton: {
    margin: 20,
    backgroundColor: '#2B393B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  option: {
    width: '100%',
    padding: 10,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedOption: {
    width: '100%',
    padding: 10,
    backgroundColor: '#D6E6CF',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  generateButton: {
    marginTop: 20,
    backgroundColor: '#2B393B',
    padding: 10,
    borderRadius: 10,
  },
  generateButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default DisplayAllQR_Conductor;
