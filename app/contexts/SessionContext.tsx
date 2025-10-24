// ========================================
// SESSION CONTEXT - PAMAMAHALA NG SESSION STATE
// ========================================
// Ang file na ito ay naghahandle ng session state sa buong app
// Ginagamit ang React Context API para sa global session management
// Nagpo-provide ng session functions at state sa lahat ng components

import React, { createContext, ReactNode, useContext } from 'react';
import { SessionState, useSessionManager } from '../hooks/useSessionManager';

// ========================================
// SESSION CONTEXT TYPE DEFINITION
// ========================================
// Interface na nagde-define ng structure ng session context
// Naglalaman ng session state at session management functions
interface SessionContextType {
  sessionState: SessionState;
  updateActivity: () => void;
  endSession: () => Promise<void>;
  saveAppState: (route: string) => Promise<void>;
  restoreAppState: () => Promise<any>;
}

// ========================================
// CREATE SESSION CONTEXT
// ========================================
// Gumagawa ng React Context para sa session management
// Undefined ang initial value kasi magse-set tayo ng value sa Provider
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ========================================
// SESSION PROVIDER COMPONENT
// ========================================
// Ang component na nagpo-provide ng session context sa buong app
// Dito naka-initialize ang session manager at na-pass sa context
interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const sessionManager = useSessionManager();

  return (
    <SessionContext.Provider value={sessionManager}>
      {children}
    </SessionContext.Provider>
  );
};

// ========================================
// USE SESSION HOOK
// ========================================
// Custom hook para sa pag-access ng session context
// I-check kung naka-provide ang context, kung hindi mag-throw ng error
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  
  return context;
};
