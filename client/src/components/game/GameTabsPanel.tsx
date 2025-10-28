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
    <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm z-40 border-t border-white/10">
      <div className="flex justify-around items-center py-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 transition-colors"
          onClick={() => onPluginChange("main")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_home.png" 
              alt="Main" 
              className="w-12 h-12 object-contain" 
            />
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium drop-shadow-lg">
              Main
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 transition-colors"
          onClick={() => onPluginChange("levelup")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_levelup.png" 
              alt="Level Up" 
              className="w-12 h-12 object-contain" 
            />
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium drop-shadow-lg">
              Level Up
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 transition-colors"
          onClick={() => onPluginChange("upgrades")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_upgrades.png" 
              alt="Upgrades" 
              className="w-12 h-12 object-contain" 
            />
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium drop-shadow-lg">
              Upgrades
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 transition-colors"
          onClick={() => onPluginChange("tasks")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_task.png" 
              alt="Tasks" 
              className="w-12 h-12 object-contain" 
            />
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium drop-shadow-lg">
              Tasks
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="relative flex flex-col items-center gap-1 p-2 hover:bg-white/10 transition-colors"
          onClick={handleChatClick}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_chat.png" 
              alt="Chat" 
              className="w-12 h-12 object-contain" 
            />
            {hasUnreadMessages && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                <span className="text-white text-xs font-bold leading-none">!</span>
              </div>
            )}
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium drop-shadow-lg">
              Chat
            </span>
          </div>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 transition-colors"
          onClick={() => onPluginChange("wheel")}
        >
          <div className="relative">
            <img 
              src="/gamegui/nav_wheel.png" 
              alt="Wheel" 
              className="w-12 h-12 object-contain" 
            />
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium drop-shadow-lg">
              Wheel
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
}