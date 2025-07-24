
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { CustomButton } from '@/components/CustomButton';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

const REGISTRATION_EMAIL_DOMAIN = '@student-id.app';

export default function LoginScreen() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const email = `${registrationNumber}${REGISTRATION_EMAIL_DOMAIN}`;
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation is handled by AuthContext in _layout.tsx
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Login</Text>
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
      <CustomButton title="Login" onPress={handleLogin} isLoading={isLoading} />
      
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
});
