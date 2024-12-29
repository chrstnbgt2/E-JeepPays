import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const CashInScreen = () => {

    const navigation = useNavigation();
  
    
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash In</Text>
      </View>

      {/* List of Choices */}
      <Text style={styles.sectionTitle}>List of choices</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listText}>Gcash</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listText}>------</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listText}>------</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listText}>------</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
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
    flexDirection: 'row',
    alignItems: 'center', // Vertically centers items
    justifyContent: 'center', // Horizontally centers the headerTitle
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative', // Allows absolute positioning for the back button
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center', // Ensures the text is centered within its container
  },
  backButton: {
    position: 'absolute', // Positions the back button without affecting layout
    left: 20, // Aligns it to the left
  },
  
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 15,
    marginLeft: 20,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    paddingVertical: 5,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  listText: {
    fontSize: 16,
    color: '#000',
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

export default CashInScreen;
