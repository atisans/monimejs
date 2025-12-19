# Rate Limiting Enhancement Task

## 1. Problem Statement

The current HTTP client implementation in `src/http-client.ts` has basic retry logic with exponential backoff, but lacks sophisticated rate limiting protection:

### Current Behavior
- **Simple Retry Logic**: Retries failed requests up to `max_retries` times (default: 2)
- **Exponential Backoff**: Uses `retry_delay * retry_backoff ** attempt` with 0-500ms jitter
- **Retry-After Header Support**: Respects `Retry-After` header from 429 responses (lines 334-352, 373-377)
- **Retryable Status Codes**: 429, 500, 502, 503, 504

### Limitations
1. **No Circuit Breaker**: Continues sending requests even when API is consistently failing
2. **No Backoff Cap**: Exponential backoff can grow unbounded (e.g., with backoff=2, attempt 10 = 1024 seconds)
3. **No Global Rate Limiting**: Each request retries independently; no coordination across requests
4. **No Request Queuing**: Concurrent requests can overwhelm the API during rate limit periods
5. **Limited Visibility**: No metrics or events for rate limiting behavior

### Impact
- Potential for excessive API calls during outages
- Poor user experience during sustained rate limiting
- Unnecessary network traffic and resource consumption
- Difficult to debug rate limiting issues in production

---

## 2. Proposed Solution

Implement a comprehensive rate limiting strategy combining multiple patterns:

### 2.1 Circuit Breaker Pattern

**Purpose**: Prevent cascading failures by "opening" the circuit after repeated failures, giving the API time to recover.

**States**:
- **CLOSED**: Normal operation, requests flow through
- **OPEN**: Too many failures occurred, fail fast without making requests
- **HALF_OPEN**: Testing if API recovered, allow limited requests

**Benefits**:
- Immediate failure response instead of waiting for timeouts
- Reduces load on struggling API
- Automatic recovery detection

**Configuration Options**:
```typescript
{
  failureThreshold: 5,        // Failures before opening circuit
  successThreshold: 2,        // Successes to close from half-open
  openDuration: 30000,        // Time to wait before half-open (ms)
  halfOpenMaxAttempts: 3      // Max concurrent requests in half-open
}
```

### 2.2 Exponential Backoff with Cap

**Purpose**: Prevent unbounded retry delays while maintaining exponential growth for reasonable attempts.

**Algorithm**:
```
delay = min(
  maxBackoff,
  initialDelay * (backoffMultiplier ** attempt)
) + jitter
```

**Configuration Options**:
```typescript
{
  initialDelay: 1000,         // Initial retry delay (ms)
  maxBackoff: 60000,          // Maximum backoff delay (ms)
  backoffMultiplier: 2,       // Exponential growth factor
  jitterFactor: 0.5           // Jitter as fraction of delay
}
```

**Example Delays** (initial=1000ms, max=60000ms, multiplier=2):
- Attempt 0: 1000ms + jitter
- Attempt 1: 2000ms + jitter
- Attempt 2: 4000ms + jitter
- Attempt 3: 8000ms + jitter
- Attempt 4: 16000ms + jitter
- Attempt 5: 32000ms + jitter
- Attempt 6: 60000ms + jitter (capped)
- Attempt 7+: 60000ms + jitter (capped)

### 2.3 Rate Limiter Options

Choose one or combine multiple approaches:

#### Option A: Token Bucket
**Best for**: Allowing bursts while maintaining average rate

**How it works**:
- Bucket holds N tokens, refills at R tokens/second
- Each request consumes 1 token
- Request waits if no tokens available

**Configuration**:
```typescript
{
  capacity: 100,              // Max tokens in bucket
  refillRate: 10,             // Tokens per second
  refillInterval: 100         // Refill check interval (ms)
}
```

#### Option B: Sliding Window
**Best for**: Strict rate limiting over time windows

**How it works**:
- Track request timestamps in a window
- Reject/queue if count exceeds limit in window
- Window slides with time

**Configuration**:
```typescript
{
  maxRequests: 100,           // Max requests per window
  windowSize: 60000,          // Window size (ms)
  precision: 1000             // Timestamp precision (ms)
}
```

#### Option C: Adaptive Rate Limiting
**Best for**: Dynamic adjustment based on API responses

**How it works**:
- Start with initial rate limit
- Decrease on 429 responses
- Gradually increase on successes
- Use Retry-After header as signal

