import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const QRCodeScannerScreen = () => {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      console.log(`Scanned ${codes.length} codes!`)
    }
  })
  

  // Check and request camera permissions
  React.useEffect(() => {
    const checkPermission = async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    };
    checkPermission();
  }, [hasPermission, requestPermission]);

  // Handle permission denied
  if (!hasPermission) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>Camera permission is required to use this feature.</Text>
      </View>
    );
  }

  // Handle no camera device available
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
        <TouchableOpacity style={styles.button1}>
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
    borderColor: '#7FA06F', // Green outline
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrBox: {
    width: '90%',
    height: '90%',
    borderWidth: 2,
    borderColor: '#000', // Inner black border
    borderRadius: 8,
    overflow: 'hidden', // Ensures the camera fits inside the box
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
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#7FA06F',
    paddingTop: 10,
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
