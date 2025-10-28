# 🎯 ClassikLustAITap - JSON-First Architecture

## 🔥 Core Philosophy: JSON Rules Everything

### Data Flow
```
Game Data (JSON Files) → FileStorage → SupabaseStorage → API → Frontend
                ↓
         User Progress (Database)
```

### Directory Structure
```
game-data/
├── upgrades/
│   ├── tap-upgrades.json
│   ├── income-upgrades.json
│   ├── special-upgrades.json
│   └── booster-upgrades.json
├── achievements/
│   ├── collection.json
│   ├── gameplay.json
│   └── social.json
├── tasks/
│   ├── daily.json
│   ├── weekly.json
│   └── events.json
├── progression/
│   └── level-requirements.json
└── settings/
    └── game-settings.json
```

## 🚀 Key Components

### FileStorage
- **Purpose**: JSON file management with caching
- **Features**: CRUD operations, validation, bulk ops
- **Performance**: In-memory caching for speed

### SupabaseStorage  
- **Purpose**: Database operations + FileStorage integration
- **Hybrid**: User progress in DB, game content in JSON
- **Migration**: Seamlessly bridges old and new systems

### Purchase Flow
```typescript
// OLD (broken): UUID validation
POST /api/upgrades/12345678-uuid/purchase ❌

// NEW (works): String ID validation via FileStorage
POST /api/upgrades/mega-tap/purchase ✅
```

## 🛠️ Development Workflow

1. **Edit Content**: Modify JSON files in `game-data/`
2. **Auto-Reload**: FileStorage detects changes
3. **Test**: Changes active immediately
4. **Deploy**: Commit JSON files

## 🎯 Benefits

- ⚡ **Performance**: Cached JSON loading
- 🔧 **Maintainable**: Clear separation of data/logic
- 🚀 **Scalable**: Easy to add new content types
- 💪 **Robust**: Validation and integrity checks
- 🎮 **Game-Ready**: No server restarts needed