**Configuration**:
```typescript
{
  initialRate: 100,           // Initial requests/minute
  minRate: 10,                // Minimum requests/minute
  maxRate: 1000,              // Maximum requests/minute
  decreaseFactor: 0.5,        // Rate multiplier on 429
  increaseFactor: 1.1,        // Rate multiplier on success
  increaseInterval: 60000     // Time between increases (ms)
}
```

---

## 3. Implementation Details

### 3.1 File Structure

```
src/
├── http-client.ts              (existing - modify)
├── rate-limiting/
│   ├── index.ts               (exports)
│   ├── circuit-breaker.ts     (circuit breaker implementation)
│   ├── rate-limiter.ts        (rate limiter interface)
│   ├── token-bucket.ts        (token bucket implementation)
│   ├── sliding-window.ts      (sliding window implementation)
│   ├── adaptive-limiter.ts    (adaptive rate limiter)
│   └── types.ts               (shared types)
└── types.ts                   (existing - extend)
```

### 3.2 Code Examples

#### Circuit Breaker Implementation

```typescript
// src/rate-limiting/circuit-breaker.ts

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  openDuration: number;
  halfOpenMaxAttempts: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;
  private halfOpenRequests = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenRequests = 0;
    }

    // Limit concurrent requests in half-open state
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenRequests >= this.config.halfOpenMaxAttempts) {
        throw new Error('Circuit breaker is HALF_OPEN - max attempts reached');
      }
      this.halfOpenRequests++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.close();
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.config.failureThreshold) {
      this.open();
    }
  }

  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.openDuration;
    this.failureCount = 0;
    this.successCount = 0;
  }

  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenRequests = 0;
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

#### Rate Limiter Interface

```typescript
// src/rate-limiting/rate-limiter.ts

export interface RateLimiter {
  /**
   * Acquire permission to make a request
   * Returns immediately if allowed, throws/waits if rate limited
   */
  acquire(): Promise<void>;

  /**
   * Report successful request completion
   */
  onSuccess(): void;

  /**
   * Report failed request (especially 429)
   * @param retryAfter - Retry-After value in milliseconds
   */
  onRateLimit(retryAfter?: number): void;

  /**
   * Get current rate limit status
   */
  getStatus(): RateLimiterStatus;
}

export interface RateLimiterStatus {
  available: number;
  total: number;
  resetsAt?: number;
}
```

#### Token Bucket Implementation

```typescript
// src/rate-limiting/token-bucket.ts

export interface TokenBucketConfig {
  capacity: number;
  refillRate: number;
  refillInterval: number;
}

export class TokenBucket implements RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private refillTimer?: NodeJS.Timeout;

  constructor(private config: TokenBucketConfig) {
    this.tokens = config.capacity;
    this.lastRefill = Date.now();
    this.startRefill();
  }

  async acquire(): Promise<void> {
    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for next refill
    await this.waitForToken();
  }

  onSuccess(): void {
    // No-op for basic token bucket
  }

  onRateLimit(retryAfter?: number): void {
    // Drain tokens on rate limit
    this.tokens = 0;
  }

  getStatus(): RateLimiterStatus {
    return {
      available: Math.floor(this.tokens),
      total: this.config.capacity,
      resetsAt: this.lastRefill + this.config.refillInterval
    };
  }

  private startRefill(): void {
    this.refillTimer = setInterval(() => {
      const tokensToAdd = this.config.refillRate;
      this.tokens = Math.min(this.config.capacity, this.tokens + tokensToAdd);
      this.lastRefill = Date.now();
    }, this.config.refillInterval);
  }

  private async waitForToken(): Promise<void> {
    return new Promise(resolve => {
      const checkToken = () => {
        if (this.tokens >= 1) {
          this.tokens--;
          resolve();
        } else {
          setTimeout(checkToken, 100);
        }
      };
      checkToken();
    });
  }

  destroy(): void {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
    }
  }
}
```

#### Integration with HTTP Client

```typescript
// src/http-client.ts (modifications)

export interface ClientOptions {
  // ... existing options

  // Circuit breaker options
  circuitBreaker?: boolean | CircuitBreakerConfig;

  // Rate limiter options
  rateLimiter?: 'token-bucket' | 'sliding-window' | 'adaptive' | RateLimiter;
  rateLimiterConfig?: TokenBucketConfig | SlidingWindowConfig | AdaptiveLimiterConfig;

  // Max backoff cap
  maxBackoff?: number;
}

export class MonimeHttpClient {
  private circuitBreaker?: CircuitBreaker;
  private rateLimiter?: RateLimiter;
  private maxBackoff: number;

