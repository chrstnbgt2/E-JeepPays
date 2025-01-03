import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner,scanQRCodesFromImage } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator'; // Import the QR generator

const QRCodeScannerScreen = () => {
  const navigation = useNavigation();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [lastScannedTime, setLastScannedTime] = useState(0);
  const scanInterval = 2000;
  const [qrDecodedText, setQrDecodedText] = useState(null);

 
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      const now = Date.now();
      if (codes.length > 0 && now - lastScannedTime > scanInterval) {
        console.log(`Scanned Code: ${codes[0].value}`);
        setLastScannedTime(now); // Update the last scanned time
      } else if (codes.length > 0) {
        console.log('Scan ignored due to interval');
      } else {
        console.log('No codes scanned');
      }
    },
  });


  // Upload QR code and decode using rn-qr-generator
  const uploadQrCode = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
      });

      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;

        RNQRGenerator.detect({ uri: fileUri })
          .then((response) => {
            const { values } = response; // `values` is an array of QR codes detected
            if (values && values.length > 0) {
              console.log('Decoded QR Code Content:', values[0]);
              Alert.alert('QR Code Detected', values[0]); // Show the QR code content
            } else {
              console.log('No QR code detected in the image.');
              Alert.alert('Error', 'No QR code detected in the image.');
            }
          })
          .catch((error) => {
            console.error('Error decoding QR code:', error);
            Alert.alert('Error', 'Failed to decode QR code.');
          });
      } else {
        Alert.alert('Error', 'No image selected.');
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      Alert.alert('Error', 'Failed to upload or read QR code image.');
    }
  };
  // Check and request camera permissions
  React.useEffect(() => {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Scanner</Text>
      </View>

      {/* Scanner Title */}
      <Text style={styles.scannerTitle}>Scan passenger QR code</Text>

      {/* Camera and Green Box */}
      <View style={styles.qrContainer}>
        <View style={styles.qrBox}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            codeScanner={codeScanner}
          />
          
          {/* Overlay Icon */}
          <View style={styles.iconOverlay}>
            <MaterialCommunityIcons name="line-scan" size={300} color="black" />
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button1} onPress={() => navigation.navigate('Share')}>
          <Text style={styles.buttonText}>QR Code Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button2}  onPress={uploadQrCode}>
          <Text style={styles.buttonText}>Upload QR Code</Text>
        </TouchableOpacity>

     
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scannerTitle: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  qrContainer: {
    alignSelf: 'center',
    marginTop: 50,
    width: 350,
    height: 350,
    borderWidth: 2,
    borderColor: '#7FA06F',  
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrBox: {
    width: '90%',
    height: '90%',
    borderWidth: 2,
    borderColor: '#000', 
    borderRadius: 8,
    overflow: 'hidden',  
    backgroundColor: '#fff',
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  button1: {
    backgroundColor: '#74A059',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
  },
  button2: {
    backgroundColor: '#4E764E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default QRCodeScannerScreen;
