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
import DocumentPicker from 'react-native-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import RNFS from 'react-native-fs';

const DiscountScreen = () => {
  const navigation = useNavigation();
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [birthDate, setBirthDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);  

  
  
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

  useEffect(() => {
    const fetchSubmissionStatus = () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          Alert.alert('Error', 'You must be logged in to access this feature.');
          navigation.goBack();
          return;
        }
  
        const uid = currentUser.uid;
        const userRequestsRef = database().ref(`discountRequests/${uid}`);
  
        // Real-time listener for status updates
        const onValueChange = userRequestsRef.on('value', (snapshot) => {
          if (snapshot.exists()) {
            const submissions = snapshot.val();
            let latestSubmission = null;
  
            // Determine the latest submission by comparing timestamps
            Object.values(submissions).forEach((submission) => {
              if (
                !latestSubmission || // First record
                (submission.timestamp && submission.timestamp > latestSubmission.timestamp)
              ) {
                latestSubmission = submission;
              }
            });
  
            setStatus(latestSubmission?.status || 'No Submission');
          } else {
            setStatus('No Submission');
          }
          setIsLoading(false);
        });
  
        // Cleanup listener on component unmount
        return () => userRequestsRef.off('value', onValueChange);
      } catch (error) {
        console.error('Error fetching submission status:', error);
        Alert.alert('Error', 'Failed to fetch submission status. Please try again.');
        setIsLoading(false);
      }
    };
  
    fetchSubmissionStatus();
  }, [navigation]);
  

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          Alert.alert('Error', 'You must be logged in to access this feature.');
          navigation.goBack();
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
              phoneNumber: userData.phoneNumber || '',
              email: userData.email || '',
            });
            setSelectedGender(userData.gender || '');
            setBirthDate(userData.birthDate ? new Date(userData.birthDate) : new Date());
  
            // Check if required fields are missing
            const missingFields = [
              !userData.gender && 'Gender',
              !userData.birthDate && 'Birth Date',
              !userData.address && 'Address',
              !userData.city && 'City',
              !userData.state && 'State',
              !userData.zip && 'ZIP Code',
            ].filter(Boolean);
  
            if (missingFields.length > 0) {
              Alert.alert(
                'Incomplete Account Information',
                `The following fields are missing: ${missingFields.join(', ')}. You need to update your account information before applying for a discount.`,
                [
                  {
                    text: 'Update Now',
                    onPress: () => navigation.replace('AccountInformation'), // Force redirect
                  },
                ],
                { cancelable: false } // Prevent dismissal
              );
            }
          } else {
            // If no user data exists, redirect immediately
            Alert.alert(
              'Account Information Missing',
              'Please complete your account information before proceeding.',
              [
                {
                  text: 'Update Now',
                  onPress: () => navigation.replace('AccountInformation'), // Force redirect
                },
              ],
              { cancelable: false } // Prevent dismissal
            );
          }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to fetch user data. Please try again.');
      }
    };
  
    fetchUserData();
  }, [navigation]);
  

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleBrowseFiles = async () => {
    try {
      const file = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      setSelectedFile(file[0]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        Alert.alert('File selection was canceled.');
      } else {
        Alert.alert('Error:', err.message);
      }
    }
  };



  const handleResubmit = () => {
    setStatus('No Submission');
  };

  const onDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };
 

  const uploadFileToStorage = async (file) => {
    try {
      const tempFilePath = `${RNFS.TemporaryDirectoryPath}/${file.name}`;
      const fileContent = await RNFS.readFile(file.uri, 'base64');
      await RNFS.writeFile(tempFilePath, fileContent, 'base64');

      const currentUser = auth().currentUser;
      const uid = currentUser?.uid;
      const filePath = `discountRequests/${uid}/${file.name}`;
      const reference = storage().ref(filePath);
      await reference.putFile(tempFilePath);

      const fileUrl = await reference.getDownloadURL();
      await RNFS.unlink(tempFilePath);

      return fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
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

    if (!firstName || !lastName || !address || !city || !state || !zip || !phoneNumber || !email || !selectedGender || !selectedFile) {
      Alert.alert('Error', 'Please fill out all required fields and upload a file.');
      return;
    }
    setIsSubmitting(true);  

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to submit the form.');
        return;
      }
      console.log("Current user:", auth().currentUser);

      const fileUrl = await uploadFileToStorage(selectedFile);

      const uid = currentUser.uid;
      const discountRef = database().ref(`discountRequests/${uid}`).push();
      await discountRef.set({
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
        fileUrl,
        status: 'Pending',
        timestamp: Date.now(),
      });

      await database().ref('/notification_web').push().set({
        fullname: `${firstName} ${lastName}`,
        status: 'unread',
        message: `Passenger ${firstName} ${lastName} Request for a discount.`,
        timestamp: new Date().toISOString(),
      });


      Alert.alert('Success', 'Your discount form has been submitted successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting discount form:', error);
      Alert.alert('Error', 'Failed to submit the form. Please try again.');
    } finally {
      setIsSubmitting(false); 
  }
  };

  if (isLoading) {
    return (
      <View style={styles.container1}>
        <Text style={styles.message}>Loading...</Text>
      </View>
    );
  }

  
  if (status === 'Pending') {
    return (
      <>
          <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" style={styles.backIcon}  />
        <Text style={styles.headerTitle1}>Go Back</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.container1}>
 

        <View style={styles.statusCard}>
          <Ionicons name="hourglass" size={50} color="#F5A623" />
          <Text style={styles.statusTitle}>We are processing your request.</Text>
          <Text style={styles.statusDescription}>
            Please wait for approval. We will notify you once your application is reviewed.
          </Text>
        </View>
      </View>
</>
    );
  }

  if (status === 'Approved') {
    return (
      <>
         <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" style={styles.backIcon}  />
        <Text style={styles.headerTitle1}>Go Back</Text>
        </TouchableOpacity>
      </View>
      
    
      <View style={styles.container1}>
   

        <View style={[styles.statusCard, { borderColor: '#4CAF50' }]}>
          <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
          <Text style={styles.statusTitle}>Your application has been approved!</Text>
          <Text style={styles.statusDescription}>
            You can now enjoy the benefits of your discount.
          </Text>
        </View>
      </View>

      </>
    );
  }

  if (status === 'Rejected') {
    return (
      <View style={styles.container1}>
        <View style={[styles.statusCard, { borderColor: '#F44336' }]}>
          <Ionicons name="close-circle" size={50} color="#F44336" />
          <Text style={styles.statusTitle}>Sorry, your application was rejected.</Text>
          <Text style={styles.statusDescription}>
            Unfortunately, your application did not meet the requirements.
          </Text>
          <TouchableOpacity style={styles.resubmitButton} onPress={handleResubmit}>
            <Text style={styles.resubmitButtonText}>Resubmit Application</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" style={styles.backIcon} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Discount Application</Text>
      </View>

     
    
      <ScrollView contentContainerStyle={styles.scrollContainer}>
    <View style={styles.noteContainer}>
        <Text style={styles.note}>
            <Text style={styles.noteTitle}>Note:</Text> The fields are pre-filled and read-only. Only file upload is allowed.
        </Text>
    </View>

    <Text style={styles.formTitle}>Personal Information</Text>

    <View style={styles.row}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor="#000"
                value={formData.firstName}
                editable={false} // Makes the input read-only
            />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter middle name"
                placeholderTextColor="#000"
                value={formData.middleName}
                editable={false}
            />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor="#000"
                value={formData.lastName}
                editable={false}
            />
        </View>
    </View>

    <View style={styles.row}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedGender}
                    enabled={false} // Makes the dropdown read-only
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
            <TouchableOpacity style={styles.datePickerButton} disabled>
                <Text style={styles.dateText}>
                    {birthDate.toLocaleDateString('en-US')}
                </Text>
            </TouchableOpacity>
        </View>
    </View>

    <View style={styles.inputGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
            style={styles.inputFull}
            placeholder="Enter address"
            placeholderTextColor="#000"
            value={formData.address}
            editable={false}
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
                editable={false}
            />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>State/Province</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter state/province"
                placeholderTextColor="#000"
                value={formData.state}
                editable={false}
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
                value={formData.zip}
                editable={false}
            />
        </View>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#000"
                value={formData.phoneNumber}
                editable={false}
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
            editable={false}
        />
    </View>

    <View style={styles.fileUpload}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload (Student ID/Senior Citizen ID/PWD ID)</Text>
            <View style={styles.fileInputContainer}>
                <TextInput
                    style={[styles.inputFull, styles.uploadInput]}
                    placeholder={selectedFile ? selectedFile.name : 'Choose file'}
                    editable={false}
                    placeholderTextColor="#000"
                />
                <TouchableOpacity style={styles.browseButton} onPress={handleBrowseFiles}>
                    <Text style={styles.browseButtonText}>Browse Files</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
    <TouchableOpacity
    style={[
        styles.submitButton,
        isSubmitting && styles.submitButtonDisabled, // Apply a disabled style if submitting
    ]}
    onPress={handleSubmit}
    disabled={isSubmitting} // Disable button when submitting
>
    {isSubmitting ? (
        <Text style={styles.submitButtonText}>Submitting...</Text> // Show loading text
    ) : (
        <Text style={styles.submitButtonText}>Submit</Text>
    )}
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
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    marginRight: 10,
  },
  header1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
 
  headerTitle1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop:-26,
    marginLeft:30
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft:10
 
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
  fileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadInput: {
    flex: 1,
    marginRight: 10,
  },
  browseButton: {
    backgroundColor: '#74A059',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
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
  },messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  resubmitButton: {
    backgroundColor: '#466B66',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resubmitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },  statusCard: {
    width: '90%',
    padding: 20,
    borderWidth: 2,
    borderColor: '#F5A623',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
    textAlign: 'center',
  }, statusDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  }, loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },    container1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default DiscountScreen;