  constructor(options: ClientOptions) {
    // ... existing initialization

    // Initialize circuit breaker
    if (options.circuitBreaker) {
      const config = options.circuitBreaker === true
        ? DEFAULT_CIRCUIT_BREAKER_CONFIG
        : options.circuitBreaker;
      this.circuitBreaker = new CircuitBreaker(config);
    }

    // Initialize rate limiter
    if (options.rateLimiter) {
      this.rateLimiter = this.createRateLimiter(
        options.rateLimiter,
        options.rateLimiterConfig
      );
    }

    this.maxBackoff = options.maxBackoff ?? DEFAULT_MAX_BACKOFF;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    // Acquire rate limit permission
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    // Execute with circuit breaker
    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(() =>
        this.executeRequest<T>(options)
      );
    }

    return this.executeRequest<T>(options);
  }

  private async executeRequest<T>(options: RequestOptions): Promise<T> {
    try {
      const result = await this._execute_with_retry<T>(...);

      // Report success to rate limiter
      if (this.rateLimiter) {
        this.rateLimiter.onSuccess();
      }

      return result;
    } catch (error) {
      // Report rate limit to rate limiter
      if (error instanceof MonimeApiError && error.code === 429) {
        this.rateLimiter?.onRateLimit(error.retryAfter);
      }
      throw error;
    }
  }

  private _calculate_retry_delay(attempt: number, error: Error): number {
    // Use Retry-After header value if available (for 429 responses)
    if (error instanceof MonimeApiError && error.retryAfter !== undefined) {
      return Math.min(error.retryAfter, this.maxBackoff);
    }

    // Exponential backoff with cap and jitter
    const baseDelay = this.retry_delay * (this.retry_backoff ** attempt);
    const cappedDelay = Math.min(baseDelay, this.maxBackoff);
    const jitter = Math.random() * 500; // 0-500ms random jitter

    return cappedDelay + jitter;
  }

  private createRateLimiter(
    type: string | RateLimiter,
    config?: any
  ): RateLimiter {
    if (typeof type === 'object') {
      return type;
    }

    switch (type) {
      case 'token-bucket':
        return new TokenBucket(config ?? DEFAULT_TOKEN_BUCKET_CONFIG);
      case 'sliding-window':
        return new SlidingWindow(config ?? DEFAULT_SLIDING_WINDOW_CONFIG);
      case 'adaptive':
        return new AdaptiveLimiter(config ?? DEFAULT_ADAPTIVE_CONFIG);
      default:
        throw new Error(`Unknown rate limiter type: ${type}`);
    }
  }
}
```

### 3.3 Configuration in types.ts

```typescript
// src/types.ts (additions)

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Number of successes to close from half-open */
  successThreshold: number;
  /** Time to wait before half-open state (ms) */
  openDuration: number;
  /** Max concurrent requests in half-open state */
  halfOpenMaxAttempts: number;
}

export interface TokenBucketConfig {
  /** Maximum number of tokens in bucket */
  capacity: number;
  /** Number of tokens to add per interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillInterval: number;
}

export interface SlidingWindowConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowSize: number;
  /** Timestamp precision in milliseconds */
  precision: number;
}

export interface AdaptiveLimiterConfig {
  /** Initial requests per minute */
  initialRate: number;
  /** Minimum requests per minute */
  minRate: number;
  /** Maximum requests per minute */
  maxRate: number;
  /** Rate multiplier on 429 response */
  decreaseFactor: number;
  /** Rate multiplier on success */
  increaseFactor: number;
  /** Time between rate increases (ms) */
  increaseInterval: number;
}

export interface ClientOptions {
  // ... existing options

  /**
   * Enable circuit breaker pattern.
   * Set to `true` for defaults or provide custom config.
   * @default false
   */
  circuitBreaker?: boolean | CircuitBreakerConfig;

  /**
   * Rate limiter type or custom implementation.
   * Options: 'token-bucket', 'sliding-window', 'adaptive'
   * @default undefined (no rate limiting)
   */
  rateLimiter?: 'token-bucket' | 'sliding-window' | 'adaptive' | RateLimiter;

  /**
   * Configuration for the selected rate limiter
   */
  rateLimiterConfig?: TokenBucketConfig | SlidingWindowConfig | AdaptiveLimiterConfig;

  /**
   * Maximum backoff delay in milliseconds.
   * Caps exponential backoff growth.
   * @default 60000 (60 seconds)
   */
  maxBackoff?: number;
}
```

### 3.4 Default Constants

```typescript
// src/http-client.ts (additions)

const DEFAULT_MAX_BACKOFF = 60000; // 60 seconds

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  openDuration: 30000,
  halfOpenMaxAttempts: 3
};

