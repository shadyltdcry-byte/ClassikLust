/**
 * vipRoutes.ts - VIP Membership and Benefits Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles VIP membership tiers, benefits, purchase processing, and time tracking
 */

import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

// VIP tier configuration
const vipTiers = {
  basic: {
    id: 'basic',
    name: 'VIP Basic',
    price: 9.99,
    duration: 30, // days
    benefits: [
      '2x LP per tap',
      'Access to 10 exclusive characters',
      'Priority chat responses',
      'Daily bonus: 1000 LP',
      'Exclusive VIP media content'
    ],
    lpMultiplier: 2,
    exclusiveCharacters: 10,
    dailyBonus: 1000
  },
  premium: {
    id: 'premium',
    name: 'VIP Premium',
    price: 19.99,
    duration: 30,
    benefits: [
      '3x LP per tap',
      'Access to ALL exclusive characters',
      'Instant AI responses',
      'Daily bonus: 2500 LP',
      'All NSFW content unlocked',
      'Custom character creation',
      'Priority support'
    ],
    lpMultiplier: 3,
    exclusiveCharacters: -1, // -1 means all
    dailyBonus: 2500,
    nsfwUnlocked: true
  },
  lifetime: {
    id: 'lifetime',
    name: 'VIP Lifetime',
    price: 99.99,
    duration: -1, // -1 means permanent
    benefits: [
      '5x LP per tap',
      'Unlimited access to all content',
      'Custom AI personality training',
      'Daily bonus: 5000 LP',
      'Beta features access',
      'Direct developer contact',
      'Lifetime updates'
    ],
    lpMultiplier: 5,
    exclusiveCharacters: -1,
    dailyBonus: 5000,
    nsfwUnlocked: true,
    betaAccess: true
  }
};

