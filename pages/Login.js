import React, { useState, useEffect, useContext } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { AuthContext } from '../context/AuthContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { setAuthState } = useContext(AuthContext);  
  const { setIsLoggedIn, setRole } = useContext(AuthContext);  
  
  // Define state
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);  

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



  

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
  
    setIsLoading(true);
  
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
  
      // ✅ Fetch user's details from Firebase
      const userSnapshot = await database().ref(`/users/accounts/${userId}`).once('value');
  
      if (!userSnapshot.exists()) {
        Alert.alert('Error', 'User not found. Please contact support.');
        await auth().signOut();
        setIsLoading(false);
        return;
      }
  
      const userData = userSnapshot.val();
      const userRole = userData.role || 'user';
      const userStatus = userData.status || 'active';
  
      // ✅ Restrict login for inactive conductors
      if (userRole === 'conductor' && userStatus === 'Deactivated') {
        Alert.alert('Account Deactivated', 'Your account is deactivated. Please contact support.');
        await auth().signOut();
        setIsLoading(false);
        return;
      }
  
      // ✅ Store user session in AsyncStorage for persistence
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify({ uid: userId, role: userRole, status: userStatus })
      );
  
      // ✅ Use `login()` from AuthContext
      login({ uid: userId, role: userRole });
  
    } catch (error) {
      console.error('❌ Login error:', error);
  
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') errorMessage = 'No account found with this email.';
      if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password. Please try again.';
      if (error.code === 'auth/too-many-requests') errorMessage = 'Too many failed attempts. Try again later.';
  
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

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
            <Ionicons name="person-outline" size={20} color="#9FA5AA" style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9FA5AA"
              style={styles.input}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9FA5AA" style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9FA5AA"
              style={styles.input}
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={togglePasswordVisibility}>
              <Ionicons
                name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#9FA5AA"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Password reset flow')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && { backgroundColor: '#ccc' }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <Text style={styles.registerText}>
            Don't have an account yet?{' '}
            <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
              Register
            </Text>
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
    width:'100%',
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
    width:'100%',
  },
});

export default LoginScreen;
