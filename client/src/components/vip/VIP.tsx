import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";

interface VIPProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const VIP_PLANS = [
  {
    id: "daily",
    title: "Daily VIP",
    price: "$4.99",
    duration: "24 hours",
    badge: "Quick Start",
    color: "from-blue-500 to-purple-600",
    benefits: [
      "2x Lust Points",
      "+50% Energy Regen",
      "Exclusive Characters",
      "VIP Chat Responses"
    ],
    coins: 500,
    gems: 24
  },
  {
    id: "weekly",
    title: "Weekly VIP",
    price: "$19.99",
    duration: "7 days",
    badge: "Popular",
    color: "from-purple-500 to-pink-600",
    benefits: [
      "3x Lust Points",
      "+100% Energy Regen",
      "All Exclusive Content",
      "Priority Support",
      "Daily Bonus Gems"
    ],
    coins: 2000,
    gems: 7,
    popular: true
  },
  {
    id: "monthly",
    title: "Monthly VIP",
    price: "$49.99",
    duration: "30 days",
    badge: "Best Value",
    color: "from-yellow-500 to-orange-600",
    benefits: [
      "5x Lust Points",
      "+200% Energy Regen",
      "Unlimited Access",
      "Custom Characters",
      "Monthly Exclusive Events"
    ],
    coins: 6000,
    gems: 30
  }
];

export default function VIP({ isOpen, onClose, userId }: VIPProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Check current VIP status
  const { data: vipStatus } = useQuery({
    queryKey: [`/api/vip/status/${userId}`],
    enabled: isOpen,
  });

  const purchaseVipMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/vip/purchase", { userId, planId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/vip/status/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
      toast.success(`Welcome to ${data.planType} VIP! Enjoy your exclusive benefits.`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to purchase VIP plan");
    },
  });

  const handlePurchase = (planId: string) => {
    setSelectedPlan(planId);
    purchaseVipMutation.mutate(planId);
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white border-none max-w-md p-0 rounded-3xl overflow-hidden h-[700px] flex flex-col">
        <DialogHeader className="p-6">
          <DialogTitle className="text-2xl font-bold text-white flex items-center justify-center">
            <Star className="w-6 h-6 text-yellow-400 mr-2" />
            VIP Membership
          </DialogTitle>
          <DialogDescription className="text-white/70 text-center">
            Unlock exclusive features and premium benefits.
          </DialogDescription>
        </DialogHeader>

        {/* Current VIP Status */}
        {vipStatus?.isActive && (
          <div className="px-6 mb-4">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">👑</span>
                <h3 className="font-bold text-yellow-400">Current VIP Status</h3>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium capitalize">{vipStatus.planType} VIP</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Left:</span>
                  <span className="font-medium">{formatTimeRemaining(vipStatus.endDate)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!vipStatus?.isActive && (
          <div className="px-6 mb-4">
            <div className="bg-gray-700/30 border border-gray-500/30 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">💎</div>
              <h3 className="font-bold mb-1">No active VIP membership</h3>
              <p className="text-sm text-white/70">Upgrade to unlock exclusive benefits!</p>
            </div>
          </div>
        )}

        {/* VIP Plans */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <h3 className="font-bold mb-4">Choose Your VIP Plan</h3>

          <div className="space-y-4">
            {VIP_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-gradient-to-r ${plan.color} rounded-xl p-1 ${
                  plan.popular ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="bg-black/80 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{plan.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">{plan.price}</span>
                        <span className="text-sm text-white/70">• {plan.duration}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      plan.id === 'daily' ? 'bg-blue-600' :
                      plan.id === 'weekly' ? 'bg-purple-600' :
                      'bg-yellow-600 text-black'
                    }`}>
                      {plan.badge}
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <span>💗</span>
                      <span className="text-sm font-medium">{plan.coins} Lust Gems</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>💎</span>
                      <span className="text-sm font-medium">{plan.gems} days</span>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-1 mb-4">
                    {plan.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <span className="text-green-400">✓</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={purchaseVipMutation.isPending && selectedPlan === plan.id}
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-bold py-3`}
                    data-testid={`button-purchase-${plan.id}`}
                  >
                    {purchaseVipMutation.isPending && selectedPlan === plan.id ?
                      "Processing..." :
                      `Purchase ${plan.title}`
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* VIP Benefits Info */}
          <div className="mt-6 bg-black/20 rounded-xl p-4">
            <h4 className="font-bold mb-2">VIP Benefits Include:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <span>🚀</span>
                <span>Faster progression</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>💫</span>
                <span>Exclusive characters</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>💬</span>
                <span>Premium AI responses</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🎁</span>
                <span>Daily bonus rewards</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}