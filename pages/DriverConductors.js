import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

const Conductors = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountList, setAccountList] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchConductors = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          Alert.alert('Error', 'You must be logged in to view conductors.');
          return;
        }

        const driverUid = currentUser.uid;

        // Set up a real-time listener
        const conductorRef = database()
          .ref('users/accounts')
          .orderByChild('creatorUid')
          .equalTo(driverUid);

        const onValueChange = conductorRef.on('value', (snapshot) => {
          const conductors = [];
          snapshot.forEach((childSnapshot) => {
            const conductor = { id: childSnapshot.key, ...childSnapshot.val() };
            conductors.push(conductor);
          });

          setAccountList(conductors); // Update the state with the latest data
        });

        // Clean up the listener when the component unmounts
        return () => conductorRef.off('value', onValueChange);
      } catch (error) {
        console.error('Error fetching conductors:', error);
        Alert.alert('Error', 'Failed to fetch conductors.');
      }
    };

    fetchConductors();
  }, []);

  const openModal = (account) => {
    setSelectedAccount(account);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAccount(null);
  };

  const openStatusModal = () => {
    setStatusModalVisible(true);
    setModalVisible(false);
  };

  const closeStatusModal = () => {
    setStatusModalVisible(false);
  };

  const updateStatus = async (newStatus) => {
    try {
      // Update the status in Firebase Realtime Database
      await database().ref(`users/accounts/${selectedAccount.id}`).update({
        status: newStatus,
      });

      Alert.alert('Success', `Status updated to ${newStatus}`);
      closeStatusModal();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.accountCard}>
      <View style={styles.accountInfo}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF9800' },
          ]}
        />
        <Text style={styles.accountName}>{`${item.firstName} ${item.lastName}`}</Text>
        <Text style={styles.accountStatus}>({item.status || 'Unknown'})</Text>
      </View>
      <TouchableOpacity style={styles.moreButton} onPress={() => openModal(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Conductors</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>List of Conductors</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddConductor')}
          >
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Account List */}
        <FlatList
          data={accountList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      </View>

      {/* Main Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={openStatusModal}>
              <Ionicons name="link" size={30} color="#007AFF" />
              <Text style={styles.modalOptionText}>Set Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                navigation.navigate('UpdateConductor', { account: selectedAccount });
                closeModal();
              }}
            >
              <Ionicons name="create-outline" size={30} color="#007AFF" />
              <Text style={styles.modalOptionText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeStatusModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={closeStatusModal}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.statusModalTitle}>Set Status</Text>
            <TouchableOpacity
              style={styles.statusOption}
              onPress={() => updateStatus('Active')}
            >
              <Text style={styles.statusOptionText}>ACTIVE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statusOption}
              onPress={() => updateStatus('Inactive')}
            >
              <Text style={styles.statusOptionText}>INACTIVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 5,
  },
  filterButton: {
    paddingHorizontal: 8,
  },
  list: {
    marginTop: 10,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDECCA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  accountName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  accountStatus: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 10,
  },
  moreButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 250,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    elevation: 10,
  },
  statusModalContainer: {
    width: 300,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    elevation: 10,
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'flex-start',
  },
  modalOptionText: {

    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  optionIcon: {
    marginRight: 10,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#000',
  },
});

export default Conductors;