export function registerVipRoutes(app: Express) {

  // Get VIP status for user
  app.get('/api/vip/status/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      const vipStatus = {
        isVip: user.vipStatus || false,
        tier: user.vipTier || null,
        expiresAt: user.vipExpiresAt || null,
        isExpired: false,
        daysRemaining: 0,
        benefits: []
      };

      if (user.vipStatus && user.vipExpiresAt) {
        const expirationDate = new Date(user.vipExpiresAt);
        const now = new Date();
        
        if (expirationDate > now) {
          // VIP is active
          vipStatus.isExpired = false;
          vipStatus.daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          const tierInfo = vipTiers[user.vipTier];
          if (tierInfo) {
            vipStatus.benefits = tierInfo.benefits;
          }
        } else {
          // VIP has expired
          vipStatus.isExpired = true;
          vipStatus.isVip = false;
        }
      }

      res.json(vipStatus);
    } catch (error) {
      console.error('VIP status error:', error);
      res.status(500).json(createErrorResponse('Failed to get VIP status'));
    }
  });

  // Get available VIP tiers
  app.get('/api/vip/tiers', (req: Request, res: Response) => {
    try {
      res.json(createSuccessResponse({
        tiers: vipTiers,
        currency: 'USD'
      }));
    } catch (error) {
      console.error('VIP tiers error:', error);
      res.status(500).json(createErrorResponse('Failed to get VIP tiers'));
    }
  });

  // Purchase VIP membership
  app.post('/api/vip/purchase', async (req: Request, res: Response) => {
    try {
      const { userId, tierId, paymentMethod } = req.body;

      if (!userId || !tierId) {
        return res.status(400).json(createErrorResponse('User ID and tier ID are required'));
      }

      const tier = vipTiers[tierId];
      if (!tier) {
        return res.status(400).json(createErrorResponse('Invalid VIP tier'));
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      // Mock payment processing (in real implementation, integrate with payment processor)
      console.log(`Processing VIP purchase for ${userId}: ${tier.name} - $${tier.price}`);

      // Calculate expiration date
      let expirationDate;
      if (tier.duration === -1) {
        // Lifetime membership
        expirationDate = null;
      } else {
        const now = new Date();
        expirationDate = new Date(now.getTime() + (tier.duration * 24 * 60 * 60 * 1000));
      }

      // Update user VIP status
      const vipUpdates = {
        vipStatus: true,
        vipTier: tierId,
        vipPurchasedAt: new Date().toISOString(),
        vipExpiresAt: expirationDate?.toISOString() || null,
        nsfwConsent: tier.nsfwUnlocked || user.nsfwConsent || false
      };

      const updatedUser = await storage.updateUser(userId, vipUpdates);

      // Log the purchase
      try {
        await storage.logVipPurchase(userId, tierId, tier.price, paymentMethod);
      } catch (logError) {
        console.warn('Failed to log VIP purchase:', logError);
      }

      res.json(createSuccessResponse({
        message: `Successfully purchased ${tier.name}!`,
        user: updatedUser,
        tier: tier,
        expiresAt: expirationDate?.toISOString() || 'Never',
        transactionId: `vip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));

    } catch (error) {
      console.error('VIP purchase error:', error);
      res.status(500).json(createErrorResponse('Failed to process VIP purchase'));
    }
  });

  // Cancel VIP membership (for refunds/customer service)
  app.post('/api/vip/cancel', async (req: Request, res: Response) => {
    try {
      const { userId, reason } = req.body;

      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID is required'));
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      if (!user.vipStatus) {
        return res.status(400).json(createErrorResponse('User does not have active VIP membership'));
      }

      // Cancel VIP membership
      const cancelUpdates = {
        vipStatus: false,
        vipTier: null,
        vipExpiresAt: null,
        vipCancelledAt: new Date().toISOString(),
        vipCancelReason: reason || 'User requested'
      };

      const updatedUser = await storage.updateUser(userId, cancelUpdates);

      console.log(`VIP membership cancelled for ${userId}. Reason: ${reason}`);

      res.json(createSuccessResponse({
        message: 'VIP membership cancelled successfully',
        user: updatedUser
      }));

    } catch (error) {
      console.error('VIP cancellation error:', error);
      res.status(500).json(createErrorResponse('Failed to cancel VIP membership'));
    }
  });

  // Get VIP benefits for user (used by other systems to check permissions)
  app.get('/api/vip/benefits/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      const benefits = {
        isVip: false,
        lpMultiplier: 1,
        exclusiveCharactersCount: 0,
        nsfwAccess: user.nsfwConsent || false,
        dailyBonus: 0,
        betaAccess: false,
        prioritySupport: false
      };

      // Check if VIP is active and not expired
      if (user.vipStatus && user.vipTier) {
        const tier = vipTiers[user.vipTier];
        
        if (tier) {
          let vipActive = true;
          
          // Check expiration for non-lifetime memberships
          if (tier.duration !== -1 && user.vipExpiresAt) {
            const expirationDate = new Date(user.vipExpiresAt);
            const now = new Date();
            vipActive = expirationDate > now;
          }
          
          if (vipActive) {
            benefits.isVip = true;
            benefits.lpMultiplier = tier.lpMultiplier;
            benefits.exclusiveCharactersCount = tier.exclusiveCharacters;
            benefits.nsfwAccess = tier.nsfwUnlocked || user.nsfwConsent || false;
            benefits.dailyBonus = tier.dailyBonus;
            benefits.betaAccess = tier.betaAccess || false;
            benefits.prioritySupport = true;
          }
        }
      }

      res.json(benefits);
    } catch (error) {
      console.error('VIP benefits error:', error);
      res.status(500).json(createErrorResponse('Failed to get VIP benefits'));
    }
  });

  // Claim daily VIP bonus
  app.post('/api/vip/claim-daily-bonus', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID is required'));
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      if (!user.vipStatus) {
        return res.status(400).json(createErrorResponse('VIP membership required'));
      }

      // Check if bonus already claimed today
      const lastClaim = user.lastVipBonusClaim ? new Date(user.lastVipBonusClaim) : null;
      const now = new Date();
      
      if (lastClaim) {
        const timeSinceLastClaim = now.getTime() - lastClaim.getTime();
        const hoursLeft = 24 - Math.floor(timeSinceLastClaim / (60 * 60 * 1000));
        
        if (timeSinceLastClaim < 24 * 60 * 60 * 1000) {
          return res.status(400).json(createErrorResponse(
            `Daily bonus already claimed. Next bonus available in ${hoursLeft} hours.`
          ));
        }
      }

      const tier = vipTiers[user.vipTier];
      if (!tier || !tier.dailyBonus) {
        return res.status(400).json(createErrorResponse('No daily bonus available for your VIP tier'));
      }

      // Award bonus LP
      const updatedUser = await storage.updateUser(userId, {
        lp: (user.lp || 0) + tier.dailyBonus,
        lastVipBonusClaim: now.toISOString()
      });

      res.json(createSuccessResponse({
        message: `Claimed daily VIP bonus: ${tier.dailyBonus} LP!`,
        bonusAmount: tier.dailyBonus,
        newLpTotal: updatedUser.lp,
        nextClaimTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      }));

    } catch (error) {
      console.error('VIP daily bonus error:', error);
      res.status(500).json(createErrorResponse('Failed to claim daily VIP bonus'));
    }
  });

  // Get VIP purchase history
  app.get('/api/vip/purchase-history/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const purchaseHistory = await storage.getVipPurchaseHistory(userId);
      res.json(purchaseHistory || []);
    } catch (error) {
      console.error('VIP purchase history error:', error);
      res.json([]);
    }
  });

  // Admin endpoint to grant VIP membership
  app.post('/api/admin/vip/grant', async (req: Request, res: Response) => {
    try {
      const { userId, tierId, durationDays } = req.body;

      if (!userId || !tierId) {
        return res.status(400).json(createErrorResponse('User ID and tier ID are required'));
      }

      const tier = vipTiers[tierId];
      if (!tier) {
        return res.status(400).json(createErrorResponse('Invalid VIP tier'));
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      // Calculate expiration based on duration or tier default
      const duration = durationDays || tier.duration;
      let expirationDate = null;
      
      if (duration !== -1) {
        const now = new Date();
        expirationDate = new Date(now.getTime() + (duration * 24 * 60 * 60 * 1000));
      }

      const vipUpdates = {
        vipStatus: true,
        vipTier: tierId,
        vipPurchasedAt: new Date().toISOString(),
        vipExpiresAt: expirationDate?.toISOString() || null,
        nsfwConsent: tier.nsfwUnlocked || user.nsfwConsent || false
      };

      const updatedUser = await storage.updateUser(userId, vipUpdates);

      console.log(`Admin granted VIP ${tier.name} to user ${userId}`);

      res.json(createSuccessResponse({
        message: `Successfully granted ${tier.name} to user`,
        user: updatedUser,
        tier: tier,
        expiresAt: expirationDate?.toISOString() || 'Never'
      }));

    } catch (error) {
      console.error('Admin VIP grant error:', error);
      res.status(500).json(createErrorResponse('Failed to grant VIP membership'));
    }
  });
}