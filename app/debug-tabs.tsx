import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function Tab1() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tab 1 - Home</Text>
      <Text style={styles.subtext}>Bottom tabs should be visible below</Text>
    </View>
  );
}

function Tab2() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tab 2 - Analytics</Text>
      <Text style={styles.subtext}>Bottom tabs should be visible below</Text>
    </View>
  );
}

function Tab3() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tab 3 - Users</Text>
      <Text style={styles.subtext}>Bottom tabs should be visible below</Text>
    </View>
  );
}

function Tab4() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tab 4 - Settings</Text>
      <Text style={styles.subtext}>Bottom tabs should be visible below</Text>
    </View>
  );
}

export default function DebugTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00B2FF',
        tabBarInactiveTintColor: '#0051C1',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="tab1"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
        component={Tab1}
      />
      <Tabs.Screen
        name="tab2"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="analytics" size={size} color={color} />,
        }}
        component={Tab2}
      />
      <Tabs.Screen
        name="tab3"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
        }}
        component={Tab3}
      />
      <Tabs.Screen
        name="tab4"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} />,
        }}
        component={Tab4}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001A5C',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 16,
    color: '#0051C1',
    textAlign: 'center',
  },
}); 