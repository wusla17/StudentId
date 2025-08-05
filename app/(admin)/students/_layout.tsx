import React from 'react';
import { Stack } from 'expo-router';

export default function StudentsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="add-student" options={{ presentation: 'modal', title: 'Add New Student' }} />
    </Stack>
  );
}