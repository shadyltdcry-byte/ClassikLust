/**
 * GameUI.tsx - Pre-built Game UI Components
 * 
 * Ready-to-use components specifically designed for your game:
 * - GamePanel: Consistent panels with themes
 * - StatBar: Animated progress bars for HP, Energy, etc.
 * - GameButton: Styled buttons with loading states
 * - CharacterCard: Reusable character display cards
 * - GameModal: Game-themed modals and dialogs
 * 
 * Usage: Import what you need from this file
 */

import React, { ReactNode } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Progress } from './progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { cn } from '@/lib/utils';
import { Loader2, Crown, Star, Heart, Lock, Unlock } from 'lucide-react';

// =============================================================================
// GAME PANEL - Consistent panels with game theming
// =============================================================================

interface GamePanelProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'glass' | 'neon' | 'dark';
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
}

export const GamePanel: React.FC<GamePanelProps> = ({
  title,
  subtitle,
  icon,
  variant = 'default',
  children,
  className,
  headerActions
}) => {
  const variants = {
    default: 'bg-gray-800/50 border-gray-600 shadow-lg',
    glass: 'bg-black/20 backdrop-blur-lg border-white/10 shadow-2xl',
    neon: 'bg-gray-900/90 border-purple-500/50 shadow-purple-500/20 shadow-lg',
    dark: 'bg-black/80 border-gray-700 shadow-2xl'
  };

  return (
    <Card className={cn(variants[variant], className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-purple-400">{icon}</div>}
            <div>
              <CardTitle className="text-white text-lg">{title}</CardTitle>
              {subtitle && (
                <CardDescription className="text-gray-400 text-sm">
                  {subtitle}
                </CardDescription>
              )}
            </div>
          </div>
          {headerActions && <div className="flex gap-2">{headerActions}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

// =============================================================================
// STAT BAR - Animated progress bars for game stats
// =============================================================================

interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: 'default' | 'health' | 'energy' | 'experience' | 'lust';
  showNumbers?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  maxValue,
  color = 'default',
  showNumbers = true,
  animated = true,
  size = 'md',
  className
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const colors = {
    default: 'bg-blue-600',
    health: 'bg-red-500',
    energy: 'bg-yellow-500',
    experience: 'bg-green-500',
    lust: 'bg-pink-500'
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between items-center">
        <span className="text-white text-sm font-medium">{label}</span>
        {showNumbers && (
          <span className="text-gray-300 text-xs">
            {value.toLocaleString()} / {maxValue.toLocaleString()}
          </span>
        )}
      </div>
      <div className={cn('w-full bg-gray-700 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn(
            colors[color],
            'h-full rounded-full transition-all duration-500 ease-out',
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// =============================================================================
// GAME BUTTON - Enhanced buttons with game styling
// =============================================================================

interface GameButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'neon' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  glowing?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const GameButton: React.FC<GameButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  glowing = false,
  onClick,
  className,
  type = 'button'
}) => {
  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
    neon: 'bg-transparent border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black shadow-purple-400/50',
    glass: 'bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20'
  };

  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'border transition-all duration-200 font-medium',
        variants[variant],
        sizes[size],
        glowing && 'shadow-lg animate-pulse',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </Button>
  );
};

// =============================================================================
// CHARACTER CARD - Reusable character display
// =============================================================================

interface Character {
  id: string;
  name: string;
  avatarUrl?: string;
  imageUrl?: string;
  level?: number;
  isVip?: boolean;
  isEnabled?: boolean;
  levelRequirement?: number;
}

interface CharacterCardProps {
  character: Character;
  selected?: boolean;
  locked?: boolean;
  onClick?: () => void;
  showStats?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  selected = false,
  locked = false,
  onClick,
  showStats = true,
  variant = 'default',
  className
}) => {
  const getCharacterIcon = (char: Character) => {
    if (char.isVip) return <Crown className="w-3 h-3 text-yellow-400" />;
    if (char.levelRequirement && char.levelRequirement > 5) return <Star className="w-3 h-3 text-blue-400" />;
    return <Heart className="w-3 h-3 text-pink-400" />;
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:scale-105',
        selected
          ? 'ring-2 ring-purple-400 bg-purple-900/50 border-purple-400/50'
          : 'bg-gray-800/60 hover:bg-gray-700/60 border-gray-600/50',
        locked && 'opacity-50',
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(
        'p-3 flex items-center gap-3',
        variant === 'compact' && 'p-2 gap-2'
      )}>
        <div className="relative flex-shrink-0">
          <img
            src={character.avatarUrl || character.imageUrl || '/uploads/placeholder-avatar.jpg'}
            alt={character.name}
            className={cn(
              'rounded-full object-cover',
              variant === 'compact' ? 'w-10 h-10' : 'w-12 h-12'
            )}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/uploads/placeholder-avatar.jpg';
            }}
          />
          {locked && (
            <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
              <Lock className="w-4 h-4 text-red-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <h3 className={cn(
              'font-semibold text-white truncate',
              variant === 'compact' ? 'text-sm' : 'text-base'
            )}>
              {character.name}
            </h3>
            {getCharacterIcon(character)}
          </div>
          
          {showStats && (
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span>Level {character.levelRequirement || 1}</span>
              {character.isEnabled ? (
                <Badge variant="secondary" className="bg-green-600/20 text-green-400 text-xs px-1 py-0">
                  <Unlock className="w-2 h-2 mr-1" /> Unlocked
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-600/20 text-red-400 text-xs px-1 py-0">
                  <Lock className="w-2 h-2 mr-1" /> Locked
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// =============================================================================
// GAME MODAL - Enhanced modal for game dialogs
// =============================================================================

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  variant?: 'default' | 'glass' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}

export const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  variant = 'default',
  size = 'md',
  children,
  footer
}) => {
  const variants = {
    default: 'bg-gray-800 border-gray-600',
    glass: 'bg-black/80 backdrop-blur-xl border-white/10',
    neon: 'bg-gray-900 border-purple-500/50 shadow-purple-500/20'
  };

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(variants[variant], sizes[size])}>
        <DialogHeader>
          <DialogTitle className="text-white text-lg">{title}</DialogTitle>
          {subtitle && (
            <p className="text-gray-400 text-sm">{subtitle}</p>
          )}
        </DialogHeader>
        
        <div className="text-white">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-600">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// NOTIFICATION TOAST - Enhanced toast notifications
// =============================================================================

interface GameToastProps {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'achievement';
  duration?: number;
}

// Use with react-hot-toast:
// import { toast } from 'react-hot-toast';
// toast.custom((t) => <GameToast title="Achievement Unlocked!" type="achievement" />);

export const GameToast: React.FC<GameToastProps> = ({
  title,
  description,
  type = 'info'
}) => {
  const types = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-yellow-600 border-yellow-500',
    info: 'bg-blue-600 border-blue-500',
    achievement: 'bg-purple-600 border-purple-500 shadow-purple-500/30'
  };

  return (
    <div className={cn(
      'max-w-md w-full shadow-lg rounded-lg p-4 border',
      types[type],
      type === 'achievement' && 'animate-bounce'
    )}>
      <div className="text-white">
        <p className="font-semibold">{title}</p>
        {description && (
          <p className="text-sm text-white/80 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// EXPORTS - Everything you need for game UI
// =============================================================================

export default {
  GamePanel,
  StatBar,
  GameButton,
  CharacterCard,
  GameModal,
  GameToast
};