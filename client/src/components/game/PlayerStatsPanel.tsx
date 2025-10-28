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
    <div className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-red-900/40 border-b-2 border-gradient-to-r from-pink-500/50 via-purple-500/50 to-red-500/50 flex-shrink-0 backdrop-blur-md relative overflow-hidden">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/10 to-blue-500/5 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-red-500/5 via-pink-500/10 to-purple-500/5 animate-pulse" style={{animationDelay: '1s'}}></div>

      {/* Left Section: Avatar + Username + Level */}
      <div className="flex items-center gap-0.5">
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-transparent bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 bg-clip-text text-xs font-bold text-center tracking-wider drop-shadow-lg">
            {displayName}
          </p>
          <div
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={onAvatarClick}
            title="Click to view/chat with character"
          >
            <img
              src={selectedCharacter?.avatarUrl || selectedCharacter?.imageUrl || selectedCharacter?.avatarPath || "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤"}
              alt="Character Avatar"
              loading="eager"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '1';
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤") {
                  target.src = "https://via.placeholder.com/64x64/1a1a1a/ff1493?text=👤";
                }
                target.style.opacity = '1';
              }}
              className="w-[88px] h-[88px] object-cover rounded-xl shadow-lg border-2 border-purple-500/50 cursor-pointer hover:border-purple-400/70 transition-all duration-500"
              style={{ opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-transparent bg-gradient-to-r from-yellow-200 via-orange-200 to-red-200 bg-clip-text text-xs font-bold text-center drop-shadow-lg tracking-wider">
              Level: {currentLevel}
            </span>
            <Progress value={(currentXP / xpToNext) * 100} className="h-2 w-20" />
          </div>
        </div>

        {/* Left Column: LustPoints and Lust Gems with frame_stat */}
        <div className="flex flex-col items-center gap-0.5 ml-2">
          {/* LustPoints Frame with frame_stat background */}
          <div 
            className="relative px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-2xl transition-all duration-500 group overflow-hidden w-28 h-20 flex flex-col justify-center items-center"
            style={{
              backgroundImage: 'url(/gamegui/frame_stat.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative flex flex-col items-center gap-0.5 z-10">
              <div className="flex items-center gap-0.5">
                <img src="/gamegui/lustgems.png" alt="LP" className="w-4 h-4" />
                <span className="text-white text-xs font-bold tracking-wider drop-shadow-lg">LustPoints</span>
              </div>
              <span className="text-white font-black text-xs tracking-wider drop-shadow-xl">
                {Math.floor(currentLP).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Lust Gems Frame with frame_stat background */}
          <div 
            className="relative px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-2xl transition-all duration-500 group overflow-hidden w-28 h-20 flex flex-col justify-center items-center"
            style={{
              backgroundImage: 'url(/gamegui/frame_stat.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative flex flex-col items-center gap-0.5 z-10">
              <div className="flex items-center gap-0.5">
                <img src="/gamegui/lustgems.png" alt="Gems" className="w-4 h-4" />
                <span className="text-white text-xs font-bold tracking-wider drop-shadow-lg">Lust Gems</span>
              </div>
              <span className="text-white font-black text-xs tracking-wider drop-shadow-xl">
                {lustGems}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: LP per Hour with frame_stat */}
      <div 
        className="relative px-3 py-2 mx-2 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-2xl transition-all duration-500 group overflow-hidden w-32 h-24 flex flex-col justify-center items-center"
        style={{
          backgroundImage: 'url(/gamegui/frame_stat.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute top-1 right-1 opacity-50 z-10">
          <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
        </div>
        <div className="relative flex flex-col items-center gap-1 text-center z-10">
          <span className="text-white text-sm font-bold tracking-wide drop-shadow-lg leading-tight">LP per Hour</span>
          <span className="text-xl font-bold text-white drop-shadow-2xl animate-pulse leading-none">∞</span>
          <span className="text-white font-bold text-sm tracking-wide drop-shadow-lg leading-tight">
            {lpPerHour}
          </span>
        </div>
      </div>

      {/* Right Section: Energy and Boosters with frame_stat */}
      <div className="flex flex-col gap-0.5">
        {/* Energy Frame with frame_stat background */}
        <div 
          className={`relative px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-2xl transition-all duration-500 group overflow-hidden w-28 h-20 flex flex-col justify-center items-center ${
            (currentEnergy / maxEnergy) > 0.95
              ? 'animate-pulse shadow-blue-400/60 shadow-2xl ring-2 ring-blue-400/60'
              : ''
          }`}
          style={{
            backgroundImage: 'url(/gamegui/frame_stat.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        >
          <div className="relative flex flex-col items-center gap-0.5 z-10">
            <span className="text-white text-xs font-bold tracking-wider drop-shadow-lg">Energy</span>
            <span className="text-white font-black text-xs tracking-wider drop-shadow-xl transition-all duration-200">
              {currentEnergy}/{maxEnergy}
            </span>
          </div>
        </div>

        {/* Boosters Frame with frame_stat background */}
        <div 
          className="relative px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md hover:shadow-2xl transition-all duration-500 group overflow-hidden w-28 h-20 flex flex-col justify-center items-center"
          style={{
            backgroundImage: 'url(/gamegui/frame_stat.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute top-1 right-1 opacity-40 z-10">
            <Sparkles className="w-2 h-2 text-green-300 animate-pulse" style={{animationDelay: '2s'}} />
          </div>
          <div className="relative text-center z-10">
            <span className="text-white text-xs font-bold tracking-wider drop-shadow-lg block mb-1">Boosters</span>
            <div className="text-white text-xs font-bold tracking-wider drop-shadow-xl">
              +0% LP [Inactive]
            </div>
          </div>
        </div>
      </div>
      
      {/* Dedicated Gallery Button */}
      <button
        onClick={onOpenGallery}
        className="ml-4 px-3 py-2 bg-gradient-to-br from-purple-700/50 via-pink-700/50 to-red-700/50 border-2 border-purple-500/70 rounded-lg shadow-xl backdrop-blur-md hover:shadow-purple-500/50 hover:shadow-2xl transition-all duration-500 hover:scale-105"
        title="Open Character Gallery"
      >
        <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
      </button>
    </div>
  );
}