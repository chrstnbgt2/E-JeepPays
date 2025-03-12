import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {AuthContext} from '../context/AuthContext';

const Conductors = () => {
  const {role} = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountList, setAccountList] = useState([]);
  const navigation = useNavigation();
  const [addConductorModalVisible, setAddConductorModalVisible] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const fetchConductors = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Warning', 'You must be logged in to view conductors.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const driverUid = currentUser.uid;
      const conductorRef = database()
        .ref('users/accounts')
        .orderByChild('creatorUid')
        .equalTo(driverUid);

      console.log('🔄 Fetching Conductors for UID:', driverUid);

      // ✅ Use real-time updates instead of one-time fetch
      conductorRef.on('value', snapshot => {
        if (!snapshot.exists()) {
          console.warn('⚠️ No conductors found.');
          setAccountList([]);
        } else {
          const conductors = [];
          snapshot.forEach(childSnapshot => {
            conductors.push({id: childSnapshot.key, ...childSnapshot.val()});
          });

          console.log('✅ Conductors Fetched:', conductors.length);
          setAccountList(conductors);
        }
        setLoading(false);
        setRefreshing(false);
      });
    } catch (error) {
      console.error('❌ Error fetching conductors:', error);
      Alert.alert('Warning', 'Failed to fetch conductors.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConductors(); // ✅ Fetch the updated list of conductors
  };

  useEffect(() => {
    fetchConductors(); // ✅ Fetch conductors initially
  }, []);

  const openModal = account => {
    setSelectedAccount(account);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAccount(null);
  };

  const openStatusModal = () => {
    if (selectedAccount) {
      setSelectedStatus(selectedAccount.status); // ✅ Set the selected status
    }
    setStatusModalVisible(true);
    setModalVisible(false);
  };

  const closeStatusModal = () => {
    setStatusModalVisible(false);
  };

  const updateStatus = async newStatus => {
    try {
      if (!selectedAccount) {
        Alert.alert('Warning', 'No conductor selected.');
        return;
      }

      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Warning', 'You must be logged in.');
        return;
      }

      const driverUid = currentUser.uid;

      if (newStatus === 'Active') {
        // ✅ Check if an active conductor already exists for this driver
        const conductorRef = database()
          .ref('users/accounts')
          .orderByChild('creatorUid')
          .equalTo(driverUid);
        const snapshot = await conductorRef.once('value');

        let alreadyActive = false;
        snapshot.forEach(child => {
          const conductor = child.val();
          if (
            conductor.status === 'Active' &&
            child.key !== selectedAccount.id
          ) {
            alreadyActive = true;
          }
        });

        if (alreadyActive) {
          Alert.alert('Warning', 'Only one conductor can be Active at a time.');
          return;
        }
      }

      // ✅ Update the selected conductor's status
      await database().ref(`users/accounts/${selectedAccount.id}`).update({
        status: newStatus,
      });

      Alert.alert('Success', `Status updated to ${newStatus}`);
      closeStatusModal();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Warning', 'Failed to update status.');
    }
  };

  const renderItem = ({item}) => (
    <View style={styles.accountCard}>
      <View style={styles.accountInfo}>
        <View
          style={[
            styles.statusDot,
            {backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF9800'},
          ]}
        />
        <Text
          style={
            styles.accountName
          }>{`${item.firstName} ${item.lastName}`}</Text>
        <Text style={styles.accountStatus}>({item.status || 'Unknown'})</Text>
      </View>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => openModal(item)}>
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
            onPress={() => setAddConductorModalVisible(true)}>
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Account List */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4CAF50"
            style={styles.loadingIndicator}
          />
        ) : accountList.length === 0 ? (
          <Text style={styles.noDataText}>No Conductors Available</Text>
        ) : (
          <FlatList
            data={accountList}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#4CAF50']}
              />
            }
          />
        )}
      </View>

      {/* Main Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={openStatusModal}>
              <Ionicons name="link" size={30} color="#007AFF" />
              <Text style={styles.modalOptionText}>Set Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                navigation.navigate('UpdateConductor', {
                  account: selectedAccount,
                });
                closeModal();
              }}>
              <Ionicons name="create-outline" size={30} color="#007AFF" />
              <Text style={styles.modalOptionText}>View More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Conductor Modal */}
      <Modal
        visible={addConductorModalVisible} // ✅ Updated State
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddConductorModalVisible(false)} // ✅ Updated State
      >
        <View style={styles.addConductorModalOverlay}>
          {' '}
          {/* ✅ Updated Style */}
          <View style={styles.addConductorModalContainer}>
            {' '}
            {/* ✅ Updated Style */}
            <Text style={styles.addConductorModalTitle}>Add Conductor</Text>
            <TouchableOpacity
              style={styles.addConductorModalOption}
              onPress={() => {
                setAddConductorModalVisible(false);
                navigation.navigate('AddConductor');
              }}>
              <Ionicons name="person-add" size={24} color="#007AFF" />
              <Text style={styles.addConductorModalOptionText}>Add New</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addConductorModalOption}
              onPress={() => {
                setAddConductorModalVisible(false);
                navigation.navigate('AddExisting');
              }}>
              <Ionicons name="search" size={24} color="#007AFF" />
              <Text style={styles.addConductorModalOptionText}>
                Add Existing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addConductorModalClose}
              onPress={() => setAddConductorModalVisible(false)}>
              <Ionicons name="close-circle" size={30} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeStatusModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.statusModalContainer}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={closeStatusModal}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            <Text style={styles.statusModalTitle}>Set Status</Text>

            {/* ✅ Active Status Button (Highlights if selected) */}
            <TouchableOpacity
              style={[
                styles.statusOption,
                selectedStatus === 'Active' && styles.selectedStatus, // ✅ Highlight if Active
              ]}
              onPress={() => updateStatus('Active')}>
              <Text style={styles.statusOptionText}>ACTIVE</Text>
            </TouchableOpacity>

            {/* ✅ Inactive Status Button (Highlights if selected) */}
            <TouchableOpacity
              style={[
                styles.statusOption,
                selectedStatus === 'Inactive' && styles.selectedStatus, // ✅ Highlight if Inactive
              ]}
              onPress={() => updateStatus('Inactive')}>
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
  addConductorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addConductorModalContainer: {
    width: 250,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    elevation: 10,
  },
  addConductorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  addConductorModalOption: {
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
  addConductorModalOptionText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  addConductorModalClose: {
    marginTop: 10,
  },
  loadingIndicator: {
    marginTop: 20,
    alignSelf: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 20,
  },
  selectedStatus: {
    backgroundColor: '#A5BE7D', // ✅ Green background for the selected status
  },
});

export default Conductors;
