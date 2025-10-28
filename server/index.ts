/**
 * index.ts
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 *
 */


import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { LunaErrorMonitor, setupLunaErrorHandlers } from './services/LunaErrorMonitor.js';
import { registerRoutes } from "./routes";
import { WebSocketServer } from 'ws';
import { SupabaseStorage } from 'shared/SupabaseStorage';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
// Old adminAPI import removed - using React State Debugger instead
// Old debugger imports removed - using React State Debugger instead
import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';

// Initialize database connection only if DATABASE_URL is provided
let db: any = null;
const connectionString = process.env.DATABASE_URL;
if (connectionString) {
  try {
    const sql = postgres(connectionString);
    db = drizzle(sql);
    console.log('Database connection established');
  } catch (error) {
    console.warn('Database connection fail, running in mock mode:', error);
  }
} else {
  console.warn('DATABASE_URL not provided, running in mock mode');
}

export { db };

// Prevent duplicate initialization during hot-reload
let isInitialized = false;

function main() {
  if (isInitialized) {
    return; // Skip duplicate initialization
  }
  isInitialized = true;
  
  console.log("[Main] Server loaded and started successfully... ");
  if (db) {
    console.log("[SupabaseDB] Database connected and loaded successfully...");
  } else {
    console.log("Running in mock mode without database");
  }
  
  // Initialize storage
  console.log("[Storage] Initialized SupabaseDB local storage system... ");
}

main();

// In-memory token storage (replace with database later)
const telegramTokens = new Map<string, { 
  telegramId: string, 
  username: string, 
  expiresAt: Date, 
  used: boolean 
}>();

// Generate temporary auth token (6-12 chars alphanumeric)
function generateAuthToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 7) + 6; // 6-12 chars
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Store persistent token (no expiration)
function storeAuthToken(telegramId: string, username: string): string {
  const token = generateAuthToken();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year (essentially permanent)
  
  telegramTokens.set(token, {
    telegramId,
    username,
    expiresAt,
    used: false
  });
  
  console.log(`Generated persistent token ${token} for Telegram user ${telegramId} (${username})`);
  return token;
}

// Validate token
export function validateAuthToken(token: string, telegramId: string): boolean {
  const tokenData = telegramTokens.get(token);
  if (!tokenData) {
    console.log(`Token ${token} not found`);
    return false;
  }
  
  if (tokenData.used) {
    console.log(`Token ${token} already used`);
    return false;
  }
  
  if (new Date() > tokenData.expiresAt) {
    console.log(`Token ${token} expired`);
    telegramTokens.delete(token);
    return false;
  }
  
  if (tokenData.telegramId !== telegramId) {
    console.log(`Token ${token} telegramId mismatch`);
    return false;
  }
  
  // Mark as used
  tokenData.used = true;
  console.log(`Token ${token} validated successfully for ${telegramId}`);
  return true;
}

// Set global reference for routes to access
(global as any).validateAuthToken = validateAuthToken;
(global as any).lunaMonitorEnabled = false;

// Store recent successful authentications for frontend polling
(global as any).recentTelegramAuth = new Map<string, {
  user: any,
  token: string,
  timestamp: number
}>();

// Enable Luna Error Monitor for admin
const lunaMonitor = LunaErrorMonitor.getInstance();
lunaMonitor.enableForAdmin('telegram_5134006535');
setupLunaErrorHandlers();
console.log('🌙 Luna Error Monitor Enabled.');

// Send test notification after 10 seconds to confirm Luna is working
setTimeout(async () => {
  try {
    const { reportToLuna } = await import('./services/LunaErrorMonitor.js');
    reportToLuna('warning', 'System', 'Luna Error Monitor - Watching for any errors.');
  } catch (error) {
    console.log('Luna test notification failed, but that\'s okay - she\'s still monitoring errors');
  }
}, 10000);

// Initialize Telegram Bot with duplication prevention
const token = process.env.TELEGRAM_BOT_TOKEN;
let telegramBotInitialized = false;

if (token && !telegramBotInitialized) {
  telegramBotInitialized = true;
  console.log("[Telegram] Initializing Telegram bot...");
  try {
    const bot = new TelegramBot(token, { polling: true });

    bot.on('message', async (msg: any) => {
      const chatId = msg.chat.id;
      const messageText = msg.text;
      const telegramId = msg.from.id.toString();
      const username = msg.from.username;
      const timestamp = new Date().toISOString();

      // Only respond to /start or /login commands
      if (messageText !== '/start' && messageText !== '/login') {
        return;
      }

      try {
        console.log(`[${timestamp}] Telegram auth initiated for user: ${telegramId} (${username}) with command: ${messageText}`);
        
        // 1. Generate temporary authentication token
        const token = storeAuthToken(telegramId, username);
        console.log(`[${timestamp}] Generated token: ${token} for telegramId: ${telegramId}`);
        
        // 2. POST to game backend auth endpoint with token
        const authResponse = await fetch('http://localhost:5000/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegramId,
            username,
            token
          })
        });

        // 3. Wait for backend response and log it
        const responseData = await authResponse.json();
        console.log(`[${timestamp}] Backend response for ${telegramId}: ${authResponse.status} - ${JSON.stringify(responseData)}`);

        if (authResponse.ok) {
          // 4. Send success confirmation message with game link
          const gameUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}?telegramId=${telegramId}`;
          bot.sendMessage(chatId, `You're logged in! 🎮\n\nClick here to play: ${gameUrl}`);
          console.log(`[${timestamp}] Success message sent to ${telegramId} with game link: ${gameUrl}`);
        } else {
          // 5. Send failure message
          bot.sendMessage(chatId, 'Authentication failed. Please try again.');
          console.log(`[${timestamp}] Failure message sent to ${telegramId}`);
        }
      } catch (error) {
        console.error(`[${timestamp}] Bot auth error for ${telegramId}:`, error);
        bot.sendMessage(chatId, 'Service temporarily unavailable.');
      }
    });

    bot.on('error', (error: any) => {
      console.error('[Telegram] Bot error:', error);
    });

    console.log("[Telegram] Bot initialized successfully!");
  } catch (error) {
    console.error('[Telegram] Failed to initialize bot:', error);
  }
} else {
  console.warn('[Telegram] TELEGRAM_BOT_TOKEN not found, bot disabled');
}

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);


  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Express error:', err);
    res.status(status).json({ message });
  });

  // Handle unhandled promise rejections (Luna monitor handles these now)
  // process.on handlers are now in setupLunaErrorHandlers()

        
  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const PORT = process.env.PORT || 5000;
  
  // WebSocket server for real-time features - using different port to avoid conflicts
  let wss;
  try {
    wss = new WebSocketServer({ 
      port: 8082,
      host: '0.0.0.0'
    });

    wss.on('error', (error: any) => {
      console.error('WebSocket server error:', error.message);
    });
  } catch (error: any) {
    console.warn('WebSocket server failed to start:', error.message);
  }

  server.listen(
    {
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      console.log(`serving on port ${PORT}`);
    },
  );
})();

// Initialize storage for server operations
// Using shared storage from routes.ts - no duplicate instance needed