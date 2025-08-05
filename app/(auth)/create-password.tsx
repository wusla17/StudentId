
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { updatePassword } from '@/services/googleSheetService';
import { CustomButton } from '@/components/CustomButton';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CreatePasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { rowIndex } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleCreatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long.');
        return;
    }

    setIsLoading(true);
    try {
      await updatePassword(Number(rowIndex), newPassword);
      Alert.alert('Success', 'Your password has been updated. Please log in again.');
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Create New Password</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.accent }]}
        placeholder="New Password"
        placeholderTextColor={colors.icon}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.accent }]}
        placeholder="Confirm New Password"
        placeholderTextColor={colors.icon}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <CustomButton title="Create Password" onPress={handleCreatePassword} isLoading={isLoading} />
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
    fontSize: 28,
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
