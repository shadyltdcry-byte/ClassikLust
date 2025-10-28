import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import SessionDebugOverlay from '@/components/dev/SessionDebugOverlay';

interface AuthContextType {
  userId: string | null;
  authSource: 'telegram' | 'supabase' | 'guest' | null;
  sessionAge: number;
  lastLoginMethod: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (userId: string, authSource: 'telegram' | 'supabase' | 'guest', userData?: any) => void;
  logout: () => void;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use the new centralized auth flow hook
  const authFlow = useAuthFlow({
    telegramTimeout: 15000, // Longer timeout for better Telegram auth
    supabaseTimeout: 5000,
    allowGuestFallback: false, // No guest fallback - auth required
    debug: import.meta.env.DEV
  });

  // Legacy compatibility - support old login function signature
  const login = (userIdFromAuth: string, authSource: 'telegram' | 'supabase' | 'guest' = 'telegram', userData?: any) => {
    console.log('AuthContext: Logging in user via legacy method:', userIdFromAuth);
    authFlow.login(userIdFromAuth, authSource, userData);
  };

  // Support guest login for specific use cases
  const loginAsGuest = () => {
    console.warn('AuthContext: Guest login attempted - this is now discouraged');
    authFlow.login(`guest_${Date.now()}`, 'guest');
  };

  return (
    <AuthContext.Provider value={{
      userId: authFlow.userId,
      authSource: authFlow.authSource,
      sessionAge: authFlow.sessionAge,
      lastLoginMethod: authFlow.lastLoginMethod,
      isAuthenticated: authFlow.isAuthenticated,
      isLoading: authFlow.isLoading,
      error: authFlow.error,
      login,
      logout: authFlow.logout,
      loginAsGuest
    }}>
      {children}
      
      {/* Session Debug Overlay - only in development */}
      <SessionDebugOverlay
        userId={authFlow.userId}
        authSource={authFlow.authSource}
        sessionAge={authFlow.sessionAge}
        lastLoginMethod={authFlow.lastLoginMethod}
        isAuthenticated={authFlow.isAuthenticated}
        isLoading={authFlow.isLoading}
        error={authFlow.error}
        onLogout={authFlow.logout}
      />
    </AuthContext.Provider>
  );
};