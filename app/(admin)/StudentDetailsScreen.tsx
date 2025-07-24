import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig'; // Adjust path as needed
import { useLocalSearchParams, useRouter } from 'expo-router';

// Interface for student data
interface StudentData {
  fullName: string;
  className: string;
  dateOfBirth: string;
  guardianName: string;
  profileImageUrl?: string;
}

export default function StudentDetailsScreen() {
  const router = useRouter();
  const { studentId: paramStudentId } = useLocalSearchParams(); // Get studentId from route params

  const [studentId, setStudentId] = useState<string | null>(null); // Internal state for studentId
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Effect to load existing student data if studentId is provided
  useEffect(() => {
    if (paramStudentId && typeof paramStudentId === 'string') {
      setStudentId(paramStudentId);
      const fetchStudentData = async () => {
        setLoading(true);
        try {
          const docRef = doc(db, 'users', paramStudentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as StudentData;
            setFullName(data.fullName || '');
            setClassName(data.className || '');
            setDateOfBirth(data.dateOfBirth || '');
            setGuardianName(data.guardianName || '');
            setProfileImageUri(data.profileImageUrl || null);
          } else {
            Alert.alert('Error', 'Student not found.');
            router.back(); // Go back if student not found
          }
        } catch (error) {
          console.error('Error fetching student data:', error);
          Alert.alert('Error', 'Failed to load student data.');
        } finally {
          setLoading(false);
        }
      };
      fetchStudentData();
    } else {
      // If no studentId, it's a new student, so ensure studentId state is null
      setStudentId(null);
    }
  }, [paramStudentId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, docId: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_images/${docId}/profile.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const saveDetails = async () => {
    setLoading(true);
    try {
      let imageUrl: string | undefined = profileImageUri || undefined;
      let currentDocId = studentId;

      // If it's a new student (no studentId yet), create a new document reference first
      if (!currentDocId) {
        const newDocRef = doc(collection(db, 'users')); // Get a new document reference with auto-generated ID
        currentDocId = newDocRef.id; // Use this ID for image upload and Firestore save
        setStudentId(currentDocId); // Update state for potential future edits
      }

      if (profileImageUri) {
        imageUrl = await uploadImage(profileImageUri, currentDocId);
      }

      const studentData: StudentData = {
        fullName,
        className,
        dateOfBirth,
        guardianName,
        profileImageUrl: imageUrl,
      };

      const docRef = doc(db, 'users', currentDocId);
      await setDoc(docRef, studentData, { merge: true }); // Use merge to update existing fields

      Alert.alert('Success', 'Student details saved successfully!');
      router.back(); // Navigate back after saving
    } catch (error) {
      console.error('Error saving student details:', error);
      Alert.alert('Error', 'Failed to save student details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{studentId ? 'Edit Student Details' : 'Add New Student'}</Text>

      <View style={styles.imageContainer}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text>No Image</Text>
          </View>
        )}
        <Button title="Pick Profile Image" onPress={pickImage} disabled={loading} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Class"
        value={className}
        onChangeText={setClassName}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Guardian's Name"
        value={guardianName}
        onChangeText={setGuardianName}
        editable={!loading}
      />

      <Button title="Save Details" onPress={saveDetails} disabled={loading} />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Saving...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
