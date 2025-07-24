import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext is here

const AdminDashboard = () => {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <Link href="/(admin)/scan-qr" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Scan QR Code</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/(admin)/manage-guardians" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add/Manage Guardians</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/(admin)/update-fees" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Update Student Fees</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/(admin)/manage-permissions" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Manage Permissions</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/(admin)/add-user" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add User</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    marginTop: 30,
  },
});

export default AdminDashboard;
