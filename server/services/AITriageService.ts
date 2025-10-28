/**
 * AITriageService.ts - AI-Powered Error Analysis & Debugging
 * Created: 2025-10-22
 * 
 * Multi-AI debugging service with Mistral primary, Perplexity backup
 */

interface DebugEvent {
  id: string;
  timestamp: string;
  severity: 'info' | 'moderate' | 'critical';
  source: 'server' | 'client';
  route?: string;
  method?: string;
  status?: number;
  code?: string;
  message: string;
  stack?: string;
  userId?: string;
  details: any;
}

interface AIAnalysis {
  summary: string;
  rootCause: string;
  confidence: number;
  suggestedFix: string;
  affectedFiles: string[];
  actionItems: string[];
}

class AITriageService {
  private static instance: AITriageService;
  private eventBuffer: DebugEvent[] = [];
  private readonly bufferSize = 500;
  private analysisCache = new Map<string, AIAnalysis>();
  private rateLimitWindow = new Map<string, number>();

  static getInstance(): AITriageService {
    if (!AITriageService.instance) {
      AITriageService.instance = new AITriageService();
    }
    return AITriageService.instance;
  }

  addEvent(event: Omit<DebugEvent, 'id' | 'timestamp'>): void {
    const debugEvent: DebugEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.eventBuffer.push(debugEvent);
    if (this.eventBuffer.length > this.bufferSize) {
      this.eventBuffer.shift();
    }

    // Auto-trigger AI analysis for moderate/critical events
    if (event.severity === 'moderate' || event.severity === 'critical') {
      this.scheduleAnalysis(debugEvent);
    }
  }

  private scheduleAnalysis(event: DebugEvent): void {
    const signature = this.getEventSignature(event);
    const now = Date.now();
    
    // Rate limiting: don't re-analyze same error pattern within 5 minutes
    if (this.rateLimitWindow.get(signature) && (now - this.rateLimitWindow.get(signature)!) < 300000) {
      return;
    }
    
    this.rateLimitWindow.set(signature, now);
    
    // Queue analysis (non-blocking)
    setTimeout(() => this.analyzeEvent(event), 1000);
  }

  private getEventSignature(event: DebugEvent): string {
    const routePart = event.route || 'unknown';
    const codePart = event.code || event.status || 'generic';
    const stackTop = event.stack?.split('\n')[0] || event.message;
    return `${routePart}:${codePart}:${stackTop.slice(0, 50)}`;
  }

  private async analyzeEvent(event: DebugEvent): Promise<void> {
    try {
      const signature = this.getEventSignature(event);
      
      // Check cache first
      if (this.analysisCache.has(signature)) {
        this.notifyLuna(event, this.analysisCache.get(signature)!);
        return;
      }

      // Prepare context for AI analysis
      const context = this.buildAnalysisContext(event);
      const analysis = await this.callAIProvider(context);
      
      if (analysis) {
        this.analysisCache.set(signature, analysis);
        this.notifyLuna(event, analysis);
      }
    } catch (error) {
      console.warn('[AITriage] Analysis failed:', error);
    }
  }

  private buildAnalysisContext(event: DebugEvent): string {
    const recentEvents = this.eventBuffer.slice(-10);
    const relatedEvents = recentEvents.filter(e => 
      e.route === event.route || 
      e.code === event.code ||
      (e.message && event.message && e.message.includes(event.message.split(' ')[0]))
    );

    return `
TYPESCRIPT TELEGRAM GAME DEBUG ANALYSIS REQUEST

Primary Event:
- Route: ${event.route || 'N/A'}
- Method: ${event.method || 'N/A'} 
- Status: ${event.status || 'N/A'}
- Code: ${event.code || 'N/A'}
- Message: ${event.message}
- Stack: ${event.stack?.slice(0, 200) || 'N/A'}
- User: ${event.userId || 'anonymous'}

Recent Related Events (${relatedEvents.length}):
${relatedEvents.map(e => `- ${e.route}: ${e.message}`).join('\n')}

Context: TypeScript Node.js game with Telegram integration, Express routes, Supabase database, React frontend, modular architecture.

Please provide:
1. Root cause hypothesis
2. Confidence level (1-10)
3. Specific fix suggestion
4. Affected files/routes
5. Action items checklist
`.trim();
  }

