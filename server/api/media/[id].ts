import { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseStorage } from '../../../shared/SupabaseStorage';

const storage = SupabaseStorage.getInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method === 'PUT') {
    // Update media file
    try {
      const updates = req.body;
      const updatedFile = await storage.updateMedia(id as string, updates);
      
      if (updatedFile) {
        res.status(200).json(updatedFile);
      } else {
        res.status(404).json({ error: 'Media file not found' });
      }
    } catch (error) {
      console.error('Media update error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Update failed'
      });
    }
    
  } else if (req.method === 'DELETE') {
    // Delete media file
    try {
      await storage.deleteMedia(id as string);
      res.status(200).json({ message: 'Media file deleted successfully' });
    } catch (error) {
      console.error('Media delete error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Delete failed'
      });
    }
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}