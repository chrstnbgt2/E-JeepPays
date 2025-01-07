import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '@react-native-firebase/database';

const JeepDetailScreen = ({ route, navigation }) => {
  const { jeepney } = route.params || {}; // The initial data passed from the map
  const [fullJeepDetails, setFullJeepDetails] = useState(null); // Full details of the jeepney
  const [loading, setLoading] = useState(true); // Loading indicator

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!jeepney || !jeepney.id) {
          console.warn('No jeepney ID provided.');
          setLoading(false);
          return;
        }

        // Fetch driver details from "users/accounts"
        const driverRef = database().ref(`users/accounts/${jeepney.id}`);
        const driverSnapshot = await driverRef.once('value');

        if (driverSnapshot.exists()) {
          const driverData = driverSnapshot.val();
          const jeepAssignedUid = driverData.jeep_assigned; // Get assigned jeepney UID

          // Fetch jeepney details from "jeepneys/{jeepAssignedUid}"
          const jeepneyRef = database().ref(`jeepneys/${jeepAssignedUid}`);
          const jeepneySnapshot = await jeepneyRef.once('value');

          if (jeepneySnapshot.exists()) {
            const jeepneyDetails = jeepneySnapshot.val();

            setFullJeepDetails({
              ...jeepneyDetails,
              driverName: `${driverData.firstName} ${driverData.lastName}`.trim() || 'Unassigned',
            });
          } else {
            console.warn('Jeepney not found.');
          }
        } else {
          console.warn('Driver not found.');
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [jeepney]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color="#000"
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Jeepney Details</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Jeepney Information</Text>

        <View style={styles.imageContainer}>
          <Image source={require('../assets/images/jeep.png')} style={styles.jeepImage} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardContent}>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : fullJeepDetails ? (
              <>
                <View style={styles.detailItem}>
                  <Text style={styles.bold}>Plate No.:</Text>
                  <Text style={styles.detailValue}>{fullJeepDetails.plateNumber || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.bold}>Capacity:</Text>
                  <Text style={styles.detailValue}>{fullJeepDetails.capacity || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.bold}>Available Seat:</Text>
                  <Text style={styles.detailValue}>{fullJeepDetails.currentCapacity || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.bold}>Route:</Text>
                  <Text style={styles.detailValue}>{fullJeepDetails.route || 'N/A'}</Text>
                </View>
              
          
              </>
            ) : (
              <Text style={styles.noDetailsText}>No jeepney details available.</Text>
            )}
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  jeepImage: { width: 200, height: 100, resizeMode: 'contain' },
  card: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 15 },
  cardContent: { paddingTop: 10 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bold: { fontWeight: 'bold' },
  detailValue: { color: '#555' },
  noDetailsText: { textAlign: 'center', color: '#888' },
  button: { backgroundColor: '#00695C', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default JeepDetailScreen;
