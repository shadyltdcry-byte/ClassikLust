
import { useState, useCallback } from 'react';

export function useGameDebugger() {
  const [debugState, setDebugState] = useState({
    playerId: '',
    playerLevel: 1,
    playerLP: 0,
    playerEnergy: 0,
    playerMaxEnergy: 1000,
    activeTab: 'main',
    isTapping: false,
    selectedCharacter: null,
    showOfflineDialog: false,
    showAdminMenu: false,
    showWheelGame: false,
    showVIP: false,
    renderCount: 0,
    lastUpdate: Date.now(),
    apiCalls: 0
  });

  const updateDebugState = useCallback((updates: Partial<typeof debugState>) => {
    setDebugState(prev => ({ ...prev, ...updates }));
  }, []);

  const trackApiCall = useCallback(() => {
    setDebugState(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }));
  }, []);

  const componentRefs = {};

  return {
    debugState,
    updateDebugState,
    trackApiCall,
    componentRefs
  };
}

// Re-export GameDebugger component from the correct location
export { default as GameDebugger } from '@/components/debug/GameDebugger';

export default useGameDebugger;
