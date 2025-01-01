import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth'; // Import Firebase Auth

const ProfileScreen = () => {
  const navigation = useNavigation();

  // Logout function
  const handleLogout = async () => {
    try {
      await auth().signOut(); // Sign the user out
      console.log('User signed out');
      // Navigate to the login screen after logout
      navigation.navigate('Login');  
    } catch (error) {
      console.error('Error signing out:', error); // Handle sign-out errors
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuItem}>
        <Ionicons name="person-circle-outline" size={24} color="#000" />
        <Text style={styles.menuText}>Account Information</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" />
      </View>
      <View style={styles.menuItem}>
        <MaterialCommunity name="brightness-percent" size={24} color="#000" />
        <Text style={styles.menuText}>Discount</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" onPress={() => navigation.navigate('Discount')} />
      </View>
      <View style={styles.menuItem}>
        <Ionicons name="pricetags-outline" size={24} color="#000" />
        <Text style={styles.menuText}>Terms and Conditions</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" />
      </View>

      <View style={styles.menuItem}>
        <Ionicons name="settings-outline" size={24} color="#000" />
        <Text style={styles.menuText}>Settings</Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" />
      </View>

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
});

export default ProfileScreen;
