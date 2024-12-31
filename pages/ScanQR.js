import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const QRCodeScannerScreen = () => {
  const navigation = useNavigation();
  
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [lastScannedTime, setLastScannedTime] = useState(0); // Store the last scanned time
  const scanInterval = 2000; // 2 seconds interval

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
        <TouchableOpacity style={styles.button2}>
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
