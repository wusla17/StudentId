import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function FeesScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.header}>Fee Status</ThemedText>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Current Balance</ThemedText>
          <ThemedText style={styles.feeAmount}>$500.00</ThemedText>
          <ThemedText style={styles.statusText}>Status: <ThemedText style={styles.statusPending}>Pending</ThemedText></ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Last Payment</ThemedText>
          <ThemedText style={styles.feeAmount}>$200.00</ThemedText>
          <ThemedText style={styles.statusText}>Date: 2024-07-20</ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Upcoming Due Date</ThemedText>
          <ThemedText style={styles.feeAmount}>August 15, 2024</ThemedText>
          <ThemedText style={styles.statusText}>Amount: $300.00</ThemedText>
        </ThemedView>

        <ThemedText style={styles.infoText}>
          For detailed payment history or to make a payment, please contact the school administration.
        </ThemedText>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#555',
  },
  statusPending: {
    color: '#FFA500', // Orange for pending
    fontWeight: 'bold',
  },
  infoText: {
    marginTop: 20,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },
});
