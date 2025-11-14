import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Sun, Baby, LucideScale, Upload } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Dashboard() {
    const [week, setWeeks] = useState(0);
    const [days, setDays] = useState(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    return;
                }

                const response = await fetch("https://garbha.onrender.com/api/auth/pregnancy-profile", {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setWeeks(data.profile.weeksPregnant);
                setDays(data.profile.pregnantDays);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const Weight_Click = () => {
        router.push('/(tabs)/weight');
    };
    const Kick_Click = () => {
        router.push('/(tabs)/kick');
    };
    const Upload_Click = () => {
        router.push('/(tabs)/file');
    };

    return (
        <View style={styles.container}>
            <View style={styles.above}>
                <View style={styles.cont}>
                    <Text style={{ fontSize: 22, fontWeight: "600", color: "white" }}>{days}</Text>
                    <Text style={{ fontSize: 12, color: "white" }}>Grown</Text>
                </View>
                <View style={styles.circle}>
                    <Text style={styles.text}>Week</Text>
                    <Text style={styles.num}>{week}</Text>
                </View>
                <View style={styles.cont}>
                    <Text style={{ fontSize: 22, fontWeight: "600", color: "white" }}>{270 - days}</Text>
                    <Text style={{ fontSize: 12, color: "white" }}>Days to grow</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Pressable style={styles.uploadButton} onPress={Upload_Click}>
                    {({ pressed }) => (
                        <Upload size={30} color="white" style={pressed && { opacity: 0.8 }} />
                    )}
                </Pressable>

                <View style={styles.notificationSection}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.noti}>
                        <Sun color={"gold"} size={35}></Sun>
                        <View>
                            <Text style={styles.title}>Sunny Day</Text>
                            <Text style={styles.values}>Take in Vitamin C today!</Text>
                        </View>
                    </View>
                    <View style={styles.noti}>
                        <Sun color={"gold"} size={35}></Sun>
                        <View>
                            <Text style={styles.title}>Stay Hydrated</Text>
                            <Text style={styles.values}>Drink plenty of water.</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card1}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Weight Tracker</Text>
                        <Pressable style={styles.btn} onPress={Weight_Click}>
                            {({ pressed }) => (
                                <Text style={[styles.btnText, pressed && { opacity: 0.8 }]}>Check Now</Text>
                            )}
                        </Pressable>
                    </View>
                    <LucideScale size={50} style={styles.cardIcon} color="white" />
                </View>

                <View style={styles.card2}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Kick Counter</Text>
                        <Pressable style={styles.btn} onPress={Kick_Click}>
                            {({ pressed }) => (
                                <Text style={[styles.btnText, pressed && { opacity: 0.8 }]}>Check Now</Text>
                            )}
                        </Pressable>
                    </View>
                    <Baby size={50} style={styles.cardIcon} color="white" />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0cfcdff"
    },
    above: {
        height: 250,
        backgroundColor: "#9A3D37",
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    cont: {
        alignItems: 'center',
    },
    circle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 2,
        borderColor: '#F4716A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F4716A',
    },
    num: {
        color: "white",
        fontSize: 45,
        fontWeight: "600"
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    uploadButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#F4716A',
        padding: 15,
        borderRadius: 50,
        zIndex: 1,
        elevation: 5,
    },
    notificationSection: {
        marginTop: 80, // To avoid upload button
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    noti: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: "500"
    },
    values: {
        fontSize: 14,
        color: '#666',
    },
    card1: {
        backgroundColor: "#715DE9",
        borderRadius: 15,
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    card2: {
        backgroundColor: "#31cf11ff",
        borderRadius: 15,
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    cardContent: {
        gap: 15,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: "500",
        color: "white",
    },
    cardIcon: {
        opacity: 0.8,
    },
    btn: {
        backgroundColor: "white",
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 25,
    },
    btnText: {
        color: "black",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
});
