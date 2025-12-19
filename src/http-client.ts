import {
  MonimeApiError,
  MonimeNetworkError,
  MonimeTimeoutError,
  MonimeValidationError,
} from "./errors";
import type { ClientOptions, RequestConfig } from "./types";
import { ClientOptionsSchema, validate } from "./validation";

/** API version prefix for all endpoints */
const API_VERSION = "v1";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  method: HttpMethod;
  path: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined> | undefined;
  config?: RequestConfig | undefined;
};

type ApiErrorResponse = {
  success: false;
  messages: string[];
  error: {
    code: number;
    reason: string;
    message: string;
    details: unknown[];
  };
};

// Default configuration values
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1 second
const DEFAULT_RETRY_BACKOFF = 2;
const DEFAULT_BASE_URL = "https://api.monime.io";

/**
 * Internal HTTP client for making requests to the Monime API.
 * Handles authentication, retries, timeouts, and error handling.
 */
export class MonimeHttpClient {
  private base_url: string;
  private space_id: string;
  private access_token: string;
  private timeout: number;
  private retries: number;
  private retry_delay: number;
  private retry_backoff: number;
  private validate_inputs: boolean;

  constructor(options: ClientOptions) {
    // Validate HTTPS requirement for custom base URLs
    if (
      options.baseUrl !== undefined &&
      !options.baseUrl.startsWith("https://")
    ) {
      throw new MonimeValidationError("baseUrl must use HTTPS for security", [
        {
          message: "baseUrl must use HTTPS for security",
          field: "baseUrl",
          value: options.baseUrl,
        },
      ]);
    }

    // Validate options if enabled (default: true)
    if (options.validateInputs !== false) {
      validate(ClientOptionsSchema, options);
    }

    this.base_url = options.baseUrl ?? DEFAULT_BASE_URL;
    this.space_id = options.spaceId;
    this.access_token = options.accessToken;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.retries = options.retries ?? DEFAULT_RETRIES;
    this.retry_delay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
    this.retry_backoff = options.retryBackoff ?? DEFAULT_RETRY_BACKOFF;
    this.validate_inputs = options.validateInputs ?? true;
  }

  /**
   * Whether input validation is enabled
   */
  get should_validate(): boolean {
    return this.validate_inputs;
  }

