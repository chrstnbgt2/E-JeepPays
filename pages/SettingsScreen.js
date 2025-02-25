import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toggle password visibility
  const togglePasswordVisibility = (type) => {
    if (type === 'current') setShowCurrentPassword(!showCurrentPassword);
    if (type === 'new') setShowNewPassword(!showNewPassword);
    if (type === 'confirm') setShowConfirmPassword(!showConfirmPassword);
  };

  // Validate Fields in Real-Time
  const validateFields = () => {
    let errors = {};

    if (!currentPassword.trim()) errors.currentPassword = 'Current password is required.';
    if (!newPassword.trim()) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCurrentPasswordChange = (text) => {
    setCurrentPassword(text);
    setError((prev) => ({
      ...prev,
      currentPassword: text.length > 0 ? '' : prev.currentPassword, // Only show error if previously invalid
    }));
  };
  
  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
  
    setError((prev) => ({
      ...prev,
      newPassword: text.length === 0 ? '' : text.length < 6 ? 'Password must be at least 6 characters long.' : '',
      confirmPassword: confirmPassword.length > 0 && text !== confirmPassword ? 'Passwords do not match.' : '',
    }));
  };
  
  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
  
    setError((prev) => ({
      ...prev,
      confirmPassword: text.length === 0 ? '' : text !== newPassword ? 'Passwords do not match.' : '',
    }));
  };
  
  

  // Re-authenticate user before updating password
  const reauthenticateUser = async () => {
    try {
      const user = auth().currentUser;
      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      return true;
    } catch (error) {
      setError((prev) => ({ ...prev, currentPassword: 'Incorrect current password.' }));
      return false;
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    if (!validateFields()) return;

    setLoading(true);
    const authenticated = await reauthenticateUser();
    if (!authenticated) {
      setLoading(false);
      return;
    }

    try {
      await auth().currentUser.updatePassword(newPassword);
      Alert.alert('Success', 'Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError({});
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2B393B" />
        </TouchableOpacity>
        <Text style={styles.header}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputField}
            value={currentPassword}
            onChangeText={handleCurrentPasswordChange}
            secureTextEntry={!showCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={() => togglePasswordVisibility('current')}>
            <Ionicons name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color="#2B393B" />
          </TouchableOpacity>
        </View>
        {error.currentPassword ? <Text style={styles.errorText}>{error.currentPassword}</Text> : null}

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputField}
            value={newPassword}
            onChangeText={handleNewPasswordChange}
            secureTextEntry={!showNewPassword}
            placeholder="Enter new password"
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={() => togglePasswordVisibility('new')}>
            <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color="#2B393B" />
          </TouchableOpacity>
        </View>
        {error.newPassword ? <Text style={styles.errorText}>{error.newPassword}</Text> : null}

        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputField}
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureTextEntry={!showConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={() => togglePasswordVisibility('confirm')}>
            <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={24} color="#2B393B" />
          </TouchableOpacity>
        </View>
        {error.confirmPassword ? <Text style={styles.errorText}>{error.confirmPassword}</Text> : null}

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePassword} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Update Password</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2B393B',
    textAlign: 'center',
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F4B47',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F4F4F4',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#2B393B',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
});

export default SettingsScreen;
