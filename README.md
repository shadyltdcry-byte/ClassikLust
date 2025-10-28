# ClassikLustAITap — Developer Guide

AI-driven, TypeScript-based anime tap interaction game with Telegram access, rich media management, and AI chat that can send images. This guide is designed so a new developer or AI can onboard fast without guesswork.

## Prerequisites
- Node.js 18+
- pnpm or npm
- Supabase project (URL + Service Role Key)
- Optional AI providers:
  - Mistral API key (MISTRAL_MODEL_API_KEY or MISTRAL_API_KEY)
  - Local: Ollama (http://localhost:11434), LM Studio (http://localhost:1234)

## Environment
Create .env (root or server):
- SUPABASE_URL=
- SUPABASE_SERVICE_ROLE_KEY=
- MISTRAL_MODEL_API_KEY=
- (Optional) MISTRAL_API_KEY=

## Install & Run
- pnpm install
- pnpm dev (or run client/server separately if configured)
- Client: http://localhost:5173 (default Vite port)
- Server/API: http://localhost:3000 (adjust to your server config)

## Core Concepts
- Media Uploading & Tagging (ImageManager, FileManagerCore)
  - Fields: characterId, isNsfw, isVip, isEvent, isWheelReward, enabledForChat, randomSendChance
  - Auto-foldering: <characterName>/<sfw|nsfw>/<imageType>
- Character Galleries (CharacterGallery)
  - GET /api/media/character/:characterId
  - Uses filePath or fallback /uploads/{fileName}
- AI Chat with Optional Image
  - POST /api/mistral/chat
  - If enabledForChat and randomSendChance hits, one image may attach
- Boosters System (Boosters + BoostersDB)
  - Fields: baseCost, hourlyBonus, tapBonus, maxLevel, requiredLevel

## API Quick Reference
- GET /api/media → MediaFile[]
- GET /api/media/character/:characterId → MediaFile[]
- POST /api/media/upload (FormData: files[], config JSON)
- PUT /api/media/:id → update media
- DELETE /api/media/:id → delete media
- GET /api/characters → Character[]
- POST /api/player/:userId/select-character → set current characterId
- POST /api/mistral/chat → chat completion with optional image

## Naming Rules (do not violate)
- characterId, filePath, fileName, fileType
- isNsfw, isVip, isEvent, isWheelReward
- enabledForChat, randomSendChance
- Boosters: baseCost, hourlyBonus, tapBonus, maxLevel, requiredLevel

## Common Tasks
- Upload media: open ImageManager → select files → set toggles → Upload
- Edit metadata: open FileManagerCore → select file → Edit → Save
- View gallery: open CharacterGallery → pick character → slideshow
- Test AI: /api/mistral/debug or in-app chat
- Add booster: Boosters → Create → fill camelCase fields

## Troubleshooting
- Image not showing: ensure absolute filePath or fallback /uploads/{fileName}
- Chat image never sends: enabledForChat=true and randomSendChance>0
- Update 400/422: payload must be camelCase and allowed fields
- Booster locked: user.level must be ≥ requiredLevel

## Where Things Live
- See STRUCTURE.md for exact directories, data flow, and conventions.
- Shared types: shared/schema.ts
- Storage adapter: shared/SupabaseStorage.ts
- Media routes: server/api/media + server/routes

## Contribute Safely
- Always use camelCase field names listed above.
- If unsure, grep schema.ts and SupabaseStorage.ts and mirror exactly.
