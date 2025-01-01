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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleNext = () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'First and Last Name are required.');
      return;
    }
    navigation.navigate('Next', { firstName, middleName, lastName });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Curve */}
        <Image
          source={require('../assets/images/top-curve.png')} // Replace with your actual top curve image path
          style={styles.topCurve}
          resizeMode="cover"
        />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')} // Replace with your logo path
              style={styles.logo}
            />
            <Text style={styles.title}>REGISTER</Text>
          </View>

          {/* Input Fields */}
          <TextInput
            placeholder="First Name"
            placeholderTextColor="#9FA5AA"
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            placeholder="Middle Name (Optional)"
            placeholderTextColor="#9FA5AA"
            style={styles.input}
            value={middleName}
            onChangeText={setMiddleName}
          />
          <TextInput
            placeholder="Last Name"
            placeholderTextColor="#9FA5AA"
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
          />

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
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
          source={require('../assets/images/bot-curve.png')} // Replace with your actual bottom curve image path
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
    backgroundColor: '#466B66', // Background color for the screen
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
    height: 120, // Adjust this to match the height of your top PNG
    zIndex: 1,
  },
  bottomCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // Adjust this to match the height of your bottom PNG
    zIndex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 150, // Adjust based on the top curve height
    marginBottom: 150, // Adjust based on the bottom curve height
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
  nextButton: {
    backgroundColor: '#8FCB81',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
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

export default RegisterScreen;
