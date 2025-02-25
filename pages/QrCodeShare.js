import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const MyQRScreenShare = () => {
  const navigation = useNavigation();

  
  const qrValue = 'https://example.com'; // Replace with your dynamic content
  const username = '@username';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Share</Text>
      </View>

      {/* QR Card */}
      <View style={styles.card}>
        <Text style={styles.username}>{username}</Text>
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
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.buttonText}>Create QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

 
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingBottom: 70, // Add padding to avoid content overlapping the tabs
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#CCD9B8',
    margin: 20,
    borderRadius: 15,
    alignItems: 'center',
    padding: 20,
    elevation: 5,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  qrContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
  },
  note: {
    fontSize: 14,
    color: '#74A059',
    marginTop: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
  flexDirection: 'column', // Stack buttons vertically
  marginHorizontal: 20,
  marginTop: 20,
},

createButton: {
  backgroundColor: '#2B393B',
  borderRadius: 10,
  paddingVertical: 10,
  marginBottom: 10, // Add space between buttons
  alignItems: 'center',
},

saveButton: {
  backgroundColor: '#4E764E',
  borderRadius: 10,
  paddingVertical: 10,
  alignItems: 'center',
},
 
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute', // Ensure it stays at the bottom
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#466B66',
    height: 70,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },

  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
  },
  activeNavItem: {
    alignItems: 'center',
  },
  activeNavText: {
    fontSize: 12,
    color: '#8FCB81',
    marginTop: 5,
    fontWeight: 'bold',
  },
});

export default MyQRScreenShare;
