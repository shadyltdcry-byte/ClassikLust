import React from "react";

interface GameProgressPanelProps {
  type: 'tasks' | 'achievements';
  progress: number;
}

export default function GameProgressPanel({ type, progress }: GameProgressPanelProps) {
  const isTask = type === 'tasks';
  
  // Milestone rewards
  const milestones = [
    { percent: 25, icon: "🎁", reward: "Bronze Chest", unlocked: false },
    { percent: 50, icon: "💎", reward: "Silver Chest", unlocked: false },
    { percent: 75, icon: "👑", reward: "Gold Chest", unlocked: false },
    { percent: 100, icon: "🏆", reward: "Master Chest", unlocked: false },
  ];

  const updatedMilestones = milestones.map(milestone => ({
    ...milestone,
    unlocked: progress >= milestone.percent
  }));

  // Dynamic classes based on type
  const headerClasses = isTask 
    ? "relative p-4 bg-gradient-to-br from-purple-900/60 to-purple-800/40 border-2 border-purple-500/30 rounded-t-xl shadow-xl"
    : "relative p-4 bg-gradient-to-br from-yellow-900/60 to-yellow-800/40 border-2 border-yellow-500/30 rounded-t-xl shadow-xl";
  
  const titleClasses = isTask 
    ? "text-2xl font-bold text-purple-200 mb-1"
    : "text-2xl font-bold text-yellow-200 mb-1";
  
  const progressBarBorderClasses = isTask
    ? "mt-3 bg-black/40 rounded-full p-1 border border-purple-500/20"
    : "mt-3 bg-black/40 rounded-full p-1 border border-yellow-500/20";
    
  const progressBarClasses = isTask
    ? "h-2 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-700 shadow-lg"
    : "h-2 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-700 shadow-lg";
    
  const contentClasses = isTask
    ? "flex-1 p-4 bg-gradient-to-b from-black/20 to-black/40 border-2 border-t-0 border-purple-500/30 rounded-b-xl shadow-xl backdrop-blur-sm"
    : "flex-1 p-4 bg-gradient-to-b from-black/20 to-black/40 border-2 border-t-0 border-yellow-500/30 rounded-b-xl shadow-xl backdrop-blur-sm";
    
  const sectionTitleClasses = isTask
    ? "text-sm font-semibold text-purple-300 mb-1"
    : "text-sm font-semibold text-yellow-300 mb-1";
    
  const nextMilestoneClasses = isTask
    ? "text-sm font-semibold text-purple-300"
    : "text-sm font-semibold text-yellow-300";

  return (
    <div className="w-72 h-full flex flex-col">
      {/* Decorative Frame Header */}
      <div className={headerClasses}>
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-lg shadow-md"></div>
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full"></div>
        
        <div className="text-center">
          <div className={titleClasses}>
            {progress}%
          </div>
          <div className="text-xs text-gray-300 uppercase tracking-wide">
            {type === 'tasks' ? 'Tasks Complete' : 'Achievements Unlocked'}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className={progressBarBorderClasses}>
          <div 
            className={progressBarClasses}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestone Chests */}
      <div className={contentClasses}>
        <div className="text-center mb-4">
          <div className={sectionTitleClasses}>Milestone Rewards</div>
          <div className="text-xs text-gray-400">Unlock chests as you progress</div>
        </div>
        
        <div className="space-y-3">
          {updatedMilestones.map((milestone, index) => {
            const itemClasses = milestone.unlocked 
              ? (isTask 
                ? "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 bg-gradient-to-r from-purple-900/40 to-purple-800/20 border-purple-400/50 shadow-lg"
                : "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-yellow-400/50 shadow-lg")
              : 'flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 bg-gray-900/30 border-gray-700/30';
              
            const rewardTextClasses = milestone.unlocked 
              ? (isTask ? "text-sm font-semibold text-purple-200" : "text-sm font-semibold text-yellow-200")
              : 'text-sm font-semibold text-gray-500';
              
            const indicatorClasses = isTask
              ? "w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg"
              : "w-6 h-6 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg";
              
            return (
              <div key={index} className={itemClasses}>
                <div className={`text-2xl transition-all duration-300 ${
                  milestone.unlocked ? 'animate-pulse' : 'grayscale opacity-50'
                }`}>
                  {milestone.icon}
                </div>
                
                <div className="flex-1">
                  <div className={rewardTextClasses}>
                    {milestone.reward}
                  </div>
                  <div className="text-xs text-gray-400">
                    {milestone.percent}% Complete
                  </div>
                </div>
                
                {milestone.unlocked && (
                  <div className={indicatorClasses}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Next Milestone */}
        {progress < 100 && (
          <div className="mt-4 p-3 bg-black/30 rounded-lg border border-gray-600/30">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Next Milestone</div>
              <div className={nextMilestoneClasses}>
                {updatedMilestones.find(m => !m.unlocked)?.percent || 100}% 
                ({(updatedMilestones.find(m => !m.unlocked)?.percent || 100) - progress}% to go)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}