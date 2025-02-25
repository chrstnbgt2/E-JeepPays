import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import DateTimePicker from '@react-native-community/datetimepicker';

const AccountScreen = () => {
  const navigation = useNavigation();
  const [selectedGender, setSelectedGender] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          Alert.alert('Error', 'You must be logged in to access your account.');
          return;
        }

        const uid = currentUser.uid;
        const userRef = database().ref(`users/accounts/${uid}`);

        userRef.once('value').then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setFormData({
              firstName: userData.firstName || '',
              middleName: userData.middleName || '',
              lastName: userData.lastName || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              zip: userData.zip || '',
              phone: userData.phoneNumber || '',
              email: userData.email || '',
            });
            setSelectedGender(userData.gender || '');
            setBirthDate(userData.birthDate ? new Date(userData.birthDate) : new Date());
          }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to fetch user data. Please try again.');
      }
    };

    fetchUserData();
  }, []);

  const sanitizeInput = (value) => {
    return value.replace(/[<>"'/]/g, ''); // Remove potentially malicious characters
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: sanitizeInput(value) });
  };

  const onDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    const {
      firstName,
      middleName,
      lastName,
      address,
      city,
      state,
      zip,
      phone,
      email,
    } = formData;

    if (!firstName || !lastName || !address || !city || !state || !zip || !phone || !email || !selectedGender) {
      Alert.alert('Error', 'Please fill out all required fields.');
      return;
    }

    if (isNaN(zip)) {
      Alert.alert('Error', 'ZIP/Postal Code must be a numeric value.');
      return;
    }

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to update your account.');
        return;
      }

      // Save updated account data to Firebase Realtime Database
      const uid = currentUser.uid;
      const userRef = database().ref(`users/accounts/${uid}`);
      await userRef.update({
        firstName,
        middleName,
        lastName,
        gender: selectedGender,
        birthDate: birthDate.toISOString(),
        address,
        city,
        state,
        zip,
        phone,
        email,
      });

      Alert.alert('Success', 'Your account has been updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating account:', error);
      Alert.alert('Error', 'Failed to update your account. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" style={styles.backIcon} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.note}>
            <Text style={styles.noteTitle}>Note:</Text> Please fill out all required fields.
          </Text>
        </View>

        {/* Form Title */}
        <Text style={styles.formTitle}>Personal Information</Text>

        {/* Form Fields */}
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter first name"
              placeholderTextColor="#000"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter middle name"
              placeholderTextColor="#000"
              value={formData.middleName}
              onChangeText={(text) => handleInputChange('middleName', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter last name"
              placeholderTextColor="#000"
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedGender}
                onValueChange={(itemValue) => setSelectedGender(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setDatePickerVisible(true)}
            >
              <Text style={styles.dateText}>
                {birthDate.toLocaleDateString('en-US')}
              </Text>
            </TouchableOpacity>
            {isDatePickerVisible && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}  
              />
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="Enter address"
            placeholderTextColor="#000"
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter City"
              placeholderTextColor="#000"
              value={formData.city}
              onChangeText={(text) => handleInputChange('city', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State/Province</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter state/province"
              placeholderTextColor="#000"
              value={formData.state}
              onChangeText={(text) => handleInputChange('state', text)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP/Postal Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ZIP code"
              placeholderTextColor="#000"
              keyboardType="numeric"
              value={formData.zip}
              onChangeText={(text) => handleInputChange('zip', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#000"
              keyboardType="numeric"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="Enter email"
            placeholderTextColor="#000"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Update</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  noteContainer: {
    marginVertical: 10,
  },
  note: {
    fontSize: 14,
    color: '#74A059',
  },
  noteTitle: {
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#74A059',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: '#74A059',
  },
  inputFull: {
    width: '100%',
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#74A059',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#74A059',
    borderRadius: 8,
    marginBottom: 10,
  },
  picker: {
    color: '#000',
  },
  datePickerButton: {
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#74A059',
    borderRadius: 8,
    padding: 10,
  },
  dateText: {
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#466B66',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AccountScreen;
