import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  message: string;
  senderType: 'user' | 'assistant';
  timestamp: string;
  characterid: string;
}

export function useChatNotifications(userId: string | null) {
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(() => {
    // Only read from localStorage once on mount and when userId is valid
    if (!userId) return null;
    return localStorage.getItem(`chat_last_read_${userId}`);
  });
  
  // Only fetch if we have a valid userId
  const { data: chatHistory = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat-history', userId, '550e8400-e29b-41d4-a716-446655440002'], // Luna's ID
    enabled: !!userId && userId !== 'undefined' && userId !== 'null',
    refetchInterval: 45000, // Reduced from 30s to 45s for better performance
    staleTime: 30000, // Cache for 30 seconds
    retry: 1, // Reduce retries
    refetchOnWindowFocus: false, // Don't refetch on focus changes
  });

  // Memoize unread count calculation to prevent re-renders
  const unreadCount = React.useMemo(() => {
    if (!chatHistory.length || !userId) return 0;
    
    return (chatHistory as ChatMessage[]).filter((message: ChatMessage) => {
      const isFromLuna = message.senderType === 'assistant';
      const isNewer = !lastReadTimestamp || message.timestamp > lastReadTimestamp;
      return isFromLuna && isNewer;
    }).length;
  }, [chatHistory, lastReadTimestamp, userId]);

  const hasUnreadMessages = unreadCount > 0;

  const markAsRead = React.useCallback(() => {
    if (!userId) return;
    
    const now = new Date().toISOString();
    setLastReadTimestamp(now);
    localStorage.setItem(`chat_last_read_${userId}`, now);
  }, [userId]);

  // Update localStorage when userId changes
  useEffect(() => {
    if (userId && userId !== 'undefined' && userId !== 'null') {
      const stored = localStorage.getItem(`chat_last_read_${userId}`);
      setLastReadTimestamp(stored);
    } else {
      setLastReadTimestamp(null);
    }
  }, [userId]);

  return {
    hasUnreadMessages,
    unreadCount,
    markAsRead
  };
}