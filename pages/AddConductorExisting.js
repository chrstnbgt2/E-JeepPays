import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const AddConductorExisting = () => {
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Warning', 'You must be logged in.');
      return;
    }

    const fetchUsers = async () => {
      try {
        const usersRef = database().ref('users/accounts');

        usersRef.on('value', snapshot => {
          const users = [];
          snapshot.forEach(childSnapshot => {
            const user = {id: childSnapshot.key, ...childSnapshot.val()};

            // ✅ Fetch users where `role` is `conductor` and `creatorUid` is "unassigned"
            if (user.role === 'conductor' && user.creatorUid === 'unassigned') {
              users.push(user);
            }
          });

          setUsersList(users);
          setFilteredUsers(users); // Initialize filtered list
          setLoading(false);
        });

        return () => usersRef.off('value');
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const assignAsConductor = async userId => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Warning', 'No logged-in user found.');
      return;
    }

    try {
      await database().ref(`users/accounts/${userId}`).update({
        creatorUid: currentUser.uid,
        role: 'conductor',
        status: 'Inactive',
      });

      Alert.alert('Success', 'User has been assigned as a conductor.');
    } catch (error) {
      console.error('Error assigning conductor:', error);
      Alert.alert('Warning', 'Failed to assign user as a conductor.');
    }
  };

  const handleSearch = text => {
    setSearchQuery(text);

    if (text === '') {
      setFilteredUsers(usersList); // Reset when empty
    } else {
      const filtered = usersList.filter(user =>
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(text.toLowerCase()),
      );
      setFilteredUsers(filtered);
    }
  };

  const renderItem = ({item}) => (
    <View style={styles.accountCard}>
      <View style={styles.accountInfo}>
        <View style={styles.statusDot} />
        <View>
          <Text
            style={
              styles.accountName
            }>{`${item.firstName} ${item.lastName}`}</Text>
          <Text style={styles.accountDetails}>
            📧 {item.email || 'No Email'}
          </Text>
          <Text style={styles.accountDetails}>
            📞 {item.phoneNumber || 'No Phone'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.assignButton}
        onPress={() => assignAsConductor(item.id)}>
        <Ionicons name="person-add" size={20} color="#FFF" />
        <Text style={styles.assignButtonText}>Assign</Text>
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
        <Text style={styles.headerTitle}>Assign Existing Conductor</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Available Users</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : filteredUsers.length === 0 ? (
          <Text style={styles.noUsersText}>No available users to assign.</Text>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 20,
  },
  noUsersText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 20,
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
    backgroundColor: '#FF9800',
    marginRight: 8,
  },
  accountName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  accountDetails: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
});

export default AddConductorExisting;
