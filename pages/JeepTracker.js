import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Image, Alert, Text, Platform, TouchableOpacity } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';
import database from '@react-native-firebase/database';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { MAPBOX_ACCESS_TOKEN } from '@env';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const JeepTrackerScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyJeepneys, setNearbyJeepneys] = useState([]);
  const [isFollowingUser, setIsFollowingUser] = useState(true); 
  const cameraRef = useRef(null);  
  const [selectedJeepney, setSelectedJeepney] = useState(null);  


  const handleJeepneyClick = (jeepney) => {
    setSelectedJeepney(jeepney); // Set the selected jeepney
  };
  const handleViewDetails = () => {
    if (selectedJeepney) {
      navigation.navigate('JeepDetail', { jeepney: selectedJeepney }); // Pass selected jeepney
    }
  };
  
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

          // Fetch and subscribe to user's current location
          Geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentLocation([longitude, latitude]);

              if (isFollowingUser && cameraRef.current) {
                cameraRef.current.setCamera({
                  centerCoordinate: [longitude, latitude],
                  zoomLevel: 14,
                  animationDuration: 1000,
                });
              }
            },
            (error) => {
              console.error('Error fetching location:', error);
              Alert.alert('Location Error', 'Unable to fetch current location.');
            },
            { enableHighAccuracy: true, distanceFilter: 10, timeout: 15000, maximumAge: 10000 }
          );

          subscribeToJeepneys(); // Subscribe to jeepney updates
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
      database().ref('jeep_loc').off(); // Remove listeners for real-time updates
      Geolocation.stopObserving(); // Stop location updates
    };
  }, []);

  const subscribeToJeepneys = () => {
    const jeepneyRef = database().ref('jeep_loc');
  
    jeepneyRef.on('child_added', (snapshot) => {
      const data = snapshot.val();
      const id = snapshot.key;
      if (data) {
        setNearbyJeepneys((prev) => {
          if (prev.some((jeepney) => jeepney.id === id)) {
            return prev; // Skip if the id already exists
          }
          return [...prev, { id, latitude: data.lat, longitude: data.lng }];
        });
      }
    });
  
    jeepneyRef.on('child_changed', (snapshot) => {
      const data = snapshot.val();
      const id = snapshot.key;
      setNearbyJeepneys((prev) =>
        prev.map((jeepney) =>
          jeepney.id === id ? { id, latitude: data.lat, longitude: data.lng } : jeepney
        )
      );
    });
  
    jeepneyRef.on('child_removed', (snapshot) => {
      const id = snapshot.key;
      setNearbyJeepneys((prev) => prev.filter((jeepney) => jeepney.id !== id));
    });
  };
  useEffect(() => {
    console.log('Nearby jeepneys:', nearbyJeepneys.map((j) => j.id));
  }, [nearbyJeepneys]);
  

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jeep Tracker</Text>
      </View>

      <Text style={styles.note}>
        <Text style={styles.noteLabel}>Note:</Text> Choose a Jeep to see the availability of a seat.
      </Text>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapboxGL.MapView
            style={styles.map}
            logoEnabled={false}
            attributionEnabled={false}
            onUserTrackingModeChange={(event) => {
              if (event.nativeEvent.payload === 1) {
                setIsFollowingUser(true);
              } else {
                setIsFollowingUser(false);
              }
            }}
            onTouchEnd={() => setIsFollowingUser(false)} // Stop following when the user touches the map
          >
            {/* Camera with Initial Zoom */}
            <MapboxGL.Camera
              ref={cameraRef}
              followUserLocation={isFollowingUser}
              followUserMode="normal"
              centerCoordinate={currentLocation}
              zoomLevel={16}
              animationMode={'flyTo'}
              animationDuration={1000}
            />

            {/* Current User Location Marker */}
            <MapboxGL.PointAnnotation id="userLocation" coordinate={currentLocation}>
              <View style={styles.userMarker} />
            </MapboxGL.PointAnnotation>

            {/* Jeepney Markers */}
            {nearbyJeepneys.map((jeepney) => (
           <MapboxGL.PointAnnotation
           key={`jeepney-${jeepney.id}`}
           id={`jeepney-${jeepney.id}`}
           coordinate={[jeepney.longitude, jeepney.latitude]}
           onSelected={() => handleJeepneyClick(jeepney)} // Selects the jeepney on marker click
         >
           <Image
             source={require('../assets/images/jeep.png')}
             style={[
               styles.markerImage,
               selectedJeepney?.id === jeepney.id && styles.selectedMarker // Apply different style if selected
             ]}
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

      {/* Button Section */}
      <TouchableOpacity
  style={[styles.detailsButton, { opacity: selectedJeepney ? 1 : 0.5 }]} 
  onPress={handleViewDetails}
  disabled={!selectedJeepney} 
>

        <Text style={styles.detailsButtonText}>View Jeep Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    color: '#555',
  },
  noteLabel: {
    fontWeight: 'bold',
    color: 'green',
  },
  mapContainer: {
    flex: 1,
    marginVertical: 20,
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
  detailsButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#00695C',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  detailsButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },selectedMarker: {
    borderWidth: 3,
    borderColor: '#FFD700', // Gold border for selected jeepney
    borderRadius: 25,
  },
  
});

export default JeepTrackerScreen;
