export type RootStackParamList = {
  Messages: undefined;
  Chat: {
    chatId: string;
    recipientName: string;
    recipientEmail: string;
    currentUserEmail: string;
  };
  ReservationDetails: {
    id: string;
  };
  // Add other screens here
};

// Extend the navigation type to include your custom screens
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}