import { useState, useEffect, useRef } from 'react';
import { deDupeFetch } from '@/lib/queryClient';

interface AuthState {
  userId: string | null;
  authSource: 'telegram' | 'supabase' | 'guest' | null;
  sessionAge: number; // in minutes
  lastLoginMethod: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthFlowConfig {
  telegramTimeout: number; // ms to wait for Telegram data
  supabaseTimeout: number; // ms to wait for Supabase session
  allowGuestFallback: boolean;
  debug: boolean;
}

const DEFAULT_CONFIG: AuthFlowConfig = {
  telegramTimeout: 15000, // 15 seconds - longer timeout
  supabaseTimeout: 5000, // 5 seconds  
  allowGuestFallback: false, // No guest mode - auth required
  debug: import.meta.env.DEV
};

export function useAuthFlow(config: Partial<AuthFlowConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    authSource: null,
    sessionAge: 0,
    lastLoginMethod: 'none',
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Update session age every minute
  useEffect(() => {
    if (!authState.isAuthenticated) return;
    
    const interval = setInterval(() => {
      const loginTime = localStorage.getItem('loginTimestamp');
      if (loginTime) {
        const ageMinutes = Math.floor((Date.now() - parseInt(loginTime)) / 60000);
        setAuthState(prev => ({ ...prev, sessionAge: ageMinutes }));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated]);

  // Centralized auth flow
  useEffect(() => {
    let aborted = false;
    
    const runAuthFlow = async () => {
      if (finalConfig.debug) {
        console.log('[useAuthFlow] Starting centralized auth flow...');
      }

      try {
        // Step 1: Check for Telegram data (with timeout)
        const telegramResult = await Promise.race([
          checkTelegramAuth(),
          new Promise<null>(resolve => 
            setTimeout(() => resolve(null), finalConfig.telegramTimeout)
          )
        ]);

        if (aborted) return;

        if (telegramResult) {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Telegram auth successful:', telegramResult);
          }
          updateAuthState(telegramResult);
          return;
        }

        // Step 2: Check Supabase session (with timeout)
        const supabaseResult = await Promise.race([
          checkSupabaseSession(),
          new Promise<null>(resolve => 
            setTimeout(() => resolve(null), finalConfig.supabaseTimeout)
          )
        ]);

        if (aborted) return;

        if (supabaseResult) {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Supabase auth successful:', supabaseResult);
          }
          updateAuthState(supabaseResult);
          return;
        }

        // Step 3: No guest fallback - require authentication
        if (finalConfig.debug) {
          console.log('[useAuthFlow] No authentication found, requiring Telegram login');
        }
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication required. Please log in through Telegram to access the game.'
        }));

      } catch (error) {
        if (!aborted) {
          console.error('[useAuthFlow] Auth flow error:', error);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication failed'
          }));
        }
      }
    };

    runAuthFlow();

    return () => {
      aborted = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Check Telegram authentication
  const checkTelegramAuth = async (): Promise<AuthState | null> => {
    try {
      // STEP 1: Check stored auth FIRST (this fixes persistence!)
      const storedToken = localStorage.getItem('telegramAuthToken');
      const storedUserId = localStorage.getItem('telegramUserId');
      const storedTelegramId = localStorage.getItem('telegramId');
      
      if (storedToken && storedUserId && storedTelegramId) {
        if (finalConfig.debug) {
          console.log('[useAuthFlow] Found stored auth, validating...');
        }
        
        try {
          const response = await fetch(`/api/auth/telegram/status/${storedTelegramId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache'
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.authenticated) {
              const loginTime = localStorage.getItem('loginTimestamp');
              const sessionAge = loginTime ? 
                Math.floor((Date.now() - parseInt(loginTime)) / 60000) : 0;
              
              if (finalConfig.debug) {
                console.log('[useAuthFlow] ✅ STORED AUTH SUCCESS - You stay logged in!');
              }
              
              return {
                userId: storedUserId,
                authSource: 'telegram' as const,
                sessionAge,
                lastLoginMethod: 'telegramStored',
                isAuthenticated: true,
                isLoading: false,
                error: null
              };
            }
          }
        } catch (error) {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Stored auth validation failed, clearing storage');
          }
          localStorage.removeItem('telegramAuthToken');
          localStorage.removeItem('telegramUserId'); 
          localStorage.removeItem('telegramId');
          localStorage.removeItem('loginTimestamp');
        }
      }

      // STEP 2: Check URL params (for initial login)
      const urlParams = new URLSearchParams(window.location.search);
      const telegramId = urlParams.get('telegramId');
      
      if (finalConfig.debug) {
        console.log('[useAuthFlow] No stored auth, checking URL params:', { telegramId, fullURL: window.location.href });
      }
      
      if (telegramId) {
        if (finalConfig.debug) {
          console.log('[useAuthFlow] Found telegramId in URL, checking auth status...');
        }
        
        const response = await deDupeFetch(`/api/auth/telegram/status/${telegramId}`);
        
        if (!response.ok) {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Telegram auth response not ok:', response.status);
          }
          return null;
        }
        
        const data = await response.json();
        
        if (finalConfig.debug) {
          console.log('[useAuthFlow] Telegram status response:', data);
        }
        
        if (data.authenticated && data.user && data.user.id) {
          try {
            localStorage.setItem('telegramAuthToken', data.token || 'no-token');
            localStorage.setItem('telegramUserId', data.user.id);
            localStorage.setItem('telegramId', telegramId);
            localStorage.setItem('loginTimestamp', Date.now().toString());
            
            if (finalConfig.debug) {
              console.log('[useAuthFlow] Telegram auth successful, cleaning URL...');
              console.log('[useAuthFlow] Stored user ID:', data.user.id);
            }
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            const authResult = {
              userId: data.user.id,
              authSource: 'telegram' as const,
              sessionAge: 0,
              lastLoginMethod: 'telegramUrl',
              isAuthenticated: true,
              isLoading: false,
              error: null
            };
            
            // Force immediate state update
            setAuthState(authResult);
            
            return authResult;
          } catch (storageError) {
            if (finalConfig.debug) {
              console.error('[useAuthFlow] LocalStorage error:', storageError);
            }
            throw storageError;
          }
        } else {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Invalid auth response:', data);
          }
        }
      }


      return null;
    } catch (error) {
      if (finalConfig.debug) {
        console.error('[useAuthFlow] Telegram auth check error:', error);
        console.error('[useAuthFlow] Error details:', error instanceof Error ? error.message : 'Unknown error');
      }
      return null;
    }
  };

  // Check Supabase session
  const checkSupabaseSession = async (): Promise<AuthState | null> => {
    // TODO: Implement Supabase session validation
    // For now, return null since we're not using Supabase auth yet
    return null;
  };

  // Create guest session
  const createGuestSession = (): AuthState => {
    let guestId = localStorage.getItem('guestUserId');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      localStorage.setItem('guestUserId', guestId);
    }
    localStorage.setItem('loginTimestamp', Date.now().toString());

    return {
      userId: guestId,
      authSource: 'guest',
      sessionAge: 0,
      lastLoginMethod: 'guestFallback',
      isAuthenticated: true,
      isLoading: false,
      error: null
    };
  };

  // Update auth state
  const updateAuthState = (newState: AuthState) => {
    if (mountedRef.current) {
      setAuthState(newState);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('telegramAuthToken');
    localStorage.removeItem('telegramUserId');
    localStorage.removeItem('telegramId');
    localStorage.removeItem('guestUserId');
    localStorage.removeItem('loginTimestamp');
    
    setAuthState({
      userId: null,
      authSource: null,
      sessionAge: 0,
      lastLoginMethod: 'none',
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  };

  // Login function (for external auth success)
  const login = (userId: string, authSource: 'telegram' | 'supabase' | 'guest', userData?: any) => {
    localStorage.setItem('loginTimestamp', Date.now().toString());
    
    if (authSource === 'telegram') {
      localStorage.setItem('telegramUserId', userId);
      if (userData?.token) {
        localStorage.setItem('telegramAuthToken', userData.token);
      }
      if (userData?.telegramId) {
        localStorage.setItem('telegramId', userData.telegramId);
      }
    } else if (authSource === 'guest') {
      localStorage.setItem('guestUserId', userId);
    }

    setAuthState({
      userId,
      authSource,
      sessionAge: 0,
      lastLoginMethod: authSource,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  };

  return {
    ...authState,
    login,
    logout,
    config: finalConfig
  };
}