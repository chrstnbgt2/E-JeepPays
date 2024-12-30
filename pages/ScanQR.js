import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Ionicons from 'react-native-vector-icons/Ionicons';

const QRCodeScannerScreen = ({ navigation }) => {
  const [cameraAuthorized, setCameraAuthorized] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;

  const checkCameraPermission = async () => {
    const result = await check(
      Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
    );

    if (result === RESULTS.GRANTED) {
      setCameraAuthorized(true);
    } else if (result === RESULTS.DENIED) {
      const requestResult = await request(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
      );
      setCameraAuthorized(requestResult === RESULTS.GRANTED);
    } else {
      Alert.alert(
        'Camera Permission',
        'Camera access is required to scan QR codes. Please enable it in settings.',
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const onQRCodeDetected = (data) => {
    Alert.alert('QR Code Detected', `Data: ${data}`);
  };

  if (!cameraAuthorized) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Camera access is not authorized. Please grant permission in settings.
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No camera device available. Please check your hardware or permissions.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Scanner</Text>
      </View>

      {/* QR Scanner */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        onFrameProcessor={(frame) => {
          // QR code detection logic can be added here with a library like VisionCameraCodeScanner.
          // Example: Use frameProcessor from VisionCameraCodeScanner.
        }}
        frameProcessorFps={5}
      />
      <Text style={styles.subtitle}>Point your camera at a QR code</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default QRCodeScannerScreen;
