import { useLocalSearchParams } from 'expo-router';
import ChatScreen from '../components/ChatScreen';

export default function ChatRoute() {
  const params = useLocalSearchParams();
  
  const routeParams = {
    chatId: (params.chatId as string) || (params.id as string) || '',
    recipientName: (params.recipientName as string) || 'Admin',
    recipientEmail: (params.recipientEmail as string) || '',
    currentUserEmail: (params.currentUserEmail as string) || '',
  };

  return <ChatScreen route={{ params: routeParams }} />;
}
