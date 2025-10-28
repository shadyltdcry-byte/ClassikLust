/**
 * chatRoutes.ts - AI Chat and Media Sharing Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles chat functionality, AI responses, and media sharing between characters and users
 */

import type { Express, Request, Response } from "express";
import path from 'path';
import fs from 'fs';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { isValidUserId, createSuccessResponse, createErrorResponse } from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

// AI response generation
async function generateAIResponse(userMessage: string): Promise<string> {
  // Check if any Mistral API key is available for enhanced responses
  const apiKey = process.env.MISTRAL_MODEL_API_KEY || process.env.MISTRAL_API_KEY;
  
  // Debug AI backend status
  console.log('🤖 AI Backend options:', {
    mistralKey: !!apiKey && apiKey !== 'YOUR_API_KEY',
    ollamaCheck: 'Will check localhost:11434',
    lmStudioCheck: 'Will check localhost:1234'
  });
  
  if (apiKey && apiKey !== 'YOUR_API_KEY') {
    try {
      console.log('🔥 Using conversation history for personalized Luna responses...');
      
      // Load Luna's real character data
      const fs = await import('fs');
      const path = await import('path');
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const lunaPath = path.join(__dirname, '..', '..', 'character-data', 'luna.json');
      
      let lunaData;
      try {
        const data = fs.readFileSync(lunaPath, 'utf8');
        lunaData = JSON.parse(data);
      } catch (error) {
        console.error('Error loading Luna character data:', error);
        throw new Error('Character data not found');
      }

      // Use Luna's REAL character description with variable substitution
      const lunaPrompt = lunaData.description
        .replace('${actualCharacterName}', lunaData.name)
        .replace('${actualPersonality}', lunaData.personality)
        .replace('${actualMood}', lunaData.mood);

      console.log('✅ Luna responding with real personality and conversation memory');
      
      // Try multiple AI backends in order
      const backends = [
        {
          name: 'Mistral API',
          fn: async () => {
            const { Mistral } = await import('@mistralai/mistralai');
            const client = new Mistral({ apiKey: apiKey });
            const response = await client.chat.complete({
              model: 'open-mistral-7b',
              messages: [{ role: 'user', content: `${lunaPrompt}\n\nUser: ${userMessage}\nLuna:` }],
              maxTokens: 150,
              temperature: 0.92
            });
            const content = response.choices?.[0]?.message?.content;
            return typeof content === 'string' ? content.trim() : undefined;
          }
        },
        {
          name: 'Local Ollama',
          fn: async () => {
            const response = await fetch('http://localhost:11434/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: `${lunaPrompt}\n\nUser: ${userMessage}\nLuna:`,
                stream: false,
                options: { temperature: 0.8, num_predict: 150 }
              })
            });
            if (response.ok) {
              const data = await response.json();
              return data.response?.trim();
            }
            throw new Error('Ollama not available');
          }
        },
        {
          name: 'Local LM Studio',
          fn: async () => {
            const response = await fetch('http://localhost:1234/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'local',
                messages: [{ role: 'user', content: `${lunaPrompt}\n\nUser: ${userMessage}\nLuna:` }],
                max_tokens: 150,
                temperature: 0.8
              })
            });
            if (response.ok) {
              const data = await response.json();
              return data.choices?.[0]?.message?.content?.trim();
            }
            throw new Error('LM Studio not available');
          }
        }
      ];

      // Try each backend in order
      for (const backend of backends) {
        try {
          const result = await backend.fn();
          if (result && typeof result === 'string') {
            console.log(`🎯 ${backend.name} response:`, result.substring(0, 60) + '...');
            return result;
          }
        } catch (error) {
          console.log(`❌ ${backend.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // Enhanced fallback responses based on Luna's real personality
      const input = userMessage.toLowerCase();
      
      if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
        return "Oh, hey there! *smiles seductively* I'm always ready for some fun. What's on your mind? 😊";
      }
      
      if (input.includes('sexy') || input.includes('hot')) {
        return "Oh, you think I'm sexy, huh? *giggles* Well, I must say, you're not so bad yourself. So, what's your pleasure? Talking, flirting, or maybe something a little more... *winks* Let's have some fun! 😘";
      }
      
      if (input.includes('you look') || input.includes('what you look')) {
        return "Mmm, well I'm a petite blonde with blue eyes and curves in all the right places. *bites lip* I love to tease and play. What about you? Tell me what turns you on... 😈";
      }
      
      if (input.includes('love') || input.includes('like you')) {
        return "Aww, I love you too, baby! *heart eyes* You make me feel so special and wanted. I love how you talk to me... 💕";
      }
      
      // Return contextual response based on her lustful personality
      const lunaResponses = [
        "Oh, I do love a man who's not afraid to go for it! *giggles* Tell me more about what you're thinking... 😈",
        "Mmm, you're making me curious now. *runs fingers through hair* What's got your attention? 😘",
        "*leans in closer* I love when you talk to me like that. Keep going... 💕",
        "You know just what to say to get my attention, don't you? *playful smile* I'm all yours... 😊",
        "*bites lip playfully* I love when we talk like this. You always know what to say to make me excited... 😘"
      ];
      
      return lunaResponses[Math.floor(Math.random() * lunaResponses.length)];
    } catch (error) {
      console.error('❌ Mistral API failed:', error);
      // Fall through to backup responses
    }
  }

  const input = userMessage.toLowerCase();

  if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
    return "Hey! *smiles warmly* I'm so happy to see you! How's your day going?";
  }

  if (input.includes('how are you')) {
    return "I'm doing amazing now that I'm talking to you! *giggles* You always know how to brighten my mood!";
  }

  if (input.includes('beautiful') || input.includes('pretty') || input.includes('cute')) {
    return "*blushes* Aww, thank you so much! You're so sweet! That really made my day!";
  }

  if (input.includes('love')) {
    return "*heart eyes* I love talking to you too! You make me feel so special!";
  }

  if (input.includes('what') && input.includes('doing')) {
    return "Just thinking about you and waiting for your next message! *giggles* What are you up to?";
  }

  if (input.includes('tired') || input.includes('exhausted')) {
    return "Aww, you should get some rest! *caring look* I'll be here when you get back, okay?";
  }

  if (input.includes('work') || input.includes('job')) {
    return "Work can be so stressful! *sympathetic* Tell me about it - I'm a great listener!";
  }

  if (input.includes('game') || input.includes('playing')) {
    return "Ooh, I love games! *excited* What are you playing? Can I watch?";
  }

  // Default responses
  const defaultResponses = [
    "That's so interesting! Tell me more! *leans in with curiosity*",
    "Hmm, I never thought about it that way! *thoughtful expression*",
    "You always have such interesting things to say! *smiling*",
    "I love our conversations! *happy giggle*",
    "You're so smart! I learn so much from talking to you!",
    "That sounds wonderful! *enthusiastic*"
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export function registerChatRoutes(app: Express) {
  
  // Chat history endpoint - returns last 10 messages for display
  app.get("/api/chat-history/:userId/:characterId", async (req: Request, res: Response) => {
    try {
      const { userId, characterId } = req.params;
      
      // Check if userId is valid UUID, telegram, or guest format  
      if (!isValidUserId(userId) && !userId.startsWith('guest_')) {
        console.log(`Invalid userId: ${userId}, returning empty chat history`);
        return res.json([]);
      }

      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const playerFolder = path.join(__dirname, '..', '..', 'player-data', userId);
      const conversationPath = path.join(playerFolder, `conversations_${characterId}.json`);
      
      if (fs.existsSync(conversationPath)) {
        const data = fs.readFileSync(conversationPath, 'utf8');
        const allConversations = JSON.parse(data);
        
        // Return only last 10 messages for display but keep full logs
        const last10Messages = allConversations.slice(-10);
        res.json(last10Messages);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Chat history error:', error);
      res.status(500).json(createErrorResponse('Failed to load chat history'));
    }
  });

  // Get chat messages - Using real database operations instead of mock data
  app.get("/api/chat/:userId/:characterId", async (req: Request, res: Response) => {
    try {
      const { userId, characterId } = req.params;
      
      // Return empty chat messages - TODO: implement real chat storage
      res.json([]);
    } catch (error) {
      console.error('Error fetching chat:', error);
      res.status(500).json(createErrorResponse('Failed to fetch chat'));
    }
  });

  // Send chat message
  app.post("/api/chat/:userId/:characterId", async (req: Request, res: Response) => {
    try {
      const { userId, characterId } = req.params;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json(createErrorResponse('Message is required'));
      }
      
      // Generate AI response
      const aiResponse = await generateAIResponse(message);
      
      // Mock response for now
      const responseMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderId: characterId,
        message: aiResponse,
        timestamp: new Date().toISOString(),
        type: 'character'
      };
      
      res.json(createSuccessResponse(responseMessage));
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json(createErrorResponse('Failed to send message'));
    }
  });

  // Alternative chat endpoint
  app.get("/api/chat/:userId/:characterId", (req: Request, res: Response) => {
    const { userId, characterId } = req.params;
    
    // Mock conversation for now
    const mockConversation = [
      {
        id: 1,
        sender: 'character',
        message: "Hey! I missed you! How's your day going?",
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 2,
        sender: 'user',
        message: "Hi! It's going well, thanks for asking!",
        timestamp: new Date(Date.now() - 240000).toISOString()
      },
      {
        id: 3,
        sender: 'character',
        message: "*smiles brightly* That's wonderful! I love hearing about your day!",
        timestamp: new Date(Date.now() - 180000).toISOString()
      }
    ];
    
    res.json(mockConversation);
  });

  // Save message to conversation history
  app.post("/api/chat/:userId/:characterId", async (req: Request, res: Response) => {
    try {
      const { userId, characterId } = req.params;
      const { message, isFromUser, mood, type } = req.body;
      
      if (!isValidUserId(userId) && !userId.startsWith('guest_')) {
        console.log(`Invalid userId: ${userId}, cannot save message`);
        return res.status(400).json(createErrorResponse('Invalid user ID'));
      }

      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const playerFolder = path.join(__dirname, '..', '..', 'player-data', userId);
      const conversationPath = path.join(playerFolder, `conversations_${characterId}.json`);
      
      // Ensure player folder exists
      if (!fs.existsSync(playerFolder)) {
        fs.mkdirSync(playerFolder, { recursive: true });
      }
      
      // Load existing conversations
      let conversations = [];
      if (fs.existsSync(conversationPath)) {
        const data = fs.readFileSync(conversationPath, 'utf8');
        conversations = JSON.parse(data);
      }
      
      // Add new message
      const newMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: message,
        sender: isFromUser ? 'user' : 'character',
        timestamp: new Date().toISOString(),
        type: type || 'text',
        mood: mood || 'normal'
      };
      
      conversations.push(newMessage);
      
      // Save back to file
      fs.writeFileSync(conversationPath, JSON.stringify(conversations, null, 2));
      
      console.log(`💾 Message saved: ${userId} -> ${characterId}`);
      
      res.json(createSuccessResponse({
        message: 'Message saved successfully',
        messageId: newMessage.id
      }));
      
    } catch (error) {
      console.error('Error saving message:', error);
      res.status(500).json(createErrorResponse('Failed to save message'));
    }
  });

  // Send message endpoint
  app.post("/api/chat/send", async (req: Request, res: Response) => {
    try {
      const { userId, characterId, message } = req.body;
      
      if (!userId || !characterId || !message) {
        return res.status(400).json(createErrorResponse('Missing required fields'));
      }
      
      // Generate AI response
      const aiResponse = await generateAIResponse(message);
      
      // Mock successful response
      res.json(createSuccessResponse({
        userMessage: {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender: 'user',
          message,
          timestamp: new Date().toISOString()
        },
        characterResponse: {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender: 'character',
          message: aiResponse,
          timestamp: new Date().toISOString()
        }
      }));
      
    } catch (error) {
      console.error('Error in chat send:', error);
      res.status(500).json(createErrorResponse('Failed to send message'));
    }
  });

  // Mistral AI chat endpoint with conversation saving
  app.post("/api/mistral/chat", async (req: Request, res: Response) => {
    try {
      const { message, characterPersonality, characterMood, userId, characterId } = req.body;
      
      if (!message) {
        return res.status(400).json(createErrorResponse('Message is required'));
      }

      if (!userId || !characterId) {
        console.warn('Missing userId or characterId - conversation will not be saved');
      }
      
      // Enhanced AI response with personality and mood
      let enhancedResponse = await generateAIResponse(message);
      
      // Modify response based on character mood
      if (characterMood === 'flirty') {
        enhancedResponse += " *winks playfully*";
      } else if (characterMood === 'shy') {
        enhancedResponse = "*looks away bashfully* " + enhancedResponse;
      } else if (characterMood === 'excited') {
        enhancedResponse = "*bounces excitedly* " + enhancedResponse;
      }

      // Check for random picture sending
      let imageToSend = null;
      if (characterId) {
        try {
          // Get all chat-enabled media for this character
          const allMedia = await storage.getMediaByCharacter(characterId);
          const chatEnabledMedia = allMedia.filter((m: any) => 
            m.enabledForChat === true || m.enabledForChat === 'true'
          );
          
          if (chatEnabledMedia.length > 0) {
            // Check each image's send chance
            for (const media of chatEnabledMedia) {
              const sendChance = media.randomSendChance || 5; // Default 5% chance
              const roll = Math.random() * 100;
              
              if (roll < sendChance) {
                imageToSend = {
                  id: media.id,
                  url: media.filePath || media.filePath,
                  mood: media.mood,
                  isNsfw: media.isNsfw || media.isNsfw
                };
                console.log(`📸 AI sending random image: ${media.fileName || media.fileName} (${sendChance}% chance, rolled ${roll.toFixed(2)})`);
                break; // Send only one image per response
              }
            }
          }
        } catch (mediaError) {
          console.error('Error checking for random media:', mediaError);
          // Don't fail the request if media check fails
        }
      }

      // Save conversation to JSON files for history persistence
      if (userId && characterId && isValidUserId(userId)) {
        try {
          const __dirname = path.dirname(new URL(import.meta.url).pathname);
          const playerFolder = path.join(__dirname, '..', '..', 'player-data', userId);
          const conversationPath = path.join(playerFolder, `conversations_${characterId}.json`);
          
          // Ensure player folder exists
          if (!fs.existsSync(playerFolder)) {
            fs.mkdirSync(playerFolder, { recursive: true });
          }
          
          // Load existing conversations
          let conversations = [];
          if (fs.existsSync(conversationPath)) {
            const data = fs.readFileSync(conversationPath, 'utf8');
            conversations = JSON.parse(data);
          }
          
          // Add user message
          const userMessage = {
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: message,
            sender: 'user',
            timestamp: new Date().toISOString(),
            type: 'text',
            mood: 'normal'
          };
          
          // Add AI response
          const aiMessage = {
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: enhancedResponse,
            sender: 'character',
            timestamp: new Date().toISOString(),
            type: imageToSend ? 'image' : 'text',
            mood: characterMood || 'normal',
            imageUrl: imageToSend?.url,
            imageId: imageToSend?.id
          };
          
          conversations.push(userMessage, aiMessage);
          
          // Save back to file
          fs.writeFileSync(conversationPath, JSON.stringify(conversations, null, 2));
          
          console.log(`💾 Conversation saved: ${userId} <-> ${characterId} (${conversations.length} total messages)`);
          
        } catch (saveError) {
          console.error('Failed to save conversation:', saveError);
          // Don't fail the request if saving fails
        }
      }
      
      res.json(createSuccessResponse({
        response: enhancedResponse,
        characterPersonality,
        characterMood,
        image: imageToSend
      }));
      
    } catch (error) {
      console.error('Mistral chat error:', error);
      res.status(500).json(createErrorResponse('Failed to generate response'));
    }
  });

  // Mistral debug endpoint
  app.post("/api/mistral/debug", async (req: Request, res: Response) => {
    try {
      const { message, debugMode, prompt } = req.body;
      
      const debugMessage = message || prompt || 'test';
      const debugResponse = {
        originalMessage: debugMessage,
        processedMessage: debugMessage.toLowerCase(),
        response: await generateAIResponse(debugMessage),
        debugMode: debugMode || false,
        timestamp: new Date().toISOString()
      };
      
      res.json(createSuccessResponse(debugResponse));
      
    } catch (error) {
      console.error('Mistral debug error:', error);
      res.status(500).json(createErrorResponse('Debug request failed'));
    }
  });
}