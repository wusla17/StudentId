import React from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ParentTabLayout() {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ID Card',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="id-card" color={color} />,
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: 'Fees',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="money" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}