import { useLocalSearchParams } from 'expo-router';
import ChatScreen from '../components/ChatScreen';

export default function ChatRoute() {
  const params = useLocalSearchParams();
  
  // Convert params to the format expected by ChatScreen
  const routeParams = {
    chatId: params.chatId as string || '',
    recipientName: params.recipientName as string || 'Admin',
    recipientEmail: params.recipientEmail as string || '',
    currentUserEmail: params.currentUserEmail as string || '',
  };

  return <ChatScreen route={{ params: routeParams }} />;
}
