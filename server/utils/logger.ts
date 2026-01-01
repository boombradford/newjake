/**
 * Environment-based logging utility
 * Reduces logging overhead in production while maintaining visibility in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: number;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    // In production, only log warnings and errors by default
    // In development, log everything
    const defaultLevel = this.isProduction ? 'warn' : 'debug';
    const configuredLevel = (process.env.LOG_LEVEL as LogLevel) || defaultLevel;
    this.minLevel = LOG_LEVELS[configuredLevel] ?? LOG_LEVELS.info;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return args.length > 0 ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  // Performance logging helper
  async measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.shouldLog('debug')) {
      return fn();
    }

    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.debug(`${label} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  // Sync version for non-async operations
  measure<T>(
    label: string,
    fn: () => T
  ): T {
    if (!this.shouldLog('debug')) {
      return fn();
    }

    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.debug(`${label} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper to create namespaced loggers
export function createLogger(namespace: string) {
  return {
    debug: (message: string, ...args: any[]) =>
      logger.debug(`[${namespace}] ${message}`, ...args),
    info: (message: string, ...args: any[]) =>
      logger.info(`[${namespace}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) =>
      logger.warn(`[${namespace}] ${message}`, ...args),
    error: (message: string, ...args: any[]) =>
      logger.error(`[${namespace}] ${message}`, ...args),
    measureAsync: <T>(label: string, fn: () => Promise<T>) =>
      logger.measureAsync(`[${namespace}] ${label}`, fn),
    measure: <T>(label: string, fn: () => T) =>
      logger.measure(`[${namespace}] ${label}`, fn),
  };
}
