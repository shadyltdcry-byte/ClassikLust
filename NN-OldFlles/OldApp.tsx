import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GameGUI from "@/components/GameGUI";
import NotFound from "@/pages/not-found";
import { GameProvider } from "@/context/GameProvider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import LoginScreen from "@/components/LoginScreen";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameGUIPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function GameGUIPage() {
  return <GameGUI onPluginAction={(action) => {
    console.log('Plugin action:', action);
    // All plugin actions should be handled within GameGUI itself
  }} />;
}

function AppContent() {
  const { isLoading, isAuthenticated, login, loginAsGuest } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} onGuestLogin={loginAsGuest} />;
  }

  return (
    <GameProvider>
      <Router />
      <Toaster />
    </GameProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
