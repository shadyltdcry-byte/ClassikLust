# Project Structure Overview

This document gives a fast, accurate map of how the project is organized so a new developer or AI can become productive immediately.

## Architecture
- Client: React/TypeScript UI (media manager, character gallery, boosters, debugger)
- Server: Express/TypeScript API (media, chat, admin)
- Shared: Cross-cutting types and Supabase storage adapter
- Storage: Supabase database + object storage for media
- AI: Mistral API preferred, fallbacks to local (Ollama, LM Studio)

## Directory Tree (key paths)
- client/
  - src/components/CharacterGallery.tsx
  - src/plugins/core/ImageManager.tsx
  - src/plugins/core/FileManagerCore.tsx
  - src/plugins/gameplay/Boosters.tsx
  - src/plugins/gameplay/BoostersDB.tsx
  - src/debugger/READMEdebugger.md
- server/
  - api/media/upload.ts
  - routes/chatRoutes.ts
  - routes/adminRoutes.ts
- shared/
  - schema.ts
  - SupabaseStorage.ts
- README.md (merged)
- STRUCTURE.md (authoritative)

## Backend Routes and Flow
- GET /api/media – list media
- GET /api/media/character/:characterId – list media by character
- POST /api/media/upload – FormData(files[], config JSON)
- PUT /api/media/:id – update media metadata (camelCase)
- DELETE /api/media/:id – delete media
- GET /api/characters – list characters
- POST /api/player/:userId/select-character – select characterId
- POST /api/mistral/chat – AI chat with optional image

## Frontend Modules
- ImageManager.tsx – upload/edit media; fields: isNsfw, isVip, isEvent, isWheelReward, enabledForChat, randomSendChance, characterId
- FileManagerCore.tsx – browse/edit media; folder naming: Character_<name>, Mood_<mood>, VIP/NSFW/Event
- CharacterGallery.tsx – display character media using characterId, filePath/fileName
- Boosters.tsx + BoostersDB.tsx – boosters with baseCost, hourlyBonus, tapBonus, maxLevel, requiredLevel

## Shared Types and Naming Rules
Always use camelCase in code and API payloads:
- characterId, filePath, fileName, fileType
- isNsfw, isVip, isEvent, isWheelReward
- enabledForChat, randomSendChance
- Boosters: baseCost, hourlyBonus, tapBonus, maxLevel, requiredLevel
SupabaseStorage.ts handles mapping, keep payloads camelCase.

## Environment & Storage
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- MISTRAL_MODEL_API_KEY (or MISTRAL_API_KEY)
- Optional locals: Ollama http://localhost:11434, LM Studio http://localhost:1234
- Media foldering: <characterName>/<sfw|nsfw>/<imageType>

## Conventions Checklist
- Use characterId, not characterid
- Use filePath/fileName/fileType consistently
- Media/boosters use the listed camelCase names
- When unsure, align to shared/schema.ts and SupabaseStorage.ts
