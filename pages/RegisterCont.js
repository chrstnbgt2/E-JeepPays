import React, { useEffect, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import Ionicons from 'react-native-vector-icons/Ionicons';

 
const RegisterScreen2 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, middleName, lastName } = route.params;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);

  const sanitizeInput = (input) => input.replace(/[<>]/g, '');

  // Real-time validation for confirm password
  useEffect(() => {
    if (confirmPassword.length > 0 && password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
    } else {
      setErrors((prev) => {
        const { confirmPassword, ...rest } = prev;
        return rest;
      });
    }
  }, [password, confirmPassword]);

  const validateInputs = () => {
    let errors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

    if (!phoneRegex.test(phoneNumber)) {
      errors.phoneNumber = 'Phone number must contain only digits (10-15 characters).';
    }

    if (!emailRegex.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!passwordRegex.test(password)) {
      errors.password = 'Password must be at least 6 characters, with 1 uppercase, 1 number, and 1 special character.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !phoneNumber || !email || !password || !confirmPassword) {
      setErrors({ general: 'All fields are required except Middle Name.' });
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;

      await database().ref(`/users/accounts/${userId}`).set({
        firstName: sanitizeInput(firstName),
        middleName: sanitizeInput(middleName || ''),
        lastName: sanitizeInput(lastName),
        phoneNumber: sanitizeInput(phoneNumber),
        email: sanitizeInput(email),
        role: 'user',
        wallet_balance: 0,
        acc_type: 'Regular',
        createdAt: new Date().toISOString(),
      });

      navigation.navigate('Login');
    } catch (error) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Email is already registered.';
      if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';
      if (error.code === 'auth/weak-password') errorMessage = 'Weak password.';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('../assets/images/top-curve.png')} style={styles.topCurve} resizeMode="cover" />

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.title}>REGISTER</Text>
          </View>

          {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#9FA5AA" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={24} color="#9FA5AA" />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
 {/* Terms and Conditions Checkbox */}
 <TouchableOpacity onPress={() => setAgreed(!agreed)} style={styles.checkboxContainer}>
    <Ionicons name={agreed ? "checkbox" : "square-outline"} size={24} color="#A5BE7D" />
    <Text style={styles.checkboxText}>
      I accept the 
      <Text style={styles.termsLink} onPress={() => navigation.navigate("TermsAndConditions")}>
        Terms & Conditions
      </Text>
    </Text>
  </TouchableOpacity>
          <TouchableOpacity style={[styles.registerButton, (!agreed || loading) && styles.disabledButton]} onPress={handleRegister} disabled={!agreed || loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>Register</Text>}
          </TouchableOpacity>
          
        </View>

        <Image source={require('../assets/images/bot-curve.png')} style={styles.bottomCurve} resizeMode="cover" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#466B66' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  topCurve: { position: 'absolute', top: 0, width: '100%', height: 120 },
  bottomCurve: { position: 'absolute', bottom: 0, width: '100%', height: 120 },
  content: { alignItems: 'center', padding: 20 },
  logo: { width: 150, height: 150 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 10 },
  label: { color: '#FFF', alignSelf: 'flex-start', marginBottom: 5 },
  input: { width: '100%', backgroundColor: '#FFF', borderRadius: 25, padding: 10, fontSize: 16, marginBottom: 5 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 10, marginBottom: 5 },
  passwordInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#000' },
  errorText: { color: '#FF6B6B', alignSelf: 'flex-start', marginBottom: 5 },
  registerButton: { backgroundColor: '#8FCB81', padding: 15, borderRadius: 25, width: '100%', alignItems: 'center', marginTop: 20 },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#FFF',
  },
  termsLink: {
    color: '#A5BE7D',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  
});

export default RegisterScreen2;
