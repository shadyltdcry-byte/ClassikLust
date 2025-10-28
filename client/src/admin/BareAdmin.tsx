import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingUp, X } from 'lucide-react';

// Bare-bones upgrades view (read-only)
const BareUpgrades: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/upgrades?userId=telegram_5134006535');
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  return (
    <div className="p-4 space-y-3">
      {loading && <div className="text-gray-300">Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="text-gray-400">No upgrades found</div>
      )}
      <div className="space-y-2">
        {items.map((u) => (
          <div key={u.id || u.key} className="bg-gray-800 border border-gray-700 p-3 rounded">
            <div className="text-white font-medium">{u.name}</div>
            <div className="text-gray-400 text-sm">Category: {u.category}</div>
            {typeof u.currentLevel !== 'undefined' && (
              <div className="text-gray-400 text-sm">Level: {u.currentLevel}</div>
            )}
            {typeof u.nextCost !== 'undefined' && u.nextCost !== null && (
              <div className="text-gray-400 text-sm">Next Cost: {u.nextCost}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface BareAdminProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * BareAdmin.tsx
 * Minimal admin menu with a single tab (Upgrades) and nothing else.
 * Safe, zero-coupling UI for progressive rollout.
 */
const BareAdmin: React.FC<BareAdminProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-700 p-0">
        <DialogHeader className="p-4 border-b border-gray-700">
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Admin (Bare)
          </DialogTitle>
          <Button onClick={onClose} variant="ghost" className="absolute right-3 top-3 text-gray-400 hover:text-white" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        {/* Only ONE tab: Upgrades (read-only) */}
        <BareUpgrades />
      </DialogContent>
    </Dialog>
  );
};

export default BareAdmin;
