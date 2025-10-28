import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit3, Trash2, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';

interface LevelRequirement {
  id?: string;
  level: number;
  lpRequired: number;
  description?: string;
  unlockRewards?: any[];
  functions?: any[];
  upgradeRequirements?: UpgradeRequirement[];
}

interface UpgradeRequirement {
  upgradeId: string;
  requiredLevel: number;
  upgradeName?: string;
}

export default function LevelManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelRequirement | null>(null);
  const [formData, setFormData] = useState<LevelRequirement>({
    level: 1,
    lpRequired: 0,
    description: '',
    unlockRewards: [],
    functions: [],
    upgradeRequirements: []
  });

  const queryClient = useQueryClient();

  const { data: levelRequirements = [], isLoading } = useQuery({
    queryKey: ['/api/admin/level-requirements'],
  });

  const { data: upgrades = [] } = useQuery({
    queryKey: ['/api/admin/upgrades'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: LevelRequirement) => {
      return await apiRequest('/api/admin/level-requirements', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/level-requirements'] });
      toast.success('Level requirement created!');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create level requirement')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LevelRequirement) => {
      return await apiRequest(`/api/admin/level-requirements/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/level-requirements'] });
      toast.success('Level requirement updated!');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update level requirement')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/level-requirements/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/level-requirements'] });
      toast.success('Level requirement deleted!');
    },
    onError: () => toast.error('Failed to delete level requirement')
  });

  const resetForm = () => {
    setFormData({
      level: 1,
      lpRequired: 0,
      description: '',
      unlockRewards: [],
      functions: [],
      upgradeRequirements: []
    });
    setEditingLevel(null);
  };

  const addUpgradeRequirement = () => {
    setFormData({
      ...formData,
      upgradeRequirements: [
        ...(formData.upgradeRequirements || []),
        { upgradeId: '', requiredLevel: 1 }
      ]
    });
  };

  const removeUpgradeRequirement = (index: number) => {
    const newRequirements = [...(formData.upgradeRequirements || [])];
    newRequirements.splice(index, 1);
    setFormData({ ...formData, upgradeRequirements: newRequirements });
  };

  const updateUpgradeRequirement = (index: number, field: string, value: any) => {
    const newRequirements = [...(formData.upgradeRequirements || [])];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    setFormData({ ...formData, upgradeRequirements: newRequirements });
  };

  const handleEdit = (level: LevelRequirement) => {
    setEditingLevel(level);
    setFormData(level);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingLevel) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-500" />
            Level Requirements Management
          </CardTitle>
          <Button 
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-pink-600 hover:bg-pink-700"
            data-testid="button-create-level"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Level
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : levelRequirements.length === 0 ? (
              <div className="text-center text-gray-400">No level requirements found</div>
            ) : (
              levelRequirements.map((level: LevelRequirement) => (
                <div key={level.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Level {level.level}</h4>
                      <p className="text-gray-300">LP Required: {level.lpRequired.toLocaleString()}</p>
                      {level.upgradeRequirements && level.upgradeRequirements.length > 0 && (
                        <div className="mt-2">
                          <p className="text-gray-400 text-xs">Upgrade Requirements:</p>
                          {level.upgradeRequirements.map((req: any, idx: number) => (
                            <p key={idx} className="text-gray-400 text-xs">
                              • {req.upgradeName || req.upgradeId}: Level {req.requiredLevel}
                            </p>
                          ))}
                        </div>
                      )}
                      {level.description && (
                        <p className="text-gray-400 text-sm mt-1">{level.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(level)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        data-testid={`button-edit-level-${level.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(level.id!)}
                        data-testid={`button-delete-level-${level.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>
                {editingLevel ? 'Edit Level Requirement' : 'Create Level Requirement'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-level"
                />
              </div>
              <div>
                <Label htmlFor="lpRequired">LP Required</Label>
                <Input
                  id="lpRequired"
                  type="number"
                  value={formData.lpRequired}
                  onChange={(e) => setFormData({...formData, lpRequired: parseInt(e.target.value)})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-lp-required"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="textarea-description"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Upgrade Requirements</Label>
                  <Button 
                    type="button"
                    size="sm"
                    onClick={addUpgradeRequirement}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-add-upgrade-requirement"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.upgradeRequirements?.map((req, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-700 p-2 rounded">
                      <Select 
                        value={req.upgradeId} 
                        onValueChange={(value) => updateUpgradeRequirement(index, 'upgradeId', value)}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500 text-white flex-1">
                          <SelectValue placeholder="Select upgrade" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-600 border-gray-500">
                          {upgrades.map((upgrade: any) => (
                            <SelectItem key={upgrade.id} value={upgrade.id}>
                              {upgrade.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Level"
                        value={req.requiredLevel}
                        onChange={(e) => updateUpgradeRequirement(index, 'requiredLevel', parseInt(e.target.value))}
                        className="bg-gray-600 border-gray-500 text-white w-20"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeUpgradeRequirement(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {(!formData.upgradeRequirements || formData.upgradeRequirements.length === 0) && (
                    <p className="text-gray-400 text-sm text-center py-2">No upgrade requirements</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  className="bg-pink-600 hover:bg-pink-700"
                  data-testid="button-save-level"
                >
                  {editingLevel ? 'Update' : 'Create'}
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