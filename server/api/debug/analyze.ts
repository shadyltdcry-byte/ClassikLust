/**
 * /api/debug/analyze.ts - AI-Powered Debugging Analysis
 * Uses Perplexity API and Mistral API for intelligent error analysis
 * Integrated with your existing debugger system
 */

import { NextApiRequest, NextApiResponse } from 'next';

// AI Analysis Service
class AIDebugAnalyzer {
  private perplexityKey: string | undefined;
  private mistralKey: string | undefined;
  
  constructor() {
    this.perplexityKey = process.env.PERPLEXITY_API_KEY;
    this.mistralKey = process.env.MISTRAL_DEBUG_API_KEY;
    
    console.log('🤖 [AI-DEBUG] Initializing with available APIs:', {
      perplexity: !!this.perplexityKey,
      mistral: !!this.mistralKey
    });
  }
  
  async analyzeErrors(errors: any[], gameContext: any = {}) {
    console.log('🤖 [AI-DEBUG] Starting error analysis...');
    console.log('🤖 [AI-DEBUG] Error count:', errors.length);
    
    const errorSummary = this.summarizeErrors(errors);
    
    // Try Perplexity first, then Mistral, then fallback
    const analysisResult = await this.tryAIAnalysis(errorSummary, gameContext);
    
    return {
      totalErrors: errors.length,
      errorCategories: this.categorizeErrors(errors),
      summary: errorSummary,
      aiAnalysis: analysisResult,
      recommendations: this.generateRecommendations(errors),
      timestamp: new Date().toISOString()
    };
  }
  
  private summarizeErrors(errors: any[]) {
    const categories = {};
    const recent = errors.filter(e => {
      const errorTime = new Date(e.timestamp || Date.now());
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return errorTime > fiveMinutesAgo;
    });
    
    errors.forEach(error => {
      const type = this.classifyError(error.message || '');
      categories[type] = (categories[type] || 0) + 1;
    });
    
    return {
      totalErrors: errors.length,
      recentErrors: recent.length,
      categories,
      topIssues: Object.entries(categories)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
    };
  }
  
