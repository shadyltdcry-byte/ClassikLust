import { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseStorage } from '../../../shared/SupabaseStorage';

const storage = SupabaseStorage.getInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all media files
    try {
      const mediaFiles = await storage.getAllMedia();
      res.status(200).json(mediaFiles || []);
    } catch (error) {
      console.error('Media fetch error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch media'
      });
    }
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}