import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const RegisterScreen2 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, middleName, lastName } = route.params;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Sanitize input to remove harmful characters
  const sanitizeInput = (input) => input.replace(/[<>]/g, '');

  // Validate user inputs
  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/; // Adjust for your region
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert(
        'Invalid Phone Number',
        'Phone number must contain only digits and be between 10 and 15 characters long.'
      );
      return false;
    }

    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters long and include at least 1 uppercase letter, 1 number, and 1 special character.'
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !phoneNumber || !email || !password) {
      Alert.alert('Error', 'All fields are required except Middle Name.');
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      // Create the user with Firebase Authentication
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      // Save additional user data to Realtime Database
      const userId = userCredential.user.uid;

      await database().ref(`/users/accounts/${userId}`).set({
        firstName: sanitizeInput(firstName),
        middleName: sanitizeInput(middleName || ''),
        lastName: sanitizeInput(lastName),
        phoneNumber: sanitizeInput(phoneNumber),
        email: sanitizeInput(email),
        role: 'user', // Defined role
        wallet_balance: 0, // Initial wallet balance
        acc_type:'Regular',
        createdAt: new Date().toISOString(), // Save timestamp
      });

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Login');
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          Alert.alert(
            'Email Already in Use',
            'The email address is already registered. Please log in or use a different email.'
          );
          break;
        case 'auth/invalid-email':
          Alert.alert('Invalid Email', 'The email address is invalid. Please try again.');
          break;
        case 'auth/weak-password':
          Alert.alert('Weak Password', 'Password must be at least 6 characters.');
          break;
        default:
          console.error('Error during registration:', error);
          Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Curve */}
        <Image
          source={require('../assets/images/top-curve.png')}
          style={styles.topCurve}
          resizeMode="cover"
        />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
            />
            <Text style={styles.title}>REGISTER</Text>
          </View>

          {/* Input Fields */}
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#9FA5AA"
            style={styles.input}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9FA5AA"
            style={styles.input}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9FA5AA"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              Login
            </Text>
          </Text>
        </View>

        {/* Bottom Curve */}
        <Image
          source={require('../assets/images/bot-curve.png')}
          style={styles.bottomCurve}
          resizeMode="cover"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#466B66',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  topCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  bottomCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 150,
    marginBottom: 150,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: '#8FCB81',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 14,
  },
  loginLink: {
    color: '#8FCB81',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen2;
