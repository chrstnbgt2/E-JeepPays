import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';



const LoginRegister = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Top Curve as an Image */}
      <Image
        source={require('../assets/images/top-curve.png')}  
        style={styles.topCurve}
        resizeMode="cover"
      />

      {/* Main Green Container */}
      <View style={styles.greenContainer}>
        {/* Logo and App Name */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}  
            style={styles.logo}
          />
          <Text style={styles.title}>eJeepPay</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}> 
          <TouchableOpacity style={styles.loginButton}  onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText} >Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Need Help?</Text>
        </View>
      </View>

      {/* Bottom Curve as an Image */}
      <Image
        source={require('../assets/images/bot-curve.png')} 
        style={styles.bottomCurve}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#466B66', 
      justifyContent: 'center',
      alignItems: 'center',
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
    greenContainer: {
      width: '100%',
      height: '80%',  
      backgroundColor: '#466B66',  
      borderTopLeftRadius: 50,
      borderTopRightRadius: 50,
      borderBottomLeftRadius: 50,
      borderBottomRightRadius: 50,
      zIndex: 2,
      overflow: 'hidden',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    logo: {
      width: 150,
      height: 150,
   
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    buttonsContainer: {
      width: '80%',
     
    },
    loginButton: {
      backgroundColor: '#8FCB81',
      paddingVertical: 15,
      borderRadius: 25,
      alignItems: 'center',
      marginBottom: 10,
    },
    loginText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    registerButton: {
      backgroundColor: '#000000',
      paddingVertical: 15,
      borderRadius: 25,
      alignItems: 'center',
    },
    registerText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    footer: {
      marginBottom: 10,
      width: '100%',  
    },
    footerText: {
      fontSize: 14,
      color: '#FFFFFF',
      textDecorationLine: 'underline',
      textAlign: 'left',
      alignSelf: 'flex-start',
      marginLeft: 20,  
    },
    
    bottomCurve: {
      position: 'absolute',
      width:'100%',
      bottom: 0,
      left: 0,
      right: 0,
      height: 120, 
      zIndex: 1,
    },
  });

export default LoginRegister;