const DEFAULT_TOKEN_BUCKET_CONFIG: TokenBucketConfig = {
  capacity: 100,
  refillRate: 10,
  refillInterval: 1000
};

const DEFAULT_SLIDING_WINDOW_CONFIG: SlidingWindowConfig = {
  maxRequests: 100,
  windowSize: 60000,
  precision: 1000
};

const DEFAULT_ADAPTIVE_CONFIG: AdaptiveLimiterConfig = {
  initialRate: 100,
  minRate: 10,
  maxRate: 1000,
  decreaseFactor: 0.5,
  increaseFactor: 1.05,
  increaseInterval: 60000
};
```

---

## 4. Libraries to Consider

### 4.1 Cockatiel

**Purpose**: Resilience and transient-fault-handling library

**Pros**:
- Battle-tested circuit breaker implementation
- Built-in retry policies with backoff strategies
- TypeScript-first with excellent type safety
- Active maintenance and good documentation
- Includes timeout and bulkhead patterns
- Event system for monitoring

**Cons**:
- Additional dependency (~50KB)
- May be overkill for simple use cases
- Learning curve for configuration

**Usage Example**:
```typescript
import { circuitBreaker, handleAll, ConsecutiveBreaker } from 'cockatiel';

const breaker = circuitBreaker(handleAll, {
  halfOpenAfter: 30 * 1000,
  breaker: new ConsecutiveBreaker(5)
});

const result = await breaker.execute(() => apiCall());
```

**Recommendation**: Excellent choice if we want production-ready patterns without implementing from scratch.

### 4.2 Bottleneck

**Purpose**: Lightweight rate limiter with job scheduling

**Pros**:
- Purpose-built for rate limiting
- Supports multiple strategies (token bucket, clustering)
- Redis support for distributed rate limiting
- Job queuing with priority
- Lightweight (~15KB)
- Works in Node.js and browsers

**Cons**:
- Less comprehensive than Cockatiel (no circuit breaker)
- Documentation could be better
- Requires understanding of internal job system

**Usage Example**:
```typescript
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100,  // Min time between jobs
  reservoir: 100, // Initial tokens
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60 * 1000
});

const result = await limiter.schedule(() => apiCall());
```

**Recommendation**: Good for rate limiting specifically, but lacks circuit breaker. Could combine with custom circuit breaker.

### 4.3 p-retry

**Purpose**: Retry failed operations with exponential backoff

**Pros**:
- Extremely lightweight (~3KB)
- Simple API, easy to integrate
- TypeScript support
- Good default retry strategies
- Works with AbortController

**Cons**:
- Only handles retries, no rate limiting or circuit breaker
- Would need to build other patterns ourselves

**Usage Example**:
```typescript
import pRetry from 'p-retry';

