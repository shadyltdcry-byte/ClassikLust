/**
 * DebuggerModule.ts - Base interface for all Debugger checker modules
 * Last Edited: 2025-10-29 by Assistant - Created unified interface for all checkers
 *
 * 🎣 BASE INTERFACE: All checker modules inherit from this
 * 🔍 STANDARDIZED: Consistent error reporting and fix suggestions
 * 🛠️ AUTO-FIXES: Structured repair actions with validation
 */

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type FixType = 'sql' | 'code_patch' | 'find_replace' | 'code_snippet' | 'note' | 'migration' | 'validation';

export interface FixSuggestion {
  type: string;
  severity: SeverityLevel;
  title: string;
  description: string;
  suggestedFix?: {
    type: FixType;
    content: string;
    fileName?: string;
    lineNumber?: number;
  };
  quickAction?: {
    label: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  };
  codeFrame?: {
    fileName: string;
    startLine: number;
    endLine: number;
    code: string;
    highlight?: number;
  };
  context?: Record<string, any>;
}

export interface DiagnosisResult {
  diagnosed?: boolean;
  passed: boolean;
  issues: FixSuggestion[];
  summary: string;
  checkerName: string;
  timestamp?: Date;
  error?: {
    type: string;
    severity: SeverityLevel;
    title: string;
    description: string;
    context?: Record<string, any>;
  };
  fixes?: FixSuggestion[];
}

export interface AutoFixResult {
  success: boolean;
  message: string;
  appliedFixes?: string[];
  remainingIssues?: FixSuggestion[];
}

export abstract class DebuggerModule {
  abstract getName(): string;
  abstract getDescription(): string;
  abstract diagnose(): Promise<DiagnosisResult>;
  
  // Optional: Check if this module can handle a specific error
  async checkErrorPattern(error: any): Promise<DiagnosisResult | null> {
    return null;
  }
  
  // Optional: Auto-fix capabilities
  async applyAutoFix(fixType: string, context: any): Promise<AutoFixResult> {
    return {
      success: false,
      message: `Auto-fix not implemented for ${fixType}`
    };
  }
  
  // Optional: Continuous monitoring
  async startMonitoring(): Promise<void> {
    // Default: no monitoring
  }
  
  async stopMonitoring(): Promise<void> {
    // Default: no monitoring
  }
  
  // Helper: Create a standardized fix suggestion
  protected createFixSuggestion(params: {
    type: string;
    severity: SeverityLevel;
    title: string;
    description: string;
    fixType?: FixType;
    fixContent?: string;
    quickAction?: FixSuggestion['quickAction'];
    context?: Record<string, any>;
  }): FixSuggestion {
    const fix: FixSuggestion = {
      type: params.type,
      severity: params.severity,
      title: params.title,
      description: params.description
    };
    
    if (params.fixType && params.fixContent) {
      fix.suggestedFix = {
        type: params.fixType,
        content: params.fixContent
      };
    }
    
    if (params.quickAction) {
      fix.quickAction = params.quickAction;
    }
    
    if (params.context) {
      fix.context = params.context;
    }
    
    return fix;
  }
  
  // Helper: Log diagnostic results
  protected logDiagnosis(result: DiagnosisResult): void {
    const timestamp = new Date().toISOString();
    const status = result.passed ? '✅ PASSED' : `❌ FAILED (${result.issues.length} issues)`;
    
    console.log(`\n🔍 [${this.getName().toUpperCase()}] ${status} - ${timestamp}`);
    console.log(`   ${result.summary}`);
    
    if (result.issues.length > 0) {
      console.log('   Issues found:');
      result.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
        console.log(`      ${issue.description}`);
        if (issue.suggestedFix) {
          console.log(`      Fix: ${issue.suggestedFix.type} - ${issue.suggestedFix.content.substring(0, 100)}...`);
        }
      });
    }
  }
  
  // Helper: Create error fingerprint for learning system
  protected createErrorFingerprint(error: any): string {
    const message = error.message || String(error);
    const code = error.code || 'unknown';
    const stack = error.stack || '';
    
    // Create a hash-like fingerprint from error characteristics
    const fingerprint = `${code}:${message.substring(0, 50)}:${stack.split('\n')[0] || ''}`;
    return Buffer.from(fingerprint).toString('base64').substring(0, 16);
  }
}

// Export common constants
export const SEVERITY_LEVELS: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];
export const FIX_TYPES: FixType[] = ['sql', 'code_patch', 'find_replace', 'code_snippet', 'note', 'migration', 'validation'];

// Common error patterns that all modules can recognize
export const COMMON_ERROR_PATTERNS = {
  POSTGRES_COLUMN_NOT_FOUND: /column "?([^"\s]+)"? does not exist/,
  POSTGRES_TABLE_NOT_FOUND: /relation "?([^"\s]+)"? does not exist/,
  UUID_VALIDATION_ERROR: /invalid input syntax for type uuid/,
  FOREIGN_KEY_VIOLATION: /violates foreign key constraint/,
  NOT_NULL_VIOLATION: /violates not-null constraint/,
  MISSING_ROUTE_ERROR: /Cannot\s+(GET|POST|PUT|DELETE)\s+(.+)/,
  IMPORT_ERROR: /Cannot find module[\s\S]*?from\s*['"]([^'"]+)['"]/,
  TYPE_ERROR: /Property[\s\S]*?does not exist on type/
};
