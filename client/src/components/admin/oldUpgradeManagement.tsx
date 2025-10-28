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
import { Plus, Edit3, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';

interface UpgradeDef {
  id?: string;
  name: string;
  description?: string;
  category: string;
  baseCost: number;
  baseEffect: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel?: number;
<<<<<<< HEAD
  levelRequirement: number;
=======
  requiredLevel?: number;
  icon?: string;
  sortOrder?: number;
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
}

const upgradeCategories = [
  { value: 'lpPerHour', label: 'LP per Hour' },
  { value: 'energy', label: 'Energy Increase' },
  { value: 'lpPerTap', label: 'LP per Tap' }
];

export default function UpgradeManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<UpgradeDef | null>(null);
  const [formData, setFormData] = useState<UpgradeDef>({
    name: '',
    description: '',
    category: 'lpPerHour',
    baseCost: 100,
    baseEffect: 1,
    costMultiplier: 1.3,
    effectMultiplier: 1.15,
    maxLevel: 10,
    levelRequirement: 1
  });

  const queryClient = useQueryClient();

<<<<<<< HEAD
  const { data: rawUpgrades = [], isLoading } = useQuery({
    queryKey: ['/api/admin/upgrades'],
  });

  const upgrades: Upgrade[] = rawUpgrades ? keysToCamel(rawUpgrades) : [];

=======
  // Use canonical definitions endpoint (no userId)
  const { data: defs = [], isLoading, error, refetch } = useQuery<UpgradeDef[]>({
    queryKey: ['upgrade-definitions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/upgrade-definitions', { headers: { 'Cache-Control': 'no-cache' }});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    },
    staleTime: 5000,
    retry: 1,
  });