  private classifyError(message: string): string {
    const patterns = {
      'database': /database|supabase|sql|connection|constraint/i,
      'authentication': /auth|login|token|unauthorized|401/i,
      'file_upload': /upload|multer|filename|formdata/i,
      'api': /api|endpoint|route|404|500/i,
      'upgrade_system': /upgrade|purchase|effect|stats/i,
      'frontend': /react|component|render|jsx|tsx/i,
      'network': /network|fetch|cors|timeout/i
    };
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) return category;
    }
    
    return 'other';
  }
  
  private async tryAIAnalysis(errorSummary: any, gameContext: any) {
    const prompt = this.buildAnalysisPrompt(errorSummary, gameContext);
    
    // Try Perplexity first
    if (this.perplexityKey) {
      try {
        console.log('🤖 [AI-DEBUG] Trying Perplexity API...');
        return await this.callPerplexityAPI(prompt);
      } catch (error) {
        console.log('🤖 [AI-DEBUG] Perplexity failed, trying Mistral...', error.message);
      }
    }
    
    // Try Mistral as fallback
    if (this.mistralKey) {
      try {
        console.log('🤖 [AI-DEBUG] Trying Mistral API...');
        return await this.callMistralAPI(prompt);
      } catch (error) {
        console.log('🤖 [AI-DEBUG] Mistral failed, using local analysis...', error.message);
      }
    }
    
    // Local fallback analysis
    console.log('🤖 [AI-DEBUG] Using local analysis fallback');
    return this.localAnalysis(errorSummary);
  }
  
  private buildAnalysisPrompt(errorSummary: any, gameContext: any): string {
    return `Analyze these errors from a TypeScript/React game application:

ERROR SUMMARY:
${JSON.stringify(errorSummary, null, 2)}

GAME CONTEXT:
- Anime tap-based game for Telegram
- Uses: React, TypeScript, Supabase, PostgreSQL
- Features: Upgrade system, media uploads, character interactions
- Current issues: Upgrade effects not applying, media uploads failing, admin auth issues

Please provide:
1. Root cause analysis
2. Specific fix recommendations
3. Prevention strategies
4. Priority order for fixes

Focus on actionable technical solutions.`;
  }
  
  private async callPerplexityAPI(prompt: string) {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.perplexityKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 1000,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      provider: 'perplexity',
      analysis: data.choices?.[0]?.message?.content || 'No analysis provided',
      model: 'llama-3.1-sonar-small-128k-online'
    };
  }
  
  private async callMistralAPI(prompt: string) {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.mistralKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 1000,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      provider: 'mistral',
      analysis: data.choices?.[0]?.message?.content || 'No analysis provided',
      model: 'mistral-small-latest'
    };
  }
  
  private localAnalysis(errorSummary: any) {
    const topIssue = errorSummary.topIssues?.[0];
    const recommendations = [];
    
    if (topIssue) {
      const [category, count] = topIssue;
      
      switch (category) {
        case 'authentication':
          recommendations.push('Check NODE_ENV environment variable');
          recommendations.push('Verify admin bypass headers are being sent');
          recommendations.push('Check if requireAdmin function is correctly implemented');
          break;
          
        case 'file_upload':
          recommendations.push('Verify multer configuration uses correct property names');
          recommendations.push('Check FormData construction in frontend');
          recommendations.push('Ensure filename vs fileName consistency');
          break;
          
        case 'upgrade_system':
          recommendations.push('Verify applyUserUpgradeEffects is called after purchases');
          recommendations.push('Check if upgrade JSON files are being loaded correctly');
          recommendations.push('Run upgrade sync from JSON files');
          break;
          
        case 'database':
          recommendations.push('Check Supabase connection');
          recommendations.push('Verify database schema matches code expectations');
          recommendations.push('Run pending database migrations');
          break;
      }
    }
    
    return {
      provider: 'local',
      analysis: `Local analysis detected ${errorSummary.totalErrors} errors with primary category: ${topIssue?.[0] || 'unknown'}. Recent activity shows ${errorSummary.recentErrors} errors in the last 5 minutes.`,
      recommendations,
      model: 'local-pattern-matching'
    };
  }
  
  private categorizeErrors(errors: any[]) {
    const categories = {};
    errors.forEach(error => {
      const type = this.classifyError(error.message || '');
      categories[type] = (categories[type] || 0) + 1;
    });
    return categories;
  }
  
  private generateRecommendations(errors: any[]) {
    const recommendations = [];
    
    // Check for common patterns
    const hasAuthErrors = errors.some(e => /401|unauthorized|admin/i.test(e.message));
    const hasUploadErrors = errors.some(e => /filename|upload|multer/i.test(e.message));
    const hasUpgradeErrors = errors.some(e => /upgrade|purchase|effect/i.test(e.message));
    
    if (hasAuthErrors) {
      recommendations.push({
        priority: 'high',
        category: 'authentication',
        action: 'Set NODE_ENV=development environment variable',
        reason: 'Admin auth is blocking development access'
      });
    }
    
    if (hasUploadErrors) {
      recommendations.push({
        priority: 'high',
        category: 'file_upload',
        action: 'Check filename vs fileName property usage',
        reason: 'Media upload property name inconsistencies detected'
      });
    }
    
    if (hasUpgradeErrors) {
      recommendations.push({
        priority: 'critical',
        category: 'upgrade_system',
        action: 'Add applyUserUpgradeEffects call after purchases',
        reason: 'Upgrade effects not being applied to user stats'
      });
    }
    
    return recommendations;
  }
}

const aiAnalyzer = new AIDebugAnalyzer();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🤖 [AI-DEBUG] === AI DEBUGGING ANALYSIS REQUEST ===');
  console.log('🤖 [AI-DEBUG] Method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }
  
  try {
    // Get error data from request or use mock data for testing
    const errors = req.body?.errors || [
      {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'GET /api/admin/upgrade-definitions 401 - Admin access denied',
        module: 'admin'
      },
      {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'POST /api/media/upload 400 - fileName undefined',
        module: 'upload'
      },
      {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Upgrade effects not applying after purchase',
        module: 'upgrades'
      }
    ];
    
    const gameContext = {
      environment: process.env.NODE_ENV,
      hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
      hasMistralKey: !!process.env.MISTRAL_DEBUG_API_KEY,
      gameType: 'anime-tap-game',
      platform: 'telegram'
    };
    
    console.log('🤖 [AI-DEBUG] Analyzing errors with context:', {
      errorCount: errors.length,
      context: gameContext
    });
    
    const analysis = await aiAnalyzer.analyzeErrors(errors, gameContext);
    
    console.log('✅ [AI-DEBUG] Analysis complete:', {
      provider: analysis.aiAnalysis?.provider,
      recommendationCount: analysis.recommendations?.length || 0
    });
    
    res.status(200).json({
      success: true,
      ...analysis
    });
    
  } catch (error: any) {
    console.error('❌ [AI-DEBUG] Analysis error:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'AI analysis failed',
      details: error.message,
      fallbackRecommendations: [
        'Check server console logs for detailed error information',
        'Verify environment variables are set correctly',
        'Restart the development server',
        'Run database migrations if needed'
      ]
    });
  }
}