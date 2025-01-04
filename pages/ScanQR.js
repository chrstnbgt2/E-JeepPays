import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import database from '@react-native-firebase/database';
import Geolocation from '@react-native-community/geolocation';  
import { getDistance } from 'geolib';

const MAX_FILE_SIZE_MB = 5; // Max file size (in MB)
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png']; // Allowed file types

const QRCodeScannerScreen = () => {
  const navigation = useNavigation();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [lastScannedTime, setLastScannedTime] = useState(0);
  const scanInterval = 2000;
  const [isProcessing, setIsProcessing] = useState(false);

  const sanitizeQRValue = (value) => {
    return value.replace(/[<>]/g, '').trim(); // Remove any angle brackets
  };

 
  const saveTripToFirebase = async (scannedUid) => {
    try {
      let isTemporaryQR = false;
      let creatorUid = scannedUid; // Default to original UID
  
      // Check if scanned UID belongs to a temporary QR
      const tempRef = database().ref(`/temporary`);
      const tempSnapshot = await tempRef.once('value');
      let tempData = null;
  
      tempSnapshot.forEach((child) => {
        const generatedUidData = child.val();
        const generatedUidKeys = Object.keys(generatedUidData);
        if (generatedUidKeys.includes(scannedUid)) {
          isTemporaryQR = true;
          creatorUid = child.key; // Get the creator UID
          tempData = generatedUidData[scannedUid]; // Get the temporary QR details
        }
      });
  
      if (!creatorUid) {
        Alert.alert('Error', 'No user found for this QR code.');
        return;
      }
  
      // Check if the temporary QR is enabled
      if (isTemporaryQR) {
        if (!tempData || tempData.status !== 'enabled') {
          Alert.alert('Error', 'This QR code is one-time use only and is already disabled.');
          return;
        }
      }
  
      const userRef = database().ref(`/users/accounts/${creatorUid}`);
      const userSnapshot = await userRef.once('value');
  
      if (!userSnapshot.exists()) {
        Alert.alert('Error', 'No user found for this QR code.');
        return;
      }
  
      const userData = userSnapshot.val();
      const fareType = isTemporaryQR ? 'regular' : userData.type || 'regular';
  
      const fareRef = database().ref(`/fares/${fareType}`);
      const fareSnapshot = await fareRef.once('value');
  
      if (!fareSnapshot.exists()) {
        Alert.alert('Error', 'Failed to fetch fare information.');
        return;
      }
  
      const fareData = fareSnapshot.val();
      const baseFareDistanceMeters = 4000; // 4 km in meters (first 4 km)
      const baseFare = fareData.firstKm;
      const additionalRatePerMeter = fareData.succeedingKm / 1000; // Fare per meter after 4 km
  
      const tripListRef = isTemporaryQR
        ? database().ref(`/trips/temporary/${creatorUid}`)
        : database().ref(`/trips/${creatorUid}`);
  
      const tripListSnapshot = await tripListRef.once('value');
      let inProgressTripKey = null;
  
      // Check for "in-progress" trip
      tripListSnapshot.forEach((child) => {
        if (child.val().status === 'in-progress') {
          inProgressTripKey = child.key;
        }
      });
  
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
  
          if (isTemporaryQR) {
            if (inProgressTripKey) {
              // **Second scan for temporary QR: Complete the trip and disable the QR**
              const tripData = tripListSnapshot.child(inProgressTripKey).val();
              const { latitude: startLat, longitude: startLong } = tripData.start_loc;
  
              const distanceMeters = getDistance(
                { latitude: startLat, longitude: startLong },
                { latitude, longitude }
              );
  
              let payment = baseFare;
              if (distanceMeters > baseFareDistanceMeters) {
                const extraMeters = distanceMeters - baseFareDistanceMeters;
                payment += extraMeters * additionalRatePerMeter;
              }
  
              payment = parseFloat(payment.toFixed(2));
  
              let newBalance = userData.wallet_balance || 0;
              if (newBalance >= payment) {
                newBalance -= payment;
                await userRef.update({ wallet_balance: newBalance });
              } else {
                Alert.alert('Insufficient Balance', 'Wallet balance is not enough to complete the trip.');
                return;
              }
  
              await tripListRef.child(inProgressTripKey).update({
                stop_loc: { latitude, longitude },
                distance: parseFloat((distanceMeters / 1000).toFixed(2)), // Convert to km
                payment,
                status: 'completed',
              });
  
              // **Disable the temporary QR to prevent reuse**
              const tempQRRef = database().ref(`/temporary/${creatorUid}/${scannedUid}`);
              await tempQRRef.update({ status: 'disabled' });
  
              Alert.alert('Trip Completed', `Fare: ₱${payment.toFixed(2)} has been deducted.`);
            } else {
              // **First scan for temporary QR: Start a new trip**
              const newTripRef = tripListRef.push();
              await newTripRef.set({
                start_loc: { latitude, longitude },
                stop_loc: null,
                distance: 0,
                payment: 0,
                status: 'in-progress',
                type: 'temporary',
                timestamp: Date.now(),
              });
              Alert.alert('Temporary Trip Started', 'New temporary trip has been started!');
            }
          } else {
            if (inProgressTripKey) {
              // **Original QR second scan: Complete trip**
              const tripData = tripListSnapshot.child(inProgressTripKey).val();
              const { latitude: startLat, longitude: startLong } = tripData.start_loc;
  
              const distanceMeters = getDistance(
                { latitude: startLat, longitude: startLong },
                { latitude, longitude }
              );
  
              let payment = baseFare;
              if (distanceMeters > baseFareDistanceMeters) {
                const extraMeters = distanceMeters - baseFareDistanceMeters;
                payment += extraMeters * additionalRatePerMeter;
              }
  
              payment = parseFloat(payment.toFixed(2));
  
              if (userData.wallet_balance >= payment) {
                await userRef.update({ wallet_balance: userData.wallet_balance - payment });
                await tripListRef.child(inProgressTripKey).update({
                  stop_loc: { latitude, longitude },
                  distance: parseFloat((distanceMeters / 1000).toFixed(2)),
                  payment,
                  status: 'completed',
                });
                Alert.alert('Trip Completed', `Trip completed! Fare: ₱${payment.toFixed(2)}.`);
              } else {
                Alert.alert('Insufficient Balance', 'Wallet balance is not enough to complete the trip.');
              }
            } else {
              // **Original QR first scan: Start a new trip**
              const newTripRef = tripListRef.push();
              await newTripRef.set({
                start_loc: { latitude, longitude },
                stop_loc: null,
                distance: 0,
                payment: 0,
                status: 'in-progress',
                type: fareType,
                timestamp: Date.now(),
              });
              Alert.alert('Trip Started', 'New trip has been started!');
            }
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          Alert.alert('Error', 'Failed to get location.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
      );
    } catch (error) {
      console.error('Error saving trip to Firebase:', error);
      Alert.alert('Error', 'Failed to save trip data.');
    }
  };
  

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const now = Date.now();
      if (codes.length > 0 && now - lastScannedTime > scanInterval) {
        const scannedUid = sanitizeQRValue(codes[0].value);
        console.log(`Scanned User UID: ${scannedUid}`);
        setLastScannedTime(now); // Update the last scanned time
        saveTripToFirebase(scannedUid); // Save scanned QR UID to Firebase
      } else {
        console.log('Scan ignored due to interval');
      }
    },
  });

  const uploadQrCode = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const result = await launchImageLibrary({ mediaType: 'photo' });

      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileSize = result.assets[0].fileSize / (1024 * 1024); // File size in MB
        const fileExtension = fileUri.split('.').pop().toLowerCase();

        if (fileSize > MAX_FILE_SIZE_MB) {
          Alert.alert('Error', `File size exceeds ${MAX_FILE_SIZE_MB}MB. Please upload a smaller image.`);
          setIsProcessing(false);
          return;
        }

        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
          Alert.alert('Error', 'Unsupported file format. Please upload a JPG or PNG image.');
          setIsProcessing(false);
          return;
        }

        RNQRGenerator.detect({ uri: fileUri })
          .then((response) => {
            const { values } = response;
            if (values && values.length > 0) {
              const sanitizedQR = sanitizeQRValue(values[0]);
              console.log('Decoded QR Code Content:', sanitizedQR);
              saveTripToFirebase(sanitizedQR); // Save detected QR code to Firebase
            } else {
              Alert.alert('Error', 'No QR code detected in the image.');
            }
          })
          .catch((error) => {
            console.error('Error decoding QR code:', error);
            Alert.alert('Error', 'Failed to decode QR code.');
          })
          .finally(() => {
            setIsProcessing(false);
          });
      } else {
        Alert.alert('Error', 'No image selected.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      Alert.alert('Error', 'Failed to upload or read QR code image.');
      setIsProcessing(false);
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
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Scanner</Text>
      </View>
      <Text style={styles.scannerTitle}>Scan passenger QR code</Text>
      <View style={styles.qrContainer}>
        <View style={styles.qrBox}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            codeScanner={codeScanner}
          />
          <View style={styles.iconOverlay}>
            <MaterialCommunityIcons name="line-scan" size={300} color="#4D7550" />
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button1} onPress={() => navigation.navigate('Share')}>
          <Text style={styles.buttonText}>QR Code Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button2, isProcessing && { opacity: 0.6 }]}
          onPress={uploadQrCode}
          disabled={isProcessing}>
          <Text style={styles.buttonText}>{isProcessing ? 'Uploading...' : 'Upload QR Code'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  scannerTitle: { marginTop: 20, fontSize: 16, textAlign: 'center', color: '#333', fontWeight: '500' },
  qrContainer: { alignSelf: 'center', marginTop: 50, width: 350, height: 350, borderWidth: 2, borderColor: '#7FA06F', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  qrBox: { width: '90%', height: '90%', borderWidth: 2, borderColor: '#000', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  iconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingHorizontal: 20 },
  button1: { backgroundColor: '#74A059', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  button2: { backgroundColor: '#4E764E', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  infoText: { color: '#fff', fontSize: 16, textAlign: 'center' },
});

export default QRCodeScannerScreen;
