// ========================================
// TOAST COMPONENT - NOTIFICATION SYSTEM
// ========================================
// Ang file na ito ay naghahandle ng toast notifications sa buong app
// May context provider para sa global toast management
// Support para sa different toast types: success, error, info

// Import ng React hooks at React Native components
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

// ========================================
// TYPE DEFINITIONS
// ========================================
// Mga type definitions para sa toast system

// Type para sa different toast types
type ToastType = 'success' | 'error' | 'info';

// Type para sa toast message structure
type ToastMessage = {
  id: number; // Unique identifier ng toast message
  text: string; // Message text na ipapakita
  type: ToastType; // Type ng toast (success, error, info)
};

// Type para sa toast context value
type ToastContextValue = {
  showToast: (text: string, type?: ToastType, durationMs?: number) => void; // Function para sa pag-show ng toast
};

// ========================================
// TOAST CONTEXT CREATION
// ========================================
// Gumagawa ng React Context para sa toast management
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ========================================
// USE TOAST HOOK
// ========================================
// Custom hook para sa pag-access ng toast context
// Nag-throw ng error kung ginamit outside ng ToastProvider
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((text: string, type: ToastType = 'info', durationMs: number = 3500) => {
    const id = ++counterRef.current;
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.container}>
        {messages.map((m) => (
          <ToastItem key={m.id} text={m.text} type={m.type} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

function ToastItem({ text, type }: { text: string; type: ToastType }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  const bg = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#374151';

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    maxWidth: '92%',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});


