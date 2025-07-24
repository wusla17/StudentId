import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Helper component for TabBar Icons
function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function AdminTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint, // Use theme color for active tab
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index" // This will be your Dashboard screen
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="students" // This will be your Students screen
        options={{
          title: 'Students',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />
      {/* Other admin screens are not part of the main tab bar */}
      {/* They can be accessed via Stack.Screen in a nested _layout or navigated to directly */}
      <Tabs.Screen name="scan-qr" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="add-user" options={{ href: null }} />
      <Tabs.Screen name="manage-guardians" options={{ href: null }} />
      <Tabs.Screen name="manage-permissions" options={{ href: null }} />
      <Tabs.Screen name="student-details" options={{ href: null }} />
      <Tabs.Screen name="update-fees" options={{ href: null }} />
    </Tabs>
  );
}