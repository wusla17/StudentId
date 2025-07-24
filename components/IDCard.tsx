import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8; // 80% of screen width
const CARD_HEIGHT = CARD_WIDTH * 1.6; // Vertical aspect ratio

interface IDCardProps {
  profileImageUrl?: string;
  fullName: string;
  className: string;
  registrationNumber: string;
  guardianName: string;
  contactNumber: string;
}

export default function IDCard({
  profileImageUrl,
  fullName,
  className,
  registrationNumber,
  guardianName,
  contactNumber,
}: IDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotation = useSharedValue(0);

  // Animated style for the front of the card
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      rotation.value,
      [0, 180],
      [0, 180],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
    };
  });

  // Animated style for the back of the card
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      rotation.value,
      [0, 180],
      [180, 360],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
    };
  });

  // Tap gesture to trigger the flip animation
  const tapGesture = Gesture.Tap().onEnd(() => {
    if (isFlipped) {
      rotation.value = withTiming(0, { duration: 500 }); // Flip back to front
    } else {
      rotation.value = withTiming(180, { duration: 500 }); // Flip to back
    }
    setIsFlipped(!isFlipped);
  });

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={styles.cardContainer}>
        {/* Front of the card */}
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <View style={styles.imageContainer}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.detailLabel}>Class:</Text>
            <Text style={styles.detailValue}>{className}</Text>
            <Text style={styles.detailLabel}>Reg. No.:</Text>
            <Text style={styles.detailValue}>{registrationNumber}</Text>
          </View>
        </Animated.View>

        {/* Back of the card */}
        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailLabel}>Guardian:</Text>
            <Text style={styles.detailValue}>{guardianName}</Text>
            <Text style={styles.detailLabel}>Contact:</Text>
            <Text style={styles.detailValue}>{contactNumber}</Text>
          </View>
          <View style={styles.qrCodeContainer}>
            {registrationNumber && (
              <QRCode
                value={JSON.stringify({ type: "student_id", registrationNumber: registrationNumber })}
                size={CARD_WIDTH * 0.4}
                color="black"
                backgroundColor="white"
              />
            )}
            <Text style={styles.qrLabel}>Scan for Student Info</Text>
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
});