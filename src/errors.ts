/**
 * Base error class for all Monime SDK errors.
 * All SDK-specific errors extend this class for consistent error handling.
 */
export class MonimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonimeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when the API returns an error response (4xx, 5xx).
 * Contains detailed information about the API error including status code,
 * reason, and any additional details from the response.
 */
export class MonimeApiError extends MonimeError {
  /**
   * Retry-After value in milliseconds (parsed from header for 429 responses)
   */
  public retryAfter?: number;

  constructor(
    message: string,
    public code: number,
    public reason: string,
    public details: unknown[],
    retryAfter?: number,
  ) {
    super(message);
    this.name = "MonimeApiError";
    Object.setPrototypeOf(this, new.target.prototype);
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
  }

  /**
   * Whether this error is retryable based on HTTP status code.
   * Retryable codes: 429 (rate limit), 500, 502, 503, 504 (server errors)
   */
  get isRetryable(): boolean {
    return (
      this.code === 429 ||
      this.code === 500 ||
      this.code === 502 ||
      this.code === 503 ||
      this.code === 504
    );
  }
}

/**
 * Error thrown when a request times out.
 * Contains the timeout value and the URL that timed out.
 */
export class MonimeTimeoutError extends MonimeError {
  constructor(
    public timeout: number,
    public url: string,
  ) {
    super(`Request to ${url} timed out after ${timeout}ms`);
    this.name = "MonimeTimeoutError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Represents a single validation issue with details about what failed.
 */
export type ValidationIssue = {
  /** Human-readable error message */
  message: string;
  /** Path to the field that failed validation (e.g., "amount.value", "lineItems.0.name") */
  field: string;
  /** The invalid value that was provided */
  value?: unknown;
};

/**
 * Error thrown when input validation fails.
 * Contains all validation issues found, allowing users to fix multiple errors at once.
 */
export class MonimeValidationError extends MonimeError {
  constructor(
    message: string,
    /** All validation issues found during validation */
    public issues: ValidationIssue[],
  ) {
    super(message);
    this.name = "MonimeValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when a network error occurs (connection refused, DNS failure, etc.).
 * These errors are generally retryable as they may be transient.
 */
export class MonimeNetworkError extends MonimeError {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "MonimeNetworkError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Network errors are generally retryable
   */
  get isRetryable(): boolean {
    return true;
  }
}
