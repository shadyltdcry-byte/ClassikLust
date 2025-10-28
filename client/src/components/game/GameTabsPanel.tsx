import React from "react";
import { Button } from "@/components/ui/button";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { useAuth } from "@/context/AuthContext";

interface GameTabsPanelProps {
  activePlugin: string;
  onPluginChange: (plugin: string) => void;
}

export default function GameTabsPanel({ 
  activePlugin, 
  onPluginChange
}: GameTabsPanelProps) {
  const { userId } = useAuth();
  const { hasUnreadMessages, markAsRead } = useChatNotifications(userId);
  
  const handleChatClick = () => {
    markAsRead();
    onPluginChange("chat");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md z-40 border-t border-purple-500/30">
      <div className="flex justify-around items-center py-3 px-2">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 p-3 hover:bg-purple-600/20 transition-all duration-200 rounded-xl ${
            activePlugin === "main" ? "bg-purple-600/30 text-pink-300" : "text-white/80"
          }`}
          onClick={() => onPluginChange("main")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_home.png" 
              alt="Main" 
              className="w-10 h-10 object-contain" 
            />
            <span className="text-xs font-medium mt-1">
              Main
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 p-3 hover:bg-purple-600/20 transition-all duration-200 rounded-xl ${
            activePlugin === "levelup" ? "bg-purple-600/30 text-pink-300" : "text-white/80"
          }`}
          onClick={() => onPluginChange("levelup")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_levelup.png" 
              alt="Level Up" 
              className="w-10 h-10 object-contain" 
            />
            <span className="text-xs font-medium mt-1">
              Level Up
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 p-3 hover:bg-purple-600/20 transition-all duration-200 rounded-xl ${
            activePlugin === "upgrades" ? "bg-purple-600/30 text-pink-300" : "text-white/80"
          }`}
          onClick={() => onPluginChange("upgrades")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_upgrades.png" 
              alt="Upgrades" 
              className="w-10 h-10 object-contain" 
            />
            <span className="text-xs font-medium mt-1">
              Upgrades
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 p-3 hover:bg-purple-600/20 transition-all duration-200 rounded-xl ${
            activePlugin === "tasks" ? "bg-purple-600/30 text-pink-300" : "text-white/80"
          }`}
          onClick={() => onPluginChange("tasks")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_task.png" 
              alt="Tasks" 
              className="w-10 h-10 object-contain" 
            />
            <span className="text-xs font-medium mt-1">
              Tasks
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`relative flex flex-col items-center gap-1 p-3 hover:bg-purple-600/20 transition-all duration-200 rounded-xl ${
            activePlugin === "chat" ? "bg-purple-600/30 text-pink-300" : "text-white/80"
          }`}
          onClick={handleChatClick}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_chat.png" 
              alt="Chat" 
              className="w-10 h-10 object-contain" 
            />
            {hasUnreadMessages && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <span className="text-white text-xs font-bold leading-none">!</span>
              </div>
            )}
            <span className="text-xs font-medium mt-1">
              Chat
            </span>
          </div>
        </Button>

        {/* ❌ REMOVED: Wheel button (no longer needed in bottom navigation) */}
      </div>
    </div>
  );
}