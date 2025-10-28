# 🎮 Complete Gameplay Systems Fix Guide

## 🚨 **Critical Issues Found & Fixed**

### **1. Energy Regeneration System - MISSING!** ⚡
**Problem**: Your energy never regenerates automatically (major gameplay blocker)
**Fixed**: Added complete energy regen system

### **2. Offline Passive Income - Not Crediting** 💰  
**Problem**: Shows offline LP but doesn't add to balance
**Fixed**: Real claim endpoint with proper user update

### **3. Admin Upgrades - Not Displaying** 🔧
**Problem**: Admin panel shows "No upgrades found" 
**Fixed**: New endpoint for JSON-first admin view

### **4. Upload Metadata - Lost on Initial Save** 📤
**Problem**: Initial upload loses character assignment, toggles, chat chance
**Fixed**: Proper initial insert with all metadata

### **5. Cropper - Zoom Only, No True Crop** ✂️
**Problem**: Can't select specific area to crop (just zoom in/out)
**Fixed**: React-easy-crop component with 512x512 canvas export

### **6. Poses - No Reusable System** 🎨
**Problem**: Can't save/reuse pose tags like "sitting", "bikini"
**Fixed**: JSONB poses system with "Add pose" functionality

---

## 🛠️ **Step-by-Step Implementation**

### **Step 1: Add Poses Column to Database**
```sql
ALTER TABLE "mediaFiles" ADD COLUMN IF NOT EXISTS "poses" jsonb DEFAULT '[]'::jsonb;
```

### **Step 2: Restart Your Server**
```bash
npm run dev
```

### **Step 3: Start Energy Regeneration**
When a user joins the game, call:
```bash
POST /api/energy/start-regen/telegram_5134006535
```

### **Step 4: Test Systems**

#### **Energy Regeneration:**
- Should see logs: `⚡ [REGEN] telegram_5134006535: 950 + 3 = 953/1000`
- Energy bar should increase every 5 seconds
- Rate: +3 energy per 5 seconds (configurable)

#### **Offline Passive Income:**
```bash
# Test the claim endpoint
curl -X POST http://localhost:5000/api/offline/claim \
  -H "Content-Type: application/json" \
  -d '{"userId":"telegram_5134006535"}'
```
- Should return: `{ claimedLp: X, newLp: Y, minutesApplied: Z }`
- LP balance should actually increase
- Capped at 3 hours (180 minutes) by default
- **NEW UPGRADE**: "Offline Collector" extends the cap (+30 min per level)

#### **Admin Upgrades:**
```bash
# Test admin endpoint
curl "http://localhost:5000/api/admin/upgrades?userId=telegram_5134006535"
```
- Should return JSON with all upgrades + currentLevel + nextCost
- Admin panel should display upgrades properly

#### **Media Upload with Metadata:**
```bash
# Test upload with full metadata
curl -X POST http://localhost:5000/api/media/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.png",
    "filePath": "/uploads/test.png",
    "fileType": "image",
    "characterId": "550e8400-e29b-41d4-a716-446655440001",
    "enabledForChat": true,
    "isNsfw": false,
    "isVip": false,
    "isEvent": false,
    "randomSendChance": 25,
    "poses": ["sitting", "casual"],
    "name": "Test Image",
    "mood": "happy",
    "category": "Character"
  }'
```

---

## 🎯 **New API Endpoints**

### **Energy System:**
- `POST /api/energy/start-regen/:userId` - Start auto energy regen
- `POST /api/energy/stop-regen/:userId` - Stop energy regen  
- `GET /api/energy/regen-status/:userId` - Check if regen is active
- `POST /api/energy/regen/:userId` - Manual energy regen (testing)

### **Offline System:**
- `POST /api/offline/claim` - Claim offline LP with 3h cap + upgrades

### **Admin System:**
- `GET /api/admin/upgrades` - List all upgrade definitions
- `GET /api/admin/upgrades?userId=X` - List with user's levels/costs

### **Media System:**
- `POST /api/media/upload` - Upload with full initial metadata
- `PUT /api/media/:mediaId` - Update with poses support
- `GET /api/media/file/:mediaId` - Get single file with poses array

