import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Clock, Gift } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface OfflineIncomeDialogProps {
  isOpen: boolean;
  onClaim: () => void;
  onClose: () => void;
  offlineLP: number;
  offlineDuration: number; // in milliseconds
}

export default function OfflineIncomeDialog({ 
  isOpen, 
  onClaim, 
  onClose,
  offlineLP,
  offlineDuration 
}: OfflineIncomeDialogProps) {
  const hours = Math.floor(offlineDuration / (1000 * 60 * 60));
  const minutes = Math.floor((offlineDuration % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900/95 to-pink-900/95 border border-purple-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Welcome Back!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6 py-4">
          {/* Offline Duration */}
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Clock className="w-5 h-5" />
            <span>You were away for {hours > 0 ? `${hours}h ` : ''}{minutes}m</span>
          </div>

          {/* Income Earned */}
          <div className="bg-black/30 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-6 h-6 text-yellow-400" />
              <span className="text-lg text-gray-300">Passive Income Earned</span>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <img src="/media/floatinghearts.png" alt="LP" className="w-8 h-8" />
              <span className="text-4xl font-bold text-yellow-400">
                +{Math.floor(offlineLP).toLocaleString()}
              </span>
              <span className="text-xl text-yellow-300">LP</span>
            </div>
          </div>

          {/* Warning */}
          <div className="text-sm text-gray-400 bg-amber-900/20 border border-amber-700/50 rounded-lg p-3">
            <p>⚠️ You must claim this to resume passive income collection!</p>
          </div>

          {/* Claim Button */}
          <Button
            onClick={onClaim}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          >
            <Heart className="w-5 h-5 mr-2" />
            Claim Passive Income
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}