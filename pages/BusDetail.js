import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const CheckSeatScreen = () => {
  const navigation = useNavigation();
  const [jeepDetails, setJeepDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJeepDetails = async () => {
      try {
        setLoading(true);

        // Get the current user's UID
        const currentUser = auth().currentUser;
        if (!currentUser) {
          console.error('No user is logged in');
          setLoading(false);
          return;
        }

        const uid = currentUser.uid;

         const jeepneysRef = database().ref('jeepneys');
        const snapshot = await jeepneysRef.orderByChild('driver').equalTo(uid).once('value');

        if (snapshot.exists()) {
           const jeepData = Object.values(snapshot.val())[0];
          setJeepDetails(jeepData);
        } else {
          console.warn('No jeepney assigned to this driver');
        }
      } catch (error) {
        console.error('Error fetching jeepney details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJeepDetails();
  }, []);

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
        <Text style={styles.headerTitle}>Check Seat</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Jeep Details</Text>

        {/* Jeep Image */}
        <View style={styles.imageContainer}>
          <Image source={require('../assets/images/bus.png')} style={styles.jeepImage} />
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader} />
          <View style={styles.cardContent}>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : jeepDetails ? (
              <>
                <View style={styles.detailItem}>
                  <Text style={styles.bold}>Jeep No.:</Text>
                  <Text style={styles.detailValue}>{jeepDetails.plateNumber || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.bold}>Capacity:</Text>
                  <Text style={styles.detailValue}>{jeepDetails.capacity || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.bold}>Available Seat:</Text>
                  <Text style={styles.detailValue}>{jeepDetails.currentCapacity || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.bold}>Route:</Text>
                  <Text style={styles.detailValue}>{jeepDetails.route || 'N/A'}</Text>
                </View>
             
              </>
            ) : (
              <Text style={styles.noDetailsText}>No jeepney details available.</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  jeepImage: {
    width: 250,
    height: 200,
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: '#F4F4F4',
    borderRadius: 15,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#CCD9B8',
    height: 50,
  },
  cardContent: {
    padding: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',  
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    paddingVertical: 15,
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#000',
    flex: 1,
  },
  detailValue: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    flex: 1,  
  },
  noDetailsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default CheckSeatScreen;
