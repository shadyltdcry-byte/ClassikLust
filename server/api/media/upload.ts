import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseStorage } from '../../../shared/SupabaseStorage';

// 🔥 FIXED: Complete error logging with detailed responses
interface UploadConfig {
  characterId?: string;
  mood?: string;
  pose?: any;
  requiredLevel?: number;
  isVip?: boolean;
  isNsfw?: boolean;
  isEvent?: boolean;
  randomSendChance?: number;
  enabledForChat?: boolean;
}

// Configure multer for file uploads with FIXED property names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => { // ✅ FIXED: filename (not fileName)
    const ext = path.extname(file.originalname); // ✅ FIXED: originalname (not originalName)
    const fileName = `uploaded_${Date.now()}_${uuidv4()}${ext}`;
    cb(null, fileName);
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
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`), false);
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
  console.log(`📤 [MEDIA-UPLOAD] === STARTING UPLOAD HANDLER ===`);
  console.log(`📤 [MEDIA-UPLOAD] Method: ${req.method}`);
  console.log(`📤 [MEDIA-UPLOAD] URL: ${req.url}`);
  console.log(`📤 [MEDIA-UPLOAD] Headers:`, JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    console.log(`❌ [MEDIA-UPLOAD] Method not allowed: ${req.method}`);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      details: `Expected POST, got ${req.method}`,
      allowedMethods: ['POST'],
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log(`📤 [MEDIA-UPLOAD] Setting up multer middleware...`);
    
    // Use multer middleware with proper error handling
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

    console.log(`📤 [MEDIA-UPLOAD] Checking uploaded files...`);
    const files = req.files as Express.Multer.File[];
    
    console.log(`📤 [MEDIA-UPLOAD] Files received:`, {
      count: files?.length || 0,
      files: files?.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname, // ✅ FIXED: originalname
        filename: f.filename, // ✅ FIXED: filename
        mimetype: f.mimetype,
        size: f.size
      })) || []
    });
    
    console.log(`📤 [MEDIA-UPLOAD] Request body:`, JSON.stringify(req.body, null, 2));
    
    if (!files || files.length === 0) {
      console.log(`❌ [MEDIA-UPLOAD] No files uploaded`);
      console.log(`❌ [MEDIA-UPLOAD] req.files:`, req.files);
      console.log(`❌ [MEDIA-UPLOAD] req.body:`, req.body);
      
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded',
        details: 'Expected files in multipart/form-data request with field name "files"',
        received: {
          filesCount: files?.length || 0,
          bodyKeys: Object.keys(req.body || {}),
          hasFiles: !!req.files
        },
        example: 'Use FormData.append("files", file) for each file',
        timestamp: new Date().toISOString()
      });
    }

    // Parse upload configuration with better error handling
    let config: UploadConfig = {};
    
    try {
      // Try to parse config from JSON string first
      if (req.body.config && typeof req.body.config === 'string') {
        config = JSON.parse(req.body.config);
        console.log(`✅ [MEDIA-UPLOAD] Parsed config from JSON:`, config);
      } else {
        // Extract config from individual form fields
        config = {
          characterId: req.body.characterId || null,
          mood: req.body.mood || null,
          pose: req.body.pose ? JSON.parse(req.body.pose) : null,
          requiredLevel: parseInt(req.body.requiredLevel) || 1,
          isVip: req.body.isVip === 'true' || req.body.isVip === true,
          isNsfw: req.body.isNsfw === 'true' || req.body.isNsfw === true,
          isEvent: req.body.isEvent === 'true' || req.body.isEvent === true,
          randomSendChance: parseInt(req.body.randomSendChance) || 5,
          enabledForChat: req.body.enabledForChat !== 'false' && req.body.enabledForChat !== false
        };
        console.log(`✅ [MEDIA-UPLOAD] Extracted config from form fields:`, config);
      }
    } catch (configError) {
      console.warn(`⚠️ [MEDIA-UPLOAD] Config parsing failed:`, configError);
      config = {
        characterId: null,
        requiredLevel: 1,
        isVip: false,
        isNsfw: false,
        isEvent: false,
        randomSendChance: 5,
        enabledForChat: true
      };
      console.log(`✅ [MEDIA-UPLOAD] Using default config:`, config);
    }

    const uploadedFiles = [];
    console.log(`📤 [MEDIA-UPLOAD] Processing ${files.length} files...`);

    // Process each uploaded file
    for (const file of files) {
      console.log(`📤 [MEDIA-UPLOAD] Processing file: ${file.originalname}`);
      
      try {
        // Determine file type based on MIME type
        let fileType = 'other';
        if (file.mimetype.startsWith('image/')) {
          fileType = file.mimetype === 'image/gif' ? 'gif' : 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }
        
        console.log(`📤 [MEDIA-UPLOAD] File type determined: ${fileType} for ${file.mimetype}`);

        // Create file path for storage
        const filePath = config.characterId 
          ? `/uploads/characters/${config.characterId}/${file.filename}` // ✅ FIXED: filename
          : `/uploads/${file.filename}`; // ✅ FIXED: filename

        // ✅ FIXED: Complete media file data with all required fields
        const mediaFileData = {
          id: uuidv4(),
          fileName: file.filename, // ✅ FIXED: filename (not fileName)
          filePath: filePath, // ✅ ALWAYS PROVIDED
          fileType: fileType, // ✅ ALWAYS PROVIDED  
          characterId: config.characterId || null,
          mood: config.mood || null,
          pose: config.pose || null,
          requiredLevel: config.requiredLevel || 1,
          isVip: config.isVip || false,
          isNsfw: config.isNsfw || false,
          isEvent: config.isEvent || false,
          randomSendChance: config.randomSendChance || 5,
          enabledForChat: config.enabledForChat !== false, // Default true
          originalName: file.originalname, // ✅ FIXED: originalname
          mimeType: file.mimetype,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log(`📤 [MEDIA-UPLOAD] Complete media file data:`, {
          id: mediaFileData.id,
          fileName: mediaFileData.fileName,
          filePath: mediaFileData.filePath,
          fileType: mediaFileData.fileType,
          hasAllRequiredFields: !!(mediaFileData.fileName && mediaFileData.filePath && mediaFileData.fileType)
        });

        // ✅ FIXED: Use the correct method name
        console.log(`📤 [MEDIA-UPLOAD] Attempting to save to database...`);
        const savedFile = await supabaseStorage.createMedia(mediaFileData);
        
        if (savedFile) {
          uploadedFiles.push(savedFile);
          console.log(`✅ [MEDIA-UPLOAD] Successfully saved to database: ${file.filename}`);
          console.log(`✅ [MEDIA-UPLOAD] Database record ID: ${savedFile.id}`);
        } else {
          console.error(`❌ [MEDIA-UPLOAD] createMedia returned null/undefined for ${file.filename}`);
          throw new Error('Database save failed - createMedia returned null');
        }
        
      } catch (fileError) {
        console.error(`❌ [MEDIA-UPLOAD] Error processing file ${file.filename}:`, {
          error: fileError.message,
          stack: fileError.stack,
          file: {
            originalname: file.originalname, // ✅ FIXED: originalname
            filename: file.filename, // ✅ FIXED: filename
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
        throw new Error(`File ${file.originalname} failed: ${fileError.message}`);
      }
    }

    console.log(`📤 [MEDIA-UPLOAD] Processing complete. Successfully uploaded: ${uploadedFiles.length}`);

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
          'Invalid file data structure',
          'Missing required fields (fileName, filePath, fileType)',
          'Supabase createMedia method failed',
          'File validation errors'
        ],
        troubleshooting: {
          checkDatabase: 'Verify Supabase connection and media_files table',
          checkFields: 'Ensure fileName, filePath, and fileType are provided',
          checkLogs: 'Review server console for detailed error messages'
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ [MEDIA-UPLOAD] SUCCESS! Uploaded ${uploadedFiles.length} files`);
    
    // ✅ COMPLETE SUCCESS RESPONSE with all details
    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      summary: {
        filesProcessed: files.length,
        filesUploaded: uploadedFiles.length,
        successRate: `${Math.round((uploadedFiles.length / files.length) * 100)}%`
      },
      details: {
        uploadedFileIds: uploadedFiles.map(f => f.id),
        uploadedFileNames: uploadedFiles.map(f => f.fileName),
        config: config
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [MEDIA-UPLOAD] === CRITICAL ERROR ===`);
    console.error(`❌ [MEDIA-UPLOAD] Error type: ${error.constructor.name}`);
    console.error(`❌ [MEDIA-UPLOAD] Error message: ${error.message}`);
    console.error(`❌ [MEDIA-UPLOAD] Error stack:`, error.stack);
    console.error(`❌ [MEDIA-UPLOAD] Request details:`, {
      method: req.method,
      url: req.url,
      hasFiles: !!(req.files && (req.files as any[]).length > 0),
      bodyKeys: Object.keys(req.body || {})
    });
    console.error(`❌ [MEDIA-UPLOAD] === END ERROR DETAILS ===`);
    
    // ✅ COMPLETE ERROR RESPONSE with full details
    res.status(500).json({ 
      success: false, 
      error: 'Media upload failed', 
      message: error.message || 'Unknown upload error',
      details: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
        requestInfo: {
          method: req.method,
          url: req.url,
          hasFiles: !!(req.files && (req.files as any[]).length > 0),
          bodyKeys: Object.keys(req.body || {}),
          contentType: req.headers['content-type']
        }
      },
      troubleshooting: {
        commonCauses: [
          'Files field name must be "files"',
          'File type not allowed (check mimetype)',
          'File too large (50MB limit)',
          'Database connection issues',
          'Missing required metadata'
        ],
        nextSteps: [
          'Check server console for detailed error logs',
          'Verify file format and size limits',
          'Test with a simple image upload first',
          'Check Supabase connection and permissions'
        ]
      },
      timestamp: new Date().toISOString()
    });
  }
}