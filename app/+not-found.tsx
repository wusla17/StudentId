import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth, db } from '@/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// SVG component for the unplugged graphic
function UnpluggedIcon() {
  return (
    <Svg width="150" height="80" viewBox="0 0 150 80">
      <Path
        d="M1,40 H40 L45,30 H55 L60,40 H65 V50 H60 L55,60 H45 L40,50 H1 Z"
        stroke="#242424"
        strokeWidth="2"
        fill="none"
      />
      <Path d="M48,35 h4 v10 h-4 z" fill="#242424" />
      <Path
        d="M149,40 H110 L105,30 H95 L90,40 H85 V50 H90 L95,60 H105 L110,50 H149 Z"
        stroke="#242424"
        strokeWidth="2"
        fill="none"
      />
      <Path d="M98,35 h4 v10 h-4 z" fill="#242424" />
      <Path d="M70,30 L75,35" stroke="#242424" strokeWidth="1.5" />
      <Path d="M80,30 L75,35" stroke="#242424" strokeWidth="1.5" />
      <Path d="M70,60 L75,55" stroke="#242424" strokeWidth="1.5" />
      <Path d="M80,60 L75,55" stroke="#242424" strokeWidth="1.5" />
    </Svg>
  );
}

export default function NotFoundScreen() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          } else {
            setUserRole('parent'); 
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('parent');
        }
      } else {
        setUserRole('parent');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRedirect = () => {
    if (userRole === 'admin') {
      router.replace('/(admin)');
    } else {
      router.replace('/(parent)');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <ThemedView style={styles.container}>
        <UnpluggedIcon />
        <ThemedText style={styles.errorCode}>404</ThemedText>
        <ThemedText type="title" style={styles.title}>Oops! Page not Found</ThemedText>
        <ThemedText style={styles.subtitle}>
          The page you are looking for does not seem to exist.
        </ThemedText>
        
        {loading ? (
          <ActivityIndicator size="large" color="#242424" style={styles.loader} />
        ) : (
          <TouchableOpacity onPress={handleRedirect} style={styles.button}>
            <ThemedText style={styles.buttonText}>GO BACK HOME</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorCode: {
    fontSize: 64,
    fontWeight: '800',
    color: '#242424',
    marginTop: 20,
  },
  title: {
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
    maxWidth: 300,
    textAlign: 'center',
    lineHeight: 24,
  },
  loader: {
    marginTop: 30,
  },
  button: {
    borderWidth: 2,
    borderColor: '#242424',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 30,
  },
  buttonText: {
    color: '#242424',
    fontSize: 14,
    fontWeight: '700',
  },
});
