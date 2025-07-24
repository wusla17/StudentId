import { Poppins_400Regular, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { auth, db } from '@/firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import GestureHandlerRootView

SplashScreen.preventAutoHideAsync();

const REGISTRATION_EMAIL_DOMAIN = '@student-id.app';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const setupAdmin = async () => {
      const ADMIN_SETUP_COMPLETE_KEY = 'admin_setup_complete';
      const adminEmail = `admin${REGISTRATION_EMAIL_DOMAIN}`;
      const adminPassword = '123'; // Consider making this more secure in a real app

      const setupComplete = await AsyncStorage.getItem(ADMIN_SETUP_COMPLETE_KEY);
      if (setupComplete === 'true') {
        console.log('Admin setup already complete (local flag found).');
        return;
      }

      console.log('Attempting to create default admin user...');
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);

        await setDoc(doc(db, "users", userCredential.user.uid), {
          registrationNumber: 'admin',
          role: 'admin',
          uid: userCredential.user.uid,
        });
        console.log('Default admin user created and role saved to Firestore.');
        await AsyncStorage.setItem(ADMIN_SETUP_COMPLETE_KEY, 'true');

      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log('Admin user already exists. Marking setup complete.');
          await AsyncStorage.setItem(ADMIN_SETUP_COMPLETE_KEY, 'true');
        } else {
          console.error('Error during admin setup:', error.code, error.message);
        }
      }
    };

    // Only run setup logic once after fonts are loaded and before navigation
    if (!loading) {
      setupAdmin();
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (role === 'admin') {
          router.replace('/(admin)');
        } else if (role) { // Ensure role is not null before navigating to tabs
          router.replace('/(tabs)');
        } else {
          // If user exists but role is not yet fetched or is null, wait or handle appropriately
          console.log("User logged in but role not yet determined or is null.");
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, loading, role]);

  if (loading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
    </Stack>
  );
}