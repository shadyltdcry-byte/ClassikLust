import { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseStorage } from '../../shared/SupabaseStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🌊 [HEALTH-CHECK] === API HEALTH CHECK ===');
  console.log('🌊 [HEALTH-CHECK] Method:', req.method);
  console.log('🌊 [HEALTH-CHECK] Time:', new Date().toISOString());
  
  try {
    const startTime = Date.now();
    
    // Test database connection
    const storage = SupabaseStorage.getInstance();
    let databaseStatus = 'unknown';
    let databaseDetails = {};
    
    try {
      // Try to fetch a small amount of data to test connection
      const testQuery = await storage.getAllCharacters();
      databaseStatus = 'connected';
      databaseDetails = {
        charactersFound: Array.isArray(testQuery) ? testQuery.length : 0,
        connectionWorking: true
      };
      console.log('✅ [HEALTH-CHECK] Database connection: OK');
    } catch (dbError) {
      databaseStatus = 'error';
      databaseDetails = {
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        connectionWorking: false
      };
      console.log('❌ [HEALTH-CHECK] Database connection: FAILED', dbError);
    }
    
    // Check AI services availability
    const aiServices = {
      mistral: !!process.env.MISTRAL_DEBUG_API_KEY || !!process.env.MISTRAL_API_KEY,
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      ollama: 'will-test-on-request',
      lmStudio: 'will-test-on-request'
    };
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      message: 'API is running correctly',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'unknown',
      isReplit: !!(process.env.REPL_ID || process.env.REPLIT_DB_URL),
      services: {
        database: {
          status: databaseStatus,
          ...databaseDetails
        },
        ai: {
          available: aiServices,
          primary: process.env.MISTRAL_DEBUG_API_KEY ? 'mistral' : 'local-fallback'
        },
        mediaUpload: {
          status: 'configured',
          maxFileSize: '50MB',
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
        }
      },
      debug: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };
    
    console.log('✅ [HEALTH-CHECK] Health check completed:', {
      responseTime: healthData.responseTime,
      databaseStatus: databaseStatus,
      environment: healthData.environment
    });
    
    res.status(200).json(healthData);
    
  } catch (error) {
    console.error('❌ [HEALTH-CHECK] Health check failed:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      message: 'API health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      details: {
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
      }
    });
  }
}