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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pink-900/90 to-red-900/90 border-t border-pink-500/30 backdrop-blur-sm z-40">
      <div className="flex justify-around items-center p-2">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "main" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("main")}
        >
          <img 
            src="/gamegui/nav_home.png" 
            alt="Main" 
            className="w-8 h-8 object-contain drop-shadow-lg" 
          />
          <span className="text-xs">Main</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "levelup" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("levelup")}
        >
          <img 
            src="/gamegui/nav_levelup.png" 
            alt="Level Up" 
            className="w-8 h-8 object-contain drop-shadow-lg" 
          />
          <span className="text-xs">Level Up</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "upgrades" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("upgrades")}
        >
          <img 
            src="/gamegui/nav_upgrades.png" 
            alt="Upgrades" 
            className="w-8 h-8 object-contain drop-shadow-lg" 
          />
          <span className="text-xs">Upgrades</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "tasks" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("tasks")}
        >
          <img 
            src="/gamegui/nav_task.png" 
            alt="Tasks" 
            className="w-8 h-8 object-contain drop-shadow-lg" 
          />
          <span className="text-xs">Tasks</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`relative flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "chat" ? "bg-pink-600/30" : ""
          }`}
          onClick={handleChatClick}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_chat.png" 
              alt="Chat" 
              className="w-8 h-8 object-contain drop-shadow-lg" 
            />
            {hasUnreadMessages && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xs font-bold leading-none">!</span>
              </div>
            )}
          </div>
          <span className="text-xs">Chat</span>
        </Button>

        {/* Optional: Achievements/Wheel tab if you use them */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 text-white hover:bg-pink-600/20 p-2 ${
            activePlugin === "achievements" ? "bg-pink-600/30" : ""
          }`}
          onClick={() => onPluginChange("achievements")}
        >
          <img 
            src="/gamegui/nav_achievements.png" 
            alt="Achievements" 
            className="w-8 h-8 object-contain drop-shadow-lg" 
          />
          <span className="text-xs">Goals</span>
        </Button>
      </div>
    </div>
  );
}