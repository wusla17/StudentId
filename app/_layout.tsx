import { AuthProvider, useAuth } from '@/context/AuthContext'; // Make sure the path is correct
import { auth, db } from '@/firebaseConfig'; // Make sure the path is correct
import { Slot, useRouter, useSegments } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// This component is the "Bouncer". It handles all navigation.
const InitialLayout = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until the auth state is fully loaded before trying to navigate
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      // User is logged in.
      // If they are on a page inside the (auth) group, redirect them away.
      if (inAuthGroup) {
         if (user.role === 'admin') {
            router.replace('/(admin)'); // Or your main admin screen
         } else {
            router.replace('/(parent)'); // Or your main parent/user screen
         }
      }
    } else if (!user) {
      // User is not logged in.
      // Redirect them to the login screen.
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, segments]);

  // Show a loading screen while we check for a logged-in user
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // If loading is complete, show the screen the user is supposed to see
  return <Slot />;
};


// This is the main layout of the app
export default function RootLayout() {
  // This useEffect hook runs only once to create the default admin
  useEffect(() => {
    const createDefaultAdmin = async () => {
      const adminEmail = 'admin@example.com';
      const adminPassword = 'admin123'; // Use a secure password

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const adminUid = userCredential.user.uid;
        
        await setDoc(doc(db, 'users', adminUid), {
          email: adminEmail,
          role: 'admin',
          createdAt: new Date(),
        });
        console.log("Default admin user created.");
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log("Default admin user already exists.");
        } else {
          console.error("Error creating default admin user:", error);
        }
      }
    };

    createDefaultAdmin();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}