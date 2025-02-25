import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const EditConductor = ({ route }) => {
  const navigation = useNavigation();
  const { account } = route.params;

  const [form, setForm] = useState({
    firstName: account.firstName || '',
    middleName: account.middleName || '',
    lastName: account.lastName || '',
    email: account.email || '',
    phoneNumber: account.phoneNumber || '',
    password: '', 
  });

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  // const handleSave = async () => {
  //   if (!form.firstName || !form.lastName || !form.email || !form.phoneNumber) {
  //     alert('Please fill in all required fields.');
  //     return;
  //   }
  
  //   try {
  //     const updates = {
  //       firstName: form.firstName,
  //       middleName: form.middleName,
  //       lastName: form.lastName,
  //       email: form.email,
  //       phoneNumber: form.phoneNumber,
  //     };
  
  //     // If a new password is provided, update it in Firebase Auth
  //     if (form.password.trim()) {
  //       const user = await auth().currentUser;
  //       await user.updatePassword(form.password);
  //       console.log('Password updated successfully.');
  //     }
  
  //     // Update the user's details in the Firebase Realtime Database
  //     await database().ref(`users/accounts/${account.id}`).update(updates);
  //     console.log('Account details updated successfully.');
  
  //     // Update the local state to reflect the latest changes
  //     setForm((prevState) => ({
  //       ...prevState,
  //       ...updates,
  //     }));
  
  //     setSuccessModalVisible(true);
  //   } catch (error) {
  //     console.error('Error updating account:', error);
  //     alert('Failed to update account. Please try again.');
  //   }
  // };
  
  const handleDelete = async () => {
    try {
      await database().ref(`users/accounts/${account.id}`).update({
        creatorUid:"unassigned", // Set to null
        status:"Inactive"
      });
  
      Alert.alert('Success', 'Conductor removed successfully.');
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating creatorUid:', error);
      Alert.alert('Error', 'Failed to remove  Conductor. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Conductor</Text>
      </View>
  
      {/* Form Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>View Information</Text>
  
        {/* First Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={form.firstName}
            readOnly
            onChangeText={(text) => handleInputChange('firstName', text)}
          />
        </View>
  
        {/* Middle Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Middle Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={form.middleName}
            readOnly
            onChangeText={(text) => handleInputChange('middleName', text)}
          />
        </View>
  
        {/* Last Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={form.lastName}
            readOnly
            onChangeText={(text) => handleInputChange('lastName', text)}
          />
        </View>
  
        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            value={form.email}
            readOnly
            onChangeText={(text) => handleInputChange('email', text)}
          />
        </View>
  
        {/* Phone Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={form.phoneNumber}
            readOnly
            onChangeText={(text) => handleInputChange('phoneNumber', text)}
          />
        </View>
  
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={styles.deleteButtonText}>Remove Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
  
      {/* Delete Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Are you sure you want to remove this account?
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleDelete}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  
      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Successfully Updated</Text>
            <TouchableOpacity
              style={styles.modalButton2}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.replace('ConductorList');
              }}
            >
              <Text style={styles.modalButtonText2}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF5252',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },

  modalButton2: {
 
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: '#FF5252',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    
  },
  modalButtonText2: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    padding:5,
 
  }, inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9', // Light gray background for read-only effect
  },
});

export default EditConductor;
