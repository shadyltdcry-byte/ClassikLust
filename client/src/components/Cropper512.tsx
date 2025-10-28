import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface CropperProps {
  imageUrl: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 🎨 TRUE IMAGE CROPPER - 512x512 Canvas Export
 * Uses react-easy-crop for proper drag/pan/zoom with selectable crop area
 * Exports exact 512x512 PNG via canvas (no stretching)
 */
export default function Cropper512({ imageUrl, onCropComplete, onCancel, isOpen }: CropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageUrl;
      });

      // Create 512x512 canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      canvas.width = 512;
      canvas.height = 512;

      // Draw the cropped portion to the canvas
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        512,
        512
      );

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 1.0);
      });

      // Create File from blob
      const fileName = `cropped_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      
      console.log(`✂️ [CROP] Generated 512x512 file: ${fileName} (${Math.round(blob.size / 1024)}KB)`);
      onCropComplete(file);

    } catch (error) {
      console.error('Error creating cropped image:', error);
      alert('Failed to crop image. Please try again.');
    }
  }, [croppedAreaPixels, imageUrl, onCropComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>✂️ Crop Image (512x512)</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1} // 1:1 aspect ratio for 512x512
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            showGrid={true}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                backgroundColor: '#000'
              },
              mediaStyle: {
                objectFit: 'contain'
              }
            }}
          />
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <label className="text-sm font-medium">Zoom:</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={createCroppedImage}
            disabled={!croppedAreaPixels}
            className="bg-purple-600 hover:bg-purple-700"
          >
            ✂️ Crop & Continue
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          💡 Drag to position, use zoom slider to scale. Final output will be exactly 512x512 pixels.
        </p>
      </DialogContent>
    </Dialog>
  );
}