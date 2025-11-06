import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";

const Profile = () => {
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState("Your Summary");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token'); // or SecureStore, depending on your setup

        const response = await fetch("http://localhost:3000/api/auth/profile", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setFirstName(data.profile.firstName);
        setLastName(data.profile.lastName);
        setEmail(data.profile.email);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

// const handleSave = () => {
//   const updatedData = {
//     firstName: 'Abhinav',
//     lastName: 'Shrestha',
//     phone: '9800000000',
//     // other editable fields
//   };

//   updateProfile(updatedData);
// };


  const updateProfile = async (updatedData) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch("http://localhost:3000/api/auth/profile", {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Optionally update local state or show success message
      Alert.alert('Success', 'Profile updated successfully');
      console.log('Updated profile:', result.profile);

    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('Update profile error:', error);
    }
  };

  const handleSummarySelection = (summaryType) => {
    setSelectedSummary(summaryType);
    setSummaryVisible(false);
    setModalTitle(summaryType);
    setModalVisible(true);
  };

  const handleSave = () => {
    setEditModalVisible(false);
  };


  return (
    <ScrollView style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>Hi</Text>
            </TouchableOpacity>
            <Text style={styles.modalText}>{modalTitle}</Text>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          setEditModalVisible(!editModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#ff6a6a" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>


      <View style={styles.header}>
        <Image
          source={{ uri: "https://i.pravatar.cc/300" }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{firstName} {lastName}</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
          <Text style={styles.editButtonText}>EDIT PROFILE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => setSummaryVisible(!summaryVisible)} style={styles.summaryHeader}>
          <Text style={styles.sectionTitle}>{selectedSummary}</Text>
          <Text style={styles.arrow}>{summaryVisible ? "▲" : "▼"}</Text>
        </TouchableOpacity>
        {summaryVisible && (
          <View style={styles.summaryDropdown}>
            <TouchableOpacity onPress={() => handleSummarySelection("Weekly Summary")} style={styles.summaryOption}>
              <Text style={styles.summaryOptionText}>Weekly Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSummarySelection("Monthly Summary")} style={styles.summaryOption}>
              <Text style={styles.summaryOptionText}>Monthly Summary</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Rate the app</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Terms and Conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#ff6a6a",
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    textTransform: "lowercase",
    color: "#222",
  },
  editButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  arrow: {
    fontSize: 16,
  },
  summaryDropdown: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  summaryOption: {
    paddingVertical: 10,
  },
  summaryOptionText: {
    fontSize: 14,
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 0.7,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 15,
    color: "#333",
  },
  deleteButton: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: "#fff0f0",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "red",
    fontWeight: "600",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  buttonClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 2,
    width: '48%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: "#ff6a6a",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  }
});

export default Profile;