  private async callAIProvider(context: string): Promise<AIAnalysis | null> {
    // Try Mistral first (existing chat integration)
    try {
      const mistralResponse = await this.callMistral(context);
      if (mistralResponse) return mistralResponse;
    } catch (error) {
      console.warn('[AITriage] Mistral failed, trying Perplexity:', error);
    }

    // Fallback to Perplexity
    try {
      return await this.callPerplexity(context);
    } catch (error) {
      console.error('[AITriage] All AI providers failed:', error);
      return null;
    }
  }

  private async callMistral(context: string): Promise<AIAnalysis | null> {
    if (!process.env.MISTRAL_API_KEY) return null;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small',
        messages: [{ role: 'user', content: context }],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) throw new Error(`Mistral API: ${response.status}`);
    
    const data = await response.json();
    return this.parseAIResponse(data.choices[0]?.message?.content || '');
  }

  private async callPerplexity(context: string): Promise<AIAnalysis | null> {
    if (!process.env.PERPLEXITY_API_KEY) return null;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: context }],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) throw new Error(`Perplexity API: ${response.status}`);
    
    const data = await response.json();
    return this.parseAIResponse(data.choices[0]?.message?.content || '');
  }

  private parseAIResponse(content: string): AIAnalysis {
    // Simple parsing - could be enhanced with structured prompts
    const lines = content.split('\n').filter(l => l.trim());
    
    return {
      summary: lines.find(l => l.includes('Root cause') || l.includes('Summary'))?.replace(/^\d+\.?\s*/, '') || content.slice(0, 100),
      rootCause: lines.find(l => l.includes('cause') || l.includes('problem'))?.replace(/^\d+\.?\s*/, '') || 'Analysis pending',
      confidence: this.extractConfidence(content),
      suggestedFix: lines.find(l => l.includes('fix') || l.includes('solution'))?.replace(/^\d+\.?\s*/, '') || 'Check logs for details',
      affectedFiles: this.extractFiles(content),
      actionItems: lines.filter(l => l.includes('•') || l.includes('-')).slice(0, 3)
    };
  }

  private extractConfidence(text: string): number {
    const match = text.match(/confidence[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) : 7;
  }

  private extractFiles(text: string): string[] {
    const filePattern = /[\w\/]+\.(?:ts|tsx|js|json)/g;
    const matches = text.match(filePattern) || [];
    return [...new Set(matches)].slice(0, 3);
  }

  private async notifyLuna(event: DebugEvent, analysis: AIAnalysis): Promise<void> {
    try {
      // Send structured alert to Luna chat system
      const alertMessage = `🚨 **${event.severity.toUpperCase()} ALERT**\n\n` +
        `**Route:** ${event.route}\n` +
        `**Issue:** ${analysis.summary}\n` +
        `**Fix:** ${analysis.suggestedFix}\n` +
        `**Files:** ${analysis.affectedFiles.join(', ')}\n\n` +
        `*Confidence: ${analysis.confidence}/10*`;

      // Post to Luna's chat stream (integrate with existing chat system)
      await this.sendLunaAlert(alertMessage, event.severity);
      
      // Trigger chat badge notification
      this.triggerChatBadge(event.severity);
      
    } catch (error) {
      console.error('[AITriage] Luna notification failed:', error);
    }
  }

  private async sendLunaAlert(message: string, severity: string): Promise<void> {
    // Integration point with Luna chat system
    if (typeof window !== 'undefined' && (window as any).lunaChat) {
      (window as any).lunaChat.addSystemMessage(message, severity);
    }
    
    // Also log to debugger console for immediate visibility
    console.log(`[Luna Alert] ${message}`);
  }

  private triggerChatBadge(severity: string): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('luna-alert', { 
        detail: { severity, timestamp: Date.now() } 
      });
      window.dispatchEvent(event);
    }
  }

  // Public API methods
  getEvents(limit = 100): DebugEvent[] {
    return this.eventBuffer.slice(-limit);
  }

  getEventsByRoute(route: string): DebugEvent[] {
    return this.eventBuffer.filter(e => e.route === route);
  }

  clearEvents(): void {
    this.eventBuffer = [];
    this.analysisCache.clear();
  }

  async forceAnalyze(eventId: string): Promise<AIAnalysis | null> {
    const event = this.eventBuffer.find(e => e.id === eventId);
    if (!event) return null;
    
    const context = this.buildAnalysisContext(event);
    return this.callAIProvider(context);
  }
}

export default AITriageService;