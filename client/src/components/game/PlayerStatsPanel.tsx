import React from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/hooks/usePlayer";

interface PlayerStatsPanelProps {
  selectedCharacter?: any;
  onAvatarClick: () => void;
  onOpenGallery: () => void;
}

export default function PlayerStatsPanel({
  selectedCharacter,
  onAvatarClick,
  onOpenGallery
}: PlayerStatsPanelProps) {
  const { user } = useAuth();
  const { data: playerData } = usePlayer();
  
  // Dynamic username from Telegram/Auth context
  const displayName = user?.telegram?.username || user?.displayName || user?.username || playerData?.username || "Player";
  const currentLP = user?.lp || playerData?.lp || 0;
  const currentLevel = user?.level || playerData?.level || 1;
  const currentXP = user?.xp || playerData?.xp || 0;
  const xpToNext = user?.xpToNext || playerData?.xpToNext || 100;
  const currentEnergy = user?.energy || playerData?.energy || 987;
  const maxEnergy = user?.maxEnergy || playerData?.maxEnergy || 1000;
  const lpPerHour = user?.lpPerHour || playerData?.lpPerHour || 250;
  const lustGems = user?.lustGems || playerData?.lustGems || 0;

  return (
    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#2a0a1f]/95 via-[#330a22]/90 to-[#2a0f22]/95 border-b border-pink-500/20 flex-shrink-0 backdrop-blur-sm relative">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/3 via-purple-500/5 to-pink-500/3"></div>

      {/* Left Section: Avatar + Username + Level */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <p className="text-white/90 text-sm font-bold text-center tracking-wide drop-shadow-sm">
            {displayName}
          </p>
          <div
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={onAvatarClick}
            title="Click to view/chat with character"
          >
            <img
              src={selectedCharacter?.avatarUrl || selectedCharacter?.imageUrl || selectedCharacter?.avatarPath || "https://via.placeholder.com/80x80/1a1a1a/ff1493?text=👤"}
              alt="Character Avatar"
              loading="eager"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '1';
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== "https://via.placeholder.com/80x80/1a1a1a/ff1493?text=👤") {
                  target.src = "https://via.placeholder.com/80x80/1a1a1a/ff1493?text=👤";
                }
                target.style.opacity = '1';
              }}
              className="w-20 h-20 object-cover rounded-xl shadow-md border-2 border-purple-400/40 cursor-pointer hover:border-purple-300/60 transition-all duration-300"
              style={{ opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-yellow-200/90 text-xs font-bold text-center drop-shadow-sm tracking-wide">
              Level: {currentLevel}
            </span>
            <Progress value={(currentXP / xpToNext) * 100} className="h-2 w-20" />
          </div>
        </div>

        {/* Left Column: LustPoints and Lust Gems with frame_stat */}
        <div className="flex flex-col items-center gap-2">
          {/* LustPoints Frame with frame_stat background */}
          <div 
            className="relative w-32 h-20 flex flex-col justify-center items-center rounded-lg"
            style={{
              backgroundImage: 'url(/gamegui/frame_stat.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20 rounded-lg"></div>
            <div className="relative flex flex-col items-center gap-1 z-10">
              <span className="text-white/95 text-xs font-bold tracking-wide drop-shadow text-center">LustPoints</span>
              <span className="text-white font-black text-sm tracking-wide drop-shadow-sm">
                {Math.floor(currentLP).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Lust Gems Frame with frame_stat background */}
          <div 
            className="relative w-32 h-20 flex flex-col justify-center items-center rounded-lg"
            style={{
              backgroundImage: 'url(/gamegui/frame_stat.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20 rounded-lg"></div>
            <div className="relative flex flex-col items-center gap-1 z-10">
              <span className="text-white/95 text-xs font-bold tracking-wide drop-shadow text-center">Lust Gems</span>
              <span className="text-white font-black text-sm tracking-wide drop-shadow-sm">
                {lustGems}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: LP per Hour with frame_stat */}
      <div 
        className="relative w-36 h-24 flex flex-col justify-center items-center rounded-lg mx-2"
        style={{
          backgroundImage: 'url(/gamegui/frame_stat.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20 rounded-lg"></div>
        <div className="absolute top-2 right-2 opacity-60 z-10">
          <Sparkles className="w-3 h-3 text-yellow-300/70" />
        </div>
        <div className="relative flex flex-col items-center gap-1 text-center z-10">
          <span className="text-white/95 text-sm font-bold tracking-wide drop-shadow">LP per Hour</span>
          <span className="text-2xl font-bold text-white/95 drop-shadow-sm">∞</span>
          <span className="text-white font-bold text-sm tracking-wide drop-shadow-sm">
            {lpPerHour}
          </span>
        </div>
      </div>

      {/* Right Section: Energy and Boosters with frame_stat */}
      <div className="flex flex-col gap-2">
        {/* Energy Frame with frame_stat background */}
        <div 
          className={`relative w-32 h-20 flex flex-col justify-center items-center rounded-lg ${
            (currentEnergy / maxEnergy) > 0.95
              ? 'ring-1 ring-blue-400/40'
              : ''
          }`}
          style={{
            backgroundImage: 'url(/gamegui/frame_stat.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20 rounded-lg"></div>
          <div className="relative flex flex-col items-center gap-1 z-10">
            <span className="text-white/95 text-xs font-bold tracking-wide drop-shadow text-center">Energy</span>
            <span className="text-white font-black text-sm tracking-wide drop-shadow-sm">
              {currentEnergy}/{maxEnergy}
            </span>
          </div>
        </div>

        {/* Boosters Frame with frame_stat background */}
        <div 
          className="relative w-32 h-20 flex flex-col justify-center items-center rounded-lg"
          style={{
            backgroundImage: 'url(/gamegui/frame_stat.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20 rounded-lg"></div>
          <div className="absolute top-1 right-1 opacity-50 z-10">
            <Sparkles className="w-2 h-2 text-green-300/60" />
          </div>
          <div className="relative text-center z-10">
            <span className="text-white/95 text-xs font-bold tracking-wide drop-shadow block mb-1">Boosters</span>
            <div className="text-white/90 text-xs font-bold tracking-wide drop-shadow-sm">
              +0% LP [Inactive]
            </div>
          </div>
        </div>
      </div>
      
      {/* Dedicated Gallery Button */}
      <button
        onClick={onOpenGallery}
        className="ml-4 p-3 bg-gradient-to-br from-purple-600/40 via-pink-600/40 to-red-600/40 border border-purple-400/30 rounded-lg shadow-lg backdrop-blur-sm hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
        title="Open Character Gallery"
      >
        <Sparkles className="w-5 h-5 text-purple-200/80" />
      </button>
    </div>
  );
}