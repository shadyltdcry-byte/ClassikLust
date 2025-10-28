import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  authSource?: 'telegram' | 'supabase' | 'guest';
}

/**
 * Middleware to reject write operations from guest users
 * unless explicitly allowed
 */
export function requireAuthenticatedUser(allowGuests = false) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.body?.userId || req.params?.userId || req.body?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required for this operation'
      });
    }

    // Check if user is a guest
    const isGuest = userId.startsWith('guest_');
    
    if (isGuest && !allowGuests) {
      return res.status(403).json({
        success: false,
        error: 'Guest users cannot perform write operations. Please log in with Telegram.',
        code: 'GUEST_WRITE_DENIED'
      });
    }

    // Add user info to request for downstream middleware
    req.userId = userId;
    req.authSource = isGuest ? 'guest' : 'telegram'; // TODO: Add Supabase detection
    
    console.log(`[AuthGuard] ${req.method} ${req.path} - User: ${userId} (${req.authSource}) - ${isGuest && allowGuests ? 'Guest allowed' : 'Authenticated'}`);
    
    next();
  };
}

/**
 * Middleware specifically for read operations
 * Allows all users but logs access
 */
export function logUserAccess() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.body?.userId || req.params?.userId || req.body?.userId || req.query?.userId;
    
    if (userId) {
      const isGuest = userId.startsWith('guest_');
      req.userId = userId;
      req.authSource = isGuest ? 'guest' : 'telegram';
      
      console.log(`[Access] ${req.method} ${req.path} - User: ${userId} (${req.authSource})`);
    }
    
    next();
  };
}

/**
 * Strict auth guard that requires valid Telegram authentication
 */
export function requireTelegramAuth() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.body?.userId || req.params?.userId || req.body?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Only allow authenticated Telegram users
    if (userId.startsWith('guest_')) {
      return res.status(401).json({
        success: false,
        error: 'Telegram authentication required for this operation',
        code: 'TELEGRAM_AUTH_REQUIRED'
      });
    }

    req.userId = userId;
    req.authSource = 'telegram';
    
    console.log(`[TelegramAuth] ${req.method} ${req.path} - User: ${userId}`);
    
    next();
  };
}

/**
 * Helper function to validate user ID format
 */
export function isValidUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') return false;
  
  // Valid formats:
  // - guest_123456789
  // - telegram_123456789  
  // - adbf6b65-418c-4cd8-acf9-fca73ca469b0 (UUID for Supabase)
  
  return /^(guest_\d+|telegram_\d+|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(userId);
}

/**
 * Middleware to validate user ID format
 */
export function validateUserId() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.body?.userId || req.params?.userId || req.body?.userId;
    
    if (userId && !isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }
    
    next();
  };
}