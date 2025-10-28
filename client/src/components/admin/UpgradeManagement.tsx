import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, TrendingUp, Coins, Zap, Timer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';
import { keysToCamel } from '@/utils/helperFunctions';

interface Upgrade {
  id?: string;
  key?: string;
  name: string;
  description?: string;
  category: string;
  baseCost: number;
  baseEffect: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel?: number;
  requiredLevel?: number;
  levelRequirement?: number; // Legacy support
  currentLevel?: number; // From admin endpoint
  nextCost?: number; // From admin endpoint
  icon?: string;
  sortOrder?: number;
}

const upgradeCategories = [
  { value: 'tap', label: 'Tap Upgrades', icon: '👆' },
  { value: 'passive', label: 'Passive Upgrades', icon: '⚡' },
  { value: 'special', label: 'Special Upgrades', icon: '🎯' }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'tap': return '👆';
    case 'passive': return '⚡';
    case 'special': return '🎯';
    default: return '📈';
  }
};

export default function UpgradeManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingUpgrade, setEditingUpgrade] = useState<Upgrade | null>(null);
  const [formData, setFormData] = useState<Upgrade>({
    name: '',
    description: '',
    category: 'tap',
    baseCost: 100,
    baseEffect: 1,
    costMultiplier: 1.3,
    effectMultiplier: 1.15,
    maxLevel: 10,
    requiredLevel: 1
  });

  const queryClient = useQueryClient();

  // 🆕 FIXED: Switch to new admin upgrades endpoint with user decoration
  const { data: upgradesResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/upgrades'],
    queryFn: async () => {
      try {
        // Use new endpoint with userId to show current levels and costs
        const response = await fetch('/api/admin/upgrades?userId=telegram_5134006535');
        if (!response.ok) {
          throw new Error(`Failed to fetch upgrades: ${response.status}`);
        }
        const result = await response.json();
        console.log('📊 [ADMIN] Fetched upgrades:', result);
        return result;
      } catch (error) {
        console.error('❌ [ADMIN] Failed to fetch upgrades:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Extract upgrades from response
  const upgrades: Upgrade[] = upgradesResponse?.data ? upgradesResponse.data : [];

  const createMutation = useMutation({
    mutationFn: async (data: Upgrade) => {
      const response = await apiRequest('POST', '/api/admin/upgrades', data);
      if (!response.ok) throw new Error('Failed to create upgrade');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
      toast.success('Upgrade created!');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create upgrade')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Upgrade) => {
      const response = await apiRequest('PUT', `/api/admin/upgrades/${data.id}`, data);
      if (!response.ok) throw new Error('Failed to update upgrade');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
      toast.success('Upgrade updated!');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update upgrade')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/upgrades/${id}`);
      if (!response.ok) throw new Error('Failed to delete upgrade');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
      toast.success('Upgrade deleted!');
    },
    onError: () => toast.error('Failed to delete upgrade')
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'tap',
      baseCost: 100,
      baseEffect: 1,
      costMultiplier: 1.3,
      effectMultiplier: 1.15,
      maxLevel: 10,
      requiredLevel: 1
    });
    setEditingUpgrade(null);
  };

  const handleEdit = (upgrade: Upgrade) => {
    setEditingUpgrade(upgrade);
    setFormData({
      ...upgrade,
      // Ensure we use the correct field names
      requiredLevel: upgrade.requiredLevel || upgrade.levelRequirement || 1
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    console.log('📝 [ADMIN] Submitting upgrade:', formData);
    if (editingUpgrade) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryLabel = (category: string) => {
    return upgradeCategories.find(cat => cat.value === category)?.label || category;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Upgrade Management
          </CardTitle>
          <Button 
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-pink-600 hover:bg-pink-700"
            data-testid="button-create-upgrade"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Upgrade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-gray-400">Loading upgrades...</div>
            ) : upgrades.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-lg">No upgrades found</p>
                <p className="text-sm mt-2">Create your first upgrade to get started!</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-400 mb-4">
                  📈 Showing {upgrades.length} upgrades with current user levels
                </div>
                {upgrades.map((upgrade: Upgrade) => (
                  <div key={upgrade.id || upgrade.key} className="bg-gray-700 p-4 rounded border border-gray-600 hover:border-gray-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getCategoryIcon(upgrade.category)}</span>
                          <h4 className="text-white font-semibold">{upgrade.name}</h4>
                          {upgrade.currentLevel !== undefined && (
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                              Level {upgrade.currentLevel}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-300">Category: <span className="text-white">{getCategoryLabel(upgrade.category)}</span></p>
                            <p className="text-gray-300">Base Cost: <span className="text-yellow-400">{upgrade.baseCost.toLocaleString()} LP</span></p>
                            <p className="text-gray-300">Base Effect: <span className="text-green-400">+{upgrade.baseEffect}</span></p>
                          </div>
                          <div>
                            <p className="text-gray-300">Required Level: <span className="text-white">{upgrade.requiredLevel || upgrade.levelRequirement || 1}</span></p>
                            <p className="text-gray-300">Max Level: <span className="text-white">{upgrade.maxLevel || '∞'}</span></p>
                            {upgrade.nextCost !== undefined && (
                              <p className="text-gray-300">Next Cost: <span className="text-yellow-400">{upgrade.nextCost.toLocaleString()} LP</span></p>
                            )}
                          </div>
                        </div>
                        
                        {upgrade.description && (
                          <p className="text-gray-400 text-sm mt-2 italic">{upgrade.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(upgrade)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-600"
                          data-testid={`button-edit-upgrade-${upgrade.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(upgrade.id!)}
                          data-testid={`button-delete-upgrade-${upgrade.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getCategoryIcon(formData.category)}
                {editingUpgrade ? 'Edit Upgrade' : 'Create Upgrade'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-upgrade-name"
                  placeholder="Enter upgrade name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {upgradeCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white">
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="baseCost">Base Cost</Label>
                  <Input
                    id="baseCost"
                    type="number"
                    value={formData.baseCost}
                    onChange={(e) => setFormData({...formData, baseCost: parseFloat(e.target.value) || 0})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-base-cost"
                  />
                </div>
                <div>
                  <Label htmlFor="baseEffect">Base Effect</Label>
                  <Input
                    id="baseEffect"
                    type="number"
                    step="0.1"
                    value={formData.baseEffect}
                    onChange={(e) => setFormData({...formData, baseEffect: parseFloat(e.target.value) || 0})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-base-effect"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="costMultiplier">Cost Multiplier</Label>
                  <Input
                    id="costMultiplier"
                    type="number"
                    step="0.01"
                    value={formData.costMultiplier}
                    onChange={(e) => setFormData({...formData, costMultiplier: parseFloat(e.target.value) || 1})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-cost-multiplier"
                  />
                </div>
                <div>
                  <Label htmlFor="effectMultiplier">Effect Multiplier</Label>
                  <Input
                    id="effectMultiplier"
                    type="number"
                    step="0.01"
                    value={formData.effectMultiplier}
                    onChange={(e) => setFormData({...formData, effectMultiplier: parseFloat(e.target.value) || 1})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-effect-multiplier"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="requiredLevel">Required Level</Label>
                  <Input
                    id="requiredLevel"
                    type="number"
                    value={formData.requiredLevel}
                    onChange={(e) => setFormData({...formData, requiredLevel: parseInt(e.target.value) || 1})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-required-level"
                  />
                </div>
                <div>
                  <Label htmlFor="maxLevel">Max Level</Label>
                  <Input
                    id="maxLevel"
                    type="number"
                    value={formData.maxLevel || ''}
                    onChange={(e) => setFormData({...formData, maxLevel: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-max-level"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="textarea-upgrade-description"
                  placeholder="Describe what this upgrade does..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  className="bg-pink-600 hover:bg-pink-700 flex-1"
                  data-testid="button-save-upgrade"
                  disabled={!formData.name || formData.baseCost <= 0}
                >
                  {editingUpgrade ? '💾 Update' : '✨ Create'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-600"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}