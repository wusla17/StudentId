import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { z } from 'zod';

// Define the validation schema for the login form
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export default function LoginScreen() {
 const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
 const { login } = useAuth();

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange', // Validate fields as the user types
    defaultValues: {
      email: '',
      password: '',
    }
  });

 const handleLogin = async (data) => {
    setServerError('');
  setLoading(true);
  try {
   await login(data.email, data.password);
      // On successful login, the AuthContext will handle navigation.
  } catch (err) {
      // Display any errors returned from the login function
   setServerError(err.message || 'An unknown error occurred.');
  } finally {
   setLoading(false);
  }
 };

 return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.innerContainer}>
        <ThemedText type="title" style={styles.header}>Welcome Back!</ThemedText>
        <ThemedText style={styles.subtitle}>Sign in to your account to continue</ThemedText>

        <View style={styles.inputContainer}>
            <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        placeholder="Email Address"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                    />
                )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

            <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(handleLogin)}
                    />
                )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}

        <TouchableOpacity
            style={[styles.loginButton, (!isValid || loading) && styles.loginButtonDisabled]}
            onPress={handleSubmit(handleLogin)}
            disabled={!isValid || loading}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <Text style={styles.loginButtonText}>Login</Text>
            )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
 );
}

const styles = StyleSheet.create({
 container: {
  flex: 1,
    backgroundColor: '#F8FAFC',
 },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
 header: {
  marginBottom: 8,
  color: '#1E293B',
    fontSize: 32,
    fontWeight: 'bold',
 },
 subtitle: {
  marginBottom: 40,
  color: '#64748B',
  fontSize: 16,
 },
  inputContainer: {
    width: '100%',
  },
 input: {
  backgroundColor: '#FFFFFF',
  height: 55,
  borderRadius: 12,
  paddingHorizontal: 15,
  marginBottom: 5, // Reduced margin
  width: '100%',
  fontSize: 16,
  borderColor: '#E2E8F0',
  borderWidth: 1,
    color: '#1E293B'
 },
  inputError: {
    borderColor: '#EF4444', // Red border for errors
  },
  errorText: {
    color: '#EF4444',
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginBottom: 15,
  },
 loginButton: {
  marginTop: 10,
  width: '100%',
  backgroundColor: '#1E293B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
 },
  loginButtonDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});