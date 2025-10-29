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

  // ✅ FIXED: Main character image with user displayPicture override
  const getMainCharacterImage = () => {
    // 1. First priority: User's custom display picture (filename only)
    if (user?.displayPicture && user.displayPicture !== 'null' && user.displayPicture.trim() !== '') {
      console.log('🖼️ [CHARACTER-DISPLAY] Using user displayPicture:', user.displayPicture);
      // Build URL from filename
      return `/uploads/${user.displayPicture}`;
    }
    
    // 2. Second priority: Character's imageUrl
    if (character?.imageUrl && character.imageUrl !== 'null' && character.imageUrl !== '/uploads/undefined') {
      console.log('🖼️ [CHARACTER-DISPLAY] Using character imageUrl:', character.imageUrl);
      return character.imageUrl;
    }
    
    // 3. Third priority: Character's avatarPath
    if (character?.avatarPath && character.avatarPath !== 'null' && character.avatarPath !== '/uploads/undefined') {
      console.log('🖼️ [CHARACTER-DISPLAY] Using character avatarPath:', character.avatarPath);
      return character.avatarPath;
    }
    
    // 4. Fourth priority: Character's avatarUrl
    if (character?.avatarUrl && character.avatarUrl !== 'null' && character.avatarUrl !== '/uploads/undefined') {
      console.log('🖼️ [CHARACTER-DISPLAY] Using character avatarUrl:', character.avatarUrl);
      return character.avatarUrl;
    }
    
    // 5. Fallback: Default placeholder
    console.log('🖼️ [CHARACTER-DISPLAY] Using fallback placeholder');
    return 'https://via.placeholder.com/600x800/1a1a1a/ff1493?text=👤';
  };

  return (
    <div className="px-4 pb-6">
      <div className="relative bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-purple-500/30">
        {/* Character Info */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold gradient-text">{character?.name || "Unnamed"}</h2>
          <p className="text-gray-400 text-sm">{character?.backstory || "Tap to interact!"}</p>
        </div>

        {/* ✅ FIXED: Character Main Image Container - DOUBLED SIZE */}
        <div className="relative mx-auto max-w-[1032px] mb-6"> {/* Was 516px, now 1032px */}
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
              src={getMainCharacterImage()}
              alt={character?.name || "Player"}
              onClick={shouldOpenGallery ? onAvatarClick : handleTap}
              onContextMenu={handleAvatarClick}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallback = 'https://via.placeholder.com/600x800/1a1a1a/ff1493?text=👤'; // ✅ FIXED: Bigger fallback too
                if (target.src !== fallback) {
                  console.warn('🖼️ [CHARACTER-DISPLAY] Image failed to load, using fallback:', target.src);
                  target.src = fallback;
                }
              }}
              className={`w-full h-auto aspect-[3/4] object-cover rounded-2xl shadow-2xl cursor-pointer transform hover:scale-105 transition-all duration-200 active:scale-95 ${
                tapEffect ? 'tap-effect scale-95' : ''
              } ${user.energy <= 0 ? 'grayscale opacity-50' : ''}`}
              style={{
                filter: user.energy <= 0 ? 'grayscale(100%)' : 'none',
                maxHeight: '800px' // ✅ DOUBLED: Was 400px, now 800px
              }}
              title="Right-click or Ctrl+Click to open gallery"
            />

            {/* Tap Effect Overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl transition-opacity duration-200 pointer-events-none ${
                tapEffect ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* ✅ FIXED: Floating Hearts with LP Display - BIGGER for larger image */}
            {tapEffect && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Heart 1 - Top Left with Custom Image */}
                <div className="absolute top-1/4 left-1/4 animate-float-up flex items-center gap-2">
                  <img src="/uploads/floatinghearts.png" alt="hearts" className="w-8 h-8" /> {/* Was w-6 h-6 */}
                  <span className="text-pink-500 font-bold text-2xl opacity-80 animate-fade-out"> {/* Was text-lg */}
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>

                {/* Heart 2 - Top Right with Emoji Heart */}
                <div className="absolute top-1/3 right-1/3 animate-float-up flex items-center gap-2" style={{ animationDelay: '0.4s' }}>
                  <span className="text-red-400 text-3xl">❤️</span> {/* Was text-xl */}
                  <span className="text-pink-500 font-bold text-2xl opacity-80 animate-fade-out" style={{ animationDelay: '0.4s' }}>
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>

                {/* Heart 3 - Center with Different Emoji */}
                <div className="absolute top-1/2 left-1/2 animate-float-up flex items-center gap-2" style={{ animationDelay: '0.6s' }}>
                  <span className="text-pink-400 text-3xl">💕</span> {/* Was text-xl */}
                  <span className="text-pink-500 font-bold text-2xl opacity-80 animate-fade-out" style={{ animationDelay: '0.6s' }}>
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>

                {/* Heart 4 - Bottom with Custom Image */}
                <div className="absolute top-2/3 left-2/3 animate-float-up flex items-center gap-2" style={{ animationDelay: '0.8s' }}>
                  <img src="/uploads/floatinghearts.png" alt="hearts" className="w-7 h-7" /> {/* Was w-5 h-5 */}
                  <span className="text-pink-500 font-bold text-2xl opacity-80 animate-fade-out" style={{ animationDelay: '0.8s' }}>
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>

                {/* Heart 5 - Another Emoji Heart */}
                <div className="absolute top-3/4 left-1/4 animate-float-up flex items-center gap-2" style={{ animationDelay: '0.9s' }}>
                  <span className="text-red-500 text-3xl">💖</span> {/* Was text-xl */}
                  <span className="text-pink-500 font-bold text-2xl opacity-80 animate-fade-out" style={{ animationDelay: '0.9s' }}>
                    +{lpPerTap || user.lpPerTap || 1}
                  </span>
                </div>
              </div>
            )}

            {user.energy <= 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">🔋</div> {/* Was text-4xl mb-2 */}
                  <p className="text-lg">No Energy!</p> {/* Was text-sm */}
                  <p className="text-sm text-gray-400">Wait for energy to regenerate</p> {/* Was text-xs */}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* ✅ REMOVED: Debug info completely removed per request */}
      </div>
    </div>
  );
}