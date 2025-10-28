import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import BareAdmin from './BareAdmin';

const BareAdminButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-pink-600 hover:bg-pink-700 text-white shadow-lg"
        size="lg"
      >
        <Settings className="w-5 h-5 mr-2" />
        Admin
      </Button>
      <BareAdmin isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default BareAdminButton;
