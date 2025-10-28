import type { Request, Response } from 'express';

// Mock VIP users storage
const mockVipUsers: Record<string, any> = {};

const VIP_PLANS = {
  daily: { duration: 24 * 60 * 60 * 1000, price: 4.99 }, // 24 hours
  weekly: { duration: 7 * 24 * 60 * 60 * 1000, price: 19.99 }, // 7 days
  monthly: { duration: 30 * 24 * 60 * 60 * 1000, price: 49.99 } // 30 days
};

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, planId } = req.body;
    
    if (!userId || !planId) {
      return res.status(400).json({ message: 'User ID and Plan ID are required' });
    }

    const plan = VIP_PLANS[planId as keyof typeof VIP_PLANS];
    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan ID' });
    }

    // Calculate end date
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.duration);

    // Store VIP status (in real app, this would go to database)
    mockVipUsers[userId] = {
      planType: planId,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      price: plan.price,
      features: getPlanFeatures(planId)
    };

    console.log(`User ${userId} purchased ${planId} VIP plan`);

    return res.status(200).json({
      success: true,
      planType: planId,
      endDate: endDate.toISOString(),
      message: `Successfully purchased ${planId} VIP plan!`
    });
    
  } catch (error) {
    console.error('VIP purchase error:', error);
    return res.status(500).json({ 
      message: 'Failed to purchase VIP plan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getPlanFeatures(planId: string) {
  const features = {
    daily: ['2x Lust Points', '+50% Energy Regen', 'Exclusive Characters', 'VIP Chat Responses'],
    weekly: ['3x Lust Points', '+100% Energy Regen', 'All Exclusive Content', 'Priority Support', 'Daily Bonus Gems'],
    monthly: ['5x Lust Points', '+200% Energy Regen', 'Unlimited Access', 'Custom Characters', 'Monthly Exclusive Events']
  };
  
  return features[planId as keyof typeof features] || [];
}