import { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseStorage } from '../../../shared/SupabaseStorage';

const storage = SupabaseStorage.getInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all characters
    try {
      const characters = await storage.getAllCharacters();
      res.status(200).json(characters || []);
    } catch (error) {
      console.error('Characters fetch error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch characters'
      });
    }
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}