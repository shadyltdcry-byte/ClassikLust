import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, AlertCircle, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface UpgradeDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  baseCost: number;
  baseEffect: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel: number;
  requiredLevel: number;
  sortOrder: number;
  hourlyBonus: number;
  tapBonus: number;
  unlockRequirements?: {
    upgradeId?: string;
    level?: number;
  };
}

const UpgradeManagement: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingUpgrade, setEditingUpgrade] = useState<UpgradeDefinition | null>(null);
  const [formData, setFormData] = useState<Partial<UpgradeDefinition>>({});
  const queryClient = useQueryClient();

  const { data: upgrades, isLoading, error, refetch } = useQuery<UpgradeDefinition[]>({
    queryKey: ['admin-upgrade-definitions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/upgrade-definitions');
      if (!res.ok) throw new Error(`Failed to fetch upgrade definitions: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    staleTime: 30000
  });

  const createMutation = useMutation({
    mutationFn: async (upgradeData: Partial<UpgradeDefinition>) => {
      const res = await apiRequest('POST', '/api/admin/upgrade-definitions', upgradeData);
      if (!res.ok) throw new Error(`Failed to create upgrade: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-upgrade-definitions'] });
      setIsCreating(false);
      setFormData({});
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpgradeDefinition) => {
      const res = await apiRequest('PUT', `/api/admin/upgrade-definitions/${id}`, data);
      if (!res.ok) throw new Error(`Failed to update upgrade: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-upgrade-definitions'] });
      setEditingUpgrade(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/upgrade-definitions/${id}`);
      if (!res.ok) throw new Error(`Failed to delete upgrade: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-upgrade-definitions'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const upgradeData = {
      ...formData,
      baseCost: Number(formData.baseCost || 100),
      baseEffect: Number(formData.baseEffect || 1),
      costMultiplier: Number(formData.costMultiplier || 1.15),
      effectMultiplier: Number(formData.effectMultiplier || 1),
      maxLevel: Number(formData.maxLevel || 50),
      requiredLevel: Number(formData.requiredLevel || 1),
      sortOrder: Number(formData.sortOrder || 0),
      hourlyBonus: Number(formData.hourlyBonus || 0),
      tapBonus: Number(formData.tapBonus || 0)
    };

    if (editingUpgrade) {
      updateMutation.mutate({ ...upgradeData, id: editingUpgrade.id } as UpgradeDefinition);
    } else {
      createMutation.mutate(upgradeData);
    }
  };

  const startEdit = (upgrade: UpgradeDefinition) => {
    setEditingUpgrade(upgrade);
    setFormData(upgrade);
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingUpgrade(null);
    setFormData({});
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg text-white mb-2">Failed to Load Upgrade Definitions</h3>
            <p className="text-gray-400 mb-4">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Upgrade Definitions ({upgrades?.length || 0})
          </CardTitle>
          <Button 
            onClick={() => setIsCreating(true)} 
            className="bg-green-600 hover:bg-green-700"
            disabled={isCreating}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Upgrade
          </Button>
        </CardHeader>
        <CardContent>
          {isCreating && (
            <Card className="bg-gray-700 border-gray-600 mb-6">
              <CardHeader>
                <CardTitle className="text-white">
                  {editingUpgrade ? 'Edit Upgrade Definition' : 'Create New Upgrade Definition'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Name</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-gray-600 border-gray-500 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="key" className="text-white">Key</Label>
                      <Input
                        id="key"
                        value={formData.key || ''}
                        onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                        className="bg-gray-600 border-gray-500 text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-gray-600 border-gray-500 text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-white">Category</Label>
                      <Select 
                        value={formData.category || ''} 
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lpPerTap">LP Per Tap</SelectItem>
                          <SelectItem value="lpPerHour">LP Per Hour</SelectItem>
                          <SelectItem value="energy">Energy</SelectItem>
                          <SelectItem value="passive">Passive</SelectItem>
                          <SelectItem value="special">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="icon" className="text-white">Icon</Label>
                      <Input
                        id="icon"
                        value={formData.icon || ''}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="bg-gray-600 border-gray-500 text-white"
                        placeholder="🚀"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sortOrder" className="text-white">Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formData.sortOrder || 0}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="baseCost" className="text-white">Base Cost</Label>
                      <Input
                        id="baseCost"
                        type="number"
                        value={formData.baseCost || 100}
                        onChange={(e) => setFormData({ ...formData, baseCost: parseInt(e.target.value) })}
                        className="bg-gray-600 border-gray-500 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="baseEffect" className="text-white">Base Effect</Label>
                      <Input
                        id="baseEffect"
                        type="number"
                        step="0.1"
                        value={formData.baseEffect || 1}
                        onChange={(e) => setFormData({ ...formData, baseEffect: parseFloat(e.target.value) })}
                        className="bg-gray-600 border-gray-500 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="costMultiplier" className="text-white">Cost Multiplier</Label>
                      <Input
                        id="costMultiplier"
                        type="number"
                        step="0.01"
                        value={formData.costMultiplier || 1.15}
                        onChange={(e) => setFormData({ ...formData, costMultiplier: parseFloat(e.target.value) })}
                        className="bg-gray-600 border-gray-500 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLevel" className="text-white">Max Level</Label>
                      <Input
                        id="maxLevel"
                        type="number"
                        value={formData.maxLevel || 50}
                        onChange={(e) => setFormData({ ...formData, maxLevel: parseInt(e.target.value) })}
                        className="bg-gray-600 border-gray-500 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingUpgrade ? 'Update' : 'Create'}
                    </Button>
                    <Button 
                      type="button" 
                      onClick={cancelEdit}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading upgrade definitions...</div>
            </div>
          ) : !upgrades?.length ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No upgrade definitions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upgrades.map(upgrade => (
                <div key={upgrade.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{upgrade.icon}</span>
                        <h4 className="text-white font-medium">{upgrade.name}</h4>
                        <span className="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">
                          {upgrade.category}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{upgrade.description}</p>
                      <div className="grid grid-cols-4 gap-4 text-xs text-gray-300">
                        <span>Base Cost: {upgrade.baseCost.toLocaleString()} LP</span>
                        <span>Base Effect: {upgrade.baseEffect}</span>
                        <span>Max Level: {upgrade.maxLevel}</span>
                        <span>Required Level: {upgrade.requiredLevel}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => startEdit(upgrade)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => deleteMutation.mutate(upgrade.id)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradeManagement;