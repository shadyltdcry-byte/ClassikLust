import { useState } from "react";
//import { Button } from "@/components/ui/button";
import type { Character, User, GameStats } from "@shared/schema";
import { useChatNotifications } from "@/hooks/useChatNotifications";

interface CharacterDisplayProps {
  character?: Character; // made optional
  user: User;
  stats?: GameStats;
  onTap: (event: React.MouseEvent) => void;
  onAvatarClick?: () => void; // New prop for avatar click
  isTapping: boolean;
  lpPerTap?: number; // Add LP per tap for display
  userId?: string; // Add userId for notifications
}

// Fallback when no character is selected
const defaultCharacter: Character = {
  id: "no-character-selected",
  name: "Select Character",
  personality: "neutral",
  bio: null,
  description: null,
  backstory: "Please select a character to interact with!",
  mood: "neutral",
  isNsfw: false,
  isVip: false,
  levelRequirement: 1,
  isEnabled: true,
  customTriggers: [],
  avatarPath: "/uploads/placeholder-avatar.jpg",
  imageUrl: "/uploads/placeholder-avatar.jpg",
  avatarUrl: "/uploads/placeholder-avatar.jpg",
  chatStyle: "casual",
  responseTimeMin: 1,
  responseTimeMax: 3,
  likes: "",
  dislikes: "",
  createdAt: new Date(),
};

export default function CharacterDisplay({
  character = defaultCharacter,
  user,
  onTap,
  onAvatarClick,
  isTapping,
  lpPerTap,
  userId,
}: CharacterDisplayProps) {
  const [tapEffect, setTapEffect] = useState(false);

  // Luna's notification system - Luna's ID is "550e8400-e29b-41d4-a716-446655440002"
  const isLuna = character?.id === "550e8400-e29b-41d4-a716-446655440002";
  const { unreadCount } = useChatNotifications(userId || null);

  const handleTap = (event: React.MouseEvent) => {
    // If this is the default "Select Character" state, open gallery instead of tapping
    if (character?.id === "no-character-selected" && onAvatarClick) {
      onAvatarClick();
      return;
    }

    if (user.energy <= 0 || isTapping) return;

    setTapEffect(true);
    onTap(event);

    // Much faster reset for fluid rapid tapping
    setTimeout(() => {
      setTapEffect(false);
    }, 80);
  };

  const handleAvatarClick = (event: React.MouseEvent) => {
    event.preventDefault();

    // Always open gallery on click if onAvatarClick is provided
    if (onAvatarClick) {
      onAvatarClick();
      return;
    }

    // Otherwise tap
    handleTap(event);
  };

  const shouldOpenGallery = character?.id === "no-character-selected";

  return (
    <div className="px-4 pb-6">
      <div className="relative bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-purple-500/30">
        {/* Character Info */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold gradient-text">{character?.name || "Unnamed"}</h2>
          <p className="text-gray-400 text-sm">{character?.backstory || "Tap to interact!"}</p>
        </div>

        {/* Character Main Image Container */}
        <div className="relative mx-auto max-w-[516px] mb-6">
          <div className="relative">
            {/* Luna's Error Alert Notification Badge */}
            {isLuna && unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 z-50">
                <div className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 shadow-lg animate-pulse border-2 border-white">
                  {unreadCount}
                </div>
              </div>
            )}
            <img
              src={
                (character?.imageUrl && character.imageUrl !== 'null' && character.imageUrl !== '/uploads/undefined') ? character.imageUrl :
                (character?.avatarPath && character.avatarPath !== 'null' && character.avatarPath !== '/uploads/undefined') ? character.avatarPath :
                (character?.avatarUrl && character.avatarUrl !== 'null' && character.avatarUrl !== '/uploads/undefined') ? character.avatarUrl :
                'https://via.placeholder.com/300x400/1a1a1a/ff1493?text=👤'
              }
              alt={character?.name || "Player"}
              onClick={shouldOpenGallery ? onAvatarClick : handleTap}
              onContextMenu={handleAvatarClick}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== 'https://via.placeholder.com/300x400/1a1a1a/ff1493?text=👤') {
                  target.src = 'https://via.placeholder.com/300x400/1a1a1a/ff1493?text=👤';
                }
              }}
              className={`w-full h-auto aspect-[3/4] object-cover rounded-2xl shadow-2xl cursor-pointer transform hover:scale-105 transition-all duration-200 active:scale-95 ${
                tapEffect ? 'tap-effect scale-95' : ''
              } ${user.energy <= 0 ? 'grayscale opacity-50' : ''}`}
              style={{
                filter: user.energy <= 0 ? 'grayscale(100%)' : 'none'
              }}
              title="Right-click or Ctrl+Click to open gallery"
            />

            {/* Tap Effect Overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl transition-opacity duration-200 pointer-events-none ${
                tapEffect ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Floating Hearts with LP Display */}
            {tapEffect && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Heart 1 - Top Left with Custom Image */}
                <div className="absolute top-1/4 left-1/4 animate-float-up flex items-center gap-2">
                  <img src="/uploads/floatinghearts.png" alt="hearts" className="w-6 h-6" />
                  <span className="text-pink-500 font-bold text-lg opacity-80 animate-fade-out">
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>

                {/* Heart 2 - Top Right with Emoji Heart */}
                <div className="absolute top-1/3 right-1/3 animate-float-up flex items-center gap-2" style={{ animationDelay: '0.4s' }}>
                  <span className="text-red-400 text-xl">❤️</span>
                  <span className="text-pink-500 font-bold text-lg opacity-80 animate-fade-out" style={{ animationDelay: '0.4s' }}>
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>

                {/* Heart 3 - Center with Different Emoji */}
                <div className="absolute top-1/2 left-1/2 animate-float-up flex items-center gap-2" style={{ animationDelay: '0.6s' }}>
                  <span className="text-pink-400 text-xl">💕</span>
                  <span className="text-pink-500 font-bold text-lg opacity-80 animate-fade-out" style={{ animationDelay: '0.6s' }}>
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>

                {/* Heart 4 - Bottom with Custom Image */}
                <div className="absolute top-2/3 left-2/3 animate-float-up flex items-center gap-2" style={{ animationDelay: '0.8s' }}>
                  <img src="/uploads/floatinghearts.png" alt="hearts" className="w-5 h-5" />
                  <span className="text-pink-500 font-bold text-lg opacity-80 animate-fade-out" style={{ animationDelay: '0.8s' }}>
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>

                {/* Heart 5 - Another Emoji Heart */}
                <div className="absolute top-3/4 left-1/4 animate-float-up flex items-center gap-2" style={{ animationDelay: '0.9s' }}>
                  <span className="text-red-500 text-xl">💖</span>
                  <span className="text-pink-500 font-bold text-lg opacity-80 animate-fade-out" style={{ animationDelay: '0.9s' }}>
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>
              </div>
            )}

            {user.energy <= 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">🔋</div>
                  <p className="text-sm">No Energy!</p>
                  <p className="text-xs text-gray-400">Wait for energy to regenerate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}