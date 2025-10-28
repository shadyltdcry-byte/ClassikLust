import type { Request, Response } from 'express';

// Mock VIP status data
const mockVipUsers: Record<string, any> = {};

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = req.params?.userId || req.query?.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user has active VIP
    const userVip = mockVipUsers[userId as string];
    
    if (!userVip) {
      return res.status(200).json({
        isActive: false,
        planType: null,
        endDate: null
      });
    }

    const now = new Date();
    const endDate = new Date(userVip.endDate);
    const isActive = now < endDate;

    return res.status(200).json({
      isActive,
      planType: userVip.planType,
      endDate: userVip.endDate,
      features: userVip.features || []
    });
    
  } catch (error) {
    console.error('VIP status error:', error);
    return res.status(500).json({ 
      message: 'Failed to get VIP status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}