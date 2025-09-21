import { get, onValue, orderByChild, query, ref, update } from 'firebase/database';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { useAuthContext } from './AuthContext';

interface MessageContextType {
  unreadCount: number;
  markMessagesAsRead: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthContext();

  // Listen for unread messages
  useEffect(() => {
    if (!user?.email) {
      setUnreadCount(0);
      return;
    }

    const messagesRef = query(ref(db, "messages"), orderByChild("time"));
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Count unread messages for the current user
        const unreadMessages = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((msg: any) => {
            // Only count messages where user is recipient and message is unread
            const isUserRecipient = msg.recipientEmail === user.email;
            const isUnread = msg.senderEmail !== user.email;
            const deletedFor = msg.deletedFor || [];
            const isDeletedForUser = deletedFor.includes(user.email);
            const readBy = msg.readBy || [];
            const hasBeenRead = readBy.includes(user.email);
            
            return isUserRecipient && isUnread && !isDeletedForUser && !hasBeenRead;
          });

        setUnreadCount(unreadMessages.length);
      } else {
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [user?.email]);

  const markMessagesAsRead = async () => {
    if (!user?.email) return;
    
    try {
      // Get all messages where user is recipient
      const messagesRef = query(ref(db, "messages"), orderByChild("time"));
      
      const snapshot = await get(messagesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const updates: { [key: string]: any } = {};
        
        Object.keys(data).forEach((key) => {
          const msg = data[key];
          
          // Only mark messages as read if user is recipient and hasn't read them yet
          if (msg.recipientEmail === user.email) {
            const readBy = msg.readBy || [];
            if (!readBy.includes(user.email)) {
              updates[`messages/${key}/readBy`] = [...readBy, user.email];
            }
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
          console.log('Messages marked as read for user:', user.email);
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return (
    <MessageContext.Provider value={{ unreadCount, markMessagesAsRead }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};
