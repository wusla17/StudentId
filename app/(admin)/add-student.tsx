import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; // Adjust path as needed
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const REGISTRATION_EMAIL_DOMAIN = '@student-id.app'; // Consistent domain for fake emails

export default function AddStudentScreen() {
  const router = useRouter();

  // Student Information States
  const [studentFullName, setStudentFullName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentDateOfBirth, setStudentDateOfBirth] = useState('');

  // Guardian Information States
  const [guardianFullName, setGuardianFullName] = useState('');
  const [guardianPhoneNumber, setGuardianPhoneNumber] = useState('');
  const [guardianInitialPassword, setGuardianInitialPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // --- 1. Validate Inputs (Basic) ---
      if (!studentFullName || !studentClass || !studentDateOfBirth ||
          !guardianFullName || !guardianPhoneNumber || !guardianInitialPassword) {
        Alert.alert('Missing Information', 'Please fill in all required fields.');
        setLoading(false);
        return;
      }

      // --- 2. Create Guardian Auth Account ---
      const guardianEmail = `${guardianPhoneNumber}${REGISTRATION_EMAIL_DOMAIN}`;
      let guardianUid: string;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, guardianEmail, guardianInitialPassword);
        guardianUid = userCredential.user.uid;
        console.log('Guardian Firebase Auth account created with UID:', guardianUid);
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          Alert.alert('Account Exists', 'A guardian account with this phone number already exists.');
        } else {
          Alert.alert('Auth Error', `Failed to create guardian account: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      // --- 3. Create Guardian Firestore Document ---
      const guardianDocRef = doc(db, 'users', guardianUid);
      await setDoc(guardianDocRef, {
        fullName: guardianFullName,
        phoneNumber: guardianPhoneNumber,
        role: 'parent',
        uid: guardianUid,
        email: guardianEmail, // Store the generated email for reference
      });
      console.log('Guardian Firestore document created.');

      // --- 4. Create Student Firestore Document ---
      const studentsCollectionRef = collection(db, 'students');
      await addDoc(studentsCollectionRef, {
        fullName: studentFullName,
        className: studentClass,
        dateOfBirth: studentDateOfBirth,
        guardianUid: guardianUid, // Link student to guardian
      });
      console.log('Student Firestore document created and linked to guardian.');

      Alert.alert('Success', 'Student and guardian added successfully!');
      router.back(); // Navigate back after successful save

    } catch (error: any) {
      console.error('Error during save process:', error);
      Alert.alert('Error', `Failed to save details: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add New Student</Text>

      {/* Student Information Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={studentFullName}
          onChangeText={setStudentFullName}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Class"
          value={studentClass}
          onChangeText={setStudentClass}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD)"
          value={studentDateOfBirth}
          onChangeText={setStudentDateOfBirth}
          editable={!loading}
        />
      </View>

      {/* Guardian Information Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Guardian Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Guardian's Full Name"
          value={guardianFullName}
          onChangeText={setGuardianFullName}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Guardian's Phone Number (e.g., 9876543210)"
          value={guardianPhoneNumber}
          onChangeText={setGuardianPhoneNumber}
          keyboardType="phone-pad"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Initial Password for Guardian"
          value={guardianInitialPassword}
          onChangeText={setGuardianInitialPassword}
          secureTextEntry
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Saving data...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#90ee90',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
