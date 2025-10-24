// ========================================
// ACTIVITY WRAPPER COMPONENT
// ========================================
// Ang component na ito ay naghahandle ng user activity tracking
// I-wrap ang screens para sa activity monitoring
// I-track ang user interactions para sa session management

import React from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { useSession } from '../contexts/SessionContext';

// ========================================
// ACTIVITY WRAPPER COMPONENT
// ========================================
// Higher-order component na naghahandle ng activity tracking
// I-wrap ang children para sa activity monitoring
interface ActivityWrapperProps {
  children: React.ReactNode;
}

export const ActivityWrapper: React.FC<ActivityWrapperProps> = ({ children }) => {
  const { updateActivity } = useSession();

  const handleTouch = () => {
    updateActivity();
  };

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};
