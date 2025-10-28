import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import type { User, Character, GameStats } from "@shared/schema";

export function useGameState() {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useAuth();

  // Don't fetch data if not authenticated or no user ID
  const enabled = isAuthenticated && !!userId;

  // Fetch user data
  const userQuery = useQuery<User>({
    queryKey: ["/api/user", userId],
    enabled,
    refetchInterval: false, // DISABLED - Stop auto-polling to prevent spam
    retry: false, // DISABLED - Stop retries during network issues
  });

  // Fetch selected character
  const characterQuery = useQuery<Character>({
    queryKey: ["/api/character/selected", userId],
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minute cache for character data
    refetchInterval: false,
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await fetch(`/api/character/selected/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch selected character');
      return response.json();
    }
  });

  // Fetch user stats
  const statsQuery = useQuery<GameStats>({
    queryKey: ["/api/stats", userId],
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minute cache for stats
    refetchInterval: false,
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await fetch(`/api/stats/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Tap mutation
  const tapMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await apiRequest("POST", "/api/tap", { userId });
      return response.json();
    },
    onSuccess: () => {
      // Only invalidate user data to update LP display (no stats to avoid API spam)
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
    },
  });

  return {
    user: userQuery.data,
    character: characterQuery.data,
    stats: statsQuery.data,
    isLoading: userQuery.isLoading || characterQuery.isLoading,
    tap: tapMutation.mutate,
    isTapping: tapMutation.isPending,
  };
}
