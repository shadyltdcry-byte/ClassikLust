/**
 * ImageManager.tsx - Fixed Media Upload Component
 * Last Edited: 2025-08-21 by Assistant
 *
 * Fixed file upload functionality, added character/avatar type selection,
 * proper form data handling, and improved error handling
 */

import React, { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Upload,
  Image,
  Video,
  Music,
  File,
  Trash2,
  Edit3,
  Filter,
  X,
  CheckCircle,
  Crop,
  ZoomIn,
  ZoomOut
} from "lucide-react";

interface ImageManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ImageManager({
  isOpen = true,
  onClose,
}: ImageManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [imageType, setImageType] = useState<string>("character"); // character or avatar
  const [uploadCategory, setUploadCategory] = useState<string>("character");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCharacter, setFilterCharacter] = useState<string>("all");

  // Cropping state
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [editingFile, setEditingFile] = useState<any | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form fields state
  const [formFields, setFormFields] = useState({
    pose: "",
    levelRequirement: 1,
    enabledForChat: false,
    randomSendChance: 5,
    isNsfw: false,
    isVip: false,
    isEvent: false,
    isWheelReward: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch media files
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ["/api/media"],
    queryFn: async () => {
      const response = await fetch("/api/media");
      if (!response.ok) throw new Error("Failed to fetch media files");
      return response.json();
    },
  });

  // Fetch characters for assignment
  const { data: characters = [] } = useQuery({
    queryKey: ["/api/characters"],
    queryFn: async () => {
      const response = await fetch("/api/characters");
      if (!response.ok) throw new Error("Failed to fetch characters");
      return response.json();
    },
  });

  // Upload mutation with auto-folder organization
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      
      // Auto-organize into folders: charactername/sfw-or-nsfw/imagetype
      const character = characters.find((c: any) => c.id === selectedCharacter);
      const characterName = character?.name || 'misc';
      const nsfwFolder = formFields.isNsfw ? 'nsfw' : 'sfw';
      const folderPath = `${characterName}/${nsfwFolder}/${imageType}`;
      
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      
      formData.append('config', JSON.stringify({
        characterId: selectedCharacter,
        folderPath,
        imageType,
        pose: formFields.pose,
        levelRequirement: formFields.levelRequirement,
        enabledForChat: formFields.enabledForChat,
        randomSendChance: formFields.randomSendChance,
        isNsfw: formFields.isNsfw,
        isVip: formFields.isVip,
        isEvent: formFields.isEvent,
        isWheelReward: formFields.isWheelReward,
      }));

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Files have been uploaded successfully",
      });
      // Invalidate both media and character-specific queries
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      if (selectedCharacter) {
        queryClient.invalidateQueries({ queryKey: ['/api/media/character', selectedCharacter] });
      }
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload files",
      });
    },
  });

  // Update mutation for editing media metadata
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('[ImageManager] Updating media', id, 'with:', updates);
      
      // Use consistent camelCase field names to match the schema
      const dbUpdates = {
        characterId: updates.characterId,
        mood: updates.mood,
        pose: updates.pose,
        category: updates.category,
        isNsfw: updates.isNsfw,
        isVip: updates.isVip,
        isEvent: updates.isEvent,
        isWheelReward: updates.isWheelReward,
        enabledForChat: updates.enabledForChat,
        randomSendChance: updates.randomSendChance,
        levelRequirement: updates.levelRequirement,
      };
      
      const response = await fetch(`/api/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbUpdates),
      });
      if (!response.ok) {
        const error = await response.text();
        console.error('[ImageManager] Update failed:', error);
        throw new Error(error || "Update failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[ImageManager] Update successful:', data);
      toast({
        title: "Update successful",
        description: "Media file has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    },
    onError: (error: any) => {
      console.error('[ImageManager] Update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update media file",
      });
    },
  });


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Show crop dialog for first image
      if (files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCropImage(e.target?.result as string);
          setCropFile(files[0]);
          setShowCropDialog(true);
        };
        reader.readAsDataURL(files[0]);
      } else {
        setSelectedFiles(files);
      }
    }
  };

  const handleCropComplete = useCallback(() => {
    if (!canvasRef.current || !cropImage || !cropFile) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    
    img.onload = () => {
      // Set canvas size to 512x512
      canvas.width = 512;
      canvas.height = 512;

      // Clear canvas
      ctx.clearRect(0, 0, 512, 512);

      // Calculate dimensions for cropping
      const scale = cropScale;
      const sourceWidth = img.width / scale;
      const sourceHeight = img.height / scale;
      
      // Calculate source position with pan offset
      const sourceX = Math.max(0, Math.min((img.width - sourceWidth) / 2 - cropPosition.x, img.width - sourceWidth));
      const sourceY = Math.max(0, Math.min((img.height - sourceHeight) / 2 - cropPosition.y, img.height - sourceHeight));

      // Draw the cropped and scaled image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        512,
        512
      );

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], cropFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(croppedFile);
          setSelectedFiles(dataTransfer.files);
          setShowCropDialog(false);
          setCropImage(null);
          setCropFile(null);
          setCropScale(1);
          setCropPosition({ x: 0, y: 0 });
          
          toast({
            title: "Image Cropped",
            description: "Image has been cropped to 512x512. Ready to upload.",
          });
        }
      }, 'image/jpeg', 0.95);
    };
    
    img.onerror = () => {
      toast({
        variant: "destructive",
        title: "Crop Failed",
        description: "Failed to load image for cropping",
      });
    };
    
    img.src = cropImage;
  }, [cropImage, cropFile, cropScale, cropPosition, toast]);

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = Array.from(selectedFiles).filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Types",
        description: `Please only upload image files (JPG, PNG, GIF, WebP)`,
        variant: "destructive",
      });
      return;
    }

    if (!selectedCharacter) {
      toast({
        title: "No Character Selected",
        description: "Please select a character for organization",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selectedFiles);
  };

  const getFileIcon = (file: any) => {
    const type = file.fileType || file.type || "";
    if (type.includes("image")) return <Image className="w-4 h-4 text-blue-400" />;
    if (type.includes("video")) return <Video className="w-4 h-4 text-red-400" />;
    if (type.includes("audio")) return <Music className="w-4 h-4 text-green-400" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  // Filter media files
  const filteredFiles = mediaFiles.filter((file: any) => {
    if (filterCategory !== "all" && file.category !== filterCategory) return false;
    if (filterCharacter !== "all" && file.characterId !== filterCharacter) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="w-full min-h-[600px] space-y-6 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
      {/* Upload Section */}
      <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Media Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div>
            <Label className="text-white">Select Files</Label>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="bg-black/30 border-white/20 text-white"
            />
            {selectedFiles && (
              <p className="text-sm text-gray-400 mt-1">
                {selectedFiles.length} file(s) selected
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Character Assignment */}
            <div>
              <Label className="text-white">Character Assignment</Label>
              <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white">
                  <SelectValue placeholder="Select character (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific character</SelectItem>
                  {characters.map((char: any) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Type - NEW FIELD */}
            <div>
              <Label className="text-white">Image Type</Label>
              <Select value={imageType} onValueChange={setImageType}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white">
                  <SelectValue placeholder="Select image type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">Character Picture</SelectItem>
                  <SelectItem value="avatar">Avatar Picture</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="ui">UI Element</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pose */}
            <div>
              <Label className="text-white">Pose (Optional)</Label>
              <Input
                value={formFields.pose}
                onChange={(e) => setFormFields(prev => ({ ...prev, pose: e.target.value }))}
                placeholder="e.g., standing, sitting, dancing"
                className="bg-black/30 border-white/20 text-white"
              />
            </div>

            {/* Required Level */}
            <div>
              <Label className="text-white">Required Level</Label>
              <Input
                type="number"
                min="1"
                value={formFields.levelRequirement}
                onChange={(e) => setFormFields(prev => ({ ...prev, levelRequirement: parseInt(e.target.value) || 1 }))}
                className="bg-black/30 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Switches */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formFields.isNsfw}
                onCheckedChange={(checked) => setFormFields(prev => ({ ...prev, isNsfw: checked }))}
              />
              <Label className="text-white">🔞NSFW 18+</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formFields.isVip}
                onCheckedChange={(checked) => setFormFields(prev => ({ ...prev, isVip: checked }))}
              />
              <Label className="text-white">💎VIP Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formFields.isEvent}
                onCheckedChange={(checked) => setFormFields(prev => ({ ...prev, isEvent: checked }))}
              />
              <Label className="text-white">⭐Event Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formFields.isWheelReward}
                onCheckedChange={(checked) => setFormFields(prev => ({ ...prev, isWheelReward: checked }))}
              />
              <Label className="text-white">Wheel Reward</Label>
            </div>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFiles || uploadMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {uploadMutation.isPending ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Media Library */}
      <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Image className="w-5 h-5" />
            Media Library
          </CardTitle>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 bg-black/30 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="character">Character</SelectItem>
                <SelectItem value="avatar">Avatar</SelectItem>
                <SelectItem value="background">Background</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCharacter} onValueChange={setFilterCharacter}>
              <SelectTrigger className="w-40 bg-black/30 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Characters</SelectItem>
                {characters.map((char: any) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading media files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No media files found. Upload some files to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file: any, index: number) => (
                <Card key={`media-${file.id}-${index}`} className="bg-black/40 border-gray-600 overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    {/* File Header with Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <span className="text-white text-sm truncate">
                          {file.fileName || file.fileName || file.originalName}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-blue-600/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFile(file);
                          }}
                          title="Edit metadata"
                        >
                          <Edit3 className="w-3 h-3 text-blue-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-red-600/20"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('Delete this file permanently?')) {
                              try {
                                const response = await fetch(`/api/media/${file.id}`, {
                                  method: 'DELETE',
                                });
                                if (response.ok) {
                                  toast({
                                    title: "File deleted",
                                    description: "Media file has been deleted",
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["/api/media"] });
                                } else {
                                  throw new Error('Delete failed');
                                }
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Delete failed",
                                  description: "Failed to delete media file",
                                });
                              }
                            }
                          }}
                          title="Delete file"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {file.filePath && (
                      <div className="w-full h-32 bg-gray-900 rounded overflow-hidden">
                        <img
                          src={file.filePath}
                          alt={file.fileName || file.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/placeholder-character.jpg';
                          }}
                        />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                      {file.mood && (
                        <Badge variant="secondary" className="text-xs">
                          {file.mood}
                        </Badge>
                      )}
                      {file.isNsfw && (
                        <Badge variant="destructive" className="text-xs">
                          NSFW 18+
                        </Badge>
                      )}
                      {file.isVip && (
                        <Badge variant="outline" className="text-xs">
                          VIP
                        </Badge>
                      )}
                     {file.isEvent && (
                        <Badge variant="outline" className="text-xs">
                          Event
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="text-gray-400 text-xs space-y-1">
                      {file.characterId ? (
                        <div>📷 {characters.find((c: any) => c.id === file.characterId)?.name || "Unknown"}</div>
                      ) : (
                        <div>📷 Unassigned</div>
                      )}
                      <div>🎲 AI Chat: {file.randomSendChance || 5}%</div>
                      {file.pose && <div>🎭 {file.pose}</div>}
                      {file.category && <div>📁 {file.category}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl bg-gray-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Crop Image
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Canvas Preview */}
            <div className="relative bg-black/50 rounded-lg overflow-hidden" style={{ height: '400px' }}>
              {cropImage && (
                <img 
                  src={cropImage} 
                  alt="Crop preview" 
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `scale(${cropScale}) translate(${cropPosition.x}px, ${cropPosition.y}px)`
                  }}
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Crop Controls */}
            <div className="space-y-3">
              <div>
                <Label className="text-white flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Zoom: {cropScale.toFixed(1)}x
                </Label>
                <Slider
                  value={[cropScale]}
                  onValueChange={([val]) => setCropScale(val)}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white text-sm">Pan X: {cropPosition.x}</Label>
                  <Slider
                    value={[cropPosition.x]}
                    onValueChange={([val]) => setCropPosition(prev => ({ ...prev, x: val }))}
                    min={-200}
                    max={200}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-white text-sm">Pan Y: {cropPosition.y}</Label>
                  <Slider
                    value={[cropPosition.y]}
                    onValueChange={([val]) => setCropPosition(prev => ({ ...prev, y: val }))}
                    min={-200}
                    max={200}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  setShowCropDialog(false);
                  setCropImage(null);
                  setCropFile(null);
                }}
                variant="outline"
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCropComplete}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Crop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Metadata Dialog */}
      {editingFile && (
        <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
          <DialogContent className="max-w-2xl bg-gray-900 border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Media Metadata</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Image Preview */}
              {editingFile.filePath && (
                <div className="w-full h-48 bg-gray-800 rounded overflow-hidden">
                  <img
                    src={editingFile.filePath}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              {/* Character Assignment */}
              <div>
                <Label className="text-white">Assign to Character</Label>
                <Select
                  value={editingFile.characterId || ""}
                  onValueChange={(value) => setEditingFile({ ...editingFile, characterId: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select character" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="">Unassigned</SelectItem>
                    {characters.map((char: any) => (
                      <SelectItem key={char.id} value={char.id} className="text-white">
                        {char.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pose */}
              <div>
                <Label className="text-white">Pose</Label>
                <Input
                  value={editingFile.pose || ""}
                  onChange={(e) => setEditingFile({ ...editingFile, pose: e.target.value })}
                  placeholder="e.g., standing, sitting"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Settings Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingFile.isNsfw || false}
                    onCheckedChange={(checked) => setEditingFile({ ...editingFile, isNsfw: checked })}
                  />
                  <Label className="text-white">NSFW 18+</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingFile.isVip || false}
                    onCheckedChange={(checked) => setEditingFile({ ...editingFile, isVip: checked })}
                  />
                  <Label className="text-white">VIP Only</Label>
                </div>
                         <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingFile.isEvent || false}
                    onCheckedChange={(checked) => setEditingFile({ ...editingFile, isEvent: checked })}
                  />
                  <Label className="text-white">Event Only</Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setEditingFile(null)}
                  variant="outline"
                  className="border-white/20 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateMutation.mutate({
                      id: editingFile.id,
                      updates: editingFile,
                    });
                    setEditingFile(null);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Close button */}
      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline" className="text-white border-white/20">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      )}
    </div>
  );
}