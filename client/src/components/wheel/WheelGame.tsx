import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Gift, Heart, Star, Trophy, Zap, X } from "lucide-react";
import type { User } from '@shared/schema';

interface WheelPrize {
  id: string;
  name: string;
  type: 'points' | 'energy' | 'character' | 'gems' | 'special';
  value: number;
  probability: number;
  color: string;
  icon: string;
  timesWon: number;
}

interface WheelGameProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const DEFAULT_PRIZES: WheelPrize[] = [
  {
    id: '1',
    name: '100 LP',
    type: 'points',
    value: 100,
    probability: 30,
    color: '#4F46E5',
    icon: '💰',
    timesWon: 0
  },
  {
    id: '2', 
    name: '50 LP',
    type: 'points',
    value: 50,
    probability: 25,
    color: '#059669',
    icon: '🪙',
    timesWon: 0
  },
  {
    id: '3',
    name: '25 Energy',
    type: 'energy',
    value: 25,
    probability: 20,
    color: '#DC2626',
    icon: '⚡',
    timesWon: 0
  },
  {
    id: '4',
    name: '5 Gems',
    type: 'gems',
    value: 5,
    probability: 15,
    color: '#7C3AED',
    icon: '💎',
    timesWon: 0
  },
  {
    id: '5',
    name: 'Character Unlock',
    type: 'character',
    value: 1,
    probability: 8,
    color: '#EA580C',
    icon: '👤',
    timesWon: 0
  },
  {
    id: '6',
    name: 'Jackpot!',
    type: 'special',
    value: 1000,
    probability: 2,
    color: '#FBBF24',
    icon: '🎉',
    timesWon: 0
  }
];

