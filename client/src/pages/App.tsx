import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GameGUI from "@/components/GameGUI";
import AdminMenu from "@/plugins/admin/AdminMenu";
import NotFound from "@/pages/not-found";
import { GameProvider } from "@/context/GameProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import TelegramAuth from "@/components/TelegramAuth";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">The application encountered an error.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for GameGUI to handle routing
function GameGUIPage() {
  const handlePluginAction = (action: string, data?: any) => {
    console.log('Plugin action:', action, data);
  };

  return (
    <ErrorBoundary>
      <GameGUI onPluginAction={handlePluginAction} />
    </ErrorBoundary>
  );
}

// Wrapper component for AdminMenu to handle routing  
function AdminMenuPage() {
  return (
    <ErrorBoundary>
      <AdminMenu onClose={() => {
        try {
          window.history.back();
        } catch (error) {
          // Fallback if history navigation fails
          window.location.href = '/';
        }
      }} />
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={GameGUIPage} />
        <Route path="/admin" component={AdminMenuPage} />
        <Route path="/AdminMenu" component={AdminMenuPage} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  // Force clear React Query cache on app start to fix phantom requests
  React.useEffect(() => {
    try {
      queryClient.clear();
    } catch (error) {
      console.warn('Failed to clear query client cache:', error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated, login } = useAuth();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      try {
        // Slower loading to allow image caching and prevent glitches
        const interval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 4; // Slower increment for better caching
          });
        }, 650); // Longer interval for smoother loading

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Loading progress error:', error);
        setInitError('Failed to initialize loading progress');
      }
    }
  }, [isLoading]);

  const handleAuthSuccess = (user: any) => {
    try {
      console.log('Authentication successful:', user);
      login(user.id, user);
    } catch (error) {
      console.error('Authentication error:', error);
      setInitError('Authentication failed');
    }
  };

  const handleAuthError = (error: any) => {
    console.error('Authentication error:', error);
    setInitError('Failed to authenticate with Telegram');
  };

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h1 className="text-2xl font-bold mb-4">Initialization Error</h1>
          <p className="text-gray-400 mb-4">{initError}</p>
          <button 
            onClick={() => {
              setInitError(null);
              window.location.reload();
            }} 
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <ErrorBoundary>
        <LoadingScreen progress={loadingProgress} />
      </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <TelegramAuth 
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GameProvider>
        <Router />
        <Toaster />
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;