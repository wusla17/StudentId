import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { CustomButton } from '@/components/CustomButton';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

const REGISTRATION_EMAIL_DOMAIN = '@student-id.app';

export default function AddUserScreen() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role is 'user'
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleCreateUser = async () => {
    setIsLoading(true);
    try {
      const email = `${registrationNumber}${REGISTRATION_EMAIL_DOMAIN}`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        registrationNumber: registrationNumber,
        role: role,
      });
      Alert.alert('Success', `User ${registrationNumber} (${role}) created successfully!`);
      setRegistrationNumber('');
      setPassword('');
      setRole('user');
    } catch (error: any) {
      let errorMessage = "An unknown error occurred. Please try again.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Error: This registration number is already taken.";
          break;
        case 'auth/weak-password':
          errorMessage = "Error: Password must be at least 6 characters long.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Error: The registration number is in an invalid format.";
          break;
        default:
          errorMessage = `An unknown error occurred: ${error.message}`;
          break;
      }
      Alert.alert('User Creation Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Add New User</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.accent }]}
        placeholder="Registration Number"
        placeholderTextColor={colors.icon}
        value={registrationNumber}
        onChangeText={setRegistrationNumber}
        keyboardType="default"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.accent }]}
        placeholder="Password"
        placeholderTextColor={colors.icon}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.roleSelectionContainer}>
        <Text style={[styles.roleLabel, { color: colors.text }]}>Select Role:</Text>
        <TouchableOpacity
          style={[styles.roleButton, role === 'user' && styles.roleButtonActive, { borderColor: colors.accent, backgroundColor: role === 'user' ? colors.tint : 'transparent' }]}
          onPress={() => setRole('user')}
        >
          <Text style={[styles.roleButtonText, { color: role === 'user' ? '#fff' : colors.text }]}>User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'admin' && styles.roleButtonActive, { borderColor: colors.accent, backgroundColor: role === 'admin' ? colors.tint : 'transparent' }]}
          onPress={() => setRole('admin')}
        >
          <Text style={[styles.roleButtonText, { color: role === 'admin' ? '#fff' : colors.text }]}>Admin</Text>
        </TouchableOpacity>
      </View>
      <CustomButton title="Create User" onPress={handleCreateUser} isLoading={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  roleSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  roleLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    marginHorizontal: 5,
  },
  roleButtonActive: {
    // backgroundColor: Colors.light.tint, // This will be dynamically set
  },
  roleButtonText: {
    fontSize: 16,
    // color: '#fff', // This will be dynamically set
  },
});
