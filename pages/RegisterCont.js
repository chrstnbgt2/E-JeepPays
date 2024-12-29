import React from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
 
const RegisterScreen2 = () => {
      const navigation = useNavigation();
        
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
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9FA5AA"
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9FA5AA"
            style={styles.input}
            secureTextEntry
          />

          {/* Register Button */}
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>Login</Text>
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
