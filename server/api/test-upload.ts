import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 [TEST-UPLOAD] Simple test endpoint called');
  console.log('🧪 [TEST-UPLOAD] Method:', req.method);
  console.log('🧪 [TEST-UPLOAD] Body:', req.body);
  console.log('🧪 [TEST-UPLOAD] Headers:', req.headers);
  
  if (req.method === 'POST') {
    // Just return success to test basic connectivity
    res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      received: {
        method: req.method,
        bodyKeys: Object.keys(req.body || {}),
        hasFiles: !!req.files
      },
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}