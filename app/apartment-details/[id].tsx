import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function ApartmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Apartment Details for ID: {id}</Text>
    </View>
  );
} 