const result = await pRetry(
  () => apiCall(),
  {
    retries: 5,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 60000,
    onFailedAttempt: error => {
      console.log(`Attempt ${error.attemptNumber} failed`);
    }
  }
);
```

**Recommendation**: Too limited for our needs, but could be useful reference for retry logic.

### 4.4 Custom Implementation

**Pros**:
- No external dependencies
- Full control over behavior
- Tailored to our specific needs
- Smaller bundle size
- No breaking changes from upstream
- Better integration with existing error types

**Cons**:
- More development time
- Need to write comprehensive tests
- May miss edge cases that libraries handle
- Maintenance burden
- Potential for bugs in complex patterns

**Recommendation**: Viable if we want to keep dependencies minimal and have time to implement properly.

---

## 5. Recommendation Summary

### Recommended Approach: Hybrid

1. **Use Cockatiel for Circuit Breaker**
   - Production-ready, well-tested
   - Excellent TypeScript support
   - Handles edge cases we might miss

2. **Custom Rate Limiter Implementation**
   - Start with simple token bucket
   - Integrate with existing Retry-After logic
   - Can add adaptive behavior later

3. **Add Backoff Cap to Existing Retry Logic**
   - Simple change to `_calculate_retry_delay()`
   - No new dependencies
   - Immediate improvement

**Rationale**:
- Balances reliability (Cockatiel) with control (custom rate limiter)
- Cockatiel adds ~50KB but saves weeks of development and testing
- Rate limiter is simpler to implement and more specific to our needs
- Backoff cap is trivial to add and provides immediate value

---

## 6. Task Checklist

### Phase 1: Foundation (High Priority)
- [ ] Add `maxBackoff` configuration option to `ClientOptions`
- [ ] Implement backoff cap in `_calculate_retry_delay()` method
- [ ] Add default constant `DEFAULT_MAX_BACKOFF = 60000`
- [ ] Update documentation for new `maxBackoff` option
- [ ] Write tests for capped exponential backoff

### Phase 2: Circuit Breaker (High Priority)
- [ ] Add Cockatiel dependency to `package.json`
- [ ] Create `src/rate-limiting/` directory structure
- [ ] Add `CircuitBreakerConfig` interface to `types.ts`
- [ ] Integrate Cockatiel circuit breaker in `http-client.ts`
- [ ] Add `circuitBreaker` option to `ClientOptions`
- [ ] Implement default circuit breaker configuration
- [ ] Add circuit breaker state exposure (for monitoring)
- [ ] Write tests for circuit breaker integration
- [ ] Add circuit breaker example to docs

### Phase 3: Rate Limiter (Medium Priority)
- [ ] Design `RateLimiter` interface in `src/rate-limiting/rate-limiter.ts`
- [ ] Implement `TokenBucket` class
- [ ] Add `TokenBucketConfig` to types
- [ ] Integrate rate limiter in HTTP client request flow
- [ ] Add `rateLimiter` and `rateLimiterConfig` options
- [ ] Implement rate limiter status reporting
- [ ] Handle 429 responses with rate limiter notification
- [ ] Write comprehensive tests for token bucket
- [ ] Add rate limiter usage examples

### Phase 4: Advanced Rate Limiters (Low Priority)
- [ ] Implement `SlidingWindow` rate limiter
- [ ] Add `SlidingWindowConfig` to types
- [ ] Implement `AdaptiveLimiter` rate limiter
- [ ] Add `AdaptiveLimiterConfig` to types
- [ ] Write tests for each rate limiter type
- [ ] Document trade-offs between rate limiter types
- [ ] Add advanced examples for each type

### Phase 5: Monitoring & Observability (Medium Priority)
- [ ] Add event emitter for rate limiting events
- [ ] Create `RateLimitEvent` types (throttled, circuit_opened, etc.)
- [ ] Add metrics collection for rate limit hits
- [ ] Expose circuit breaker state in client
- [ ] Add rate limiter status getter
- [ ] Create debugging utilities
- [ ] Document monitoring best practices

### Phase 6: Documentation & Examples (High Priority)
- [ ] Update main README with rate limiting features
- [ ] Create comprehensive rate limiting guide
- [ ] Add migration guide for existing users
- [ ] Create examples for each configuration
- [ ] Document performance implications
- [ ] Add troubleshooting section
- [ ] Create API reference for rate limiting

### Phase 7: Testing & Validation (High Priority)
- [ ] Unit tests for all rate limiter implementations
- [ ] Integration tests with HTTP client
- [ ] Load tests to verify rate limiting behavior
- [ ] Test circuit breaker state transitions
- [ ] Test edge cases (network failures, timeouts)
- [ ] Add benchmarks for performance impact
- [ ] Test browser compatibility (if applicable)

### Phase 8: Polish & Release (Medium Priority)
- [ ] Review TypeScript types for completeness
- [ ] Ensure backward compatibility
- [ ] Update CHANGELOG
- [ ] Version bump planning
- [ ] Deprecation notices if needed
- [ ] Performance optimization review
- [ ] Security review (rate limiter bypass scenarios)

---

## 7. Success Metrics

After implementation, we should see:

1. **Reduced API Load During Outages**
   - Circuit breaker prevents cascading failures
   - Fail-fast behavior reduces wasted requests

2. **Better User Experience**
   - Predictable retry behavior with capped delays
   - Transparent rate limiting with status reporting

3. **Improved Observability**
   - Events for monitoring rate limit hits
   - Circuit breaker state visibility
   - Rate limiter metrics

4. **Maintained Performance**
   - Minimal overhead for successful requests
   - No significant bundle size increase (<100KB total)

5. **Backward Compatibility**
   - Existing code works without changes
   - Opt-in for new features

---

## 8. Future Enhancements

Consider for future iterations:

1. **Distributed Rate Limiting**
   - Redis-backed rate limiter for multi-instance apps
   - Shared circuit breaker state

2. **Request Prioritization**
   - Priority queue for rate-limited requests
   - Critical vs. non-critical request handling

3. **Adaptive Timeout**
   - Adjust timeout based on API response times
   - Percentile-based timeout calculation

4. **Cost-Based Rate Limiting**
   - Different costs for different endpoints
   - Budget-based request management

5. **Predictive Rate Limiting**
   - Learn API rate limit patterns
   - Proactive throttling before 429s

6. **Multi-Region Support**
   - Different rate limits per region
   - Automatic failover to different regions
