import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, Trophy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';

interface Achievement {
  id?: string;
  name: string;
  description?: string;
  category: string;
  baseRequirement: {
    type: string;
    baseTarget: number;
    multiplier: number;
  };
  levels: {
    level: number;
    target: number;
    reward: {
      type: string;
      amount: number;
    };
  }[];
  maxLevel: number;
  icon?: string;
  isHidden: boolean;
  isEnabled: boolean;
  sortOrder: number;
}

const achievementCategories = [
  { value: 'tapping', label: 'Tapping' },
  { value: 'chatting', label: 'Chatting' },
  { value: 'progression', label: 'Progression' },
  { value: 'special', label: 'Special' }
];

const requirementTypes = [
  { value: 'totalTaps', label: 'Total Taps' },
  { value: 'totalLpEarned', label: 'Total LP Earned' },
  { value: 'levelReached', label: 'Level Reached' },
  { value: 'chatMessages', label: 'Chat Messages' },
  { value: 'charactersUnlocked', label: 'Characters Unlocked' }
];

const rewardTypes = [
  { value: 'lp', label: 'LP' },
  { value: 'energy', label: 'Energy' },
  { value: 'charisma', label: 'Charisma' }
];

export default function AchievementManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState<Achievement>({
    name: '',
    description: '',
    category: 'tapping',
    baseRequirement: { type: 'totalTaps', baseTarget: 10, multiplier: 2 },
    levels: [
      { level: 1, target: 10, reward: { type: 'lp', amount: 100 } },
      { level: 2, target: 20, reward: { type: 'lp', amount: 200 } },
      { level: 3, target: 40, reward: { type: 'lp', amount: 400 } }
    ],
    maxLevel: 10,
    icon: '',
    isHidden: false,
    isEnabled: true,
    sortOrder: 0
  });

  const queryClient = useQueryClient();

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['/api/admin/achievements'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Achievement) => {
      return await apiRequest('/api/admin/achievements', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/achievements'] });
      toast.success('Achievement created!');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create achievement')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Achievement) => {
      return await apiRequest(`/api/admin/achievements/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/achievements'] });
      toast.success('Achievement updated!');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update achievement')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/achievements/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/achievements'] });
      toast.success('Achievement deleted!');
    },
    onError: () => toast.error('Failed to delete achievement')
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'tapping',
      requirement: { type: 'totalTaps', target: 100 },
      reward: { type: 'lp', amount: 500 },
      icon: '',
      isHidden: false,
      isEnabled: true,
      sortOrder: 0
    });
    setEditingAchievement(null);
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData(achievement);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingAchievement) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryLabel = (category: string) => {
    return achievementCategories.find(cat => cat.value === category)?.label || category;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-pink-500" />
            Achievement Management
          </CardTitle>
          <Button 
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-pink-600 hover:bg-pink-700"
            data-testid="button-create-achievement"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Achievement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : achievements.length === 0 ? (
              <div className="text-center text-gray-400">No achievements found</div>
            ) : (
              achievements.map((achievement: Achievement) => (
                <div key={achievement.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">{achievement.name}</h4>
                        {achievement.isHidden && <EyeOff className="w-4 h-4 text-gray-500" />}
                        {!achievement.isEnabled && <span className="text-red-400 text-xs">(Disabled)</span>}
                      </div>
                      <p className="text-gray-300">Category: {getCategoryLabel(achievement.category)}</p>
                      <p className="text-gray-300">
                        Requirement: {achievement.requirement?.target} {achievement.requirement?.type?.replace('_', ' ')}
                      </p>
                      <p className="text-gray-300">
                        Reward: {achievement.reward?.amount} {achievement.reward?.type}
                      </p>
                      {achievement.description && (
                        <p className="text-gray-400 text-sm mt-1">{achievement.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(achievement)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        data-testid={`button-edit-achievement-${achievement.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(achievement.id!)}
                        data-testid={`button-delete-achievement-${achievement.id}`}
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
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAchievement ? 'Edit Achievement' : 'Create Achievement'}
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
                  data-testid="input-achievement-name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="textarea-achievement-description"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-achievement-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {achievementCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Requirement Type</Label>
                  <Select 
                    value={formData.requirement?.type || 'total_taps'} 
                    onValueChange={(value) => setFormData({...formData, requirement: {...formData.requirement, type: value}})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-requirement-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {requirementTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    value={formData.requirement?.target || 100}
                    onChange={(e) => setFormData({...formData, requirement: {...formData.requirement, target: parseInt(e.target.value)}})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-target"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Reward Type</Label>
                  <Select 
                    value={formData.reward?.type || 'lp'} 
                    onValueChange={(value) => setFormData({...formData, reward: {...formData.reward, type: value}})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-reward-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {rewardTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.reward?.amount || 500}
                    onChange={(e) => setFormData({...formData, reward: {...formData.reward, amount: parseInt(e.target.value)}})}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-amount"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hidden"
                    checked={formData.isHidden}
                    onCheckedChange={(checked) => setFormData({...formData, isHidden: checked})}
                    data-testid="switch-hidden"
                  />
                  <Label htmlFor="hidden">Hidden</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.isEnabled}
                    onCheckedChange={(checked) => setFormData({...formData, isEnabled: checked})}
                    data-testid="switch-enabled"
                  />
                  <Label htmlFor="enabled">Enabled</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-sort-order"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  className="bg-pink-600 hover:bg-pink-700"
                  data-testid="button-save-achievement"
                >
                  {editingAchievement ? 'Update' : 'Create'}
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