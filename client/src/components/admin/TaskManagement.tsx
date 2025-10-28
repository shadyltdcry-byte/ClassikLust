import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit3, Trash2, CheckSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: {
    type: string;
    target: number;
  };
  reward: {
    type: string;
    amount: number;
  };
  icon: string;
  isDaily: boolean;
  isEnabled: boolean;
  sortOrder: number;
}

const taskCategories = [
  { value: 'daily', label: 'Daily Tasks' },
  { value: 'energy', label: 'Energy Tasks' },
  { value: 'social', label: 'Social Tasks' },
  { value: 'progression', label: 'Progression' },
  { value: 'special', label: 'Special Events' }
];

const requirementTypes = [
  { value: 'login_streak', label: 'Login Streak' },
  { value: 'energy_gained', label: 'Energy Gained' },
  { value: 'messages_sent', label: 'Messages Sent' },
  { value: 'total_taps', label: 'Total Taps' },
  { value: 'level_reached', label: 'Level Reached' }
];

const rewardTypes = [
  { value: 'lp', label: 'Lust Points' },
  { value: 'energy', label: 'Energy' },
  { value: 'gems', label: 'Gems' },
  { value: 'character', label: 'Character Unlock' }
];

export default function TaskManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'daily',
    requirementType: 'login_streak',
    requirementTarget: 1,
    rewardType: 'lp',
    rewardAmount: 100,
    icon: '📋',
    isDaily: true,
    isEnabled: true,
    sortOrder: 1
  });

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/admin/tasks'],
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: (taskData: any) => fetch(`/api/admin/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      setShowDialog(false);
      resetForm();
      toast({ title: "Task created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...taskData }: any) => fetch(`/api/admin/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      setShowDialog(false);
      resetForm();
      toast({ title: "Task updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    }
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      toast({ title: "Task deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'daily',
      requirementType: 'login_streak',
      requirementTarget: 1,
      rewardType: 'lp',
      rewardAmount: 100,
      icon: '📋',
      isDaily: true,
      isEnabled: true,
      sortOrder: 1
    });
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description,
      category: task.category,
      requirementType: task.requirement.type,
      requirementTarget: task.requirement.target,
      rewardType: task.reward.type,
      rewardAmount: task.reward.amount,
      icon: task.icon,
      isDaily: task.isDaily,
      isEnabled: task.isEnabled,
      sortOrder: task.sortOrder
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const taskData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      requirement: {
        type: formData.requirementType,
        target: formData.requirementTarget
      },
      reward: {
        type: formData.rewardType,
        amount: formData.rewardAmount
      },
      icon: formData.icon,
      isDaily: formData.isDaily,
      isEnabled: formData.isEnabled,
      sortOrder: formData.sortOrder
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, ...taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const getCategoryLabel = (category: string) => {
    return taskCategories.find(cat => cat.value === category)?.label || category;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            Task Management
          </CardTitle>
          <Button 
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-create-task"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-400">No tasks found</div>
            ) : (
              tasks.map((task: Task) => (
                <div key={task.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{task.icon}</span>
                        <h4 className="text-white font-medium">{task.name}</h4>
                        {task.isDaily && (
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Daily</span>
                        )}
                        {!task.isEnabled && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Disabled</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{task.description}</p>
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>Category: {getCategoryLabel(task.category)}</span>
                        <span>Requirement: {task.requirement.target} {task.requirement.type}</span>
                        <span>Reward: +{task.reward.amount} {task.reward.type}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(task)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        data-testid={`button-edit-task-${task.id}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(task.id)}
                        data-testid={`button-delete-task-${task.id}`}
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
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-200">Task Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter task name"
                />
              </div>
              <div>
                <Label htmlFor="icon" className="text-gray-200">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="📋"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-200">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-gray-200">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="requirementType" className="text-gray-200">Requirement Type</Label>
                <Select value={formData.requirementType} onValueChange={(value) => setFormData({ ...formData, requirementType: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    {requirementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requirementTarget" className="text-gray-200">Requirement Target</Label>
                <Input
                  id="requirementTarget"
                  type="number"
                  value={formData.requirementTarget}
                  onChange={(e) => setFormData({ ...formData, requirementTarget: parseInt(e.target.value) || 1 })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="rewardType" className="text-gray-200">Reward Type</Label>
                <Select value={formData.rewardType} onValueChange={(value) => setFormData({ ...formData, rewardType: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select reward" />
                  </SelectTrigger>
                  <SelectContent>
                    {rewardTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rewardAmount" className="text-gray-200">Reward Amount</Label>
                <Input
                  id="rewardAmount"
                  type="number"
                  value={formData.rewardAmount}
                  onChange={(e) => setFormData({ ...formData, rewardAmount: parseInt(e.target.value) || 100 })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="sortOrder" className="text-gray-200">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDaily"
                  checked={formData.isDaily}
                  onChange={(e) => setFormData({ ...formData, isDaily: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isDaily" className="text-gray-200">Daily Task</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTask ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}