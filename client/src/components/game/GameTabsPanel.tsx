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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#330a22]/95 via-[#2a0f22]/95 to-[#330a22]/95 border-t border-pink-500/20 backdrop-blur-sm z-40 shadow-lg shadow-black/20">
      <div className="flex justify-around items-center p-3">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white/90 hover:bg-pink-600/15 p-3 rounded-lg transition-all duration-300 ${
            activePlugin === "main" 
              ? "bg-pink-600/20 ring-1 ring-pink-400/40 shadow-sm shadow-pink-400/20" 
              : ""
          }`}
          onClick={() => onPluginChange("main")}
        >
          <img 
            src="/gamegui/nav_home.png" 
            alt="Main" 
            className="w-7 h-7 object-contain drop-shadow-sm" 
          />
          <span className="text-xs font-medium">Main</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white/90 hover:bg-pink-600/15 p-3 rounded-lg transition-all duration-300 ${
            activePlugin === "levelup" 
              ? "bg-pink-600/20 ring-1 ring-pink-400/40 shadow-sm shadow-pink-400/20" 
              : ""
          }`}
          onClick={() => onPluginChange("levelup")}
        >
          <img 
            src="/gamegui/nav_levelup.png" 
            alt="Level Up" 
            className="w-7 h-7 object-contain drop-shadow-sm" 
          />
          <span className="text-xs font-medium">Level Up</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white/90 hover:bg-pink-600/15 p-3 rounded-lg transition-all duration-300 ${
            activePlugin === "upgrades" 
              ? "bg-pink-600/20 ring-1 ring-pink-400/40 shadow-sm shadow-pink-400/20" 
              : ""
          }`}
          onClick={() => onPluginChange("upgrades")}
        >
          <img 
            src="/gamegui/nav_upgrades.png" 
            alt="Upgrades" 
            className="w-7 h-7 object-contain drop-shadow-sm" 
          />
          <span className="text-xs font-medium">Upgrades</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white/90 hover:bg-pink-600/15 p-3 rounded-lg transition-all duration-300 ${
            activePlugin === "tasks" 
              ? "bg-pink-600/20 ring-1 ring-pink-400/40 shadow-sm shadow-pink-400/20" 
              : ""
          }`}
          onClick={() => onPluginChange("tasks")}
        >
          <img 
            src="/gamegui/nav_task.png" 
            alt="Tasks" 
            className="w-7 h-7 object-contain drop-shadow-sm" 
          />
          <span className="text-xs font-medium">Tasks</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`relative flex flex-col items-center gap-1 text-white/90 hover:bg-pink-600/15 p-3 rounded-lg transition-all duration-300 ${
            activePlugin === "chat" 
              ? "bg-pink-600/20 ring-1 ring-pink-400/40 shadow-sm shadow-pink-400/20" 
              : ""
          }`}
          onClick={handleChatClick}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_chat.png" 
              alt="Chat" 
              className="w-7 h-7 object-contain drop-shadow-sm" 
            />
            {hasUnreadMessages && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                <span className="text-white text-xs font-bold leading-none">!</span>
              </div>
            )}
          </div>
          <span className="text-xs font-medium">Chat</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white/90 hover:bg-pink-600/15 p-3 rounded-lg transition-all duration-300 ${
            activePlugin === "achievements" 
              ? "bg-pink-600/20 ring-1 ring-pink-400/40 shadow-sm shadow-pink-400/20" 
              : ""
          }`}
          onClick={() => onPluginChange("achievements")}
        >
          <img 
            src="/gamegui/nav_achievements.png" 
            alt="Achievements" 
            className="w-7 h-7 object-contain drop-shadow-sm" 
          />
          <span className="text-xs font-medium">Goals</span>
        </Button>
      </div>
    </div>
  );
}