import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView, 
  ScrollView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard,
  Modal
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
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [driverPassword, setDriverPassword] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");



  const handleInputChange = (field, value) => {
    let newErrors = { ...errors };
  
    // **Name Validation (Only Text)**
    if (['firstName', 'middleName', 'lastName'].includes(field)) {
      if (/[^a-zA-Z\s]/.test(value)) {
        newErrors[field] = 'Only letters are allowed.';
      } else {
        delete newErrors[field];
      }
    }
  
    // **Email Validation**
    if (field === 'email') {
      if (value && !/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = 'Invalid email format.';
      } else {
        delete newErrors.email;
      }
    }
  
    // **Phone Number Validation (Numbers Only)**
    if (field === 'phoneNumber') {
      if (value && !/^\d+$/.test(value)) {
        newErrors.phoneNumber = 'Only numbers are allowed.';
      } else {
        delete newErrors.phoneNumber;
      }
    }
  
    // **Password Validation (Only if User Starts Typing)**
    if (field === 'password') {
      if (value && value.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
      } else {
        delete newErrors.password;
      }
    }
  
    // **Confirm Password Validation (Only if User Starts Typing)**
    if (field === 'cpassword') {
      if (value && value !== form.password) {
        newErrors.cpassword = 'Passwords do not match.';
      } else {
        delete newErrors.cpassword;
      }
    }
  
    setErrors(newErrors);
    setForm({ ...form, [field]: value });
  };
  const validateForm = () => {
    let newErrors = {};
    if (!form.firstName) newErrors.firstName = 'First Name cannot be empty.';
    if (!form.lastName) newErrors.lastName = 'Last Name cannot be empty.';
    if (!form.email) newErrors.email = 'Email cannot be empty.';
    if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format.';
    if (!form.phoneNumber) newErrors.phoneNumber = 'Phone Number cannot be empty.';
    if (!/^\d+$/.test(form.phoneNumber)) newErrors.phoneNumber = 'Only numbers allowed.';
    if (!form.password || form.password.length < 6) newErrors.password = 'Min 6 characters.';
    if (form.cpassword !== form.password) newErrors.cpassword = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setPasswordModalVisible(true); // Show password prompt for driver authentication
  };

  const confirmAddConductor = async () => {
    if (!driverPassword) {
      setPasswordError("Password cannot be empty.");
      return;
    }
  
    setPasswordError(""); // Clear previous errors
    setLoading(true);
  
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error("No logged-in driver.");
  
      const driverEmail = currentUser.email;
      const driverUid = currentUser.uid;
      const credential = auth.EmailAuthProvider.credential(driverEmail, driverPassword);
  
      // ✅ **Step 1: Reauthenticate Driver**
      await currentUser.reauthenticateWithCredential(credential);
      console.log("✅ Driver reauthenticated.");
  
      // ✅ **Step 2: Create Conductor in Firebase Authentication**
      const userCredential = await auth().createUserWithEmailAndPassword(form.email, form.password);
      const conductorUid = userCredential.user.uid;
      console.log(`✅ Conductor created: ${conductorUid}`);
  
      // ✅ **Step 3: Store Conductor Data in Firebase Database**
      await database().ref(`/users/accounts/${conductorUid}`).set({
        firstName: form.firstName,
        middleName: form.middleName || '',
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        role: 'conductor',
        wallet_balance: 0,
        creatorUid: driverUid,
        status: 'Inactive',
        timestamp: Date.now(),
      });
      console.log("✅ Conductor saved to database.");
  
      // ✅ **Step 4: Log Out Conductor & Restore Driver Session**
      await auth().signOut();
      await auth().signInWithEmailAndPassword(driverEmail, driverPassword);
      console.log("✅ Driver session restored.");
  
      setPasswordModalVisible(false);
      setSuccessModal(true);
    } catch (error) {
      console.error("❌ Password Error:", error.message);
      setPasswordError("Incorrect password. Please try again."); // Show error inside modal
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add New Conductor</Text>
              <View style={{ width: 24 }} />
            </View>
          <View style={styles.content}>

            {/* Header with Centered Title */}
            <Modal visible={successModal} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Ionicons name="checkmark-circle" size={50} color="green" />
      <Text style={styles.modalTitle}>Success!</Text>
      <Text style={styles.modalMessage}>Conductor account has been created successfully.</Text>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => {
          setSuccessModal(false);
          navigation.navigate('Driver', { screen: 'Profile' });

        }}
      >
        <Text style={styles.modalButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

            <View style={styles.row}>
  <View style={styles.inputContainer}>
    <Text style={styles.label}>First Name</Text>
    <TextInput
      style={[styles.input, errors.firstName && styles.inputError]}
      value={form.firstName}
      onChangeText={(text) => handleInputChange('firstName', text)}
    />
    {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
  </View>

  <View style={styles.inputContainer}>
    <Text style={styles.label}>Middle Name</Text>
    <TextInput
      style={[styles.input, errors.middleName && styles.inputError]}
      value={form.middleName}
      onChangeText={(text) => handleInputChange('middleName', text)}
    />
    {errors.middleName && <Text style={styles.errorText}>{errors.middleName}</Text>}
  </View>

  <View style={styles.inputContainer}>
    <Text style={styles.label}>Last Name</Text>
    <TextInput
      style={[styles.input, errors.lastName && styles.inputError]}
      value={form.lastName}
      onChangeText={(text) => handleInputChange('lastName', text)}
    />
    {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
  </View>
</View>

{/* Email & Phone Number Row */}
<View style={styles.row}>
  <View style={styles.inputContainer}>
    <Text style={styles.label}>Email</Text>
    <TextInput
      style={[styles.input, errors.email && styles.inputError]}
      keyboardType="email-address"
      value={form.email}
      onChangeText={(text) => handleInputChange('email', text)}
    />
    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
  </View>


</View>
 
    <Text style={styles.label}>Phone Number</Text>
    <TextInput
      style={styles.input}
      keyboardType="phone-pad"
      value={form.phoneNumber}
      onChangeText={(text) => handleInputChange('phoneNumber', text)}
    />
 
{/* Password */}
<Text style={styles.label}>Password</Text>
<View style={styles.passwordContainer}>
  <TextInput
    style={styles.passwordInput}
    secureTextEntry={!showPassword}
    value={form.password}
    onChangeText={(text) => handleInputChange('password', text)}
  />
  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
    <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
  </TouchableOpacity>
</View>

{/* Confirm Password */}
<Text style={styles.label}>Confirm Password</Text>
<View style={styles.passwordContainer}>
  <TextInput
    style={styles.passwordInput}
    secureTextEntry={!showConfirmPassword}
    value={form.cpassword}
    onChangeText={(text) => handleInputChange('cpassword', text)}
  />
  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
    <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
  </TouchableOpacity>
</View>
{errors.cpassword && <Text style={styles.errorText}>{errors.cpassword}</Text>}


            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.submitButtonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
            </TouchableOpacity>

          {/* Password Confirmation Modal */}
<Modal
  visible={passwordModalVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setPasswordModalVisible(false)}
>
  <View style={styles.passwordModalOverlay}>
    <View style={styles.passwordModalContainer}>
      <Text style={styles.passwordModalTitle}>Enter Driver Password</Text>

      {/* Password Input */}
      <View style={styles.passwordInputWrapper}>
        <TextInput
          style={[
            styles.passwordInput1,
            passwordError ? styles.passwordInputError : null, // Apply red border on error
          ]}
          placeholder="Enter password"
          placeholderTextColor="#999"
          secureTextEntry
          value={driverPassword}
          onChangeText={(text) => {
            setDriverPassword(text);
            setPasswordError(""); // Clear error when typing
          }}
        />
        
      </View>

      {/* Error Message */}
      {passwordError ? <Text style={styles.passwordErrorText}>{passwordError}</Text> : null}

      {/* Buttons */}
      <View style={styles.passwordButtonContainer}>
        <TouchableOpacity
          style={styles.passwordConfirmButton}
          onPress={confirmAddConductor}
        >
          <Text style={styles.passwordButtonText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.passwordCancelButton}
          onPress={() => {
            setDriverPassword(""); // Reset password input on cancel
            setPasswordModalVisible(false);
          }}
        >
          <Text style={styles.passwordButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>



          </View>


      
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    backgroundColor: '#F5F5F5',
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
    marginTop:20
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
 
  },label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
  }, scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40, // Ensures scrolling when keyboard is up
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 5, // Add spacing between fields
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  passwordModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  passwordModalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  passwordModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  passwordInputWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  passwordInput1: {
    width: '100%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  passwordInputError: {
    borderColor: 'red',
  },
  passwordErrorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  passwordButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  passwordConfirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  passwordCancelButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  passwordButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateConductor;
