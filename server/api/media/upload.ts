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
  console.log('🎯 [MEDIA-UPLOAD] === STARTING UPLOAD HANDLER ===');
  console.log('🎯 [MEDIA-UPLOAD] Method:', req.method);
  console.log('🎯 [MEDIA-UPLOAD] URL:', req.url);
  
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
          console.error('🎯 [MEDIA-UPLOAD] Multer error:', {
            message: err.message,
            code: (err as any).code,
            field: (err as any).field,
            stack: err.stack
          });
          reject(err);
        } else {
          console.log('🎯 [MEDIA-UPLOAD] Multer middleware completed successfully');
          resolve();
        }
      });
    });

    console.log('🎯 [MEDIA-UPLOAD] Checking uploaded files...');
    const files = req.files as Express.Multer.File[];
    
    console.log('🎯 [MEDIA-UPLOAD] Files received:', {
      count: files?.length || 0,
      files: files?.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size
      })) || []
    });
    
    if (!files || files.length === 0) {
      console.log('🎯 [MEDIA-UPLOAD] No files received');
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded' 
      });
    }

    console.log(`🎯 [MEDIA-UPLOAD] Processing ${files.length} files`);

    // Parse upload configuration
    let config: UploadConfig = {};
    
    try {
      if (req.body.config && typeof req.body.config === 'string') {
        config = JSON.parse(req.body.config);
        console.log('🎯 [MEDIA-UPLOAD] Parsed config from JSON:', config);
      } else {
        // Extract config from individual form fields
        config = {
          characterId: req.body.characterId || undefined, // ✅ FIXED: undefined instead of null
          mood: undefined, // Set later if needed
          pose: req.body.pose ? JSON.parse(req.body.pose) : undefined, // ✅ FIXED: undefined instead of null
          levelRequirement: parseInt(req.body.levelRequirement) || 1,
          isVip: req.body.isVip === 'true' || req.body.isVip === true,
          isNsfw: req.body.isNsfw === 'true' || req.body.isNsfw === true,
          isEvent: req.body.isEvent === 'true' || req.body.isEvent === true,
          isWheelReward: req.body.isWheelReward === 'true' || req.body.isWheelReward === true,
          randomSendChance: parseInt(req.body.randomSendChance) || 5,
          enabledForChat: req.body.enabledForChat !== 'false' && req.body.enabledForChat !== false
        };
        console.log('🎯 [MEDIA-UPLOAD] Extracted config from form fields:', config);
      }
    } catch (configError) {
      console.warn('🎯 [MEDIA-UPLOAD] Config parsing failed:', configError);
      config = {
        characterId: undefined, // ✅ FIXED: undefined instead of null
        levelRequirement: 1,
        isVip: false,
        isNsfw: false,
        isEvent: false,
        isWheelReward: false,
        randomSendChance: 5,
        enabledForChat: true
      };
      console.log('🎯 [MEDIA-UPLOAD] Using default config:', config);
    }

    const uploadedFiles = [];

    // Process each uploaded file
    for (const file of files) {
      console.log(`🎯 [MEDIA-UPLOAD] Processing file: ${file.originalname}`);
      
      try {
        // Determine file type
        let fileType = 'other';
        if (file.mimetype.startsWith('image/')) {
          fileType = file.mimetype === 'image/gif' ? 'gif' : 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }

        console.log(`🎯 [MEDIA-UPLOAD] File type determined: ${fileType} for ${file.mimetype}`);

        // Create file path
        const filePath = config.folderPath 
          ? `/uploads/${config.folderPath}/${file.filename}` 
          : `/uploads/${file.filename}`;

        // ✅ FIXED: Complete media file data with proper typing
        const mediaFileData = {
          id: uuidv4(),
          fileName: file.filename,
          filePath: filePath,
          fileType: fileType,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          characterId: config.characterId || undefined, // ✅ FIXED: undefined instead of null
          mood: config.mood || undefined, // ✅ FIXED: undefined instead of null
          pose: config.pose || undefined, // ✅ FIXED: undefined instead of null  
          category: config.imageType || undefined, // ✅ FIXED: undefined instead of null
          requiredLevel: config.levelRequirement || 1,
          isVip: config.isVip || false,
          isNsfw: config.isNsfw || false,
          isEvent: config.isEvent || false,
          isWheelReward: config.isWheelReward || false,
          enabledForChat: config.enabledForChat !== false,
          randomSendChance: config.randomSendChance || 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('🎯 [MEDIA-UPLOAD] Complete media file data:', {
          id: mediaFileData.id,
          fileName: mediaFileData.fileName,
          filePath: mediaFileData.filePath,
          fileType: mediaFileData.fileType,
          hasAllRequiredFields: !!(mediaFileData.fileName && mediaFileData.filePath && mediaFileData.fileType)
        });

        // ✅ Save to database
        console.log('🎯 [MEDIA-UPLOAD] Attempting to save to database...');
        const savedFile = await supabaseStorage.createMedia(mediaFileData);
        
        if (savedFile) {
          uploadedFiles.push(savedFile);
          console.log(`✅ [MEDIA-UPLOAD] Successfully saved to database: ${file.filename}`);
          console.log(`✅ [MEDIA-UPLOAD] Database record ID: ${savedFile.id}`);
        } else {
          console.error(`❌ [MEDIA-UPLOAD] createMedia returned null/undefined for ${file.filename}`);
          throw new Error('Database save failed - createMedia returned null');
        }
        
      } catch (fileError: unknown) {
        console.error(`❌ [MEDIA-UPLOAD] Error processing file ${file.filename}:`, {
          error: fileError instanceof Error ? fileError.message : 'Unknown error',
          stack: fileError instanceof Error ? fileError.stack : undefined,
          file: {
            originalname: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
          }
        });
        
        // Clean up the uploaded file on error
        try {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`🗑️ [MEDIA-UPLOAD] Cleaned up failed file: ${file.path}`);
          }
        } catch (cleanupError) {
          console.error(`❌ [MEDIA-UPLOAD] Failed to cleanup file: ${cleanupError}`);
        }
        
        // Add detailed error to response
        throw new Error(`File ${file.originalname} failed: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    console.log(`🎯 [MEDIA-UPLOAD] Processing complete. Successfully uploaded: ${uploadedFiles.length}`);

    if (uploadedFiles.length === 0) {
      console.log('❌ [MEDIA-UPLOAD] No files were successfully processed');
      return res.status(500).json({ 
        success: false, 
        error: 'No files were successfully processed'
      });
    }

    console.log(`✅ [MEDIA-UPLOAD] SUCCESS! Uploaded ${uploadedFiles.length} files`);
    
    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles
    });

  } catch (error: unknown) {
    console.error('❌ [MEDIA-UPLOAD] === CRITICAL ERROR ===');
    console.error('❌ [MEDIA-UPLOAD] Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('❌ [MEDIA-UPLOAD] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ [MEDIA-UPLOAD] Error stack:', error instanceof Error ? error.stack : undefined);
    
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}