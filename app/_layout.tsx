
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './context/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function useProtectedRoute(user, isReady) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return; // Only navigate if the layout is ready

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to the login page if not authenticated and not in the auth group
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to the app if authenticated and in the auth group
      router.replace('/(app)/(tabs)/dashboard');
    }
  }, [user, segments, router, isReady]);
}

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        // const token = await AsyncStorage.getItem('token');
        // if (token) {
        //   setUser(true);
        // } else {
        //   setUser(false);
        // }
        setUser(false);
      } catch (error) {
        console.error('Failed to fetch token:', error);
        setUser(false); // Assume not authenticated on error
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync(); // Hide the splash screen once auth state is determined
      }
    };

    checkToken();
  }, []);

  useProtectedRoute(user, isReady);

  if (!isReady) {
    return null; // Keep splash screen visible
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </AuthContext.Provider>
  );
}
