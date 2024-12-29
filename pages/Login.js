import React, { useState, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {

   const navigation = useNavigation();
  
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Curve */}
        <Image
          source={require('../assets/images/top-curve.png')}
          style={styles.topCurve}
          resizeMode="cover"
        />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo Section */}
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>LOGIN</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="logo-ionic" size={20} color="#9FA5AA" style={styles.icon} />
            
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9FA5AA"
              style={styles.input}
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9FA5AA" style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9FA5AA"
              style={styles.input}
              secureTextEntry
            />
            <Ionicons name="eye-off-outline" size={20} color="#9FA5AA" style={styles.icon} />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <Text style={styles.registerText}>
            Don't have an account yet?{' '}
            <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>Register</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Curve */}
      {!isKeyboardVisible && (
        <Image
          source={require('../assets/images/bot-curve.png')}
          style={styles.bottomCurve}
          resizeMode="cover"
        />
      )}
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
    alignItems: 'center',
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
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  forgotPasswordText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'right',
    width: '100%',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#8FCB81',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#FFF',
    fontSize: 14,
  },
  registerLink: {
    color: '#8FCB81',
    textDecorationLine: 'underline',
  },
  bottomCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
});

export default LoginScreen;
