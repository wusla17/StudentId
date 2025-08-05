
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Student } from '@/services/googleSheetService';

interface VirtualIDCardProps {
  student: Student;
}

export const VirtualIDCard: React.FC<VirtualIDCardProps> = ({ student }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const rotate = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotate.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotate.value, [0, 1], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
    };
  });

  const onCardPress = () => {
    rotate.value = withTiming(rotate.value === 0 ? 1 : 0, { duration: 800 });
  };

  const qrCodeValue = JSON.stringify({ studentId: student.studentId });

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://i.imgur.com/gKM1gC8.png' }} style={styles.clip} />
      <Image source={{ uri: 'https://i.imgur.com/5g2cO5K.png' }} style={styles.lanyard} />

      <TouchableOpacity onPress={onCardPress} activeOpacity={0.9}>
        <Animated.View style={[styles.card, styles.cardFront, { backgroundColor: colors.cardBackground }, frontAnimatedStyle]}>
          <Text style={[styles.hostelName, { color: colors.text }]}>Hostel Name</Text>
          <Image source={{ uri: student.photoUrl }} style={styles.profilePic} />
          <Text style={[styles.studentName, { color: colors.text }]}>{student.studentName}</Text>
          <Text style={[styles.studentId, { color: colors.accent }]}>{student.studentId}</Text>
          <View style={styles.qrCodeContainer}>
            <QRCode value={qrCodeValue} size={120} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, { backgroundColor: colors.cardBackground }, backAnimatedStyle]}>
          <Text style={[styles.guardianTitle, { color: colors.text }]}>Guardians</Text>
          <ScrollView>
            {student.guardians.map((guardian, index) => (
              <View key={index} style={styles.guardianRow}>
                <Image source={{ uri: guardian.photo }} style={styles.guardianPhoto} />
                <View>
                  <Text style={[styles.guardianName, { color: colors.text }]}>{guardian.name}</Text>
                  <Text style={[styles.guardianRelation, { color: colors.accent }]}>{guardian.relation}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 80, // Space for lanyard and clip
  },
  clip: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
    position: 'absolute',
    top: 10,
    zIndex: 10,
  },
  lanyard: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
    position: 'absolute',
    top: 30,
    zIndex: 5,
  },
  card: {
    width: 320,
    height: 500,
    borderRadius: 20,
    padding: 20,
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  cardFront: {
    alignItems: 'center',
  },
  cardBack: {
    paddingTop: 30,
  },
  hostelName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    marginBottom: 20,
  },
  profilePic: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#5DADE2',
    marginBottom: 20,
  },
  studentName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
  },
  studentId: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    marginBottom: 20,
  },
  qrCodeContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  guardianTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  guardianRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
  },
  guardianPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  guardianName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
  },
  guardianRelation: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
});
