import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import {launchImageLibrary} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

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
    phoneNumber: '',
    email: '',
  });

  const [userRole, setUserRole] = useState('');
  const [uploading, setUploading] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseUri, setLicenseUri] = useState(null);

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

        userRef.on('value', snapshot => {
          if (snapshot.exists()) {
            const userData = snapshot.val();

            // Set role in state
            setUserRole(userData.role || '');

            setFormData({
              firstName: userData.firstName || '',
              middleName: userData.middleName || '',
              lastName: userData.lastName || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              zip: userData.zip ? String(userData.zip) : '',
              phoneNumber: userData.phoneNumber
                ? String(userData.phoneNumber)
                : '',
              email: userData.email || '',
            });

            setSelectedGender(userData.gender || '');
            setBirthDate(
              userData.birthDate ? new Date(userData.birthDate) : new Date(),
            );

            console.log('✅ Form Data Updated:', {
              firstName: userData.firstName || '',
              middleName: userData.middleName || '',
              lastName: userData.lastName || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              zip: userData.zip ? String(userData.zip) : '',
              phoneNumber: userData.phoneNumber
                ? String(userData.phoneNumber)
                : '',
              email: userData.email || '',
              gender: userData.gender || '',
              birthDate: userData.birthDate
                ? new Date(userData.birthDate)
                : new Date(),
              role: userData.role || '',
            });

            // Handle multi-role logic
            if (userData.role === 'driver') {
              console.log('🚗 User is an Driver');
            } else if (userData.role === 'conductor') {
              console.log(' User is a conductor');
            } else if (userData.role === 'user') {
              console.log('🚌 User is a Passenger');
            } else {
              console.log('🔹 User role not specified');
            }
          } else {
            console.log('⚠️ No user data found in Firebase.');
          }
        });

        userRef.on('value', snapshot => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserRole(userData.role || ''); // Store user role

            // Load existing license image if available
            if (userData.licenseUrl) {
              setLicenseUri(userData.licenseUrl || null);
              setLicenseStatus(userData.licenseStatus || null);
            }
          } else {
            console.log('⚠️ No user data found in Firebase.');
          }
        });
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
        Alert.alert('Error', 'Failed to fetch user data. Please try again.');
      }
    };

    fetchUserData();

    return () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        database().ref(`users/accounts/${currentUser.uid}`).off();
      }
    };
  }, []);

  // 🔹 Sanitize input to prevent invalid characters
  const sanitizeInput = value => {
    return value.replace(/[<>"'/]/g, ''); // Remove potentially malicious characters
  };

  // 🔹 Update form data in real-time and save to Firebase
  const handleInputChange = (field, value) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prevData => ({
      ...prevData,
      [field]: sanitizedValue,
    }));
  };

  const onDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      setBirthDate(selectedDate);

      // Save birth date to Firebase
      const currentUser = auth().currentUser;
      if (currentUser) {
        const uid = currentUser.uid;
        database().ref(`users/accounts/${uid}`).update({
          birthDate: selectedDate.toISOString(),
        });
      }
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
      phoneNumber,
      email,
    } = formData;

    if (
      !firstName ||
      !lastName ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !phoneNumber ||
      !email ||
      !selectedGender
    ) {
      Alert.alert('Warning', 'Please fill out all required fields.');
      return;
    }

    if (isNaN(zip)) {
      Alert.alert('Warning', 'ZIP/Postal Code must be a numeric value.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Warning', 'Please enter a valid email address.');
      return;
    }

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Warning', 'You must be logged in to update your account.');
        return;
      }

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
        phoneNumber,
        email,
      });

      Alert.alert('Success', 'Your account has been updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating account:', error);
      Alert.alert('Error', 'Failed to update your account. Please try again.');
    }
  };

  const handleLicenseUpload = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    console.log('📸 Selecting image...');

    launchImageLibrary({mediaType: 'photo'}, async response => {
      if (response.didCancel) return;
      if (!response.assets || response.assets.length === 0) return;

      const image = response.assets[0];
      console.log('📸 Image selected:', image.uri);

      // ✅ Ensure the upload path matches the Firebase rules
      const imageRef = storage().ref(
        `driver_licenses/${currentUser.uid}/license.jpg`,
      );

      try {
        setUploading(true);
        console.log('🚀 Uploading file to Firebase...');

        await imageRef.putFile(image.uri);
        console.log('✅ File uploaded successfully!');

        const downloadURL = await imageRef.getDownloadURL();
        console.log('🔗 Download URL:', downloadURL);

        await database().ref(`users/accounts/${currentUser.uid}`).update({
          licenseUrl: downloadURL,
          licenseStatus: 'pending', // Reset status after upload
        });

        setLicenseUri(downloadURL);
        setLicenseStatus('pending');
        Alert.alert(
          'Success',
          'Driver’s License uploaded successfully! Waiting for approval.',
        );
      } catch (error) {
        console.error('❌ License Upload Error:', error);
        Alert.alert(
          'Error',
          `Failed to upload driver’s license: ${error.message}`,
        );
      } finally {
        setUploading(false);
      }
    });
  };

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
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.note}>
            <Text style={styles.noteTitle}>Note:</Text> Please fill out all
            required fields.
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
              onChangeText={text => handleInputChange('firstName', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter middle name"
              placeholderTextColor="#000"
              value={formData.middleName}
              onChangeText={text => handleInputChange('middleName', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter last name"
              placeholderTextColor="#000"
              value={formData.lastName}
              onChangeText={text => handleInputChange('lastName', text)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedGender}
                onValueChange={itemValue => setSelectedGender(itemValue)}
                style={styles.picker}>
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
              onPress={() => setDatePickerVisible(true)}>
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
                minimumDate={new Date(1900, 0, 1)}
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
            onChangeText={text => handleInputChange('address', text)}
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
              onChangeText={text => handleInputChange('city', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State/Province</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter state/province"
              placeholderTextColor="#000"
              value={formData.state}
              onChangeText={text => handleInputChange('state', text)}
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
              keyboardType="phone-pad"
              value={formData.zip}
              onChangeText={text => handleInputChange('zip', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#000"
              keyboardType="phone-pad"
              value={formData.phoneNumber}
              onChangeText={text => handleInputChange('phoneNumber', text)}
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
            onChangeText={text => handleInputChange('email', text)}
            readOnly
          />
        </View>
        <View style={styles.container}>
          {/* Driver's License Upload Section (Only for Drivers) */}
          {userRole === 'driver' && (
            <View style={styles.uploadContainer}>
              <Text style={styles.label}>Driver’s License</Text>

              <View style={styles.uploadRow}>
                {/* License Image Preview */}
                <Image
                  source={licenseUri ? {uri: licenseUri} : ''}
                  style={styles.licensePreview}
                />

                {/* Upload Button - Only if Status is Null or Rejected */}
                {(licenseStatus === null || licenseStatus === 'rejected') && (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleLicenseUpload}
                    disabled={uploading}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={24}
                      color="white"
                    />
                    <Text style={styles.uploadButtonText}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Message */}
              {licenseStatus === 'pending' && (
                <Text style={styles.pendingText}>
                  ⏳ License Pending Approval
                </Text>
              )}
              {licenseStatus === 'rejected' && (
                <Text style={styles.rejectedText}>
                  ❌ License Rejected. Please re-upload.
                </Text>
              )}
              {licenseStatus === 'approved' && (
                <Text style={styles.approvedText}>✅ License Approved</Text>
              )}
            </View>
          )}
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

  uploadContainer: {
    width: '100%',
  },
  label: {fontSize: 16, fontWeight: 'bold', marginBottom: 5},
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: '100%',
  },
  licensePreview: {
    width: 100,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#466B66',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#466B66',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  pendingText: {
    marginTop: 10,
    color: 'orange',
    fontWeight: 'bold',
  },
  rejectedText: {
    marginTop: 10,
    color: 'red',
    fontWeight: 'bold',
  },
  approvedText: {
    marginTop: 10,
    color: 'green',
    fontWeight: 'bold',
  },
});

export default AccountScreen;
