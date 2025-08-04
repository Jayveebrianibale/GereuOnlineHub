import { useColorScheme as useSystemColorScheme } from 'react-native';

export function useColorScheme() {
  return useSystemColorScheme() || 'light';
}
