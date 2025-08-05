import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';

interface UserProfile {
  uid: string;
  email: string | null;
  phoneNumber?: string | null;
  role: 'admin' | 'parent' | null;
  fullName?: string;
}

interface AuthContextType {
  user: FirebaseAuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data();
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            phoneNumber: profileData.phoneNumber || null,
            role: profileData.role || null,
            fullName: profileData.fullName || null,
          });
        } else {
          // This case should ideally not happen if user is authenticated via Firebase Auth
          // but doesn't have a Firestore profile. Handle gracefully.
          console.warn("User authenticated but no Firestore profile found.");
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect to redirect based on user role after loading
  useEffect(() => {
    if (!loading) {
      if (userProfile) {
        if (userProfile.role === 'admin') {
          router.replace('/(admin)');
        } else if (userProfile.role === 'parent') {
          router.replace('/(parent)');
        }
      } else if (!user) {
        // Only redirect to login if not loading and no user is present
        router.replace('/(auth)/login');
      }
    }
  }, [loading, user, userProfile]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.replace('/(auth)/login'); // Redirect to login after logout
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