  /**
   * Makes an HTTP request to the Monime API.
   * @param options - Request options including method, path, body, and config
   * @returns The parsed JSON response
   * @throws {MonimeApiError} When the API returns an error response
   * @throws {MonimeTimeoutError} When the request times out
   * @throws {MonimeNetworkError} When a network error occurs
   * @throws {MonimeValidationError} When input validation fails
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, body, params, config } = options;

    // Merge config with defaults (per-request overrides client defaults)
    const timeout = config?.timeout ?? this.timeout;
    const max_retries = config?.retries ?? this.retries;
    const external_signal = config?.signal;
    const idempotency_key = config?.idempotencyKey;

    // Build URL with query params
    const url = this.build_url(path, params);

    // Build headers
    const headers = this.build_headers(method, body, idempotency_key);

    // Build fetch options
    const fetch_options: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      fetch_options.body = JSON.stringify(body);
    }

    // Execute request with retry logic
    return this.execute_with_retry<T>(
      url,
      fetch_options,
      timeout,
      max_retries,
      external_signal,
    );
  }

  private build_url(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    let url = `${this.base_url}/${API_VERSION}${path}`;

    if (params) {
      const search_params = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          search_params.set(key, String(value));
        }
      }
      const query_string = search_params.toString();
      if (query_string) {
        url += `?${query_string}`;
      }
    }

    return url;
  }

  private build_headers(
    method: HttpMethod,
    body?: unknown,
    idempotency_key?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "Monime-Space-Id": this.space_id,
      Authorization: `Bearer ${this.access_token}`,
    };

    // Only set Content-Type for requests with body
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    // Set idempotency key for POST requests
    if (method === "POST") {
      headers["Idempotency-Key"] = idempotency_key ?? crypto.randomUUID();
    }

    return headers;
  }

  private async execute_with_retry<T>(
    url: string,
    fetch_options: RequestInit,
    timeout: number,
    max_retries: number,
    external_signal?: AbortSignal,
  ): Promise<T> {
    let last_error: Error | undefined;

    // Total attempts = 1 initial + max_retries
    const total_attempts = 1 + max_retries;

    for (
      let attempt_number = 1;
      attempt_number <= total_attempts;
      attempt_number++
    ) {
      try {
        return await this.execute_request<T>(
          url,
          fetch_options,
          timeout,
          external_signal,
        );
      } catch (error) {
        last_error = error as Error;

        // Don't retry if aborted by user
        if (last_error.name === "AbortError" && external_signal?.aborted) {
          throw last_error;
        }

        // Don't retry timeout errors (they already took long enough)
        if (last_error instanceof MonimeTimeoutError) {
          throw last_error;
        }

        // Check if error is retryable
        const is_retryable = this.is_retryable_error(last_error);
        const is_last_attempt = attempt_number === total_attempts;

        if (!is_retryable || is_last_attempt) {
          throw last_error;
        }

        // Calculate delay for next attempt
        // attempt_number=1 failed, so this will be retry #1 (index 0 for backoff calculation)
        const retry_index = attempt_number - 1;
        const delay = this.calculate_retry_delay(retry_index, last_error);
        await this.sleep(delay);

        // Continue to next attempt
      }
    }

    // Should never reach here, but TypeScript needs this
    throw last_error ?? new Error("Unknown error during retry");
  }

  private async execute_request<T>(
    url: string,
    fetch_options: RequestInit,
    timeout: number,
    external_signal?: AbortSignal,
  ): Promise<T> {
    // Build abort signal: combine timeout signal with external signal if provided
    const signals: AbortSignal[] = [];
    let timeout_id: ReturnType<typeof setTimeout> | undefined;
    let timeout_controller: AbortController | undefined;

    if (timeout > 0) {
      timeout_controller = new AbortController();
      timeout_id = setTimeout(() => {
        timeout_controller?.abort();
      }, timeout);
      signals.push(timeout_controller.signal);
    }

    if (external_signal) {
      signals.push(external_signal);
    }

    // Use AbortSignal.any() to combine signals (Node 20+)
    const signal = signals.length > 0 ? AbortSignal.any(signals) : undefined;

    try {
      const res = await fetch(url, {
        ...fetch_options,
        ...(signal && { signal }),
      });

      // Parse JSON response safely
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new MonimeApiError(
          `Invalid JSON response from server: ${res.status} ${res.statusText}`,
          res.status,
          "invalid_json",
          [],
        );
      }

      // Check for HTTP errors
      if (!res.ok) {
        const retry_after = this.parse_retry_after(res.headers);
        const error_response = data as ApiErrorResponse;

        if (error_response.error) {
          throw new MonimeApiError(
            error_response.error.message,
            error_response.error.code,
            error_response.error.reason,
            error_response.error.details,
            retry_after,
          );
        }
        throw new MonimeApiError(
          `HTTP ${res.status}: ${res.statusText}`,
          res.status,
          "http_error",
          [],
          retry_after,
        );
      }

      return data as T;
    } catch (error) {
      // Re-throw our custom errors
      if (
        error instanceof MonimeApiError ||
        error instanceof MonimeTimeoutError ||
        error instanceof MonimeNetworkError
      ) {
        throw error;
      }

      // Handle abort errors
      if (error instanceof Error && error.name === "AbortError") {
        // Check if it was our timeout or user's signal
        if (timeout_controller?.signal.aborted && !external_signal?.aborted) {
          throw new MonimeTimeoutError(timeout, url);
        }
        // Re-throw user's abort
        throw error;
      }

      // Wrap network errors
      if (error instanceof TypeError) {
        throw new MonimeNetworkError(`Network error: ${error.message}`, error);
      }

      throw error;
    } finally {
      if (timeout_id !== undefined) {
        clearTimeout(timeout_id);
      }
    }
  }

  /**
   * Parse Retry-After header value to milliseconds
   * Supports both seconds format (e.g., "120") and HTTP-date format
   */
  private parse_retry_after(headers: Headers): number | undefined {
    const retry_after = headers.get("Retry-After");
    if (!retry_after) return undefined;

    // Try parsing as seconds (most common)
    const seconds = Number.parseInt(retry_after, 10);
    if (!Number.isNaN(seconds)) {
      return seconds * 1000;
    }

    // Try parsing as HTTP-date (e.g., "Wed, 21 Oct 2025 07:28:00 GMT")
    const date = Date.parse(retry_after);
    if (!Number.isNaN(date)) {
      const delay = date - Date.now();
      return delay > 0 ? delay : undefined;
    }

    return undefined;
  }

  private is_retryable_error(error: Error): boolean {
    // Network errors are retryable
    if (error instanceof MonimeNetworkError) {
      return true;
    }

    // Check API errors for retryable status codes
    if (error instanceof MonimeApiError) {
      return error.isRetryable;
    }

    // AbortError from timeout is not retryable (already waited)
    if (error.name === "AbortError") {
      return false;
    }

    return false;
  }

  private calculate_retry_delay(retry_index: number, error: Error): number {
    // Use Retry-After header value if available (for 429 responses)
    if (error instanceof MonimeApiError && error.retryAfter !== undefined) {
      return error.retryAfter;
    }

    // Exponential backoff: delay = initial_delay * (backoff ^ retry_index)
    // retry_index 0: 1000ms, retry_index 1: 2000ms, retry_index 2: 4000ms, etc.
    const base_delay = this.retry_delay * this.retry_backoff ** retry_index;
    const jitter = Math.random() * 500; // 0-500ms random jitter

    return base_delay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
