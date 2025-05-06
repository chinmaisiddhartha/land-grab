import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log file paths
const accessLogPath = path.join(logsDir, 'access.log');
const errorLogPath = path.join(logsDir, 'error.log');

// Log levels
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

// Logger function
function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message} ${meta ? JSON.stringify(meta) : ''}`;
  
  console.log(logEntry);
  
  // Also write to file
  const logFile = level === LogLevel.ERROR ? errorLogPath : accessLogPath;
  fs.appendFileSync(logFile, logEntry + '\n');
}

// Express middleware
export function apiLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Log request
  log(LogLevel.INFO, `${req.method} ${req.url}`, { 
    ip: req.ip,
    query: req.query,
    params: req.params
  });
  
  // Capture the original end method
  const originalEnd = res.end;
  
  // Override the end method
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    // Calculate request duration
    const duration = Date.now() - start;
    
    // Log response
    log(LogLevel.INFO, `${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    
    // Call the original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}

// Export log functions for use elsewhere
export const logger = {
  info: (message: string, meta?: any) => log(LogLevel.INFO, message, meta),
  warn: (message: string, meta?: any) => log(LogLevel.WARN, message, meta),
  error: (message: string, meta?: any) => log(LogLevel.ERROR, message, meta),
  debug: (message: string, meta?: any) => log(LogLevel.DEBUG, message, meta)
};
