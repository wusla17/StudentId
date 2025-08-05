import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function AdminLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#D1D5DB', // Light gray
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="students"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name="th-large" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scan-qr"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name="dollar" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="communication"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name="external-link" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 10,
    borderTopWidth: 0,
  },
  tabItem: {
    paddingVertical: 10,
  },
});
