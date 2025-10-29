import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseStorage } from '../../../shared/SupabaseStorage';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `uploaded_${Date.now()}_${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseStorage = SupabaseStorage.getInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use multer middleware
    const uploadMiddleware = upload.array('files', 10);
    
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req as any, res as any, (err) => {
        if (err) {
          console.error('Multer error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Parse configuration from form data
    let config: any = {};
    try {
      if (req.body.config) {
        config = JSON.parse(req.body.config);
      }
    } catch (error) {
      console.warn('Config parsing failed, using defaults');
    }

    const uploadedFiles = [];

    // Process each file
    for (const file of files) {
      try {
        // Determine file type
        let fileType = 'other';
        if (file.mimetype.startsWith('image/')) {
          fileType = file.mimetype === 'image/gif' ? 'gif' : 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }

        // Create media file data for database
        const mediaFileData = {
          id: uuidv4(),
          fileName: file.filename,
          filePath: `/uploads/${file.filename}`,
          fileType: fileType,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          characterId: config.characterId || undefined,
          mood: undefined,
          pose: config.pose || undefined,
          category: config.category || undefined,
          requiredLevel: config.requiredLevel || 1,
          isVip: config.isVip || false,
          isNsfw: config.isNsfw || false,
          isEvent: config.isEvent || false,
          isWheelReward: config.isWheelReward || false,
          enabledForChat: config.enabledForChat !== false,
          randomSendChance: config.randomSendChance || 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to database using SupabaseStorage
        const savedFile = await supabaseStorage.createMedia(mediaFileData);
        
        if (savedFile) {
          uploadedFiles.push(savedFile);
          console.log(`✅ Uploaded: ${file.filename}`);
        }
        
      } catch (fileError) {
        console.error(`❌ Error processing ${file.filename}:`, fileError);
        
        // Clean up file on error
        try {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', cleanupError);
        }
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ error: 'No files were successfully processed' });
    }

    console.log(`✅ Upload complete! ${uploadedFiles.length} files`);
    
    res.status(200).json(uploadedFiles);

  } catch (error: unknown) {
    console.error('❌ Upload failed:', error);
    
    res.status(500).json({ 
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}