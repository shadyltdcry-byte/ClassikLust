/**
 * NewsTicker.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 * Optional scrolling events/news
 *
 * Please leave a detailed description
 *      of each function you add
 */

import React, { useState, useEffect } from 'react';

interface NewsItem {
  id: number;
  text: string;
}

const NewsTicker: React.FC<{ newsItems: NewsItem[] }> = ({ newsItems }) => {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) =>
        prevIndex === newsItems.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change news item every 3 seconds

    return () => clearInterval(interval);
  }, [newsItems.length]);

  if (!newsItems.length) return null;

  return (
    <div style={{
      backgroundColor: '#f0f0f0',
      padding: '10px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#333',
    }}>
      <div style={{
        display: 'inline-block',
        paddingLeft: '100%',
        animation: 'ticker 10s linear infinite',
        '@keyframes ticker': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' }
        }
      }}>
        {newsItems[currentNewsIndex].text}
      </div>
    </div>
  );
};

// Default NewsTicker with game-relevant news
const DefaultNewsTicker: React.FC = () => {
  const gameNewsItems = [
    { id: 1, text: '🔥 New characters available! Check out the latest additions!' },
    { id: 2, text: '💎 Daily rewards reset at midnight - claim yours now!' },
    { id: 3, text: '⚡ Energy regenerates every 30 seconds - keep tapping!' },
  ];

  return <NewsTicker newsItems={gameNewsItems} />;
};

export default DefaultNewsTicker;
