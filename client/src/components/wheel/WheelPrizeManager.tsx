import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Gift, Coins, Zap, Gamepad2, Star, Crown, Heart, X } from "lucide-react";

interface WheelPrizeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WheelPrize {
  id?: string;
  type: string;
  label: string;
  min: number;
  max: number;
  probability: number;
  characterid?: string;
  upgradeId?: string;
  isSpecial?: boolean;
}

const PRIZE_TYPES = [
  { value: 'coins', label: 'Coins (LP)', icon: Coins, color: 'text-yellow-400' },
  { value: 'energy', label: 'Energy', icon: Zap, color: 'text-blue-400' },
  { value: 'character', label: 'Character Unlock', icon: Gamepad2, color: 'text-purple-400' },
  { value: 'upgrade', label: 'Upgrade Unlock', icon: Star, color: 'text-green-400' },
  { value: 'gems', label: 'Premium Gems', icon: Crown, color: 'text-pink-400' },
  { value: 'hearts', label: 'Love Hearts', icon: Heart, color: 'text-red-400' },
  { value: 'nothing', label: 'No Prize', icon: X, color: 'text-gray-400' },
  { value: 'special', label: 'Special Event', icon: Gift, color: 'text-orange-400' }
];

export default function WheelPrizeManager({ isOpen, onClose }: WheelPrizeManagerProps) {
  const [newPrize, setNewPrize] = useState<WheelPrize>({
    type: 'coins',
    label: '',
    min: 0,
    max: 0,
    probability: 0.1
  });
  
  const queryClient = useQueryClient();

  // Fetch available data for selects
  const { data: characters = [] } = useQuery({
    queryKey: ["/api/characters"],
    enabled: isOpen
  });

  const { data: upgrades = [] } = useQuery({
    queryKey: ["/api/upgrades"],
    enabled: isOpen
  });

  const { data: wheelPrizes = [] } = useQuery({
    queryKey: ["/api/admin/wheel-prizes"],
    enabled: isOpen
  });

  // Create prize mutation
  const createPrizeMutation = useMutation({
    mutationFn: async (prize: WheelPrize) => {
      const response = await apiRequest("POST", "/api/admin/wheel-prizes", prize);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wheel-prizes"] });
      setNewPrize({
        type: 'coins',
        label: '',
        min: 0,
        max: 0,
        probability: 0.1
      });
      toast.success("Prize created successfully");
    },
    onError: () => {
      toast.error("Failed to create prize");
    }
  });

  // Delete prize mutation
  const deletePrizeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/wheel-prizes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wheel-prizes"] });
      toast.success("Prize deleted successfully");
    }
  });

  const handleCreatePrize = () => {
    if (!newPrize.label || newPrize.probability <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    createPrizeMutation.mutate(newPrize);
  };

  const handleTypeChange = (type: string) => {
    const typeInfo = PRIZE_TYPES.find(t => t.value === type);
    setNewPrize(prev => ({
      ...prev,
      type,
      label: typeInfo?.label || '',
      min: type === 'coins' ? 100 : type === 'energy' ? 25 : 1,
      max: type === 'coins' ? 1000 : type === 'energy' ? 100 : 1
    }));
  };

  const totalProbability = wheelPrizes.reduce((sum: number, prize: any) => sum + (prize.probability || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-lg text-white border-0">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-400" />
            Wheel Prize Manager
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 flex-1 min-h-0">
          {/* Create New Prize */}
          <Card className="bg-slate-800/40 backdrop-blur border-slate-600/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Prize
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Prize Type</Label>
                  <Select value={newPrize.type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {PRIZE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          <div className="flex items-center gap-2">
                            <type.icon className={`w-4 h-4 ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Display Label</Label>
                  <Input
                    value={newPrize.label}
                    onChange={(e) => setNewPrize(prev => ({ ...prev, label: e.target.value }))}
                    className="bg-slate-700/50 border-slate-600/50 text-white"
                    placeholder="Prize display name"
                  />
                </div>

                {newPrize.type !== 'nothing' && (
                  <>
                    <div>
                      <Label className="text-slate-300">Minimum Value</Label>
                      <Input
                        type="number"
                        value={newPrize.min}
                        onChange={(e) => setNewPrize(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                        className="bg-slate-700/50 border-slate-600/50 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300">Maximum Value</Label>
                      <Input
                        type="number"
                        value={newPrize.max}
                        onChange={(e) => setNewPrize(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                        className="bg-slate-700/50 border-slate-600/50 text-white"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-slate-300">Probability (0-1)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={newPrize.probability}
                    onChange={(e) => setNewPrize(prev => ({ ...prev, probability: parseFloat(e.target.value) || 0 }))}
                    className="bg-slate-700/50 border-slate-600/50 text-white"
                  />
                </div>

                {newPrize.type === 'character' && (
                  <div>
                    <Label className="text-slate-300">Character</Label>
                    <Select value={newPrize.characterid || ""} onValueChange={(value) => setNewPrize(prev => ({ ...prev, characterid: value }))}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue placeholder="Select character" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {characters.map((char: any) => (
                          <SelectItem key={char.id} value={char.id} className="text-white">
                            {char.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreatePrize}
                disabled={createPrizeMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                {createPrizeMutation.isPending ? "Creating..." : "Create Prize"}
              </Button>
            </CardContent>
          </Card>

          {/* Prize List */}
          <Card className="bg-slate-800/40 backdrop-blur border-slate-600/30 flex-1 min-h-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Current Prizes</CardTitle>
                <Badge className="bg-blue-600/80 text-white">
                  Total Probability: {(totalProbability * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {wheelPrizes.map((prize: any, index: number) => {
                    const prizeType = PRIZE_TYPES.find(t => t.value === prize.type);
                    const PrizeIcon = prizeType?.icon || Gift;
                    
                    return (
                      <div key={prize.id || index} className="p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <PrizeIcon className={`w-5 h-5 ${prizeType?.color || 'text-gray-400'}`} />
                            <h4 className="font-semibold text-white">{prize.label}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-600/80 text-white">
                              {(prize.probability * 100).toFixed(1)}%
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deletePrizeMutation.mutate(prize.id)}
                              className="bg-red-600/20 border-red-500/50 hover:bg-red-600/40 p-1"
                              disabled={deletePrizeMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
                          <p>Type: <span className="text-yellow-300">{prize.type}</span></p>
                          {prize.type !== 'nothing' && (
                            <>
                              <p>Min: <span className="text-green-300">{Number(prize.min) || 0}</span></p>
                              <p>Max: <span className="text-green-300">{Number(prize.max) || 0}</span></p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}