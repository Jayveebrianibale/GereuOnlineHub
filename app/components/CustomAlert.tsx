import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ visible, title, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.alertContainer,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#333' : '#E5E5E5',
              transform: [{ scale: scaleValue }]
            }
          ]}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <ThemedText style={[styles.title, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
              {title}
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#10B981' }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.buttonText}>OK</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: 200,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
