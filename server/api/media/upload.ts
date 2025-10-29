import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseStorage } from 'shared/SupabaseStorage';

// 🔧 FIXED: Interface for upload configuration
interface UploadConfig {
  characterId?: string;
  mood?: string;
  pose?: any; // Can be string or object/array
  requiredLevel?: number;
  isVip?: boolean;
  isNsfw?: boolean;
  isEvent?: boolean;
  randomSendChance?: number;
  enabledForChat?: boolean;
}

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
  filename: (req, file, cb) => { // 🔧 FIXED: filename not fileName
    // Generate unique filename with timestamp
    const ext = path.extname(file.originalname); // 🔧 FIXED: originalname not originalName
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
  // 🔥 COMPREHENSIVE ERROR LOGGING
  console.log(`🖼️ [MEDIA-UPLOAD] === STARTING UPLOAD HANDLER ===`);
  console.log(`🖼️ [MEDIA-UPLOAD] Method: ${req.method}`);
  console.log(`🖼️ [MEDIA-UPLOAD] URL: ${req.url}`);
  console.log(`🖼️ [MEDIA-UPLOAD] Headers:`, req.headers);
  
  if (req.method !== 'POST') {
    console.log(`❌ [MEDIA-UPLOAD] Method not allowed: ${req.method}`);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      details: `Expected POST, got ${req.method}`,
      allowedMethods: ['POST']
    });
  }

  try {
    console.log(`🖼️ [MEDIA-UPLOAD] Setting up multer middleware...`);
    
    // Use multer middleware
    const uploadMiddleware = upload.array('files', 10); // Allow up to 10 files
    
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req as any, res as any, (err) => {
        if (err) {
          console.error(`❌ [MEDIA-UPLOAD] Multer error:`, {
            message: err.message,
            code: err.code,
            field: err.field,
            stack: err.stack
          });
          reject(err);
        } else {
          console.log(`✅ [MEDIA-UPLOAD] Multer middleware completed successfully`);
          resolve();
        }
      });
    });

    console.log(`🖼️ [MEDIA-UPLOAD] Checking uploaded files...`);
    const files = req.files as Express.Multer.File[];
    
    console.log(`🖼️ [MEDIA-UPLOAD] Files received:`, {
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
      console.log(`❌ [MEDIA-UPLOAD] No files uploaded`);
      console.log(`❌ [MEDIA-UPLOAD] req.files:`, req.files);
      console.log(`❌ [MEDIA-UPLOAD] req.body:`, req.body);
      
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded',
        details: 'Expected files in multipart/form-data request',
        receivedFiles: files?.length || 0,
        requestBody: req.body
      });
    }

    // Parse upload configuration with proper typing
    let config: UploadConfig = {};
    console.log(`🖼️ [MEDIA-UPLOAD] Raw request body:`, req.body);
    
    try {
      if (req.body.config) {
        config = JSON.parse(req.body.config);
        console.log(`✅ [MEDIA-UPLOAD] Parsed config:`, config);
      } else {
        console.log(`⚠️ [MEDIA-UPLOAD] No config in request body, using defaults`);
        // Extract config from individual body fields
        config = {
          characterId: req.body.characterId,
          mood: req.body.mood,
          pose: req.body.pose,
          requiredLevel: parseInt(req.body.requiredLevel) || 1,
          isVip: req.body.isVip === 'true',
          isNsfw: req.body.isNsfw === 'true',
          isEvent: req.body.isEvent === 'true',
          randomSendChance: parseInt(req.body.randomSendChance) || 5,
          enabledForChat: req.body.enabledForChat !== 'false'
        };
        console.log(`✅ [MEDIA-UPLOAD] Extracted config from body fields:`, config);
      }
    } catch (configError) {
      console.warn(`⚠️ [MEDIA-UPLOAD] Invalid config JSON:`, configError);
      console.warn(`⚠️ [MEDIA-UPLOAD] Using defaults and individual fields`);
      config = {
        characterId: req.body.characterId,
        requiredLevel: 1
      };
    }

    const uploadedFiles = [];
    console.log(`🖼️ [MEDIA-UPLOAD] Processing ${files.length} files...`);

    // Process each uploaded file
    for (const file of files) {
      console.log(`🖼️ [MEDIA-UPLOAD] Processing file: ${file.originalname}`);
      
      try {
        // Determine file type based on MIME type
        let fileType = 'other';
        if (file.mimetype.startsWith('image/')) {
          fileType = file.mimetype === 'image/gif' ? 'gif' : 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }
        
        console.log(`🖼️ [MEDIA-UPLOAD] File type determined: ${fileType} for ${file.mimetype}`);

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
            console.log(`🖼️ [MEDIA-UPLOAD] Created character folder: ${characterFolder}`);
          }

          // Move file to character folder
          const newPath = path.join(characterFolder, file.filename); // 🔧 FIXED: filename not fileName
          fs.renameSync(file.path, newPath);
          (file as any).path = newPath; // Update path reference
          console.log(`🖼️ [MEDIA-UPLOAD] Moved file to character folder: ${newPath}`);
        }

        // Create media file record with organized path
        const filePath = config.characterId 
          ? `/uploads/characters/${config.characterId}/${file.filename}` // 🔧 FIXED: filename not fileName
          : `/uploads/${file.filename}`; // 🔧 FIXED: filename not fileName

        const mediaFileData = {
          id: uuidv4(),
          fileName: file.filename, // 🔧 FIXED: filename not fileName
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
        
        console.log(`🖼️ [MEDIA-UPLOAD] Attempting to save to database:`, {
          id: mediaFileData.id,
          fileName: mediaFileData.fileName,
          filePath: mediaFileData.filePath,
          fileType: mediaFileData.fileType
        });

        // Save to database
        const savedFile = await supabase.saveMediaFile(mediaFileData);
        
        if (savedFile) {
          uploadedFiles.push(savedFile);
          console.log(`✅ [MEDIA-UPLOAD] Successfully saved to database: ${file.filename}`);
          console.log(`✅ [MEDIA-UPLOAD] Database record:`, savedFile);
        } else {
          console.error(`❌ [MEDIA-UPLOAD] Failed to save ${file.filename} to database - saveMediaFile returned null/undefined`);
          // Clean up the uploaded file if database save failed
          try {
            fs.unlinkSync(file.path);
            console.log(`🗑️ [MEDIA-UPLOAD] Cleaned up file: ${file.path}`);
          } catch (cleanupError) {
            console.error(`❌ [MEDIA-UPLOAD] Failed to cleanup file: ${cleanupError}`);
          }
        }
      } catch (fileError) {
        console.error(`❌ [MEDIA-UPLOAD] Error processing file ${file.filename}:`, {
          error: fileError.message,
          stack: fileError.stack,
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
          fs.unlinkSync(file.path);
          console.log(`🗑️ [MEDIA-UPLOAD] Cleaned up failed file: ${file.path}`);
        } catch (cleanupError) {
          console.error(`❌ [MEDIA-UPLOAD] Failed to cleanup file: ${cleanupError}`);
        }
      }
    }

    console.log(`🖼️ [MEDIA-UPLOAD] Processing complete. Uploaded files: ${uploadedFiles.length}`);

    if (uploadedFiles.length === 0) {
      console.log(`❌ [MEDIA-UPLOAD] No files were successfully processed`);
      return res.status(500).json({ 
        success: false, 
        error: 'No files were successfully processed',
        details: 'All files failed to save to database',
        filesAttempted: files.length,
        uploadedCount: 0,
        possibleCauses: [
          'Database connection issues',
          'Invalid file data',
          'Missing required fields',
          'Supabase saveMediaFile method failed'
        ]
      });
    }

    console.log(`✅ [MEDIA-UPLOAD] Success! Uploaded ${uploadedFiles.length} files`);
    res.status(200).json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      details: {
        filesProcessed: files.length,
        filesUploaded: uploadedFiles.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [MEDIA-UPLOAD] === CRITICAL ERROR ===`);
    console.error(`❌ [MEDIA-UPLOAD] Error type: ${error.constructor.name}`);
    console.error(`❌ [MEDIA-UPLOAD] Error message: ${error.message}`);
    console.error(`❌ [MEDIA-UPLOAD] Error stack:`, error.stack);
    console.error(`❌ [MEDIA-UPLOAD] Request details:`, {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    });
    console.error(`❌ [MEDIA-UPLOAD] === END ERROR DETAILS ===`);
    
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: error.constructor.name,
      stack: error.stack,
      requestInfo: {
        method: req.method,
        url: req.url,
        hasFiles: !!(req.files && req.files.length > 0),
        bodyKeys: Object.keys(req.body || {})
      },
      timestamp: new Date().toISOString()
    });
  }
}