import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';

export interface PlayerData {
  userId: string;
  username?: string;
  displayName?: string;
  telegram?: { username?: string };
  lp?: number;
  lpPerHour?: number;
  energy?: number;
  maxEnergy?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
  lustGems?: number;
}

async function fetchPlayer(userId?: string): Promise<PlayerData | null> {
  try {
    const res = await apiRequest('GET', '/api/me');
    if (res.ok) return await res.json();

    if (userId) {
      const res2 = await apiRequest('GET', `/api/users/${encodeURIComponent(userId)}`);
      if (res2.ok) return await res2.json();
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function usePlayer() {
  const { userId, user } = useAuth();

  return useQuery<PlayerData | null>({
    queryKey: ['player', userId],
    queryFn: () => fetchPlayer(userId),
    initialData: user
      ? {
          userId: userId || 'unknown',
          username: user?.username,
          displayName: user?.displayName,
          telegram: user?.telegram,
          lp: user?.lp,
          lpPerHour: user?.lpPerHour,
          energy: user?.energy,
          maxEnergy: user?.maxEnergy,
          level: user?.level,
          xp: user?.xp,
          xpToNext: user?.xpToNext,
          lustGems: user?.lustGems,
        }
      : null,
    staleTime: 10000,
  });
}
