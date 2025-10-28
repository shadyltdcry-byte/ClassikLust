/**
 * errorTriage.ts - Global Error Capture & AI Analysis Middleware
 * Created: 2025-10-22
 * 
 * Captures all Express errors and forwards to AI triage service
 */

import type { Request, Response, NextFunction } from 'express';
import AITriageService from '../services/AITriageService';

const aiTriage = AITriageService.getInstance();

// Global error handler middleware
export const errorTriageMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Determine severity based on error type and status
  let severity: 'info' | 'moderate' | 'critical' = 'moderate';
  
  if (err.status >= 500 || !err.status) {
    severity = 'critical';
  } else if (err.status >= 400) {
    severity = 'moderate';
  }

  // Special patterns for critical classification
  if (err.message?.includes('PGRST') || 
      err.message?.includes('schema') ||
      err.message?.includes('not defined') ||
      err.code === 'ECONNREFUSED') {
    severity = 'critical';
  }

  // Sanitize request body (remove sensitive data)
  const sanitizedBody = { ...req.body };
  delete sanitizedBody.password;
  delete sanitizedBody.token;
  delete sanitizedBody.apiKey;

  // Add to AI triage queue
  aiTriage.addEvent({
    severity,
    source: 'server',
    route: req.route?.path || req.path,
    method: req.method,
    status: err.status || 500,
    code: err.code,
    message: err.message || 'Unknown server error',
    stack: err.stack,
    userId: req.body?.userId || req.query?.userId || req.headers['x-user-id'],
    details: {
      url: req.url,
      params: req.params,
      query: req.query,
      body: sanitizedBody,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      }
    }
  });

  // Continue with normal error handling
  if (res.headersSent) {
    return next(err);
  }

  // Send structured error response
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  });
};

// Request logging middleware (captures successful requests too)
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    
    if (isError) {
      aiTriage.addEvent({
        severity: res.statusCode >= 500 ? 'critical' : 'moderate',
        source: 'server',
        route: req.route?.path || req.path,
        method: req.method,
        status: res.statusCode,
        message: `HTTP ${res.statusCode} - ${req.path}`,
        details: {
          duration,
          url: req.url,
          userAgent: req.headers['user-agent']
        }
      });
    }
  });
  
  next();
};

// Export triage service for route-specific error capture
export { AITriageService };
export const captureError = (route: string, method: string, error: any, context?: any) => {
  aiTriage.addEvent({
    severity: 'moderate',
    source: 'server',
    route,
    method,
    message: error.message || 'Route error',
    stack: error.stack,
    details: context
  });
};