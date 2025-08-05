import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function CommunicationScreen() {
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [targetGroup, setTargetGroup] = useState('all');

  const handleSendMessage = () => {
    if (!messageTitle || !messageBody) {
      Alert.alert('Missing Information', 'Please enter both title and message.');
      return;
    }

    console.log('Sending message:', { messageTitle, messageBody, targetGroup });

    Alert.alert(
      'Message Sent',
      `Title: ${messageTitle}\nBody: ${messageBody}\nTo: ${targetGroup.toUpperCase()}`
    );

    setMessageTitle('');
    setMessageBody('');
    setTargetGroup('all');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Send Broadcast Notification</Text>

        <Text style={styles.sectionTitle}>Message Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          value={messageTitle}
          onChangeText={setMessageTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notification Message Body"
          value={messageBody}
          onChangeText={setMessageBody}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.sectionTitle}>Target Audience</Text>
        <TextInput
          style={styles.input}
          placeholder="Target Group (e.g., all, parents, Class 5)"
          value={targetGroup}
          onChangeText={setTargetGroup}
        />

        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  sendButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
