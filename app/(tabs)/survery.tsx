import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView, 
  Alert,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from 'expo-router';
import { Picker } from "@react-native-picker/picker";

// 👶 Import your local image
import heartBaby from "../../assets/images/fetus.png";

export default function SurveyScreen() {
  const [formData, setFormData] = useState({
    age: "",
    pregnantDays: "",
    weight: "",
    // height: "",
    // conditions: "",
    lmp: "",
    dueDate: "",
    firstPregnancy: true,
    weeksPregnant: "",
    previousPregnancies: "",
    previousComplications: false,
    bloodType: "",
    preExistingConditions: [],
    otherCondition: "",
    allergies: "",
    medications: "",
    smoke: null,
    alcohol: null,
    familyHistory: false,
  });
   const router = useRouter();

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const toggleCondition = (condition) => {
    if (formData.preExistingConditions.includes(condition)) {
      setFormData({
        ...formData,
        preExistingConditions: formData.preExistingConditions.filter(
          (c) => c !== condition
        ),
      });
    } else {
      setFormData({
        ...formData,
        preExistingConditions: [...formData.preExistingConditions, condition],
      });
    }
  };

  
    const handleSubmit = async ()=>{
        const response = await fetch('http://192.168.123.7:3000/api/auth/pregnancy-profile',{
            method:"POST",
            headers:{
                "Content-type":"application/json"
            },
            body: JSON.stringify(formData)

        })

        const resp = await response.json()
        if (!resp.success) {
                Alert.alert(resp.message)
            }

            if (resp.success) {
                Alert.prompt("Successfully signed in")
                router.push('/(tabs)/verify')
            }
        console.log(response)
    }


  // const handleSubmit = () => {
  //   Alert.alert("Form Submitted", JSON.stringify(formData, null, 2));
  // };

  const conditionOptions = [
    "Diabetes",
    "Hypertension",
    "Thyroid Disorder",
    "Asthma",
    "Heart Disease",
    "Kidney Disease",
    "Autoimmune Disorder",
    "Mental Health Condition",
    "Blood Disorder",
    "Other",
  ];

  return (
    <LinearGradient
      colors={["#ffeaea", "#ffbfbf", "#ff9f9f"]}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Image source={heartBaby} style={styles.image} />
          <Text style={styles.headerText}>
            Help us personalize{"\n"}
            <Text style={styles.headerHighlight}>YOUR profile</Text>
          </Text>
        </View>

        {/* Form Fields */}
        <Text style={styles.label}>How old are you?</Text>
        <TextInput
          style={styles.input}
          placeholder="Eg : 28"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(text) => handleChange("age", text)}
        />

        <Text style={styles.label}>How many days have you been pregnant?</Text>
        <TextInput
          style={styles.input}
          placeholder="Eg : 31"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={formData.pregnantDays}
          onChangeText={(text) => handleChange("pregnantDays", text)}
        />

        <Text style={styles.label}>
          Enter your weight (in kgs) before pregnancy
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Eg : 78 kgs"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={formData.weight}
          onChangeText={(text) => handleChange("weight", text)}
        />

        {/* <Text style={styles.label}>Enter your height (in cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="Eg : 171 cm"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={formData.height}
          onChangeText={(text) => handleChange("height", text)}
        /> */}

        <Text style={styles.label}>Last Menstrual Period (LMP)</Text>
        <TextInput
          style={styles.input}
          value={formData.lmp}
          onChangeText={(text) => handleChange("lmp", text)}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Due Date</Text>
        <TextInput
          style={styles.input}
          value={formData.dueDate}
          onChangeText={(text) => handleChange("dueDate", text)}
          placeholder="YYYY-MM-DD"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>First Pregnancy</Text>
          <Switch
            value={formData.firstPregnancy}
            onValueChange={(value) => handleChange("firstPregnancy", value)}
          />
        </View>

        <Text style={styles.label}>Weeks Pregnant</Text>
        <TextInput
          style={styles.input}
          value={formData.weeksPregnant}
          onChangeText={(text) => handleChange("weeksPregnant", text)}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Previous Pregnancies</Text>
        <TextInput
          style={styles.input}
          value={formData.previousPregnancies}
          onChangeText={(text) => handleChange("previousPregnancies", text)}
          keyboardType="numeric"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Previous Complications</Text>
          <Switch
            value={formData.previousComplications}
            onValueChange={(value) => handleChange("previousComplications", value)}
          />
        </View>

        <Text style={styles.label}>Blood Type</Text>
        <Picker
          selectedValue={formData.bloodType}
          onValueChange={(value) => handleChange("bloodType", value)}
          style={styles.selects}
        >
          <Picker.Item label="Select Blood Type" value="" />
          {[ "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" ].map((type) => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>

        <Text style={styles.label}>Pre-existing Conditions</Text>
        {conditionOptions.map((condition) => (
          <TouchableOpacity
            key={condition}
            onPress={() => toggleCondition(condition)}
            style={styles.checkboxContainer}
          >
            <Text style={styles.pretext}>
              {formData.preExistingConditions.includes(condition) ? "☑" : "☐"}{" "}
              {condition}
            
            </Text>
          </TouchableOpacity>
        ))}
        {formData.preExistingConditions.includes("Other") && (
          <TextInput
            style={styles.input}
            value={formData.otherCondition}
            onChangeText={(text) => handleChange("otherCondition", text)}
            placeholder="Please specify other condition"
          />
        )}

        <Text style={styles.label}>Allergies</Text>
        <TextInput
          style={styles.input}
          value={formData.allergies}
          onChangeText={(text) => handleChange("allergies", text)}
          placeholder="e.g. Penicillin"
        />

        <Text style={styles.label}>Medications</Text>
        <TextInput
          style={styles.input}
          value={formData.medications}
          onChangeText={(text) => handleChange("medications", text)}
          placeholder="e.g. Iron supplements"
        />

        <Text style={styles.label}>Do you smoke?</Text>
        <Picker
          selectedValue={formData.smoke}
          onValueChange={(value) => handleChange("smoke", value)}
          style={styles.selects}
        >
          <Picker.Item label="Select" value={null} />
          <Picker.Item label="Yes" value={true} />
          <Picker.Item label="No" value={false} />
        </Picker>

        <Text style={styles.label}>Do you consume alcohol?</Text>
        <Picker
          selectedValue={formData.alcohol}
          onValueChange={(value) => handleChange("alcohol", value)}
          style={styles.selects}
        >
          <Picker.Item label="Select" value={null} />
          <Picker.Item label="Yes" value={true} />
          <Picker.Item label="No" value={false} />
        </Picker>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>
            Family History of Pregnancy Complications
          </Text>
          <Switch
            value={formData.familyHistory}
            onValueChange={(value) => handleChange("familyHistory", value)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  headerText: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  headerHighlight: {
    color: "#ff69b4",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#ff69b4",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  selects:{
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 0,
    fontSize: 15,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "#ddd",

  },
  pretext:{
    color:"white",
  }
});