>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
  const createMutation = useMutation({
    mutationFn: async (data: UpgradeDef) => {
      const response = await apiRequest('POST', '/api/admin/upgrade-definitions', data);
      if (!response.ok) throw new Error('Failed to create upgrade');
      return response.json();
    },
    onSuccess: () => {
<<<<<<< HEAD
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
=======
      queryClient.invalidateQueries({ queryKey: ['upgrade-definitions'] });
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
      toast.success('Upgrade created!');
      setShowDialog(false);
      setEditing(null);
      setFormData({ ...formData, name: '' });
    },
    onError: () => toast.error('Failed to create upgrade')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpgradeDef) => {
      const response = await apiRequest('PUT', `/api/admin/upgrade-definitions/${data.id}`, data);
      if (!response.ok) throw new Error('Failed to update upgrade');
      return response.json();
    },
    onSuccess: () => {
<<<<<<< HEAD
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
=======
      queryClient.invalidateQueries({ queryKey: ['upgrade-definitions'] });
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
      toast.success('Upgrade updated!');
      setShowDialog(false);
      setEditing(null);
    },
    onError: () => toast.error('Failed to update upgrade')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/upgrade-definitions/${id}`);
      if (!response.ok) throw new Error('Failed to delete upgrade');
      return response.json();
    },
    onSuccess: () => {
<<<<<<< HEAD
      queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] });
=======
      queryClient.invalidateQueries({ queryKey: ['upgrade-definitions'] });
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
      toast.success('Upgrade deleted!');
    },
    onError: () => toast.error('Failed to delete upgrade')
  });

<<<<<<< HEAD
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'lpPerHour',
      baseCost: 100,
      baseEffect: 1,
      costMultiplier: 1.3,
      effectMultiplier: 1.15,
      maxLevel: 10,
      levelRequirement: 1
    });
    setEditingUpgrade(null);
  };

  const handleEdit = (upgrade: Upgrade) => {
    setEditingUpgrade(upgrade);
    setFormData(upgrade);
=======
  const getCategoryLabel = (v: string) => upgradeCategories.find(c => c.value === v)?.label || v;

  const handleEdit = (u: UpgradeDef) => {
    setEditing(u);
    setFormData({ ...u });
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
    setShowDialog(true);
  };

  const handleSubmit = () => {
<<<<<<< HEAD
    console.log("SUBMITTING:", formData); // see values before sending
    if (editingUpgrade) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryLabel = (category: string) => {
    return upgradeCategories.find(cat => cat.value === category)?.label || category;
  };

=======
    if (editing?.id) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Upgrade Definitions
          </CardTitle>
          <Button 
            onClick={() => { setEditing(null); setShowDialog(true); }}
            className="bg-pink-600 hover:bg-pink-700"
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
<<<<<<< HEAD
              <div className="text-center text-gray-400">Loading...</div>
            ) : upgrades.length === 0 ? (
              <div className="text-center text-gray-400">No upgrades found</div>
            ) : (
              upgrades.map((upgrade: Upgrade) => (
                <div key={upgrade.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{upgrade.name}</h4>
                      <p className="text-gray-300">Category: {getCategoryLabel(upgrade.category)}</p>
                      <p className="text-gray-300">Base Cost: {upgrade.baseCost} LP | Effect: +{upgrade.baseEffect}</p>
                      <p className="text-gray-300">Level Required: {upgrade.levelRequirement}</p>
                      {upgrade.description && (
                        <p className="text-gray-400 text-sm mt-1">{upgrade.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
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
=======
              <div className="text-center text-gray-400 py-8">Loading definitions…</div>
            ) : error ? (
              <div className="text-center text-gray-400 py-8">API error loading definitions. <Button size="sm" className="ml-2" onClick={() => refetch()}>Retry</Button></div>
            ) : defs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No upgrade definitions found.</div>
            ) : (
              defs.map((u) => (
                <div key={u.id || u.key} className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{u.name}</h4>
                      <div className="text-sm text-gray-300 flex gap-4">
                        <span>Category: {getCategoryLabel(u.category)}</span>
                        <span>Base Cost: {u.baseCost.toLocaleString()} LP</span>
                        <span>Base Effect: +{u.baseEffect}</span>
                        <span>Max Level: {u.maxLevel ?? '∞'}</span>
                      </div>
                      {u.description && <p className="text-gray-400 text-sm mt-1">{u.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => u.id && deleteMutation.mutate(u.id)}>Delete</Button>
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
            <DialogHeader>
<<<<<<< HEAD
              <DialogTitle>
                {editingUpgrade ? 'Edit Upgrade' : 'Create Upgrade'}
              </DialogTitle>
=======
              <DialogTitle>{editing ? 'Edit Upgrade' : 'Create Upgrade'}</DialogTitle>
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
<<<<<<< HEAD
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-upgrade-name"
                />
=======
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-gray-700 border-gray-600 text-white" />
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {upgradeCategories.map(cat => (
<<<<<<< HEAD
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
=======
                      <SelectItem key={cat.value} value={cat.value} className="text-white">{cat.icon} {cat.label}</SelectItem>
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="baseCost">Base Cost</Label>
<<<<<<< HEAD
                  <Input
                    id="baseCost"
                    type="number"
                    value={formData.baseCost}
                    onChange={(e) => setFormData({...formData, baseCost: parseFloat(e.target.value)})}
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
                    onChange={(e) => setFormData({...formData, baseEffect: parseFloat(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-base-effect"
                  />
=======
                  <Input id="baseCost" type="number" value={formData.baseCost} onChange={(e) => setFormData({ ...formData, baseCost: parseFloat(e.target.value) || 0 })} className="bg-gray-700 border-gray-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="baseEffect">Base Effect</Label>
                  <Input id="baseEffect" type="number" step="0.1" value={formData.baseEffect} onChange={(e) => setFormData({ ...formData, baseEffect: parseFloat(e.target.value) || 0 })} className="bg-gray-700 border-gray-600 text-white" />
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="costMultiplier">Cost Multiplier</Label>
<<<<<<< HEAD
                  <Input
                    id="costMultiplier"
                    type="number"
                    step="0.1"
                    value={formData.costMultiplier}
                    onChange={(e) => setFormData({...formData, costMultiplier: parseFloat(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-cost-multiplier"
                  />
                </div>
                <div>
                  <Label htmlFor="effectMultiplier">Effect Multiplier</Label>
                  <Input
                    id="effectMultiplier"
                    type="number"
                    step="0.1"
                    value={formData.effectMultiplier}
                    onChange={(e) => setFormData({...formData, effectMultiplier: parseFloat(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-effect-multiplier"
                  />
=======
                  <Input id="costMultiplier" type="number" step="0.01" value={formData.costMultiplier} onChange={(e) => setFormData({ ...formData, costMultiplier: parseFloat(e.target.value) || 1 })} className="bg-gray-700 border-gray-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="effectMultiplier">Effect Multiplier</Label>
                  <Input id="effectMultiplier" type="number" step="0.01" value={formData.effectMultiplier} onChange={(e) => setFormData({ ...formData, effectMultiplier: parseFloat(e.target.value) || 1 })} className="bg-gray-700 border-gray-600 text-white" />
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
<<<<<<< HEAD
                  <Label htmlFor="levelRequirement">Level Required</Label>
                  <Input
                    id="levelRequirement"
                    type="number"
                    value={formData.levelRequirement}
                    onChange={(e) => setFormData({...formData, levelRequirement: parseInt(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-level-requirement"
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
                  />
=======
                  <Label htmlFor="requiredLevel">Required Level</Label>
                  <Input id="requiredLevel" type="number" value={formData.requiredLevel} onChange={(e) => setFormData({ ...formData, requiredLevel: parseInt(e.target.value) || 1 })} className="bg-gray-700 border-gray-600 text-white" />
                </div>
                <div>
                  <Label htmlFor="maxLevel">Max Level</Label>
                  <Input id="maxLevel" type="number" value={formData.maxLevel ?? ''} onChange={(e) => setFormData({ ...formData, maxLevel: e.target.value ? parseInt(e.target.value) : undefined })} className="bg-gray-700 border-gray-600 text-white" placeholder="Unlimited" />
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
<<<<<<< HEAD
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="textarea-upgrade-description"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  className="bg-pink-600 hover:bg-pink-700"
                  data-testid="button-save-upgrade"
                >
                  {editingUpgrade ? 'Update' : 'Create'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-600"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
=======
                <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-gray-700 border-gray-600 text-white" placeholder="Describe what this upgrade does..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="bg-pink-600 hover:bg-pink-700 flex-1" disabled={!formData.name || formData.baseCost <= 0}>{editing ? '💾 Update' : '✨ Create'}</Button>
                <Button variant="outline" onClick={() => setShowDialog(false)} className="border-gray-600 text-gray-300 hover:bg-gray-600">Cancel</Button>
>>>>>>> 6c7bfde9877f32c10209d04425a480e4a0459da7
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}