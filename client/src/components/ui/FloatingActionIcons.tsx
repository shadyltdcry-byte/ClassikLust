import React from "react";
import { Button } from "@/components/ui/button";
import { Activity, Crown, Settings, Image } from "lucide-react";

interface FloatingActionIconsProps {
  onOpenWheel: () => void;
  onOpenVIP: () => void;
  onOpenAdmin: () => void;
  onOpenGallery: () => void;
}

export default function FloatingActionIcons({
  onOpenWheel,
  onOpenVIP,
  onOpenAdmin,
  onOpenGallery
}: FloatingActionIconsProps) {
  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-50">
      {/* Character Gallery */}
      {onOpenGallery && (
        <button
          onClick={onOpenGallery}
          className="bg-purple-600 hover:bg-purple-700 p-3 rounded-full shadow-lg transition-all hover:scale-110"
          title="Character Gallery"
        >
          <Image className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Wheel of Fortune */}
      <Button
        variant="default"
        size="icon"
        className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:via-yellow-400 hover:to-orange-400 border-2 border-yellow-300/70 shadow-2xl hover:shadow-yellow-400/40 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        onClick={onOpenWheel}
        data-testid="button-wheel-game"
      >
        <Activity className="w-7 h-7 text-white drop-shadow-lg" />
      </Button>

      {/* VIP Icon */}
      <Button
        variant="default"
        size="icon"
        className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-violet-600 to-purple-700 hover:from-purple-500 hover:via-violet-500 hover:to-purple-600 border-2 border-purple-300/70 shadow-2xl hover:shadow-purple-400/40 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        onClick={onOpenVIP}
        data-testid="button-vip"
      >
        <Crown className="w-7 h-7 text-white drop-shadow-lg" />
      </Button>

      {/* Settings Icon */}
      <Button
        variant="default"
        size="icon"
        className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 via-gray-600 to-slate-700 hover:from-slate-500 hover:via-gray-500 hover:to-slate-600 border-2 border-gray-300/70 shadow-2xl hover:shadow-gray-400/40 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        onClick={onOpenAdmin}
        data-testid="button-settings"
      >
        <Settings className="w-7 h-7 text-white drop-shadow-lg" />
      </Button>
    </div>
  );
}