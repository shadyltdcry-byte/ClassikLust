import type { Request, Response } from 'express';

// Mock wheel prizes storage
let mockWheelPrizes = [
  {
    id: '1',
    type: 'coins',
    label: '100 LP',
    min: 100,
    max: 100,
    probability: 0.30
  },
  {
    id: '2',
    type: 'coins',
    label: '50 LP', 
    min: 50,
    max: 50,
    probability: 0.25
  },
  {
    id: '3',
    type: 'energy',
    label: '25 Energy',
    min: 25,
    max: 25,
    probability: 0.20
  },
  {
    id: '4',
    type: 'gems',
    label: '5 Gems',
    min: 5,
    max: 5,
    probability: 0.15
  },
  {
    id: '5',
    type: 'character',
    label: 'Character Unlock',
    min: 1,
    max: 1,
    probability: 0.08
  },
  {
    id: '6',
    type: 'special',
    label: 'Jackpot!',
    min: 1000,
    max: 1000,
    probability: 0.02
  }
];

export default async function handler(req: Request, res: Response) {
  try {
    switch (req.method) {
      case 'GET':
        return res.status(200).json(mockWheelPrizes);
        
      case 'POST':
        const newPrize = {
          id: Date.now().toString(),
          ...req.body
        };
        mockWheelPrizes.push(newPrize);
        return res.status(201).json(newPrize);
        
      case 'DELETE':
        const prizeId = req.query.id || req.body.id;
        mockWheelPrizes = mockWheelPrizes.filter(p => p.id !== prizeId);
        return res.status(200).json({ success: true });
        
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Wheel prizes API error:', error);
    return res.status(500).json({ 
      message: 'Failed to manage wheel prizes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}