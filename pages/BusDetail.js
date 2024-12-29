import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const CheckSeatScreen = () => {
     const navigation =useNavigation();

  return (
    
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" style={styles.backIcon} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Check Seat</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Jeep Details</Text>

        {/* Jeep Image */}
        <View style={styles.imageContainer}>
          <Image
           source={require('../assets/images/bus.png')}
            style={styles.jeepImage}
          />
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader} />
          <View style={styles.cardContent}>
            <Text style={styles.detailText}>
              <Text style={styles.bold}>Jeep No.:</Text> __________
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.bold}>Capacity:</Text> __________
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.bold}>Availability:</Text> __________
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem}>
                      <Ionicons name="home" size={24} color="#FFFFFF" onPress={() => navigation.navigate('Home')}/>
                      <Text style={styles.navText}>Home</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.navItem}   onPress={() => navigation.navigate('Tracker')}>
                      <Ionicons name="location-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.navText}>Tracker</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('MyQR')}>
                      <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.navText}>My QR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('History')}>
                      <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.navText}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                      <Ionicons name="person-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.navText}>Profile</Text>
                    </TouchableOpacity>
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
  detailText: {
    fontSize: 24,
    marginBottom: 10,
    color: '#000',
  },
  bold: {
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
  navText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
});

export default CheckSeatScreen;
