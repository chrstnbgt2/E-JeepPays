import React, { createContext, useRef } from 'react';
import Geolocation from 'react-native-geolocation-service';

export const DriverLocationContext = createContext();

export const DriverLocationProvider = ({ children }) => {
  const watchIdRef = useRef(null);

  const startLocationTracking = (updateDriverLocation) => {
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateDriverLocation(latitude, longitude);
      },
      (error) => {
        console.error('Error fetching location:', error);
      },
      { enableHighAccuracy: true, distanceFilter: 10 }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
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
