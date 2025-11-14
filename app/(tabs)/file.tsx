
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FileUploadScreen = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick a document.');
    }
  };

  const uploadFile = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!selectedFile) {
      Alert.alert('No file selected', 'Please select a file to upload.');
      return;
    }
    console.log("I am here")

    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType,
    });
    console.log("this is format data : ", formData)
    
    try {
        const response = await fetch('https://garbha.onrender.com/api/documents/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        
        console.log("this is response data : ", response)
      if (response.ok) {
        Alert.alert('Upload Successful', 'The file has been uploaded successfully.');
        setSelectedFile(null); // Clear the selection after upload
      } else {
        const errorText = await response.text();
        Alert.alert('Upload Failed', `Server responded with ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Upload Error', 'An unexpected error occurred during the upload. Please check the console for more details.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Your Documents</Text>
      <Text style={styles.subtitle}>You can upload images or PDF files.</Text>

      <TouchableOpacity style={styles.selectButton} onPress={selectFile}>
        <Feather name="paperclip" size={20} color="#fff" />
        <Text style={styles.selectButtonText}>Select File</Text>
      </TouchableOpacity>

      {selectedFile && (
        <View style={styles.fileInfo}>
          <Feather name={selectedFile.mimeType.startsWith('image/') ? 'image' : 'file-text'} size={40} color="#555" />
          <Text style={styles.fileName}>{selectedFile.name}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.uploadButton} onPress={uploadFile} disabled={!selectedFile}>
        <Feather name="upload" size={20} color="#fff" />
        <Text style={styles.uploadButtonText}>Upload</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  selectButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  fileInfo: {
    marginTop: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    elevation: 2,
  },
  fileName: {
    fontSize: 16,
    marginTop: 10,
    color: '#333',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default FileUploadScreen;
