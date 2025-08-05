import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions, ActivityIndicator } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate, 
  Extrapolate, 
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

export default function IDCard() {
  const { userProfile, loading: authLoading } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const rotation = useSharedValue(0);

  const gesture = Gesture.Tap().onEnd(() => {
    rotation.value = withSpring(rotation.value === 0 ? 180 : 0);
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [0, 180], Extrapolate.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden', // Hide back of the front card
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360], Extrapolate.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden', // Hide back of the back card
    };
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (userProfile && userProfile.uid && userProfile.role === 'parent') {
        try {
          const q = query(collection(db, 'students'), where('guardianUid', '==', userProfile.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            // Assuming one student per guardian for simplicity, or pick the first one
            setStudentData({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
          } else {
            console.log("No student found for this guardian.");
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchStudentData();
    }
  }, [userProfile, authLoading]);

  if (loading || authLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText>Loading ID Card...</ThemedText>
      </ThemedView>
    );
  }

  if (!studentData) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>No student data available for this guardian.</ThemedText>
      </ThemedView>
    );
  }

  const qrCodeValue = JSON.stringify({
    studentId: studentData.id,
    fullName: studentData.fullName,
    className: studentData.className,
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <Image
            source={studentData.profileImageUrl ? { uri: studentData.profileImageUrl } : require('@/assets/images/react-logo.png')}
            style={styles.profileImage}
          />
          <ThemedText type="title" style={styles.studentName}>{studentData.fullName}</ThemedText>
          <ThemedText style={styles.studentDetail}>Class: {studentData.className}</ThemedText>
          <ThemedText style={styles.studentDetail}>ID: {studentData.id.substring(0, 8)}...</ThemedText>
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <ThemedText type="subtitle" style={styles.backHeader}>Guardian Information</ThemedText>
          <ThemedText style={styles.backDetail}>Name: {userProfile?.fullName || 'N/A'}</ThemedText>
          <ThemedText style={styles.backDetail}>Phone: {userProfile?.phoneNumber || 'N/A'}</ThemedText>
          <ThemedText style={styles.backDetail}>Email: {userProfile?.email || 'N/A'}</ThemedText>
          <View style={styles.qrCodeContainer}>
            <QRCode
              value={qrCodeValue}
              size={CARD_WIDTH * 0.4}
              color="black"
              backgroundColor="white"
            />
            <ThemedText style={styles.qrLabel}>Scan for Student Details</ThemedText>
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardFront: {
    backgroundColor: '#6200EE', // Deep purple
  },
  cardBack: {
    backgroundColor: '#03DAC6', // Teal
    transform: [{ rotateY: '180deg' }], // Initially flipped
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  studentName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  studentDetail: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 3,
  },
  backHeader: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  backDetail: {
    color: '#333',
    fontSize: 15,
    marginBottom: 5,
  },
  qrCodeContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  qrLabel: {
    marginTop: 10,
    fontSize: 12,
    color: '#333',
  },
});
