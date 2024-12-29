import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
 
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker for the select box
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

const DiscountScreen = () => {
 const navigation =useNavigation();
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [birthDate, setBirthDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const handleBrowseFiles = async () => {
    try {
      const file = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      setSelectedFile(file[0]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        Alert.alert('File selection was canceled.');
      } else {
        Alert.alert('Error:', err.message);
      }
    }
  };

  const onDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" style={styles.backIcon} onPress={() => navigation.goBack()}/>
        <Text style={styles.headerTitle}>Discount</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.note}>
            <Text style={styles.noteTitle}>Note:</Text> Please fill out all required fields.
          </Text>
        </View>

        {/* Form Title */}
        <Text style={styles.formTitle}>Personal Information</Text>

        {/* Form Fields */}
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter first name"
              placeholderTextColor="#000"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter middle name"
              placeholderTextColor="#000"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter last name"
              placeholderTextColor="#000"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedGender}
                onValueChange={(itemValue) => setSelectedGender(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setDatePickerVisible(true)}
            >
              <Text style={styles.dateText}>
                {birthDate.toLocaleDateString('en-US')}
              </Text>
            </TouchableOpacity>
            {isDatePickerVisible && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()} // Prevent selecting future dates
              />
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="Enter address"
            placeholderTextColor="#000"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter City"
              placeholderTextColor="#000"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State/Province</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter state/province"
              placeholderTextColor="#000"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP/Postal Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ZIP code"
              placeholderTextColor="#000"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#000"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="Enter email"
            placeholderTextColor="#000"
          />
        </View>

        {/* File Upload */}
        <View style={styles.fileUpload}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload (Student ID/Senior Citizen ID/PWD ID)</Text>
            <View style={styles.fileInputContainer}>
              <TextInput
                style={[styles.inputFull, styles.uploadInput]}
                placeholder={selectedFile ? selectedFile.name : 'Choose file'}
                editable={false}
                placeholderTextColor="#000"
              />
              <TouchableOpacity style={styles.browseButton} onPress={handleBrowseFiles}>
                <Text style={styles.browseButtonText}>Browse Files</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  noteContainer: {
    marginVertical: 10,
  },
  note: {
    fontSize: 14,
    color: '#74A059',
  },
  noteTitle: {
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#74A059',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: '#74A059',
  },
  inputFull: {
    width: '100%',
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#74A059',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#74A059',
    borderRadius: 8,
    marginBottom: 10,
  },
  picker: {
    color: '#000',
  },
  datePickerButton: {
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#74A059',
    borderRadius: 8,
    padding: 10,
  },
  dateText: {
    color: '#000',
  },
  fileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadInput: {
    flex: 1,
    marginRight: 10,
  },
  browseButton: {
    backgroundColor: '#74A059',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#466B66',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DiscountScreen;
