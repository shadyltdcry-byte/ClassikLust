import type { Request, Response } from 'express';

// Mock prizes for wheel spinning
const DEFAULT_PRIZES = [
  {
    id: '1',
    name: '100 LP',
    type: 'points',
    value: 100,
    probability: 0.30,
    color: '#4F46E5',
    icon: '💰'
  },
  {
    id: '2', 
    name: '50 LP',
    type: 'points',
    value: 50,
    probability: 0.25,
    color: '#059669',
    icon: '🪙'
  },
  {
    id: '3',
    name: '25 Energy',
    type: 'energy',
    value: 25,
    probability: 0.20,
    color: '#DC2626',
    icon: '⚡'
  },
  {
    id: '4',
    name: '5 Gems',
    type: 'gems',
    value: 5,
    probability: 0.15,
    color: '#7C3AED',
    icon: '💎'
  },
  {
    id: '5',
    name: 'Character Unlock',
    type: 'character',
    value: 1,
    probability: 0.08,
    color: '#EA580C',
    icon: '👤'
  },
  {
    id: '6',
    name: 'Jackpot!',
    type: 'special',
    value: 1000,
    probability: 0.02,
    color: '#FBBF24',
    icon: '🎉'
  }
];

// Weighted random selection
function selectPrize(prizes: any[]) {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    if (random <= cumulativeProbability) {
      return prize;
    }
  }
  
  // Fallback to first prize
  return prizes[0];
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // TODO: Check if user can spin (once per day)
    // For now, allow spinning
    
    // Select a random prize
    const wonPrize = selectPrize(DEFAULT_PRIZES);
    
    // TODO: Award the prize to the user
    console.log(`User ${userId} won prize:`, wonPrize);
    
    // TODO: Update user stats with last wheel spin time
    
    return res.status(200).json({
      success: true,
      prizeId: wonPrize.id,
      prize: wonPrize,
      message: `Congratulations! You won ${wonPrize.name}!`
    });
    
  } catch (error) {
    console.error('Wheel spin error:', error);
    return res.status(500).json({ 
      message: 'Failed to spin wheel',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}