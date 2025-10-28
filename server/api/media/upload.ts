import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseStorage } from 'shared/SupabaseStorage';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  fileName: (req, file, cb) => {
    // Generate unique filename with timestamp
    const ext = path.extname(file.originalName);
    const fileName = `uploaded_${Date.now()}_${uuidv4()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images and videos
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Disable Next.js default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Import shared storage instance instead of creating duplicate
const supabase = new SupabaseStorage(); // TODO: Replace with singleton

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use multer middleware
    const uploadMiddleware = upload.array('files', 10); // Allow up to 10 files
    
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req as any, res as any, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Parse upload configuration
    let config = {};
    try {
      config = JSON.parse((req.body as any).config || '{}');
    } catch (e) {
      console.warn('Invalid config JSON, using defaults');
    }

    const uploadedFiles = [];

    // Process each uploaded file
    for (const file of files) {
      try {
        // Determine file type based on MIME type
        let fileType = 'other';
        if (file.mimetype.startsWith('image/')) {
          fileType = file.mimetype === 'image/gif' ? 'gif' : 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }
        
        console.log(`File type determined: ${fileType} for ${file.mimetype}`);

        // Auto-create character folder structure
        if (config.characterId) {
          const characterFolder = path.join(
            process.cwd(), 
            'public', 
            'uploads', 
            'characters',
            config.characterId
          );
          
          if (!fs.existsSync(characterFolder)) {
            fs.mkdirSync(characterFolder, { recursive: true });
            console.log(`[Upload] Created character folder: ${characterFolder}`);
          }

          // Move file to character folder
          const newPath = path.join(characterFolder, file.fileName);
          fs.renameSync(file.path, newPath);
          file.path = newPath;
        }

        // Create media file record with organized path
        const filePath = config.characterId 
          ? `/uploads/characters/${config.characterId}/${file.fileName}`
          : `/uploads/${file.fileName}`;

        const mediaFileData = {
          id: uuidv4(),
          fileName: file.fileName,
          filePath,
          fileType,
          characterId: config.characterId || null,
          mood: config.mood || null,
          pose: config.pose || null,
          requiredLevel: config.requiredLevel || 1,
          isVip: config.isVip || false,
          isNsfw: config.isNsfw || false,
          isEvent: config.isEvent || false,
          randomSendChance: config.randomSendChance || 5,
          enabledForChat: config.enabledForChat !== false, // Default true
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to database
        const savedFile = await supabase.saveMediaFile(mediaFileData);
        
        if (savedFile) {
          uploadedFiles.push(savedFile);
          console.log(`Successfully saved to database: ${file.fileName}`);
        } else {
          console.error(`Failed to save ${file.fileName} to database`);
          // Clean up the uploaded file if database save failed
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.error('Failed to cleanup file:', cleanupError);
          }
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.fileName}:`, fileError);
        // Clean up the uploaded file on error
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', cleanupError);
        }
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ error: 'No files were successfully processed' });
    }

    res.status(200).json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });

  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}