import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from '@env';  
import { useNavigation } from '@react-navigation/native';
 
import Ionicons from 'react-native-vector-icons/Ionicons';


MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const JeepTrackerScreen = () => {
   const navigation = useNavigation();
      
  const initialCoordinates = [121.056269, 14.553449]; // Example: Manila, Philippines

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jeep Tracker</Text>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          logoEnabled={false} // Disable Mapbox logo
          attributionEnabled={false} // Disable attribution
        >
          {/* Set the initial view */}
          <MapboxGL.Camera
            zoomLevel={12} // Adjust zoom level
            centerCoordinate={initialCoordinates}
          />

          {/* Add Jeep Markers */}
          <MapboxGL.PointAnnotation
            id="jeep1"
            coordinate={[121.054702, 14.554729]} // Example coordinate
          >
            <Image
              source={require('../assets/images/jeep.png')} // Path to your custom image
              style={styles.markerImage}
            />
          </MapboxGL.PointAnnotation>

          <MapboxGL.PointAnnotation
            id="jeep2"
            coordinate={[121.058880, 14.552060]} // Example coordinate
          >
            <Image
              source={require('../assets/images/jeep.png')} // Path to your custom image
              style={styles.markerImage}
            />
          </MapboxGL.PointAnnotation>
        </MapboxGL.MapView>
      </View>

      {/* View Jeep Details Button */}
      <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('BusDetail')}>
        <Text style={styles.detailsButtonText}>View Jeep Details</Text>
      </TouchableOpacity>

     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    backgroundColor: '#466B66',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  markerImage: {
    width: 40, 
    height: 40,
    resizeMode: 'contain', 
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#466B66',
    height: 70,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
});

export default JeepTrackerScreen;
