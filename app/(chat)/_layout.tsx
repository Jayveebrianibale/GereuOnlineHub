import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen name="chat/[id]" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}


