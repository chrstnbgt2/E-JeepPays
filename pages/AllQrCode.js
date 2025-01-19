import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import ViewShot from 'react-native-view-shot';
import Geolocation from '@react-native-community/geolocation';
import { MAPBOX_ACCESS_TOKEN } from '@env';

const DisplayAllQR_Conductor = () => {
  const navigation = useNavigation();
  const [qrList, setQrList] = useState([]);
  const [filteredQrList, setFilteredQrList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tripStatus, setTripStatus] = useState({});  
  const [loading, setLoading] = useState({});

  const getLocation = async () => {
    try {
      const location = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
        );
      });
      return location;
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location.');
      throw error;
    }
  };

  useEffect(() => {
    const fetchUserQrCodes = () => {
      const currentUser = auth().currentUser;
      if (!currentUser) return;
  
      const userLoggedUid = currentUser.uid;
      const tempRef = database().ref(`temporary/${userLoggedUid}`);
      const tripsRef = database().ref(`trips/temporary/${userLoggedUid}`);
  
      // Listen for real-time updates on both nodes
      const tempListener = tempRef.on('value', (tempSnapshot) => {
        const qrCodes = [];
        tempSnapshot.forEach((child) => {
          const qrData = child.val();
  
          // Only include QR codes with `enabled` status
          if (qrData.status === 'enabled') {
            qrCodes.push({
              key: child.key,
              ...qrData, // Include fields like `username` and `type`
            });
          }
        });
  
        // Listen for updates in trips and merge statuses
        const tripsListener = tripsRef.on('value', (tripsSnapshot) => {
          const tripStatuses = {};
          tripsSnapshot.forEach((child) => {
            const tripData = child.val();
            tripStatuses[child.key] = tripData.status || 'completed'; // Default to 'completed'
          });
  
          // Merge `status` from `trips/temporary` into `qrCodes`
          const mergedData = qrCodes.map((qr) => ({
            ...qr,
            status: tripStatuses[qr.key] || qr.status, // Use trip status if available
          }));
  
          // Update QR list and apply search filtering
          setQrList(mergedData);
          setFilteredQrList(() => {
            if (searchQuery.trim() === '') return mergedData;
            return mergedData.filter(
              (item) =>
                item.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.type?.toLowerCase().includes(searchQuery.toLowerCase())
            );
          });
        });
  
        // Cleanup trips listener when temp listener updates
        return () => tripsRef.off('value', tripsListener);
      });
  
      // Cleanup temp listener on unmount
      return () => tempRef.off('value', tempListener);
    };
  
    fetchUserQrCodes();
  
    // Cleanup listeners on unmount
    return () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userLoggedUid = currentUser.uid;
        const tempRef = database().ref(`temporary/${userLoggedUid}`);
        const tripsRef = database().ref(`trips/temporary/${userLoggedUid}`);
        tempRef.off('value');
        tripsRef.off('value');
      }
    };
  }, [searchQuery]);  
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredQrList(qrList);
    } else {
      const filteredList = qrList.filter(
        (item) =>
          item.username.toLowerCase().includes(query.toLowerCase()) ||
          item.type.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredQrList(filteredList);
    }
  };

  const handleStartTrip = async (item) => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Conductor is not logged in.');
        return;
      }
  
      const conductorUid = currentUser.uid;
  
      // Check if the trip is already in progress
      const tripRef = database().ref(`/trips/temporary/${conductorUid}/${item.key}`);
      const tripSnapshot = await tripRef.once('value');
      if (tripSnapshot.exists() && tripSnapshot.val().status === 'in-progress') {
        Alert.alert('Error', 'This trip is already in progress.');
        return;
      }
  
      // Get current location
      const location = await getLocation();
      if (!location) throw new Error('Failed to retrieve location.');
  
      const { latitude, longitude } = location;
  
      // Get jeepney information
      const conductorRef = database().ref(`/users/accounts/${conductorUid}`);
      const conductorSnapshot = await conductorRef.once('value');
      const conductorData = conductorSnapshot.val();
  
      const driverUid = conductorData.creatorUid;
      const driverRef = database().ref(`/users/accounts/${driverUid}`);
      const driverSnapshot = await driverRef.once('value');
      const driverData = driverSnapshot.val();
  
      const jeepneyId = driverData.jeep_assigned;
      const jeepneyRef = database().ref(`/jeepneys/${jeepneyId}`);
      const jeepneySnapshot = await jeepneyRef.once('value');
  
      if (!jeepneySnapshot.exists()) {
        Alert.alert('Error', 'Jeepney not found.');
        return;
      }
  
      let jeepneyData = jeepneySnapshot.val();
      if (jeepneyData.currentCapacity <= 0) {
        Alert.alert('Error', 'The jeepney is full.');
        return;
      }
  
      // Deduct one seat
      const updatedCapacity = jeepneyData.currentCapacity - 1;
      await jeepneyRef.update({ currentCapacity: updatedCapacity });
  
      // Save trip data in Firebase
      await tripRef.set({
        start_loc: { latitude, longitude },
        stop_loc: null,
        distance: 0,
        payment: 0,
        status: 'in-progress',
        type: item.type,
        timestamp: Date.now(),
      });
  
      Alert.alert(
        'Trip Started',
        `Trip for ${item.username} has been successfully started. Seats remaining: ${updatedCapacity}`
      );
    } catch (error) {
      console.error('Error starting trip:', error);
      Alert.alert('Error', 'Failed to start the trip.');
    }
  };
  
  
  const handleStopTrip = async (item) => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Conductor is not logged in.');
        return;
      }
  
      const conductorUid = currentUser.uid;
  
      // Get current location
      const location = await getLocation();
      if (!location) throw new Error('Failed to retrieve location.');
  
      const { latitude, longitude } = location;
  
      // Retrieve trip data from Firebase
      const tripRef = database().ref(`/trips/temporary/${conductorUid}/${item.key}`);
      const tripSnapshot = await tripRef.once('value');
      if (!tripSnapshot.exists()) {
        Alert.alert('Error', `No active trip found for ${item.username}.`);
        return;
      }
  
      const tripData = tripSnapshot.val();
      const { latitude: startLat, longitude: startLong } = tripData.start_loc;
  
      // Calculate route using Mapbox
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLong},${startLat};${longitude},${latitude}?access_token=${MAPBOX_ACCESS_TOKEN}`;
      const response = await fetch(directionsUrl);
      const routeData = await response.json();
  
      if (!response.ok || !routeData.routes || routeData.routes.length === 0) {
        Alert.alert('Error', 'Failed to calculate route.');
        return;
      }
  
      const distanceMeters = routeData.routes[0].distance;
  
      // Calculate fare
      const baseFareDistanceMeters = 4000; // First 4km
      const baseFare = 15; // Example base fare
      const additionalRatePerMeter = 2 / 1000; // Example rate
      let payment = baseFare;
  
      if (distanceMeters > baseFareDistanceMeters) {
        const extraMeters = distanceMeters - baseFareDistanceMeters;
        payment += extraMeters * additionalRatePerMeter;
      }
  
      payment = parseFloat(payment.toFixed(2));
  
      // Update trip data in Firebase
      await tripRef.update({
        stop_loc: { latitude, longitude },
        distance: parseFloat((distanceMeters / 1000).toFixed(2)),
        payment,
        status: 'completed',
      });
  
      // Update QR code status to disabled
      const qrRef = database().ref(`/temporary/${conductorUid}/${item.key}`);
      await qrRef.update({ status: 'disabled' });
  
      // Get conductor and jeepney information
      const conductorRef = database().ref(`/users/accounts/${conductorUid}`);
      const conductorSnapshot = await conductorRef.once('value');
      const conductorData = conductorSnapshot.val();
  
      if (!conductorData) {
        Alert.alert('Error', 'Conductor account not found.');
        return;
      }
  
      const driverUid = conductorData.creatorUid;
      const driverRef = database().ref(`/users/accounts/${driverUid}`);
      const driverSnapshot = await driverRef.once('value');
      const driverData = driverSnapshot.val();
  
      const jeepneyId = driverData.jeep_assigned;
      const jeepneyRef = database().ref(`/jeepneys/${jeepneyId}`);
      const jeepneySnapshot = await jeepneyRef.once('value');
  
      if (!jeepneySnapshot.exists()) {
        Alert.alert('Error', 'Jeepney not found.');
        return;
      }
  
      // Add one seat back
      let jeepneyData = jeepneySnapshot.val();
      const updatedCapacity = jeepneyData.currentCapacity + 1;
      await jeepneyRef.update({ currentCapacity: updatedCapacity });
  
      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const dailyStatsRef = database().ref(`/jeepneys/${jeepneyId}/dailyStats/${today}`);
      const dailyStatsSnapshot = await dailyStatsRef.once('value');
      const dailyStats = dailyStatsSnapshot.val() || { totalIncome: 0, totalPassengers: 0 };
  
      await dailyStatsRef.update({
        totalIncome: parseFloat((dailyStats.totalIncome + payment).toFixed(2)),
        totalPassengers: dailyStats.totalPassengers + 1,
      });
  
      // Log transaction for the conductor
      const conductorTransactionsRef = database().ref(`/users/accounts/${conductorUid}/transactions`);
      await conductorTransactionsRef.push({
        type: 'trip',
        description: `Received payment for trip QR: ${item.key}`,
        amount: payment,
        distance: parseFloat((distanceMeters / 1000).toFixed(2)),
        createdAt: new Date().toISOString(),
      });
  
      // Update conductor wallet balance
      await conductorRef.update({
        wallet_balance: (conductorData.wallet_balance || 0) + payment,
      });
  
      Alert.alert(
        'Trip Stopped',
        `Trip for ${item.username} completed. Distance: ${(distanceMeters / 1000).toFixed(
          2
        )} km. Payment: ₱${payment.toFixed(2)}. Seats available: ${updatedCapacity}`
      );
    } catch (error) {
      console.error('Error stopping trip:', error);
      Alert.alert('Error', 'Failed to stop the trip.');
    }
  };
  
  
  
  
  
  const renderTripButton = (item) => {
    const isItemInProgress = item.status === 'in-progress'; // Dynamically check the status
  
    return (
      <View style={styles.buttonContainer}>
        {!isItemInProgress && (
          <TouchableOpacity
            style={[styles.tripButton, styles.startButton]}
            onPress={() => handleStartTrip(item)}
          >
            <Text style={styles.buttonText}>Start Trip</Text>
          </TouchableOpacity>
        )}
        {isItemInProgress && (
          <TouchableOpacity
            style={[styles.tripButton, styles.stopButton]}
            onPress={() =>
              Alert.alert(
                'Stop Trip',
                `Are you sure you want to stop the trip for ${item.username}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Yes, Stop', onPress: () => handleStopTrip(item) },
                ]
              )
            }
          >
            <Text style={styles.buttonText}>Stop Trip</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Share</Text>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search by username or type"
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filteredQrList}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <ViewShot options={{ format: 'png', quality: 1 }}>
            <View style={styles.qrCard}>
              <Text style={styles.qrUsername}>Username: {item.username}</Text>
              <Text style={styles.qrType}>Type: {item.type}</Text>
              <QRCode value={item.key || 'N/A'} size={200} logoBackgroundColor="transparent" />
              {renderTripButton(item)}
            </View>
          </ViewShot>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No QR codes found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#F4F4F4' },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  searchBar: {
    margin: 10,
    padding: 10,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: '#F9F9F9',
  },
  qrCard: { padding: 20, backgroundColor: '#CCD9B8', borderRadius: 15, margin: 10, alignItems: 'center' },
  qrUsername: { fontSize: 16, fontWeight: 'bold' },
  qrType: { fontSize: 14, color: '#555' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  tripButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginHorizontal: 5 },
  startButton: { backgroundColor: '#4CAF50' },
  stopButton: { backgroundColor: '#FF4D4D' },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
});

export default DisplayAllQR_Conductor;