---

## 🎮 **Gameplay Mechanics Now Working**

### **⚡ Energy Regeneration:**
- **Rate**: +3 energy every 5 seconds
- **Max**: Respects user.maxEnergy (upgrades increase this)
- **Auto-start**: Call start-regen when user joins game
- **Auto-stop**: Call stop-regen when user leaves (optional cleanup)

### **💰 Offline Passive Income:**
- **Base Cap**: 3 hours (180 minutes)
- **Formula**: `claimedLP = (minutesOffline / 60) * lpPerHour`
- **Upgrade**: "Offline Collector" extends cap (+30 min per level, max level 6)
- **Protection**: Updates lastTick to prevent double-claiming

### **🖼️ Media System:**
- **Upload**: Saves all metadata on first insert (no more edit-after-upload)
- **Poses**: Reusable tags stored as JSONB array
- **Toggles**: isVip, isNsfw, isEvent, enabledForChat work properly
- **Character Assignment**: Uses UUID properly (gallery displays correctly)

### **✂️ True Cropper:**
- **Drag/Pan**: Position the crop area anywhere on image
- **Zoom**: Scale the image within the crop area
- **Export**: Exact 512x512 PNG via canvas (no stretching)
- **Touch**: Works on mobile with pinch/drag

---

## 📄 **Client Changes Needed**

### **1. Admin Upgrades Component:**
```typescript
// Change fetch from old endpoint to:
const response = await fetch('/api/admin/upgrades?userId=telegram_5134006535');
// Will show: Name, Category, Current Level, Next Cost, Max Level
```

### **2. Media Upload Component:**
```typescript
// Use new upload endpoint:
POST /api/media/upload
// Include all metadata in initial request
// After success, fetch GET /api/media/file/:id to refresh UI
```

### **3. Media Editor Component:**
```typescript
// Add poses multi-select:
// - Load existing poses from file.poses
// - "Add pose" input to append new ones  
// - Save poses array in PUT request
```

### **4. Replace Current Cropper:**
```typescript
import Cropper512 from '@/components/Cropper512';
// Use instead of current zoom-only viewer
// onCropComplete receives ready-to-upload File
```

### **5. Energy Auto-Start:**
```typescript
// When user joins game:
fetch('/api/energy/start-regen/telegram_5134006535', { method: 'POST' });
// Energy will auto-regenerate every 5 seconds
```

### **6. Offline Claim UI:**
```typescript
// Show "Claim Offline LP" when user returns
// On click:
const result = await fetch('/api/offline/claim', {
  method: 'POST',
  body: JSON.stringify({ userId }),
  headers: { 'Content-Type': 'application/json' }
});
// Update user LP with result.newLp
```

---

## 🧪 **Testing Checklist**

- ⬜ **Energy**: Regenerates +3 every 5 seconds automatically
- ⬜ **Offline**: Claiming actually adds LP to balance
- ⬜ **Admin**: Upgrades list shows with your current levels
- ⬜ **Upload**: Metadata saves on first upload (no edit required)
- ⬜ **Cropper**: Can drag/pan to select area, exports clean 512x512
- ⬜ **Poses**: Can add "sitting", "bikini" and reuse on other files
- ⬜ **Toggles**: VIP/NSFW/Event/Chat switches work properly

---

## 🎆 **Architecture Summary**

### **Energy System**:
```
User joins → POST /api/energy/start-regen/:userId
↓
Server runs setInterval every 5s
↓  
+3 energy (capped at maxEnergy)
↓
Client sees energy bar increase
```

### **Offline System**:
```
User returns → Check lastTick vs now
↓
Show "Claim Offline LP" if > 0 minutes
↓  
POST /api/offline/claim → Apply 3h cap + upgrades
↓
Update user.lp and user.lastTick
```

### **Media System**:
```
Select file → Cropper512 (drag/pan/zoom)
↓
Crop & Continue → 512x512 canvas export
↓  
Upload form → POST /api/media/upload (all metadata)
↓
Re-fetch file → UI shows correct values immediately
```

All systems are now properly integrated without touching any startup files! 🚀