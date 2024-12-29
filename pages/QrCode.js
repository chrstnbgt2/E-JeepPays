import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg'; // Ensure this library is installed
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
 

const MyQRScreen = () => {
  const navigation = useNavigation();



  const qrValue = 'https://example.com'; // Replace with your dynamic content
  const userName = 'Daisy Miller';
  const mobileNumber = '09XXXXXXXXX';
  const username = '@username';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My QR</Text>
      </View>

      {/* QR Card */}
      <View style={styles.card}>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.details}>Mobile No.: {mobileNumber}</Text>
        <Text style={styles.details}>Username: {username}</Text>

        {/* QR Code */}
     
        <View style={styles.qrContainer}>
  <QRCode
    value={qrValue}
    size={300}  
    logo={require('../assets/images/qrlogo.png')}  
    logoSize={80} 
    logoBackgroundColor="transparent" 
    logoMargin={-20}  
    quietZone={10}  
  />
</View>

        

        <Text style={styles.note}>Transfer fees may apply</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.button1} onPress={() => navigation.navigate('Share')}>
          <Text style={styles.buttonText}>QR Code Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button2}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
       <View style={styles.bottomNav}>
           <TouchableOpacity style={styles.navItem}>
             <Ionicons name="home" size={24} color="#FFFFFF" onPress={() => navigation.navigate('Home')}/>
             <Text style={styles.navText}>Home</Text>
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.navItem}   onPress={() => navigation.navigate('Tracker')}>
             <Ionicons name="location-outline" size={24} color="#FFFFFF" />
             <Text style={styles.navText}>Tracker</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('MyQR')}>
             <Ionicons name="qr-code-outline" size={24} color="#8FCB81" />
             <Text style={styles.navText}>My QR</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('History')}>
             <Ionicons name="time-outline" size={24} color="#FFFFFF" />
             <Text style={styles.navText}>History</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
             <Ionicons name="person-outline" size={24} color="#FFFFFF" />
             <Text style={styles.navText}>Profile</Text>
           </TouchableOpacity>
         </View>
   

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
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  card: {
    backgroundColor: '#CCD9B8',
    marginHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    padding: 20,
    elevation: 5,
  },
  name: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  details: {
    fontSize: 20,
    color: '#555',
    marginBottom: 5,
  },
  qrContainer: {
    marginVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white', // Ensures a clean background around the QR code
    padding: 10, // Add padding for the QR code container
    borderRadius: 10, // Smooth corners
  },
  
  note: {
    fontSize: 15,
    color: '#74A059',
    marginTop: 10,
    fontWeight: 'bold', // Makes the text bold
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Use 'space-between' to ensure even spacing
    marginHorizontal: 20,
    marginTop: 20,
 
  },
  button1: {
    flex: 1, // Equal width for all buttons
    backgroundColor: '#74A059',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 5, // Add spacing between buttons
    alignItems: 'center',
  },
  button2: {
    flex: 1, // Equal width for all buttons
    backgroundColor: '#4E764E',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 5, // Add spacing between buttons
    alignItems: 'center',
  },
  
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#466B66',
    height: 70,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginTop: 'auto',
  },
  navItem: {
    alignItems: 'center',
  },
  activeNavItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
  activeNavText: {
    fontSize: 12,
    color: '#8FCB81',
    marginTop: 5,
    fontWeight: 'bold',
  },
});

export default MyQRScreen;
