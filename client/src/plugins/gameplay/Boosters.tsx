/**
 * Boosters.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 * Handles boosters UI
 */

// This file contains the React component for the Boosters Modal.
// It handles the UI, state, and calls the data functions from the database file.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "react-hot-toast";
import { Star, Gift, Headphones, Heart, ChefHat, Dumbbell, Palette, Home, Zap, Plus, Trash2 } from "lucide-react";

// Importing the core data logic from the separate file
import { 
  fetchBoosters, 
  createBooster, 
  deleteBooster, 
  BoosterData 
} from "./BoostersDB";

interface BoostersModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // User type is not defined in this standalone file
}

const getIcon = (id: string) => {
  switch (id) {
    case 'special-talent': return Star;
    case 'gift-selection': return Gift;
    case 'active-listening': return Headphones;
    case 'date-experience': return Heart;
    case 'cooking-mastery': return ChefHat;
    case 'athleticism': return Dumbbell;
    case 'artistic-talent': return Palette;
    case 'home-care': return Home;
    case 'star': return Star;
    case 'gift': return Gift;
    case 'headphones': return Headphones;
    case 'heart': return Heart;
    case 'chefhat': return ChefHat;
    default: return Zap;
  }
};

const calculateCost = (baseCost: number, level: number): number => {
  // Cap the level to prevent exponential explosion
  const cappedLevel = Math.min(level, 50);
  // Use a more reasonable scaling factor
  return Math.floor(baseCost * Math.pow(1.12, cappedLevel));
};

const calculateHourlyBonus = (baseBonus: number, level: number): number => {
  return Math.floor(baseBonus + (baseBonus * 0.1 * level));
};

const calculateTapBonus = (baseBonus: number, level: number): number => {
  return Math.floor(baseBonus + (baseBonus * 0.1 * level));
};

