import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import AdminShell from './AdminShell';

/**
 * 🔍 Floating Admin 2 Button
 * Clean floating button that opens the new modular admin system
 * Separate from existing admin - progressive feature rollout
 */
const FloatingAdminButton: React.FC = () => {
  const [showAdmin2, setShowAdmin2] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowAdmin2(true)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="lg"
      >
        <Settings className="w-5 h-5 mr-2" />
        Admin 2
      </Button>
      
      <AdminShell 
        isOpen={showAdmin2} 
        onClose={() => setShowAdmin2(false)} 
      />
    </>
  );
};

export default FloatingAdminButton;