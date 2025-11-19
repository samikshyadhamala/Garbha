
import React, { useState } from 'react';
import { Image } from 'expo-image';
import { View, TextInput, StyleSheet, Text, Platform, Pressable, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function GetStarted() {
    const [isChecked, setChecked] = useState(false);
    const router = useRouter()
    const { setUser } = useAuth();
    const [login, setLogin] = useState(false)
    const [form, setForm] = useState({
        email: "",
        password: ""
    })

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            console.log("This is token : ", token)

            const response = await fetch("http://192.168.1.5:3000/api/auth/profile", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log("this is the one data : ", data)
            if (!response.ok) {
                throw new Error(data.message || 'Network response was not ok');
            }
            if (data.profile) {
                setLogin(data.profile.firstLogin);

            } else {
                Alert.alert("Error")
            }
        } catch (error) {
            console.log(error.message);
        }
    };


    const GoTo = () => {
        router.push('/auth/started')
    }

    const Log = async () => {

        try {

            console.log("thsi is forma email", form.email)
            console.log("thsi is forma password", form.password)


            const response = await fetch('http://192.168.1.5:3000/api/auth/login', {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify(form)

            })

            const resp = await response.json()
            console.log("this is login response : ", resp)

            if (!resp.success) {
                Alert.alert(resp.message)
            }

            if (resp.success) {
                console.log("i am inside success")
                Alert.alert(resp.message)
                await AsyncStorage.setItem('token', resp.token);
                router.replace({ pathname: '/(app)/(tabs)/dashboard' });

                console.log("Hello world")
            }
        } catch (error) {
            console.error(error)
        }
    }
    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: 'white' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.containers}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.above}>
                    <Image source={require('../../assets/images/fetus.png')} style={{ width: 200, height: 200 }} />
                    <View style={styles.cont}>
                        <Text style={styles.title}>Log in</Text>
                        <Text style={styles.para}>Login to your exisiting account</Text>
                    </View>
                </View>
                <View style={styles.below}>
                    <TextInput
                        style={styles.input}
                        placeholder="email"
                        // keyboardType="phone-pad"
                        onChangeText={text => setForm(prev => ({ ...prev, email: text }))}
                        value={form.email}
                    />
                    <TextInput style={styles.input} placeholder="password" secureTextEntry onChangeText={text => setForm(prev => ({ ...prev, password: text }))} value={form.password} />
                </View>
                <View style={styles.buttons}>
                    <View style={styles.checkboxContainer}>

                        <Text style={styles.checkboxLabel}>Don't have an account? <Text style={styles.highlight} onPress={GoTo}>SignUp</Text>.</Text>
                    </View>

                    <Pressable style={styles.btn} onPress={Log}>
                        {({ pressed }) => (
                            <Text style={[styles.btnText, pressed && { opacity: 0.8 }]}>
                                Log In
                            </Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    containers: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    above: {
        alignItems: 'center',
        marginBottom: 20,
    },
    cont: {
        alignItems: 'center',
        marginTop: 10,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: "#F4716A",
    },
    para: {
        fontSize: 14,
        marginTop: 5,
    },
    below: {
        width: '100%',
    },
    input: {
        padding: 15,
        backgroundColor: "#f0f0f0",
        marginVertical: 10,
        borderRadius: 10,
        width: '100%',
    },
    buttons: {
        width: '100%',
        marginTop: 10,
        bottom: -10
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkboxLabel: {
        fontSize: 12,
        marginLeft: 10,
        flexShrink: 1,
    },
    highlight: {
        color: "red",
    },
    btn: {
        backgroundColor: "#F4716A",
        borderRadius: 12,
        padding: 15,
        marginVertical: 10,
    },
    btnText: {
        color: "white",
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
    }
});