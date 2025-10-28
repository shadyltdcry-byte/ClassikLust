import { createServerClient } from './server';

export const withAuth = (handler: any) => {
  return async (req: any, res: any) => {
    const supabase = createServerClient();
    
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        req.user = user;
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
    }
    
    return handler(req, res);
  };
};