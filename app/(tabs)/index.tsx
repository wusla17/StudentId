import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Button, Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig'; // Adjust path as needed, import auth
import { signOut } from 'firebase/auth'; // Import signOut
import { useRouter } from 'expo-router'; // Import useRouter

import IDCard from '../../components/IDCard'; // Import the new IDCard component
import { useAuth } from '@/context/AuthContext';

interface StudentData {
  fullName: string;
  className: string;
  registrationNumber: string;
  guardianName: string;
  contactNumber: string;
  profileImageUrl?: string;
}

export default function IDCardScreen() {
  const { user, loading: authLoading } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const fetchStudentData = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setStudentData(docSnap.data() as StudentData);
          } else {
            console.log("No student data found for this user.");
            setStudentData(null); // Ensure data is null if not found
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
          setStudentData(null); // Ensure data is null on error
        } finally {
          setDataLoading(false);
        }
      } else if (!authLoading) {
        // If user is null and auth is not loading, then no user is logged in
        setDataLoading(false);
      }
    };

    if (!authLoading) {
      fetchStudentData();
    }
  }, [user, authLoading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login'); // Navigate to login screen after logout
    } catch (error: any) {
      console.error("Error signing out:", error.message);
      Alert.alert("Logout Error", "Failed to log out. Please try again.");
    }
  };

  if (authLoading || dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading ID Card...</Text>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={styles.container}>
        <Text>No ID card data available. Please ensure your profile is complete.</Text>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <IDCard
        profileImageUrl={studentData.profileImageUrl}
        fullName={studentData.fullName}
        className={studentData.className}
        registrationNumber={studentData.registrationNumber}
        guardianName={studentData.guardianName}
        contactNumber={studentData.contactNumber}
      />
      <View style={styles.logoutButtonContainer}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingBottom: 20, // Add some padding at the bottom for the button
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  logoutButtonContainer: {
    marginTop: 20, // Space between ID card and button
    width: '80%',
  },
});