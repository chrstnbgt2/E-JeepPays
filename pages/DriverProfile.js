import { useNavigation } from '@react-navigation/native';
import React, { useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext'; 
import { DriverLocationContext } from '../context/DriverLocationContext';

import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const ProfileScreenDriver = () => {
  const navigation = useNavigation();
   const { logOut } = useContext(AuthContext);  
   const { stopLocationTracking } = useContext(DriverLocationContext);
    // Logout function
    const handleLogout = async () => {
      try {
        const driverUid = auth().currentUser?.uid;
  
        if (driverUid) {
          // Remove driver's location from Firebase
          await database().ref(`jeep_loc/${driverUid}`).remove();
        }
  
        // Stop location tracking
        stopLocationTracking();
  
        await logOut();
        Alert.alert('Success', 'You have been logged out.');
        navigation.navigate('Login');
      } catch (error) {
        console.error('Error signing out:', error);
        Alert.alert('Error', 'An error occurred while signing out.');
      }
    };
  
    
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {/* Menu Items */}
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AccountInformation')}>
        <Ionicons name="person-circle-outline" size={24} color="#000" />
        <Text style={styles.menuText}>Account Information</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ConductorList')} >
        <MaterialCommunity name="account" size={24} color="#000" />
        <Text style={styles.menuText}>My Conductor</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="pricetags-outline" size={24} color="#000" />
        <Text style={styles.menuText}>Terms and Conditions</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="settings-outline" size={24} color="#000" />
        <Text style={styles.menuText}>Settings</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" />
      </TouchableOpacity>

      {/* Logout Button */}
         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
             <Text style={styles.logoutText}>Log out</Text>
         </TouchableOpacity>

   
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F4F4F4',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 5,
  },
  menuText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  logoutButton: {
    backgroundColor: '#74A059',
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 80,  
    alignItems: 'center',
    position: 'absolute', 
    bottom: 40,  
    left: 20,  
    right: 20,  
  },
  
  logoutText: {
    color: '#FFF',
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
    marginTop: 'auto',
  },
  navItem: {
    alignItems: 'center',
  },
  activeNavItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
  activeNavText: {
    fontSize: 12,
    color: '#8FCB81',
    marginTop: 5,
    fontWeight: 'bold',
  },
});

export default ProfileScreenDriver;
