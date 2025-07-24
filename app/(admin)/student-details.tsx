import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function StudentDetailsScreen() {
  const { studentId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Student Details</Text>
      <Text style={[styles.detail, { color: colors.text }]}>Student ID: {studentId}</Text>
      <Text style={{ color: colors.text }}>Student details will be fetched from Firestore here.</Text>
      {/* Add buttons for Grant Leave and Update Fees, which will interact with Firestore */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
  },
  detail: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    marginBottom: 10,
  },
});