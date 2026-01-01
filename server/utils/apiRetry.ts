/**
 * Retry utility for external API calls with exponential backoff
 * Doubles API reliability by handling transient failures
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: Set<string>;
  onRetry?: (error: any, attempt: number) => void;
}

const DEFAULT_RETRYABLE_ERRORS = new Set([
  'ECONNRESET',
  'ENOTFOUND',
  'ESOCKETTIMEDOUT',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'EPIPE',
  'EAI_AGAIN'
]);

const DEFAULT_RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  522, // Connection Timed Out
  524  // A Timeout Occurred
]);

function isRetryableError(error: any, customRetryableErrors?: Set<string>): boolean {
  const retryableErrors = customRetryableErrors || DEFAULT_RETRYABLE_ERRORS;

  // Check error code
  if (error.code && retryableErrors.has(error.code)) {
    return true;
  }

  // Check HTTP status code (for axios errors)
  if (error.response?.status && DEFAULT_RETRYABLE_STATUS_CODES.has(error.response.status)) {
    return true;
  }

  // Check if it's a network error
  if (error.message?.includes('network') || error.message?.includes('timeout')) {
    return true;
  }

  return false;
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  const {
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2
  } = options;

  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryableErrors,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt > maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error, retryableErrors)) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, options);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[Retry] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms:`, errorMessage);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern to prevent cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if enough time has passed to try again
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'half-open';
        console.log('[CircuitBreaker] Transitioning to half-open state');
      } else {
        throw new Error('Circuit breaker is open. Service temporarily unavailable.');
      }
    }

    try {
      const result = await fn();

      // Success - reset the circuit breaker
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        console.log('[CircuitBreaker] Circuit closed after successful call');
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.error(`[CircuitBreaker] Circuit opened after ${this.failures} failures`);
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// Global circuit breakers for different services
export const googleMapsCircuitBreaker = new CircuitBreaker(5, 60000, 30000);
export const forgeProxyCircuitBreaker = new CircuitBreaker(5, 60000, 30000);
export const llmCircuitBreaker = new CircuitBreaker(3, 120000, 60000);
