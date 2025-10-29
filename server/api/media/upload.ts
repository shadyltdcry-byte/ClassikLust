import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseStorage } from '../../../shared/SupabaseStorage';

interface UploadConfig {
  characterId?: string;
  folderPath?: string;
  imageType?: string;
  mood?: string;
  pose?: any;
  levelRequirement?: number;
  isVip?: boolean;
  isNsfw?: boolean;
  isEvent?: boolean;
  isWheelReward?: boolean;
  enabledForChat?: boolean;
  randomSendChance?: number;
}

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
  console.log('📤 [MEDIA-UPLOAD] Upload request received');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Use multer middleware
    const uploadMiddleware = upload.array('files', 10);
    
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req as any, res as any, (err) => {
        if (err) {
          console.error('📤 [MEDIA-UPLOAD] Multer error:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      console.log('📤 [MEDIA-UPLOAD] No files received');
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded' 
      });
    }

    console.log(`📤 [MEDIA-UPLOAD] Processing ${files.length} files`);

    // Parse upload configuration
    let config: UploadConfig = {};
    
    try {
      if (req.body.config) {
        config = JSON.parse(req.body.config);
      }
    } catch (error) {
      console.warn('📤 [MEDIA-UPLOAD] Config parsing failed, using defaults');
    }

    const uploadedFiles = [];

    // Process each uploaded file
    for (const file of files) {
      try {
        // Determine file type
        let fileType = 'other';
        if (file.mimetype.startsWith('image/')) {
          fileType = file.mimetype === 'image/gif' ? 'gif' : 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }

        // Create file path - use the config folderPath if provided
        const filePath = config.folderPath 
          ? `/uploads/${config.folderPath}/${file.filename}` 
          : `/uploads/${file.filename}`;

        // Prepare media file data for database
        const mediaFileData = {
          id: uuidv4(),
          fileName: file.filename, // ✅ This is correct - multer sets this
          filePath: filePath,
          fileType: fileType,
          originalName: file.originalname, // ✅ This is correct - multer sets this
          mimeType: file.mimetype,
          fileSize: file.size,
          characterId: config.characterId || null,
          mood: null, // Set later if needed
          pose: config.pose || null,
          category: config.imageType || null,
          requiredLevel: config.levelRequirement || 1,
          isVip: config.isVip || false,
          isNsfw: config.isNsfw || false,
          isEvent: config.isEvent || false,
          isWheelReward: config.isWheelReward || false,
          enabledForChat: config.enabledForChat !== false, // Default true
          randomSendChance: config.randomSendChance || 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('📤 [MEDIA-UPLOAD] Saving to database:', {
          fileName: mediaFileData.fileName,
          filePath: mediaFileData.filePath,
          fileType: mediaFileData.fileType
        });

        // Save to database
        const savedFile = await supabaseStorage.createMedia(mediaFileData);
        
        if (savedFile) {
          uploadedFiles.push(savedFile);
          console.log(`✅ [MEDIA-UPLOAD] Successfully processed: ${file.filename}`);
        } else {
          console.error(`❌ [MEDIA-UPLOAD] Database save failed for: ${file.filename}`);
        }
        
      } catch (fileError) {
        console.error(`❌ [MEDIA-UPLOAD] Error processing ${file.filename}:`, fileError);
        
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
      return res.status(500).json({ 
        success: false, 
        error: 'No files were successfully processed' 
      });
    }

    console.log(`✅ [MEDIA-UPLOAD] Upload complete! ${uploadedFiles.length} files processed`);
    
    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('❌ [MEDIA-UPLOAD] Upload failed:', error);
    
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}