export default function BoostersModal({ isOpen, onClose, user }: BoostersModalProps) {
  const [activeTab, setActiveTab] = useState("boosters");
  const [newBooster, setNewBooster] = useState({
    name: "",
    description: "",
    baseCost: 100,
    hourlyBonus: 10,
    tapBonus: 0,
    maxLevel: 10,
    requiredLevel: 1,
    icon: "zap"
  });

  const queryClient = useQueryClient();

  // Fetch all boosters using the function from our database file
  const { data: boosters = [], isLoading } = useQuery<BoosterData[]>({
    queryKey: ["boosters"],
    queryFn: fetchBoosters,
  });

  // Purchase booster mutation (mocked logic)
  const purchaseBoosterMutation = useMutation({
    mutationFn: async (boosterId: string) => {
      // In a real app, this would be an API call to a backend
      // We'll mock a successful purchase here
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: "Purchase successful" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boosters"] });
      // Invalidate user data as well
      queryClient.invalidateQueries({ queryKey: ["/api/user/init"] });
      toast.success("Booster purchased successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Not enough points!");
    },
  });

  // Create booster mutation (admin only)
  const createBoosterMutation = useMutation({
    mutationFn: async (boosterData: any) => {
      // Use the createBooster function from our database file
      return await createBooster(boosterData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boosters"] });
      toast.success("Booster created successfully!");
      setNewBooster({
        name: "",
        description: "",
        baseCost: 100,
        hourlyBonus: 10,
        tapBonus: 0,
        maxLevel: 10,
        requiredLevel: 1,
        icon: "zap"
      });
    },
    onError: (error: any) => {
      toast.error("Failed to create booster: " + error.message);
    },
  });

  // Delete booster mutation (admin only)
  const deleteBoosterMutation = useMutation({
    mutationFn: async (boosterId: string) => {
      // Use the deleteBooster function from our database file
      return await deleteBooster(boosterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boosters"] });
      toast.success("Booster deleted successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to delete booster: " + error.message);
    },
  });

  const canAfford = (booster: BoosterData) => {
    const cost = calculateCost(booster.baseCost, booster.level);
    return user?.points >= cost;
  };

  const meetsRequirements = (booster: BoosterData) => {
    return user?.level >= (booster.requiredLevel || 1);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handlePurchase = (boosterId: string) => {
    // Prevent multiple rapid purchases
    if (purchaseBoosterMutation.isPending) {
      return;
    }
    
    // This is still a mock, as the user data isn't tied to the mock booster data
    // In a real app, this would deduct the points from the user.
    purchaseBoosterMutation.mutate(boosterId);
  };

  const handleCreateBooster = () => {
    createBoosterMutation.mutate(newBooster);
  };

  const handleDeleteBooster = (boosterId: string) => {
    // Replaced confirm() with a mock toast for better UI/UX in Canvas
    toast.promise(
      deleteBoosterMutation.mutateAsync(boosterId),
      {
        loading: 'Deleting...',
        success: 'Booster deleted!',
        error: 'Failed to delete booster.',
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Power-Up Boosters
          </DialogTitle>
          <DialogDescription>
            Purchase boosters to enhance your clicking power and earn more LP per hour!
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="boosters">Available Boosters</TabsTrigger>
              <TabsTrigger value="create">Create Booster</TabsTrigger>
              <TabsTrigger value="manage">Manage Boosters</TabsTrigger>
            </TabsList>

            <TabsContent value="boosters" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="grid gap-4 md:grid-cols-2 pb-4">
                  {isLoading && (
                    <div className="col-span-2 text-center py-8">
                      <Zap className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-2" />
                      <div className="text-gray-400">Loading boosters...</div>
                    </div>
                  )}

                  {!isLoading && boosters.length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      <Zap className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <div className="text-gray-400">No boosters available</div>
                      <div className="text-sm text-gray-500 mt-2">Check back later!</div>
                    </div>
                  )}

                  {!isLoading && boosters.map((booster: BoosterData) => {
                    const Icon = getIcon(booster.id);
                    const cost = calculateCost(booster.baseCost, booster.level || 0);
                    const hourlyBonus = calculateHourlyBonus(booster.hourlyBonus, booster.level || 0);
                    const tapBonus = calculateTapBonus(booster.tapBonus, booster.level || 0);
                    const isMaxLevel = (booster.level || 0) >= (booster.maxLevel || 10);
                    const affordable = canAfford(booster);
                    const meetsReqs = meetsRequirements(booster);

                    return (
                      <Card
                        key={booster.id}
                        className={`bg-gradient-to-br ${
                          affordable && meetsReqs && !isMaxLevel
                            ? 'from-green-400/20 to-blue-400/20 border-green-400/50'
                            : 'from-gray-400/20 to-gray-600/20 border-gray-500/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text:white">{booster.name}</h3>
                                <p className="text-sm text-gray-300">{booster.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                Lv.{booster.level || 0}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm mb-3">
                            {hourlyBonus > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">LP per Hour:</span>
                                <span className="text-green-400 font-bold">+{formatNumber(hourlyBonus)}</span>
                              </div>
                            )}
                            {tapBonus > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Tap Bonus:</span>
                                <span className="text-blue-400 font-bold">+{formatNumber(tapBonus)}</span>
                              </div>
                            )}
                          </div>

                          {isMaxLevel ? (
                            <div className="bg-yellow-600 text-white text-center py-2 rounded font-bold">
                              MAX LEVEL
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-yellow-400 font-bold">💰 {formatNumber(cost)}</span>
                                <Button
                                  onClick={() => handlePurchase(booster.id)}
                                  disabled={!affordable || !meetsReqs || purchaseBoosterMutation.isPending}
                                  className={`${
                                    affordable && meetsReqs
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : 'bg-gray-600 cursor-not-allowed'
                                  }`}
                                >
                                  {!meetsReqs ? 'LOCKED' : !affordable ? 'INSUFFICIENT FUNDS' : 'UPGRADE'}
                                </Button>
                              </div>
                              {!meetsReqs && (
                                <p className="text-xs text-red-400">
                                  Requires Level {booster.requiredLevel || 1}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{booster.level || 0}/{booster.maxLevel || 10}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((booster.level || 0) / (booster.maxLevel || 10)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="create" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Booster</CardTitle>
                    <CardDescription>Design a new booster for players to purchase</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="booster-name">Name</Label>
                        <Input
                          id="booster-name"
                          value={newBooster.name}
                          onChange={(e) => setNewBooster({ ...newBooster, name: e.target.value })}
                          placeholder="Booster name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="booster-icon">Icon</Label>
                        <select
                          id="booster-icon"
                          value={newBooster.icon}
                          onChange={(e) => setNewBooster({ ...newBooster, icon: e.target.value })}
                          className="w-full p-2 rounded border bg-gray-900"
                        >
                          <option value="zap">⚡ Zap</option>
                          <option value="star">⭐ Star</option>
                          <option value="gift">🎁 Gift</option>
                          <option value="heart">❤️ Heart</option>
                          <option value="chefhat">👨‍🍳 Chef</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="booster-description">Description</Label>
                      <Textarea
                        id="booster-description"
                        value={newBooster.description}
                        onChange={(e) => setNewBooster({ ...newBooster, description: e.target.value })}
                        placeholder="Booster description"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="base-cost">Base Cost</Label>
                        <Input
                          id="base-cost"
                          type="number"
                          value={newBooster.baseCost}
                          onChange={(e) => setNewBooster({ ...newBooster, baseCost: parseInt(e.target.value) || 100 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hourly-bonus">Hourly Bonus</Label>
                        <Input
                          id="hourly-bonus"
                          type="number"
                          value={newBooster.hourlyBonus}
                          onChange={(e) => setNewBooster({ ...newBooster, hourlyBonus: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tap-bonus">Tap Bonus</Label>
                        <Input
                          id="tap-bonus"
                          type="number"
                          value={newBooster.tapBonus}
                          onChange={(e) => setNewBooster({ ...newBooster, tapBonus: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-level">Max Level</Label>
                        <Input
                          id="max-level"
                          type="number"
                          value={newBooster.maxLevel}
                          onChange={(e) => setNewBooster({ ...newBooster, maxLevel: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="required-level">Required Player Level</Label>
                        <Input
                          id="required-level"
                          type="number"
                          value={newBooster.requiredLevel}
                          onChange={(e) => setNewBooster({ ...newBooster, requiredLevel: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateBooster}
                      disabled={!newBooster.name || !newBooster.description || createBoosterMutation.isPending}
                      className="w-full"
                    >
                      {createBoosterMutation.isPending ? "Creating..." : "Create Booster"}
                    </Button>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="manage" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <div className="flex items:center justify-between">
                    <h3 className="text-lg font-semibold">Manage Existing Boosters</h3>
                  </div>

                  <div className="grid gap-4">
                    {boosters.map((booster: BoosterData) => (
                      <Card key={booster.id} className="bg-gray-800/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{booster.name}</h4>
                              <p className="text-sm text-gray-400">{booster.description}</p>
                              <div className="text-xs text-gray-500 mt-1">
                                Cost: {booster.baseCost} | Hourly: +{booster.hourlyBonus} | Max Lv: {booster.maxLevel}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDeleteBooster(booster.id)}
                              variant="destructive"
                              size="sm"
                              disabled={deleteBoosterMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
