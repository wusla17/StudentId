import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Adjust path as needed
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

interface StudentData {
  fullName: string;
  isOnLeave: boolean;
  // Add other student properties as needed
}

export default function AdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [onLeaveStudents, setOnLeaveStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef);
        const querySnapshot = await getDocs(q);

        let total = 0;
        let onLeave = 0;

        querySnapshot.forEach((doc) => {
          const student = doc.data() as StudentData;
          if (student.fullName) { // Simple check to ensure it's a student profile
            total++;
            if (student.isOnLeave) {
              onLeave++;
            }
          }
        });

        setTotalStudents(total);
        setOnLeaveStudents(onLeave);
        setPresentStudents(total - onLeave);
      } catch (error) {
        console.error("Error fetching student data for dashboard:", error);
        Alert.alert("Error", "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      {/* Student Overview Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{totalStudents}</Text>
            <Text style={styles.overviewLabel}>Total Students</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{presentStudents}</Text>
            <Text style={styles.overviewLabel}>Present</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{onLeaveStudents}</Text>
            <Text style={styles.overviewLabel}>On Leave</Text>
          </View>
        </View>
      </View>

      {/* Admin Actions Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Admin Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(admin)/scan-qr')}>
            <FontAwesome name="qrcode" size={40} color="#2196F3" />
            <Text style={styles.actionButtonText}>Scan Student QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(admin)/student-details')}>
            <FontAwesome name="user-plus" size={40} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Add New Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Manage Fees', 'Navigate to Manage Fees screen')}> {/* Placeholder */}
            <FontAwesome name="money" size={40} color="#FF9800" />
            <Text style={styles.actionButtonText}>Manage Fees</Text>
          </TouchableOpacity>
          {/* Add more action buttons as needed */}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  overviewLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  actionButton: {
    width: '45%', // Roughly two columns
    backgroundColor: '#e8f5e9', // Light background for buttons
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
});
