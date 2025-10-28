// Navigation Icons Asset Registry
// Generated custom futuristic icons with dark pink/blackish aesthetic

export const NAVIGATION_ICONS = {
  HOME: '/assets/nav_home.png',
  LEVEL_UP: '/assets/nav_levelup.png',
  UPGRADES: '/assets/nav_upgrades.png',
  TASKS: '/assets/nav_tasks.png',
  CHAT: '/assets/nav_chat.png',
  ACHIEVEMENTS: '/assets/nav_achievements.png',
  WHEEL: '/assets/nav_wheel.png'
};

export const STAT_FRAMES = {
  PRIMARY: '/assets/frame_stat.png'
};

// Icon component wrapper for consistent sizing
export const NavIcon = ({ type, className = "w-6 h-6" }: { type: keyof typeof NAVIGATION_ICONS, className?: string }) => {
  return (
    <img 
      src={NAVIGATION_ICONS[type]} 
      alt={type.toLowerCase().replace('_', ' ')} 
      className={className}
    />
  );
};