import React, { useState } from 'react';
import { Image } from 'expo-image';
import { View, TextInput, StyleSheet, Text, Platform, Pressable, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import Checkbox from 'expo-checkbox';
import { Link, useRouter } from 'expo-router';
import { setMail } from './save'
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GetStarted() {
    const [isChecked, setChecked] = useState(false);
    const router = useRouter();
    const [form, setForm] = useState({
            firstName:"",
            lastName:"",
            email:"",
            password:""
        })

    const Start = async ()=>{
        const response = await fetch('https://garbha.onrender.com/api/auth/signup/send-otp',{
            method:"POST",
            headers:{
                "Content-type":"application/json"
            },
            body: JSON.stringify(form)

        })

        const resp = await response.json()
        if (!resp.success) {
                Alert.alert(resp.message)
            }

            if (resp.success) {
                setMail(form.email)
                Alert.prompt("Successfully signed in")
                router.push('/(tabs)/verify')
            }
        console.log(response)
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
                        <Text style={styles.title}>Get Started</Text>
                        <Text style={styles.para}>Create account for free.</Text>
                    </View>
                </View>
                <View style={styles.below}>
                    <TextInput style={styles.input} placeholder="first name" onChangeText={text => setForm(prev => ({ ...prev, firstName: text }))} value={form.firstName} />
                    <TextInput style={styles.input} placeholder="last name" onChangeText={text => setForm(prev => ({ ...prev, lastName: text }))} value={form.lastName} />
                    <TextInput style={styles.input} placeholder="email" keyboardType="email-address" onChangeText={text => setForm(prev => ({ ...prev, email: text }))}value={form.email} />
                    <TextInput style={styles.input} placeholder="password" secureTextEntry onChangeText={text => setForm(prev => ({ ...prev, password: text }))} value={form.password}/>
                </View>
                <View style={styles.buttons}>
                    <View style={styles.checkboxContainer}>
                        <Checkbox
                            value={isChecked}
                            onValueChange={setChecked}
                            color={isChecked ? '#4630EB' : undefined}
                        />
                        <Text style={styles.checkboxLabel}>By checking the box you agree to our <Text style={styles.highlight} onPress={() => router.push('/(tabs)/dashbaord')}>Terms and Conditions</Text>.</Text>
                    </View>
                        <Text style={styles.checkboxLabel}>Already have an account?<Text style={styles.highlight} onPress={() => router.push('/(tabs)/login')}>LogIn</Text>.</Text>
                        <Pressable style={styles.btn} onPress={Start}>
                            {({ pressed }) => (
                                <Text style={[styles.btnText, pressed && { opacity: 0.8 }]}>
                                    Next ➡
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
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
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
