// ========================================
// SESSION STATUS COMPONENT
// ========================================
// Ang component na ito ay naghahandle ng session status display
// I-show ang current session information para sa debugging/testing
// Optional component na pwedeng i-remove sa production

import React from 'react';
import { Text, View } from 'react-native';
import { useSession } from '../contexts/SessionContext';

// ========================================
// SESSION STATUS COMPONENT
// ========================================
// Component na naghahandle ng session status display
// I-show ang current session information
export const SessionStatus: React.FC = () => {
  const { sessionState } = useSession();

  // I-calculate ang time remaining
  const timeRemaining = Math.max(0, SESSION_TIMEOUT - (Date.now() - sessionState.lastActivity));
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
  const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  return (
    <View style={{ 
      position: 'absolute', 
      top: 50, 
      right: 10, 
      backgroundColor: 'rgba(0,0,0,0.7)', 
      padding: 10, 
      borderRadius: 5,
      zIndex: 1000
    }}>
      <Text style={{ color: 'white', fontSize: 12 }}>
        Session: {sessionState.isActive ? 'Active' : 'Inactive'}
      </Text>
      <Text style={{ color: 'white', fontSize: 12 }}>
        Timeout: {minutesRemaining}:{secondsRemaining.toString().padStart(2, '0')}
      </Text>
    </View>
  );
};

// Constants
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
