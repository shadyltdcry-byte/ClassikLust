import type { Express, Request, Response } from 'express';
import AITriageService from '../services/AITriageService';
import { SupabaseStorage } from '../../shared/SupabaseStorage';

const aiTriage = AITriageService.getInstance();
const storage = SupabaseStorage.getInstance();

export function registerDebugRoutes(app: Express) {
  // Frontend error capture endpoint
  app.post('/api/debug/triage', async (req: Request, res: Response) => {
    try {
      aiTriage.addEvent(req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Triage capture failed:', error);
      res.status(500).json({ error: 'Failed to capture event' });
    }
  });

  // AI analysis endpoint for manual requests
  app.post('/api/debug/analyze', async (req: Request, res: Response) => {
    try {
      const events = aiTriage.getEvents(50);
      const recentErrors = events.filter(e => e.severity === 'critical' || e.severity === 'moderate');
      
      if (recentErrors.length === 0) {
        return res.json({
          summary: 'No recent errors to analyze. System appears healthy.',
          events: 0,
          recommendations: ['Continue monitoring', 'Run periodic health checks']
        });
      }

      // Group errors by route/pattern
      const errorGroups = new Map<string, any[]>();
      recentErrors.forEach(event => {
        const key = `${event.route || 'unknown'}:${event.code || event.status || 'generic'}`;
        if (!errorGroups.has(key)) errorGroups.set(key, []);
        errorGroups.get(key)!.push(event);
      });

      // Build AI analysis context
      const context = Array.from(errorGroups.entries())
        .map(([pattern, events]) => {
          const latest = events[0];
          return `Pattern: ${pattern} (${events.length} occurrences)\n` +
            `Route: ${latest.route}\n` +
            `Message: ${latest.message}\n` +
            `Stack: ${latest.stack?.split('\n')[0] || 'N/A'}`;
        }).join('\n\n');

      const analysisPrompt = `Analyze these TypeScript game server errors:\n\n${context}\n\nProvide:\n1. Root cause summary\n2. Priority fix recommendations\n3. Affected files/routes`;
      
      // Try to get AI analysis
      const analysis = await aiTriage.forceAnalyze(recentErrors[0].id);
      
      res.json({
        summary: analysis?.summary || 'Multiple error patterns detected',
        rootCause: analysis?.rootCause || 'Analysis in progress',
        recommendations: analysis?.actionItems || ['Check server logs', 'Verify database connectivity'],
        affectedRoutes: [...errorGroups.keys()],
        totalEvents: recentErrors.length,
        confidence: analysis?.confidence || 8
      });
      
    } catch (error: any) {
      res.status(500).json({
        error: 'Analysis failed',
        message: error.message,
        fallback: 'Check console logs for details'
      });
    }
  });

  // Get all debug events
  app.get('/api/debug/events', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const route = req.query.route as string;
    
    let events = aiTriage.getEvents(limit);
    if (route) {
      events = aiTriage.getEventsByRoute(route);
    }
    
    res.json(events);
  });

  // Clear debug events
  app.delete('/api/debug/events', (req: Request, res: Response) => {
    aiTriage.clearEvents();
    res.json({ success: true, message: 'Debug events cleared' });
  });

  // System health check with comprehensive status
  app.get('/api/debug/health', async (req: Request, res: Response) => {
    try {
      const health = {
        timestamp: new Date().toISOString(),
        server: 'online',
        database: 'checking...',
        ai: 'checking...'
      };

      // Test Supabase connection
      try {
        const { data } = await storage.supabase.from('users').select('count').limit(1);
        health.database = data ? 'connected' : 'warning';
      } catch (e) {
        health.database = 'error';
      }

      // Test AI providers
      try {
        const mistralOK = !!process.env.MISTRAL_API_KEY;
        const perplexityOK = !!process.env.PERPLEXITY_API_KEY;
        health.ai = mistralOK ? 'mistral-ready' : perplexityOK ? 'perplexity-ready' : 'no-keys';
      } catch (e) {
        health.ai = 'error';
      }

      res.json(health);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Available commands list
  app.get('/api/debug/commands', (req: Request, res: Response) => {
    const commands = [
      { name: 'status', description: 'System health check', params: [] },
      { name: 'ai-analyze', description: 'AI analysis of recent errors', params: [] },
      { name: 'clearCache', description: 'Clear React Query cache', params: [] },
      { name: 'reconnect', description: 'Reconnect services', params: [] },
      { name: 'logs', description: 'Show recent logs', params: ['count:10'] },
      { name: 'errors', description: 'Show recent errors', params: ['count:20'] },
      { name: 'events', description: 'Show events for route', params: ['route:/api/...'] },
      { name: 'tail', description: 'Follow live logs', params: [] },
      { name: 'export', description: 'Download log file', params: [] }
    ];
    
    res.json(commands);
  });
}