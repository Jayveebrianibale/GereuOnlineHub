// ========================================
// PERSISTENT AUTH TEST COMPONENT
// ========================================
// Ang component na ito ay para sa testing ng persistent authentication
// I-display ang current authentication state at persistent data
// Para sa debugging at verification ng functionality

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    clearPersistentUserData,
    getRememberUserPreference,
    hasPersistentUserData,
    restorePersistentAppState,
    restorePersistentUserData
} from '../../utils/persistentAuthUtils';
import { useAuth } from '../hooks/useAuth';

export const PersistentAuthTest: React.FC = () => {
  const { user, role, isAuthenticated, isLoading, isRestoringSession } = useAuth();
  const [persistentData, setPersistentData] = useState<any>(null);
  const [appState, setAppState] = useState<any>(null);
  const [rememberPreference, setRememberPreference] = useState<boolean>(false);
  const [hasPersistent, setHasPersistent] = useState<boolean>(false);

  const loadPersistentData = async () => {
    try {
      const userData = await restorePersistentUserData();
      const appStateData = await restorePersistentAppState();
      const rememberPref = await getRememberUserPreference();
      const hasPersistentData = await hasPersistentUserData();

      setPersistentData(userData);
      setAppState(appStateData);
      setRememberPreference(rememberPref);
      setHasPersistent(hasPersistentData);
    } catch (error) {
      console.error('Error loading persistent data:', error);
    }
  };

  const clearPersistentData = async () => {
    try {
      await clearPersistentUserData();
      await loadPersistentData();
    } catch (error) {
      console.error('Error clearing persistent data:', error);
    }
  };

  useEffect(() => {
    loadPersistentData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Persistent Authentication Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Auth State</Text>
        <Text style={styles.text}>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Is Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Is Restoring Session: {isRestoringSession ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>User Email: {user?.email || 'None'}</Text>
        <Text style={styles.text}>User Role: {role || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Persistent Data</Text>
        <Text style={styles.text}>Has Persistent Data: {hasPersistent ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Remember Preference: {rememberPreference ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Persistent User Email: {persistentData?.email || 'None'}</Text>
        <Text style={styles.text}>Persistent User Role: {persistentData?.role || 'None'}</Text>
        <Text style={styles.text}>Last Login: {persistentData?.lastLoginTime ? new Date(persistentData.lastLoginTime).toLocaleString() : 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App State</Text>
        <Text style={styles.text}>Saved Route: {appState?.currentRoute || 'None'}</Text>
        <Text style={styles.text}>Saved Role: {appState?.userRole || 'None'}</Text>
        <Text style={styles.text}>Saved Time: {appState?.timestamp ? new Date(appState.timestamp).toLocaleString() : 'None'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={loadPersistentData}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearPersistentData}>
          <Text style={styles.buttonText}>Clear Persistent Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.45,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
