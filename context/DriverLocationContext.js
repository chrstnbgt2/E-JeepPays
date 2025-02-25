import React, { createContext, useRef } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Alert, Platform } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const DriverLocationContext = createContext();

export const DriverLocationProvider = ({ children }) => {
  const watchIdRef = useRef(null);

  // ✅ Request location permission
  const requestLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

      const result = await request(permission);

      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for real-time tracking.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      return false;
    }
  };

  // ✅ Start location tracking
  const startLocationTracking = async (updateDriverLocation) => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    // ✅ Prevent duplicate tracking sessions
    if (watchIdRef.current !== null) {
      console.warn('⛔ Tracking already running, stopping first...');
      stopLocationTracking();
    }

    console.log('📍 Starting location tracking...');

    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📡 Location updated: ${latitude}, ${longitude}`);
        updateDriverLocation(latitude, longitude);
      },
      (error) => {
        console.error('❌ GPS Error:', error);
        Alert.alert('GPS Error', 'Unable to fetch current location. Ensure GPS is enabled.');
        watchIdRef.current = null; // ✅ Reset watchId to allow reattempting tracking
      },
      { enableHighAccuracy: true, distanceFilter: 5, interval: 5000, fastestInterval: 2000 }
    );
  };

  // ✅ Stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      console.warn('⛔ Stopping location tracking...');
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return (
    <DriverLocationContext.Provider
      value={{
        startLocationTracking,
        stopLocationTracking,
      }}
    >
      {children}
    </DriverLocationContext.Provider>
  );
};
