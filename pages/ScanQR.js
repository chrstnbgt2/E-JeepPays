import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import database from '@react-native-firebase/database';
import Geolocation from '@react-native-community/geolocation';
import auth from '@react-native-firebase/auth';

import { MAPBOX_ACCESS_TOKEN } from '@env';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

const QRCodeScannerScreen = () => {
  const navigation = useNavigation();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedTime, setLastScannedTime] = useState(0);
  const scanInterval = 2000;
  const [locationError, setLocationError] = useState(false);

  const sanitizeQRValue = (value) => {
    return value.replace(/[<>]/g, '').trim();
  };

  const fetchLocationFromFirebase = async (userId) => {
    try {
      const snapshot = await database().ref(`/users/locations/${userId}`).once('value');
      if (snapshot.exists()) {
        const location = snapshot.val();
        return { latitude: location.latitude, longitude: location.longitude };
      } else {
        throw new Error('No location data available in Firebase.');
      }
    } catch (error) {
      console.error('Error fetching location from Firebase:', error);
      return null;
    }
  };

  const getLocation = async (userId) => {
    try {
      const location = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocationError(false); // Clear error state on success
            resolve({ latitude, longitude });
          },
          (error) => {
            console.warn('Geolocation failed, falling back to Firebase:', error);
            setLocationError(true); // Set error state on failure
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
        );
      });
      return location;
    } catch (geolocationError) {
      const fallbackLocation = await fetchLocationFromFirebase(userId);
      if (fallbackLocation) {
        setLocationError(false); // Clear error state if Firebase fallback succeeds
        return fallbackLocation;
      } else {
        setLocationError(true); // Set error state if both fail
        throw new Error('Failed to retrieve location from both Geolocation and Firebase.');
      }
    }
  };
  
  const saveTripToFirebase = async (scannedUid) => {
    try {
      let isTemporaryQR = false;
      let creatorUid = scannedUid;
      let tempData = null;

      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Conductor is not logged in.');
        return;
      }

      const conductorUid = currentUser.uid;
      const conductorRef = database().ref(`/users/accounts/${conductorUid}`);
      const conductorSnapshot = await conductorRef.once('value');
      if (!conductorSnapshot.exists()) {
        Alert.alert('Error', 'Conductor account not found.');
        return;
      }

      const conductorData = conductorSnapshot.val();
      const conductorName = `${conductorData.firstName || ''} ${conductorData.lastName || ''}`.trim();
      const driverUid = conductorData.creatorUid;
      if (!driverUid) {
        Alert.alert('Error', 'No linked driver found for this conductor.');
        return;
      }

      const driverRef = database().ref(`/users/accounts/${driverUid}`);
      const driverSnapshot = await driverRef.once('value');
      if (!driverSnapshot.exists()) {
        Alert.alert('Error', 'Driver account not found.');
        return;
      }

      const driverData = driverSnapshot.val();
      const jeepneyId = driverData.jeep_assigned;
      if (!jeepneyId) {
        Alert.alert('Error', 'No jeepney assigned to this driver.');
        return;
      }

      const jeepneyRef = database().ref(`/jeepneys/${jeepneyId}`);
      const jeepneySnapshot = await jeepneyRef.once('value');
      if (!jeepneySnapshot.exists()) {
        Alert.alert('Error', 'Jeepney not found.');
        return;
      }

      const jeepneyData = jeepneySnapshot.val();
      const maxCapacity = jeepneyData.capacity || 25;
      let currentCapacity = jeepneyData.currentCapacity ?? maxCapacity;

      const tempRef = database().ref(`/temporary`);
      const tempSnapshot = await tempRef.once('value');
      tempSnapshot.forEach((child) => {
        const generatedUidData = child.val();
        const generatedUidKeys = Object.keys(generatedUidData);
        if (generatedUidKeys.includes(scannedUid)) {
          isTemporaryQR = true;
          creatorUid = child.key;
          tempData = generatedUidData[scannedUid];
        }
      });

      if (isTemporaryQR && (!tempData || tempData.status !== 'enabled')) {
        Alert.alert('Error', 'This temporary QR code is not valid or already disabled.');
        return;
      }

      const userRef = database().ref(`/users/accounts/${creatorUid}`);
      const userSnapshot = await userRef.once('value');
      if (!userSnapshot.exists()) {
        Alert.alert('Error', 'No user found for this QR code.');
        return;
      }

      const userData = userSnapshot.val();
      let fareType = isTemporaryQR ? tempData?.type?.toLowerCase() || 'regular' : userData.acc_type?.toLowerCase() || 'regular';

      const fareRef = database().ref(`/fares/${fareType}`);
      const fareSnapshot = await fareRef.once('value');
      if (!fareSnapshot.exists()) {
        Alert.alert('Error', `Fare type "${fareType}" not found.`);
        return;
      }

      const fareData = fareSnapshot.val();
      const baseFareDistanceMeters = 4000;
      const baseFare = fareData.firstKm;
      const additionalRatePerMeter = fareData.succeedingKm / 1000;

      const tripListRef = database().ref(`/trips/temporary/${creatorUid}/${scannedUid}`);
      const tripSnapshot = await tripListRef.once('value');

      if (tripSnapshot.exists() && tripSnapshot.val().status === 'in-progress') {
        const location = await getLocation(currentUser.uid);
        if (!location) throw new Error('Failed to retrieve location.');

        const { latitude, longitude } = location;
        const tripData = tripSnapshot.val();
        const { latitude: startLat, longitude: startLong } = tripData.start_loc;

        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLong},${startLat};${longitude},${latitude}?access_token=${MAPBOX_ACCESS_TOKEN}`;
        const response = await fetch(directionsUrl);
        const routeData = await response.json();

        if (!response.ok || !routeData.routes || routeData.routes.length === 0) {
          Alert.alert('Error', 'Failed to get route from Mapbox.');
          return;
        }

        const distanceMeters = routeData.routes[0].distance;
        let payment = baseFare;

        if (distanceMeters > baseFareDistanceMeters) {
          const extraMeters = distanceMeters - baseFareDistanceMeters;
          payment += extraMeters * additionalRatePerMeter;
        }

        payment = parseFloat(payment.toFixed(2));

        if (userData.wallet_balance >= payment) {
          await userRef.update({ wallet_balance: userData.wallet_balance - payment });

          await conductorRef.update({
            wallet_balance: (conductorData.wallet_balance || 0) + payment,
          });

          const scannerTransactionsRef = database().ref(`/users/accounts/${conductorUid}/transactions`);
          await scannerTransactionsRef.push({
            type: 'trip',
            description: `Received payment from passenger`,
            passengerUid: creatorUid,
            passengerName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            amount: payment,
            distance: parseFloat((distanceMeters / 1000).toFixed(2)),
            createdAt: new Date().toISOString(),
          });

          await tripListRef.update({
            stop_loc: { latitude, longitude },
            distance: parseFloat((distanceMeters / 1000).toFixed(2)),
            payment,
            status: 'completed',
          });

          currentCapacity = Math.min(maxCapacity, currentCapacity + 1);
          await jeepneyRef.update({ currentCapacity });

          const transactionsRef = database().ref(`/users/accounts/${creatorUid}/transactions`);
          await transactionsRef.push({
            type: 'trip',
            description: `Trip payment to conductor`,
            conductorUid: conductorUid,
            conductorName: conductorName,
            amount: payment,
            distance: parseFloat((distanceMeters / 1000).toFixed(2)),
            createdAt: new Date().toISOString(),
          });

          const today = new Date().toISOString().split('T')[0];
          const incomeRef = database().ref(`/jeepneys/${jeepneyId}/dailyStats/${today}`);
          const incomeSnapshot = await incomeRef.once('value');

          const dailyData = incomeSnapshot.val() || { totalIncome: 0, totalPassengers: 0 };
          const updatedDailyData = {
            totalIncome: (dailyData.totalIncome || 0) + payment,
            totalPassengers: (dailyData.totalPassengers || 0) + 1,
          };

          await incomeRef.update(updatedDailyData);

          if (isTemporaryQR) {
            const qrRef = database().ref(`/temporary/${creatorUid}/${scannedUid}`);
            await qrRef.update({ status: 'disabled' });
          }

          Alert.alert(
            'Trip Completed',
            `Trip completed! Fare: ₱${payment.toFixed(2)}. Seats Available: ${currentCapacity}`
          );
        } else {
          Alert.alert('Insufficient Balance', 'Wallet balance is not enough to complete the trip.');
        }
      } else {
        if (currentCapacity <= 0) {
          Alert.alert('Error', 'The jeepney is full.');
          return;
        }

        const location = await getLocation(currentUser.uid);
        if (!location) throw new Error('Failed to retrieve location.');

        const { latitude, longitude } = location;

        await tripListRef.set({
          start_loc: { latitude, longitude },
          stop_loc: null,
          distance: 0,
          payment: 0,
          status: 'in-progress',
          type: fareType,
          qrId: scannedUid,
          timestamp: Date.now(),
        });

        currentCapacity -= 1;
        await jeepneyRef.update({ currentCapacity });

        Alert.alert('Trip Started', `New trip has been started! Remaining Seats: ${currentCapacity}`);
      }
    } catch (error) {
      console.error('Error saving trip to Firebase:', error);
      Alert.alert('Error', 'Failed to save trip data.');
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const now = Date.now();
      if (!isScanning && codes.length > 0 && now - lastScannedTime > scanInterval) {
        setIsScanning(true);
        const scannedUid = sanitizeQRValue(codes[0].value);
        console.log(`Scanned User UID: ${scannedUid}`);
        setLastScannedTime(now);
        saveTripToFirebase(scannedUid);

        setTimeout(() => {
          setIsScanning(false);
        }, scanInterval);
      } else {
        console.log('Scan ignored due to interval or already scanning');
      }
    },
  });
  
  const uploadQrCode = async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      const result = await launchImageLibrary({ mediaType: 'photo' });

      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileSize = result.assets[0].fileSize / (1024 * 1024);
        const fileExtension = fileUri.split('.').pop().toLowerCase();

        if (fileSize > MAX_FILE_SIZE_MB) {
          Alert.alert('Error', `File size exceeds ${MAX_FILE_SIZE_MB}MB. Please upload a smaller image.`);
          setIsScanning(false);
          return;
        }

        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
          Alert.alert('Error', 'Unsupported file format. Please upload a JPG or PNG image.');
          setIsScanning(false);
          return;
        }

        RNQRGenerator.detect({ uri: fileUri })
          .then((response) => {
            const { values } = response;
            if (values && values.length > 0) {
              const sanitizedQR = sanitizeQRValue(values[0]);
              console.log('Decoded QR Code Content:', sanitizedQR);
              saveTripToFirebase(sanitizedQR);
            } else {
              Alert.alert('Error', 'No QR code detected in the image.');
            }
          })
          .catch((error) => {
            console.error('Error decoding QR code:', error);
            Alert.alert('Error', 'Failed to decode QR code.');
          })
          .finally(() => {
            setIsScanning(false);
          });
      } else {
        Alert.alert('Error', 'No image selected.');
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      Alert.alert('Error', 'Failed to upload or read QR code image.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const checkPermission = async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    };
    checkPermission();
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>Camera permission is required to use this feature.</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>No camera device found.</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
       
        <Text style={styles.headerTitle}>QR Code Scanner</Text>
    
 
      </View>
      {locationError && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>Unable to retrieve GPS location. Please ensure GPS is enabled.</Text>
  </View>
)}

      <Text style={styles.scannerTitle}>Scan passenger QR code</Text>
      <View style={styles.qrContainer}>
        <View style={styles.qrBox}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!isScanning}
            codeScanner={codeScanner}
          />
          {isScanning && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
            </View>
          )}
        
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button1} onPress={() => navigation.navigate('Share')}>
          <Text style={styles.buttonText}>QR Code Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button2, isScanning && { opacity: 0.6 }]}
          onPress={uploadQrCode}
          disabled={isScanning}>
          <Text style={styles.buttonText}>{isScanning ? 'Processing...' : 'Upload QR Code'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button3} onPress={() => navigation.navigate('AllQR')}>
          <Text style={styles.buttonText}>View ALL QR Generated</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  backButton: { marginRight: 8 },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
  },  scannerTitle: { marginTop: 20, fontSize: 16, textAlign: 'center', color: '#333', fontWeight: '500' },
  qrContainer: { alignSelf: 'center', marginTop: 50, width: 350, height: 350, borderWidth: 2, borderColor: '#7FA06F', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  qrBox: { width: '90%', height: '90%', borderWidth: 2, borderColor: '#000', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  iconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingHorizontal: 20 },
  button1: { backgroundColor: '#74A059', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  button2: { backgroundColor: '#4E764E', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  button3: { backgroundColor: '#215A3E', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  infoText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  errorContainer: {
    backgroundColor: '#black',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 20,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
  },
  
});

export default QRCodeScannerScreen;
