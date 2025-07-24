
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { updatePushToken } from '@/services/googleSheetService'; // Keep for now, will remove later
import { VirtualIDCard } from '@/components/VirtualIDCard';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

export default function IDCardScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync(user.uid); // Use UID as identifier for push token
    }
  }, [user]);

  async function registerForPushNotificationsAsync(userId: string) {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
      // TODO: Update push token in Firestore for the user
      // await updatePushToken(userId, token); // This function needs to be adapted for Firestore
    } else {
      alert('Must use physical device for Push Notifications');
    }
  
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Welcome, {user?.email}!</Text>
      <Text style={{ color: colors.text }}>This is the ID Card Screen.</Text>
      {/* <VirtualIDCard student={student} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
  },
});
