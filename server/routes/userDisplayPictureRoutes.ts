/**
 * userDisplayPictureRoutes.ts - COMPLETE FIX for Display Picture API
 * FIXED: FormData construction, proper metadata handling, filename extraction
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseStorage } from '../../shared/SupabaseStorage';

const router = Router();
const supabaseStorage = SupabaseStorage.getInstance();

// 🔧 FIXED: Configure multer for display picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // 🔧 FIXED: Use correct property names
    const ext = path.extname(file.originalname);
    const fileName = `display_${Date.now()}_${uuidv4()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
});

/**
 * POST /api/user/set-display-picture - Upload and set user display picture
 * 🔥 FIXED: Complete FormData handling with proper metadata extraction
 */
router.post('/set-display-picture', async (req, res) => {
  try {
    console.log('🖼️ [DISPLAY-PICTURE] Starting upload process...');
    
    // 🔧 FIXED: Use multer middleware properly
    const uploadMiddleware = upload.single('file');
    
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req as any, res as any, (err) => {
        if (err) {
          console.error('😱 [DISPLAY-PICTURE] Multer error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const file = req.file as Express.Multer.File;
    
    if (!file) {
      console.error('😱 [DISPLAY-PICTURE] No file uploaded');
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded',
        fileName: null,
        requiredLevel: null
      });
    }

    console.log('🖼️ [DISPLAY-PICTURE] File uploaded:', {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });

    // 🔧 FIXED: Extract metadata from request body (after multer processing)
    let userId: string | null = null;
    let requiredLevel = 1;
    
    try {
      // Extract userId from multiple possible sources
      userId = (req.body.userId as string) || 
               (req.body.telegramId as string) || 
               (req.headers['x-user-id'] as string) || 
               null;
      
      // 🔧 FIXED: Parse requiredLevel properly
      if (req.body.requiredLevel) {
        const parsed = parseInt(req.body.requiredLevel as string, 10);
        if (!isNaN(parsed) && parsed > 0) {
          requiredLevel = parsed;
        }
      }
      
      console.log('🖼️ [DISPLAY-PICTURE] Extracted metadata:', {
        userId,
        requiredLevel,
        bodyKeys: Object.keys(req.body)
      });
      
    } catch (metaError) {
      console.warn('⚠️ [DISPLAY-PICTURE] Failed to parse metadata:', metaError);
    }

    if (!userId) {
      console.error('😱 [DISPLAY-PICTURE] No userId provided');
      // Clean up uploaded file
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
      
      return res.status(400).json({ 
        success: false, 
        error: 'userId is required',
        fileName: null,
        requiredLevel: null
      });
    }

    // Update user's display picture in database - 🔧 FIXED: Store only filename
    const updateResult = await supabaseStorage.updateUser(userId, {
      displayPicture: file.filename // 🔧 FIXED: Store just filename, not full path
    });

    if (updateResult) {
      console.log(`✅ [DISPLAY-PICTURE] Successfully updated user ${userId} display picture: ${file.filename}`);
      
      res.json({
        success: true,
        fileName: file.filename, // 🔧 FIXED: Return filename for client
        filePath: `/uploads/${file.filename}`, // Full path for immediate use
        requiredLevel,
        message: 'Display picture updated successfully'
      });
    } else {
      console.error('😱 [DISPLAY-PICTURE] Failed to update user in database');
      
      // Clean up uploaded file on database error
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
      
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update display picture in database',
        fileName: null,
        requiredLevel: null
      });
    }

  } catch (error: any) {
    console.error('😱 [DISPLAY-PICTURE] Upload error:', error);
    
    // Clean up any uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Display picture upload failed',
      details: error?.message || 'Unknown error',
      fileName: null,
      requiredLevel: null
    });
  }
});

export default router;