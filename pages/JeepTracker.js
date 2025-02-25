import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Alert,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';
import database from '@react-native-firebase/database';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { MAPBOX_ACCESS_TOKEN } from '@env';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const JeepTrackerScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyJeepneys, setNearbyJeepneys] = useState([]);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true); // Track first load
  const cameraRef = useRef(null);
  const [selectedJeepney, setSelectedJeepney] = useState(null);

  const handleJeepneyClick = (jeepney) => {
    setSelectedJeepney(jeepney);
  };

  const handleViewDetails = () => {
    if (selectedJeepney) {
      navigation.navigate('JeepDetail', { jeepney: selectedJeepney });
    }
  };

  const requestLocationPermission = async () => {
    try {
      const result = await request(
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      );

      if (result === RESULTS.GRANTED) {
        console.log('Location permission granted');
        Geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation([longitude, latitude]);

            // Set camera immediately with no animation on first load
            if (firstLoad && cameraRef.current) {
              cameraRef.current.setCamera({
                centerCoordinate: [longitude, latitude],
                zoomLevel: 14,
                animationDuration: 0, // No animation for the first load
              });
              setFirstLoad(false); // Prevent further immediate updates
            }
          },
          (error) => {
            console.error('Error fetching location:', error);
            Alert.alert('Location Error', 'Unable to fetch current location.');
          },
          { enableHighAccuracy: true, distanceFilter: 10, timeout: 15000, maximumAge: 10000 }
        );

        subscribeToJeepneys();
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
    requestLocationPermission();

    return () => {
      database().ref('jeep_loc').off();
      Geolocation.stopObserving();
    };
  }, []);

  const refreshMap = async () => {
    setIsRefreshing(true);
    console.log('Refreshing map...');
    setNearbyJeepneys([]);  
    await requestLocationPermission(); 
    setIsRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jeep Tracker</Text>
      </View>

      <Text style={styles.note}>
        <Text style={styles.noteLabel}>Note:</Text> Swipe down to refresh or choose a Jeep to see the availability of a seat.
      </Text>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshMap} />
        }
      >
        <View style={styles.mapContainer}>
          {currentLocation ? (
            <MapboxGL.MapView
              style={styles.map}
              logoEnabled={false}
              attributionEnabled={false}
            >
              <MapboxGL.Camera
                ref={cameraRef}
                centerCoordinate={currentLocation}
                zoomLevel={14}
                animationMode={firstLoad ? 'easeTo' : 'flyTo'}
                animationDuration={firstLoad ? 0 : 1000} // Instant on first load
              />
              <MapboxGL.PointAnnotation id="userLocation" coordinate={currentLocation}>
                <View style={styles.userMarker} />
              </MapboxGL.PointAnnotation>

              {nearbyJeepneys.map((jeepney) => (
                <MapboxGL.MarkerView
                  key={`jeepney-${jeepney.id}`}
                  coordinate={[jeepney.longitude, jeepney.latitude]}
                >
                  <TouchableOpacity onPress={() => handleJeepneyClick(jeepney)}>
                    <Image
                      source={require('../assets/images/jeep.png')}
                      style={styles.markerImage}
                    />
                  </TouchableOpacity>
                </MapboxGL.MarkerView>
              ))}
            </MapboxGL.MapView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        </View>
      </ScrollView>

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
    backgroundColor: '#F9F9F9',
  },
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
    height: 500,
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
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 15,
    marginHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default JeepTrackerScreen;
