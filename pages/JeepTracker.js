import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Alert, Text, Platform } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';
import database from '@react-native-firebase/database';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { MAPBOX_ACCESS_TOKEN } from '@env';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const JeepTrackerScreen = () => {
 
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyJeepneys, setNearbyJeepneys] = useState([]);
  const [listenerActive, setListenerActive] = useState(false);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const result = await request(
          Platform.OS === 'android'
            ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
            : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        );

        if (result === RESULTS.GRANTED) {
          console.log('Location permission granted');

          // Fetch current location
          Geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentLocation([longitude, latitude]); // Set current location
              startJeepneyListeners(latitude, longitude); // Start listening for updates
            },
            (error) => {
              console.error('Error fetching location:', error);
              Alert.alert('Location Error', 'Unable to fetch current location.');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to track jeepneys.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => openSettings() },
            ]
          );
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };

    requestLocationPermission();

    // Cleanup on component unmount
    return () => {
      database().ref('jeep_loc').off();
    };
  }, []);

  const startJeepneyListeners = (latitude, longitude) => {
    if (listenerActive) {
      return; // Avoid adding duplicate listeners
    }

    const radiusInKm = 3; // 3 kilometers
    const bounds = geohashQueryBounds([latitude, longitude], radiusInKm);
    const jeepneyRef = database().ref('jeep_loc');

    const promises = bounds.map(([start, end]) =>
      jeepneyRef.orderByChild('geohash').startAt(start).endAt(end).once('value')
    );

    Promise.all(promises)
      .then((snapshots) => {
        const nearby = [];
        snapshots.forEach((snapshot) => {
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            const { lat, lng } = data;
            const distance = distanceBetween([latitude, longitude], [lat, lng]);
            if (distance <= radiusInKm) {
              nearby.push({
                id: childSnapshot.key,
                latitude: lat,
                longitude: lng,
              });
            }
          });
        });

        setNearbyJeepneys(nearby);

        // Set up real-time listeners
        jeepneyRef.on('child_removed', (snapshot) => {
          const removedJeepneyId = snapshot.key;
          setNearbyJeepneys((prev) => prev.filter((jeepney) => jeepney.id !== removedJeepneyId));
        });

        jeepneyRef.on('child_changed', (snapshot) => {
          const updatedData = snapshot.val();
          const updatedId = snapshot.key;

          setNearbyJeepneys((prev) =>
            prev.map((jeepney) =>
              jeepney.id === updatedId
                ? {
                    id: updatedId,
                    latitude: updatedData.lat,
                    longitude: updatedData.lng,
                  }
                : jeepney
            )
          );
        });

        jeepneyRef.on('child_added', (snapshot) => {
          const newJeepney = snapshot.val();
          const newId = snapshot.key;
        
          if (newJeepney) {
            const { lat, lng } = newJeepney;
        
            setNearbyJeepneys((prev) => {
              // Check if the jeepney ID already exists in the array
              if (prev.some((jeepney) => jeepney.id === newId)) {
                return prev; // If it exists, return the previous state unchanged
              }
        
          
              return [
                ...prev,
                {
                  id: newId,
                  latitude: lat,
                  longitude: lng,
                },
              ];
            });
          }
        });
        
        setListenerActive(true);
      })
      .catch((error) => {
        console.error('Error fetching nearby jeepneys:', error);
      });
  };


  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapboxGL.MapView
            style={styles.map}
            logoEnabled={false}
            attributionEnabled={false}
          >
            {/* Camera Initial View */}
            <MapboxGL.Camera zoomLevel={14} centerCoordinate={currentLocation} />

            {/* Current User Location Marker */}
            <MapboxGL.PointAnnotation id="userLocation" coordinate={currentLocation}>
              <View style={styles.userMarker} />
            </MapboxGL.PointAnnotation>

            {/* Jeepney Markers */}
            {nearbyJeepneys.map((jeepney) => (
              <MapboxGL.PointAnnotation
                key={jeepney.id}
                id={jeepney.id}
                coordinate={[jeepney.longitude, jeepney.latitude]}
              >
                <Image
                  source={require('../assets/images/jeep.png')} // Replace with your Jeepney icon
                  style={styles.markerImage}
                />
              </MapboxGL.PointAnnotation>
            ))}
          </MapboxGL.MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'blue',
    borderColor: 'white',
    borderWidth: 2,
  },
  markerImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
});

export default JeepTrackerScreen;
