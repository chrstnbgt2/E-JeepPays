import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth'; // Import Firebase Auth
import database from '@react-native-firebase/database'; // Import Firebase Database

const CreateConductor = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    cpassword: '',
  });

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    const {
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      password,
      cpassword,
    } = form;

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      Alert.alert('Error', 'All fields except middle name are required!');
      return;
    }

    // Check if passwords match
    if (password !== cpassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    try {
      // Get the current logged-in user's UID
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to create a conductor.');
        return;
      }
      const creatorUid = currentUser.uid;

      // Generate a unique key for the conductor
      const newConductorRef = database().ref('users/accounts').push();
      const userId = newConductorRef.key;

      // Save conductor data in the Realtime Database
      await newConductorRef.set({
        firstName,
        middleName,
        lastName,
        email,
        phoneNumber,
        role: 'conductor',
        wallet_balance: 0, // Default wallet balance
        creatorUid, // Add creator's UID
        status:'Active',
        timestamp: Date.now(),
      });

      Alert.alert('Success', 'Conductor account created successfully!');
      navigation.goBack(); // Navigate back to the previous screen
    } catch (error) {
      console.error('Error creating conductor account:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Conductor</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Create an account</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#999"
          value={form.firstName}
          onChangeText={(text) => handleInputChange('firstName', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Middle Name (Optional)"
          placeholderTextColor="#999"
          value={form.middleName}
          onChangeText={(text) => handleInputChange('middleName', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#999"
          value={form.lastName}
          onChangeText={(text) => handleInputChange('lastName', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(text) => handleInputChange('email', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={form.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={form.password}
          onChangeText={(text) => handleInputChange('password', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={form.cpassword}
          onChangeText={(text) => handleInputChange('cpassword', text)}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateConductor;
