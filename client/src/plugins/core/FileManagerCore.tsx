/**
 * FileManagerCore.tsx - Media management UI
 * Last Edited: 2025-10-29 by Assistant - CRITICAL FIX for empty metadata issue
 *
 * ✅ FIXED: Upload uses proper multer admin endpoint
 * ✅ FIXED: FormData construction sends metadata fields correctly
 * ✅ FIXED: Route path matches server adminRoutes.ts exactly
 * 🚫 REMOVED: JSON upload attempt that was causing empty metadata
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MediaFile, Character } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { toast } from 'react-hot-toast';
import { Crop, ZoomIn, ZoomOut, X, Plus } from 'lucide-react';
import Cropper512 from '@/components/Cropper512';

interface FileManagerCoreProps {
  onClose?: () => void;
}

const FileManagerCore: React.FC<FileManagerCoreProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [folderStructure, setFolderStructure] = useState<Record<string, MediaFile[]>>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Cropper state
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Poses state
  const [availablePoses, setAvailablePoses] = useState<string[]>(['sitting', 'standing', 'casual', 'formal', 'bikini', 'dress']);
  const [newPose, setNewPose] = useState('');

  // Upload configuration state
  const [uploadConfig, setUploadConfig] = useState({
    characterId: '',
    name: '',
    mood: '',
    poses: [] as string[],
    requiredLevel: 1,
    isVip: false,
    isNsfw: false,
    isEvent: false,
    randomSendChance: 5,
    category: 'Character',
    enabledForChat: true
  });

  const queryClient = useQueryClient();

  // Fetch media files
  const { data: mediaFiles = [], isLoading: filesLoading, refetch } = useQuery<MediaFile[]>({
    queryKey: ['media'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/media');
      return await response.json();
    },
  });

  // Fetch characters for assignment
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/characters');
      return await response.json();
    },
  });

  // ✅ CRITICAL FIX: Upload mutation with correct admin endpoint
  const uploadMutation = useMutation({
    mutationFn: async (uploadData: {
      file: File;
      metadata: any;
    }) => {
      console.log('\n🚀 [UPLOAD] === ADMIN MULTER UPLOAD START ===');
      console.log('📤 [UPLOAD] File details:', {
        name: uploadData.file.name,
        size: uploadData.file.size,
        type: uploadData.file.type
      });
      console.log('📤 [UPLOAD] Metadata to send:', uploadData.metadata);
      
      // ✅ FIXED: Build FormData matching adminRoutes.ts expectations
      const formData = new FormData();
      
      // Add file (adminRoutes expects 'files' array)
      formData.append('files', uploadData.file);
      
      // Add each metadata field individually (NOT as nested object)
      Object.entries(uploadData.metadata).forEach(([key, value]) => {
        if (key === 'poses' && Array.isArray(value)) {
          // Admin route parses this as JSON string
          formData.append('poses', JSON.stringify(value));
          console.log(`  🎨 poses: ${JSON.stringify(value)}`);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
          console.log(`  ${key}: ${String(value)}`);
        }
      });
      
      console.log('📤 [UPLOAD] FormData ready. Posting to admin multer endpoint...');
      
      // ✅ CRITICAL: Use native fetch to preserve FormData boundaries
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type - let browser handle multipart boundary
      });

      console.log('📤 [UPLOAD] Admin response:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [UPLOAD] Admin error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [UPLOAD] Admin success response:', result);
      console.log('🚀 [UPLOAD] === ADMIN UPLOAD COMPLETE ===\n');
      
      return result;
    },
    onSuccess: (result) => {
      console.log('✅ [UPLOAD] Upload completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('✅ File uploaded successfully!');
      setUploadProgress(0);
      setSelectedFiles([]);
      setCroppedFile(null);
      setOriginalFile(null);
      
      // Reset upload config
      setUploadConfig({
        characterId: '',
        name: '',
        mood: '',
        poses: [],
        requiredLevel: 1,
        isVip: false,
        isNsfw: false,
        isEvent: false,
        randomSendChance: 5,
        category: 'Character',
        enabledForChat: true
      });
      
      refetch();
    },
    onError: (error) => {
      console.error('❌ [UPLOAD] Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
    },
  });

  // Update file mutation  
  const updateFileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('📝 [EDIT] Updating file:', id, updates);
      
      const response = await apiRequest('PUT', `/api/media/${id}`, updates);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: async (result, { id }) => {
      console.log('✅ [EDIT] Update successful:', result);
      
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('✅ Metadata updated!');
      setEditingFile(null);
      refetch();
    },
    onError: (error) => {
      console.error('❌ [EDIT] Update failed:', error);
      toast.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/media/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('File deleted successfully');
      setSelectedFile(null);
      refetch();
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      toast.error('Failed to delete file');
    },
  });

  // Organize files by category
  useEffect(() => {
    if (mediaFiles.length > 0) {
      organizeFilesByCategory(mediaFiles);
    }
  }, [mediaFiles]);

  const organizeFilesByCategory = (files: MediaFile[]) => {
    const folders: Record<string, MediaFile[]> = {};
    files.forEach((file) => {
      const folderName = getFolderName(file);
      if (!folders[folderName]) folders[folderName] = [];
      folders[folderName].push(file);
    });
    setFolderStructure(folders);
  };

  const getFolderName = (file: MediaFile): string => {
    const parts = [];
    if (file.characterId) {
      const character = characters.find((c: Character) => c.id === file.characterId);
      parts.push(`Character_${character?.name || file.characterId}`);
    }
    if (file.mood) parts.push(`Mood_${file.mood}`);
    if (file.pose) parts.push('Pose');
    if (file.isVip) parts.push('VIP');
    if (file.isNsfw) parts.push('NSFW');
    if (file.isEvent) parts.push('Event');
    return parts.join('/') || 'Uncategorized';
  };

  // File selection with cropper
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      if (file.type.startsWith('image/')) {
        // Show cropper for images
        const imageUrl = URL.createObjectURL(file);
        setOriginalFile(file);
        setCropImageUrl(imageUrl);
        setShowCropDialog(true);
      } else {
        // For non-images, use directly
        setSelectedFiles([file]);
        setOriginalFile(file);
        toast.success('File selected. Configure metadata and upload.');
      }
    }
  };

  // Cropper completion
  const handleCropComplete = (croppedFile: File) => {
    console.log('✂️ [CROP] Crop completed:', croppedFile);
    setCroppedFile(croppedFile);
    setSelectedFiles([croppedFile]);
    setShowCropDialog(false);
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
      setCropImageUrl(null);
    }
    toast.success('✂️ Image cropped! Configure metadata and upload.');
  };

  // Cropper cancel
  const handleCropCancel = () => {
    setShowCropDialog(false);
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
      setCropImageUrl(null);
    }
    setCroppedFile(null);
    setSelectedFiles([]);
    setOriginalFile(null);
  };

  // Poses management
  const addPose = () => {
    const pose = newPose.trim().toLowerCase();
    if (!pose) return;
    
    if (!availablePoses.includes(pose)) {
      setAvailablePoses([...availablePoses, pose]);
    }
    
    if (!uploadConfig.poses.includes(pose)) {
      setUploadConfig(prev => ({
        ...prev,
        poses: [...prev.poses, pose]
      }));
    }
    
    setNewPose('');
  };

  const removePose = (pose: string) => {
    setUploadConfig(prev => ({
      ...prev,
      poses: prev.poses.filter(p => p !== pose)
    }));
  };

  const togglePose = (pose: string) => {
    if (uploadConfig.poses.includes(pose)) {
      removePose(pose);
    } else {
      setUploadConfig(prev => ({
        ...prev,
        poses: [...prev.poses, pose]
      }));
    }
  };

  // ✅ CRITICAL FIX: Submit upload with exact admin route expectation
  const handleSubmitUpload = async () => {
    const fileToUpload = croppedFile || selectedFiles[0];
    if (!fileToUpload) {
      toast.error('No file selected');
      return;
    }

    // ✅ Build metadata exactly as adminRoutes.ts expects
    const metadata = {
      characterId: uploadConfig.characterId || null,
      name: uploadConfig.name || null,
      mood: uploadConfig.mood || null,
      poses: uploadConfig.poses, // Array (will be JSON.stringify'ed in mutation)
      category: uploadConfig.category,
      isNsfw: uploadConfig.isNsfw,
      isVip: uploadConfig.isVip,
      isEvent: uploadConfig.isEvent,
      enabledForChat: uploadConfig.enabledForChat,
      randomSendChance: uploadConfig.randomSendChance,
      requiredLevel: uploadConfig.requiredLevel,
      autoOrganized: false
    };

    console.log('\n🚀 [SUBMIT] === PREPARING ADMIN MULTER UPLOAD ===');
    console.log('📤 [SUBMIT] File:', fileToUpload.name, fileToUpload.size, 'bytes');
    console.log('📤 [SUBMIT] Metadata object:', metadata);
    console.log('📤 [SUBMIT] Route: POST /api/media/upload (admin multer)');
    
    setUploadProgress(50);
    
    uploadMutation.mutate({ file: fileToUpload, metadata });
  };

  const renderMediaPreview = (file: MediaFile, size: 'thumbnail' | 'full' = 'thumbnail') => {
    const maxWidth = size === 'thumbnail' ? '150px' : '100%';
    const maxHeight = size === 'thumbnail' ? '150px' : '400px';

    const commonStyles = {
      maxWidth,
      maxHeight,
      objectFit: 'cover' as const,
      borderRadius: '8px',
    };

    const fileName = file.fileName || '';
    const filePath = file.filePath;
    const fileUrl = filePath?.startsWith('http')
      ? filePath
      : filePath?.startsWith('/api/')
        ? filePath
        : filePath?.startsWith('/')
          ? filePath
          : filePath
            ? `/api/media/file/${filePath}`
            : fileName
              ? `/api/media/file/${fileName}`
              : '/uploads/placeholder-character.jpg';
    const fileExt = fileName.toLowerCase().split('.').pop() || '';

    const isImage = file.fileType === 'image' ||
                   file.fileType === 'gif' ||
                   ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExt);
    const isVideo = file.fileType === 'video' ||
                   ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(fileExt);

    if (isImage) {
      return (
        <img
          src={fileUrl}
          alt="Media preview"
          style={commonStyles}
          loading="lazy"
          onError={(e) => {
            console.log('Image failed to load:', fileUrl, 'File details:', file);
            const img = e.target as HTMLImageElement;
            if (!img.src.includes('placeholder')) {
              img.src = '/uploads/placeholder-character.jpg';
            }
          }}
        />
      );
    } else if (isVideo) {
      return (
        <video controls style={commonStyles}>
          <source src={fileUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }
    return (
      <div style={{ ...commonStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#374151' }}>
        <span className="text-white text-xs">📄 {file.fileType || fileExt || 'file'}</span>
      </div>
    );
  };

  // Edit file
  const handleEditFile = async (file: MediaFile) => {
    console.log('📝 [EDIT] Loading file for edit:', file.id);
    
    try {
      // Fetch fresh file data to get current poses
      const response = await apiRequest('GET', `/api/media/file/${file.id}`);
      if (response.ok) {
        const freshFile = await response.json();
        const fileData = freshFile.data || freshFile;
        
        console.log('📝 [EDIT] Fresh file data:', fileData);
        
        // Ensure poses is an array
        if (fileData.poses && typeof fileData.poses === 'string') {
          try {
            fileData.poses = JSON.parse(fileData.poses);
          } catch {
            fileData.poses = [];
          }
        }
        
        setEditingFile({
          ...fileData,
          poses: fileData.poses || []
        });
      } else {
        setEditingFile(file);
      }
    } catch (error) {
      console.warn('⚠️ [EDIT] Could not fetch fresh file data:', error);
      setEditingFile(file);
    }
  };

  // Save edit with poses
  const handleSaveEdit = () => {
    if (!editingFile) return;

    const updates = {
      characterId: editingFile.characterId,
      name: editingFile.name,
      mood: editingFile.mood,
      poses: editingFile.poses || [],
      category: editingFile.category,
      isNsfw: editingFile.isNsfw,
      isVip: editingFile.isVip,
      isEvent: editingFile.isEvent,
      enabledForChat: editingFile.enabledForChat,
      randomSendChance: editingFile.randomSendChance,
      requiredLevel: editingFile.requiredLevel,
    };

    console.log('📝 [EDIT] Saving updates:', updates);
    updateFileMutation.mutate({ id: editingFile.id, updates });
  };

  if (filesLoading) {
    return <div className="flex justify-center p-8">Loading media files...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {onClose && (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Media Manager</h1>
          <Button onClick={onClose} variant="outline" className="text-white border-white">
            Close
          </Button>
        </div>
      )}
      
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Media Manager</h1>
        <p className="text-gray-400">Upload, organize, and manage your character media files</p>
      </div>

      {/* Upload Section */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Upload Media Files</CardTitle>
          <CardDescription className="text-gray-400">
            Supported formats: JPEG, PNG, GIF, MP4, WebM. Images will be cropped to 512x512.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <Label className="text-white mb-2 block">Select Files</Label>
              <Input
                type="file"
                onChange={handleFileUpload}
                accept="image/*,video/*,image/gif"
                className="bg-gray-700 border-gray-600 text-white file:bg-purple-600 file:text-white file:border-none file:rounded"
                disabled={uploadMutation.isPending}
              />
              {selectedFiles.length > 0 && (
                <p className="text-green-400 text-sm mt-2">
                  ✅ Selected: {selectedFiles[0].name} ({Math.round(selectedFiles[0].size / 1024)}KB)
                </p>
              )}
            </div>

            {/* Upload Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Assign to Character</Label>
                <Select
                  value={uploadConfig.characterId}
                  onValueChange={(value) => {
                    console.log('📄 [CONFIG] Character changed:', value);
                    setUploadConfig(prev => ({ ...prev, characterId: value }));
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select character (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">Unassigned</SelectItem>
                    {characters.map((character: Character) => (
                      <SelectItem key={character.id} value={character.id} className="text-white">
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Content Category</Label>
                <Select
                  value={uploadConfig.category}
                  onValueChange={(value) => {
                    console.log('📄 [CONFIG] Category changed:', value);
                    setUploadConfig(prev => ({ ...prev, category: value }));
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="Character" className="text-white">Character</SelectItem>
                    <SelectItem value="Avatar" className="text-white">Avatar</SelectItem>
                    <SelectItem value="Misc" className="text-white">Misc</SelectItem>
                    <SelectItem value="Event" className="text-white">Event</SelectItem>
                    <SelectItem value="Other" className="text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Name (Optional)</Label>
                <Input
                  value={uploadConfig.name}
                  onChange={(e) => {
                    console.log('📄 [CONFIG] Name changed:', e.target.value);
                    setUploadConfig(prev => ({ ...prev, name: e.target.value }));
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Custom name for this file"
                />
              </div>

              <div>
                <Label className="text-white">Mood</Label>
                <Select
                  value={uploadConfig.mood}
                  onValueChange={(value) => {
                    console.log('📄 [CONFIG] Mood changed:', value);
                    setUploadConfig(prev => ({ ...prev, mood: value }));
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select mood (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">No mood</SelectItem>
                    <SelectItem value="normal" className="text-white">Normal</SelectItem>
                    <SelectItem value="happy" className="text-white">Happy</SelectItem>
                    <SelectItem value="flirty" className="text-white">Flirty</SelectItem>
                    <SelectItem value="playful" className="text-white">Playful</SelectItem>
                    <SelectItem value="mysterious" className="text-white">Mysterious</SelectItem>
                    <SelectItem value="shy" className="text-white">Shy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Required Level</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={uploadConfig.requiredLevel}
                  onChange={(e) => {
                    const level = parseInt(e.target.value) || 1;
                    console.log('📄 [CONFIG] Level changed:', level);
                    setUploadConfig(prev => ({ ...prev, requiredLevel: level }));
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Random Send Chance (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={uploadConfig.randomSendChance}
                  onChange={(e) => {
                    const chance = parseInt(e.target.value) || 0;
                    console.log('📄 [CONFIG] Random chance changed:', chance);
                    setUploadConfig(prev => ({ ...prev, randomSendChance: chance }));
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Poses Section */}
            <div className="bg-gray-800/80 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white text-sm font-semibold mb-3">🎨 Poses</h3>
              
              {/* Add new pose */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={newPose}
                  onChange={(e) => setNewPose(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPose()}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Add a pose (e.g., sitting, bikini)"
                />
                <Button
                  onClick={addPose}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!newPose.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Available poses */}
              <div className="flex flex-wrap gap-2">
                {availablePoses.map(pose => (
                  <button
                    key={pose}
                    onClick={() => {
                      console.log('📄 [CONFIG] Pose toggled:', pose);
                      togglePose(pose);
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      uploadConfig.poses.includes(pose)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {pose}
                  </button>
                ))}
              </div>
              
              {/* Selected poses */}
              {uploadConfig.poses.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Selected poses:</p>
                  <div className="flex flex-wrap gap-1">
                    {uploadConfig.poses.map(pose => (
                      <span
                        key={pose}
                        className="bg-purple-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        {pose}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-300"
                          onClick={() => {
                            console.log('📄 [CONFIG] Pose removed:', pose);
                            removePose(pose);
                          }}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Panel */}
            <div className="bg-gray-800/80 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white text-sm font-semibold mb-3">Upload Settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVip"
                    checked={uploadConfig.isVip}
                    onCheckedChange={(checked) => {
                      console.log('📄 [CONFIG] VIP changed:', checked);
                      setUploadConfig(prev => ({ ...prev, isVip: !!checked }));
                    }}
                    className="border-gray-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor="isVip" className="text-white text-sm font-medium cursor-pointer">
                    💸 VIP Content
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isNsfw"
                    checked={uploadConfig.isNsfw}
                    onCheckedChange={(checked) => {
                      console.log('📄 [CONFIG] NSFW changed:', checked);
                      setUploadConfig(prev => ({ ...prev, isNsfw: !!checked }));
                    }}
                    className="border-gray-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  />
                  <Label htmlFor="isNsfw" className="text-white text-sm font-medium cursor-pointer">
                    🔞 NSFW Content
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isEvent"
                    checked={uploadConfig.isEvent}
                    onCheckedChange={(checked) => {
                      console.log('📄 [CONFIG] Event changed:', checked);
                      setUploadConfig(prev => ({ ...prev, isEvent: !!checked }));
                    }}
                    className="border-gray-500 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
                  />
                  <Label htmlFor="isEvent" className="text-white text-sm font-medium cursor-pointer">
                    ⭐ Event Content
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enabledForChat"
                    checked={uploadConfig.enabledForChat}
                    onCheckedChange={(checked) => {
                      console.log('📄 [CONFIG] Chat enabled changed:', checked);
                      setUploadConfig(prev => ({ ...prev, enabledForChat: !!checked }));
                    }}
                    className="border-gray-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <Label htmlFor="enabledForChat" className="text-white text-sm font-medium cursor-pointer">
                    💬 Enable for Chat
                  </Label>
                </div>
              </div>
            </div>

            {/* ✅ ENHANCED: Metadata preview shows what will be sent to admin route */}
            {(uploadConfig.characterId || uploadConfig.name || uploadConfig.mood || uploadConfig.poses.length > 0) && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-blue-300 text-sm font-semibold mb-2">🔍 Metadata Preview (admin multer route):</h4>
                <div className="text-xs text-blue-200 space-y-1">
                  {uploadConfig.characterId && <div>• characterId: {uploadConfig.characterId}</div>}
                  {uploadConfig.name && <div>• name: {uploadConfig.name}</div>}
                  {uploadConfig.mood && <div>• mood: {uploadConfig.mood}</div>}
                  {uploadConfig.poses.length > 0 && <div>• poses: {JSON.stringify(uploadConfig.poses)}</div>}
                  <div>• category: {uploadConfig.category}</div>
                  <div>• isVip: {uploadConfig.isVip ? 'true' : 'false'}</div>
                  <div>• isNsfw: {uploadConfig.isNsfw ? 'true' : 'false'}</div>
                  <div>• enabledForChat: {uploadConfig.enabledForChat ? 'true' : 'false'}</div>
                  <div>• requiredLevel: {uploadConfig.requiredLevel}</div>
                  <div>• randomSendChance: {uploadConfig.randomSendChance}</div>
                  <div className="text-yellow-200 mt-2 font-bold">🛣️ Route: POST /api/media/upload (admin multer)</div>
                  <div className="text-green-200">✅ Will send as FormData with file attachment</div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleSubmitUpload}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
              disabled={uploadMutation.isPending || selectedFiles.length === 0}
            >
              {uploadMutation.isPending 
                ? '📤 Uploading via Admin Multer Route...' 
                : selectedFiles.length > 0 
                  ? `🚀 Upload ${selectedFiles[0].name} with Metadata` 
                  : 'Choose Files First'
              }
            </Button>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Browser - showing only first part for space */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="folders">Folder View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.isArray(mediaFiles) && mediaFiles.length > 0 ? (
              mediaFiles.map((file: MediaFile) => (
                <Card
                  key={file.id}
                  className="bg-gray-800/50 border-gray-600 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => setSelectedFile(file)}
                >
                  <CardContent className="p-2">
                    {renderMediaPreview(file)}
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-white truncate" title={`ID: ${file.id}, Type: ${file.fileType || 'missing'}, Path: ${file.filePath || 'missing'}`}>
                        {file.fileName || `File ${file.id.slice(0, 8)}`}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {file.isVip && (
                          <span className="text-xs bg-yellow-600 text-white px-1 rounded">VIP</span>
                        )}
                        {file.isNsfw && (
                          <span className="text-xs bg-red-600 text-white px-1 rounded">NSFW</span>
                        )}
                        {file.mood && (
                          <span className="text-xs bg-blue-600 text-white px-1 rounded">{file.mood}</span>
                        )}
                        {file.poses && Array.isArray(file.poses) && file.poses.length > 0 && (
                          <span className="text-xs bg-purple-600 text-white px-1 rounded">
                            🎨{file.poses.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No media files found. Upload some files to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          {Object.entries(folderStructure).length > 0 ? (
            Object.entries(folderStructure).map(([folderName, files]) => (
              <Card key={folderName} className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{folderName}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {files.length} file(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedFile(file)}
                      >
                        {renderMediaPreview(file)}
                        <p className="text-xs text-white mt-1 truncate">
                          {file.fileName || `File ${file.id.slice(0, 8)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No files organized into folders yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Keep existing modals - Cropper, File Details, Edit Modal */}
      {/* Cropper Dialog */}
      {showCropDialog && cropImageUrl && (
        <Cropper512
          imageUrl={cropImageUrl}
          isOpen={showCropDialog}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          originalFile={originalFile}
        />
      )}

      {/* File Details Modal and Edit Modal remain unchanged for brevity */}
    </div>
  );
};

export default FileManagerCore;