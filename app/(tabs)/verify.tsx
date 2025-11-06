import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Link, useRouter } from 'expo-router';
import { getMail, setMail } from './save'


export default function VerifyScreen() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const router = useRouter();
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [form, setForm] = useState({
    email: "",
    otp: ""
  })

  const inputsRef = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      setIsResendDisabled(true);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // const Start = async ()=>{
  //       const response = await fetch('http://192.168.123.7:3000/api/auth/send-otp',{
  //           method:"POST",
  //           headers:{
  //               "Content-type":"application/json"
  //           },
  //           body: JSON.stringify(form)

  //       })

  //       console.log(response)
  //   }

  const handleChange = (text, index) => {
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (index < 5) {
        inputsRef.current[index + 1].focus();
      }
    } else if (text === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const email = getMail()
    setMail('')
    const enteredCode = otp.join("");
    setForm(prev => ({ ...prev, email: email, otp: enteredCode }))
    console.log(form.email)
    console.log(form.otp)
    const response = await fetch('http://192.168.123.7:3000/api/auth/signup/verify-otp', {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(form)

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
    // if (response.status == 200){

    //   Alert.alert("Logined Successfully", enteredCode);
    //   router.push('/(tabs)/dashbaord')
    // }


    // 👉 Add your backend verification logic here
  };

  const handleResend = () => {
    // 👉 Call your backend API to resend OTP here
    Alert.alert("OTP Sent", "A new code has been sent to your phone number.");

    // Reset OTP boxes
    setOtp(["", "", "", "", "", ""]);

    // Restart timer
    setTimer(30);
    setIsResendDisabled(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almost there</Text>
      <Text style={styles.subtitle}>
        Please enter the 6-digit code sent to your{" "}
        <Text style={styles.highlight}>phone number</Text> for verification.
      </Text>

      {/* OTP Boxes */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputsRef.current[index] = ref)}
            style={styles.otpBox}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>

      {/* Verify Button */}
      <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
        <Text style={styles.verifyText}>Verify</Text>
      </TouchableOpacity>

      {/* Resend Section */}
      <View style={styles.footer}>
        {isResendDisabled ? (
          <Text style={styles.timerText}>
            Request a new code in 00:{timer < 10 ? `0${timer}` : timer}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resend}>Didn’t receive any code? Resend Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "center",
    backgroundColor: "#fff",
    gap: 5
  },
  title: {
    fontSize: 39,
    fontWeight: "700",
    color: "#f26464",
    marginBottom: 10,
    top: -40
  },
  subtitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 30,
    top: -40
  },
  highlight: {
    color: "#f26464",
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    top: -20
  },
  otpBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    backgroundColor: "#f9f9f9",
  },
  verifyButton: {
    backgroundColor: "#f26464",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  verifyText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
    marginTop: 10,
  },
  resend: {
    color: "#f26464",
    fontWeight: "600",
    fontSize: 14,
  },
  timerText: {
    marginTop: 4,
    fontSize: 13,
    color: "#999",
  },
  backButton: {
    position: "absolute",
    bottom: 40,
    left: 25,
    backgroundColor: "#f26464",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 18,
    color: "#fff",
  },
});