export default function WheelGame({ isOpen, onClose, userId }: WheelGameProps) {
  const [prizes, setPrizes] = useState<WheelPrize[]>(DEFAULT_PRIZES);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<WheelPrize | null>(null);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [activeTab, setActiveTab] = useState("spin");
  const [rotation, setRotation] = useState(0);

  // Get user data to check wheel availability
  const { data: user } = useQuery<User>({
    queryKey: [`/api/user/${userId}`],
    enabled: isOpen,
  });

  // Calculate time until next spin (daily reset at midnight)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      
      // Check if user can spin (daily reset at midnight)
      if (user?.lastWheelSpin) {
        const lastSpinDate = new Date(user.lastWheelSpin);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at 00:00:00
        const lastSpinDay = new Date(lastSpinDate.getFullYear(), lastSpinDate.getMonth(), lastSpinDate.getDate());
        
        // If the last spin was today, show countdown to next midnight
        if (lastSpinDay.getTime() >= today.getTime()) {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const diff = tomorrow.getTime() - now.getTime();

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            return;
          }
        }
      }
      
      // Can spin now
      setTimeLeft("");
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const canSpin = !user?.lastWheelSpin || timeLeft === "";

  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wheel/spin", { userId });
      return response.json();
    },
    onSuccess: (data) => {
      const wonPrize = prizes.find(p => p.id === data.prizeId) || prizes[0];
      setSelectedPrize(wonPrize);
      setSpinResult(data.message);
      
      // Calculate final rotation
      const prizeIndex = prizes.findIndex(p => p.id === data.prizeId);
      const segmentAngle = 360 / prizes.length;
      const finalRotation = rotation + 1440 + (prizeIndex * segmentAngle); // 4 full spins + target
      setRotation(finalRotation);
      
      // Update prize win count
      setPrizes(prev => prev.map(p => 
        p.id === wonPrize.id ? { ...p, timesWon: p.timesWon + 1 } : p
      ));

      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stats/${userId}`] });
      
      setTimeout(() => {
        setIsSpinning(false);
        toast.success(`🎉 You won ${wonPrize.name}!`);
      }, 3000);
    },
    onError: (error: any) => {
      setIsSpinning(false);
      toast.error(error.message || "Spin failed!");
    },
  });

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;
    
    setIsSpinning(true);
    setSelectedPrize(null);
    setSpinResult(null);
    
    spinMutation.mutate();
  };

  const WheelDisplay = () => (
    <div className="relative w-80 h-80 mx-auto">
      {/* Wheel Container */}
      <div 
        className="w-full h-full rounded-full border-8 border-yellow-400 relative overflow-hidden transition-transform duration-3000 ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          background: `conic-gradient(${prizes.map((prize, index) => 
            `${prize.color} ${(index * 360) / prizes.length}deg ${((index + 1) * 360) / prizes.length}deg`
          ).join(', ')})`
        }}
      >
        {/* Prize Sections */}
        {prizes.map((prize, index) => (
          <div
            key={prize.id}
            className="absolute w-full h-full flex items-center justify-center text-white font-bold text-sm"
            style={{
              transform: `rotate(${(index * 360) / prizes.length + 180 / prizes.length}deg)`,
              transformOrigin: 'center',
            }}
          >
            <div className="flex flex-col items-center justify-center transform rotate-90 text-center">
              <span className="text-xl">{prize.icon}</span>
              <span className="text-xs mt-1 whitespace-nowrap">{prize.name}</span>
            </div>
          </div>
        ))}
        
        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center">
          <Star className="w-8 h-8 text-yellow-600" />
        </div>
      </div>
      
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-red-500"></div>
      </div>
    </div>
  );

  const PrizeStats = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {prizes.map((prize) => (
          <Card key={prize.id} className="bg-gray-800/50 border-gray-600">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">{prize.icon}</div>
              <div className="text-white font-medium text-sm">{prize.name}</div>
              <div className="text-gray-400 text-xs">
                {prize.probability}% chance
              </div>
              <Badge variant="secondary" className="mt-2">
                Won {prize.timesWon} times
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-purple-900 to-indigo-900 text-white border-purple-500/30 max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center relative">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            🎡 Daily Wheel
          </CardTitle>
          <Button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 p-0 bg-gray-800 hover:bg-gray-700"
            variant="ghost"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
              <TabsTrigger value="spin" className="text-white data-[state=active]:bg-purple-600">
                🎯 Spin
              </TabsTrigger>
              <TabsTrigger value="stats" className="text-white data-[state=active]:bg-purple-600">
                📊 Stats
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="spin" className="space-y-6">
              <WheelDisplay />
              
              {/* Spin Status */}
              {canSpin && (
                <div className="text-center bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <div className="text-2xl animate-bounce">🎁</div>
                    </div>
                    <div className="text-green-300 font-bold text-xl">Daily Spin Ready!</div>
                  </div>
                  <div className="text-green-400 text-lg">Your luck awaits ✨</div>
                </div>
              )}
              
              {!canSpin && timeLeft && (
                <div className="text-center bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/50 rounded-lg p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-purple-400 animate-pulse"></div>
                    </div>
                    <div className="text-purple-300 font-bold text-xl">⏰ Wheel Locked</div>
                  </div>
                  <div className="text-purple-200 font-mono text-3xl mb-2 tracking-wider">{timeLeft}</div>
                  <div className="text-purple-400 text-lg mb-4">Until next daily spin</div>
                  <div className="w-full bg-purple-900/30 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 h-3 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <div className="text-purple-300 text-sm mt-3">🌅 Resets daily at 12:00 AM</div>
                </div>
              )}
              
              {/* Spin Button */}
              <div className="text-center space-y-4">
                <Button
                  onClick={handleSpin}
                  disabled={!canSpin || isSpinning}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-full text-lg disabled:opacity-50"
                  data-testid="button-spin-wheel"
                >
                  {isSpinning ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Spinning...
                    </div>
                  ) : !canSpin ? (
                    <>🕒 Next spin: {timeLeft}</>
                  ) : (
                    "🎯 SPIN THE WHEEL!"
                  )}
                </Button>
                
                {spinResult && (
                  <div className="bg-green-600/20 border border-green-500 rounded-lg p-4">
                    <div className="text-green-400 font-bold">{spinResult}</div>
                    {selectedPrize && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-2xl">{selectedPrize.icon}</span>
                        <span className="text-white">{selectedPrize.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Rewards */}
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h4 className="font-bold mb-2 text-purple-300">Recent Rewards</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Yesterday:</span>
                      <span className="text-yellow-400">+500 coins</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2 days ago:</span>
                      <span className="text-purple-400">Character unlock</span>
                    </div>
                  </div>
                </div>

                {/* Possible Rewards */}
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h4 className="font-bold mb-2 text-blue-300">Possible Rewards</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      <span>+1000 coins: +10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💎</span>
                      <span>gems: +500</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-2">Prize Statistics</h3>
                <p className="text-gray-400">Track your wheel spin history and prize probabilities</p>
              </div>
              <PrizeStats />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}