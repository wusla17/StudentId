import React from 'react';
import { StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CustomButton from '@/components/CustomButton';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { userProfile, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Logout Error', error.message);
            }
          }
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Profile</ThemedText>

      <ThemedView style={styles.profileCard}>
        <ThemedText type="subtitle" style={styles.label}>Full Name:</ThemedText>
        <ThemedText style={styles.value}>{userProfile?.fullName || 'N/A'}</ThemedText>

        <ThemedText type="subtitle" style={styles.label}>Email:</ThemedText>
        <ThemedText style={styles.value}>{userProfile?.email || 'N/A'}</ThemedText>

        <ThemedText type="subtitle" style={styles.label}>Phone Number:</ThemedText>
        <ThemedText style={styles.value}>{userProfile?.phoneNumber || 'N/A'}</ThemedText>

        <ThemedText type="subtitle" style={styles.label}>Role:</ThemedText>
        <ThemedText style={styles.value}>{userProfile?.role || 'N/A'}</ThemedText>
      </ThemedView>

      <CustomButton
        title="Logout"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
  },
  header: {
    marginBottom: 30,
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#dc3545', // Red for logout
    width: '100%',
    maxWidth: 500,
  },
});
