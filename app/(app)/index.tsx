import { StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/(auth)/login');
          return;
        }

        const response = await fetch("http://192.168.1.5:3000/api/auth/profile", {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();

        if (data.profile && data.profile.firstLogin) {
          // User is logged in for the first time, redirect to the setup page.
          router.replace('/auth/verify');
        } else {
          // User has already completed setup, redirect to the main dashboard/explore page.
          router.replace('/explore');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, redirect to login.
        router.replace('/(auth)/login');
      }
    };

    checkProfile();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});