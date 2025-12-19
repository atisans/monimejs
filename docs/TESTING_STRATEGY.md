# Testing Strategy for MonimeJS SDK

## Table of Contents
1. [Overview](#overview)
2. [Testing Libraries Comparison](#testing-libraries-comparison)
3. [Mocking Libraries Comparison](#mocking-libraries-comparison)
4. [Testing Strategy](#testing-strategy)
5. [What to Test](#what-to-test)
6. [Code Coverage Requirements](#code-coverage-requirements)
7. [CI/CD Integration](#cicd-integration)
8. [Task Checklist](#task-checklist)

---

## Overview

### Why Testing is Critical for Payment SDKs

Payment SDKs handle sensitive financial transactions where errors can lead to:
- **Financial losses**: Incorrect transaction amounts, duplicate charges, or failed refunds
- **Security vulnerabilities**: Exposed credentials, improper authentication, or validation bypasses
- **Compliance issues**: Failed audits, regulatory violations, or PCI-DSS non-compliance
- **Reputation damage**: User trust erosion from unreliable payment processing
- **Integration failures**: Breaking changes affecting production systems

**Key Testing Principles for Payment SDKs:**
- **Zero tolerance for regression**: Payment logic must be bulletproof
- **Comprehensive error handling**: Every failure path must be tested
- **Network resilience**: Retry logic, timeouts, and idempotency must work correctly
- **Input validation**: Malformed inputs must be caught before reaching the API
- **Security first**: Credentials, tokens, and sensitive data must never be logged or exposed

---

## Testing Libraries Comparison

### 1. Vitest

**Overview**: Modern, Vite-powered test runner with ESM-first design and excellent TypeScript support.

**Pros:**
- Native ESM support (matches this SDK's `"type": "module"`)
- Extremely fast with smart caching and parallel execution
- Jest-compatible API (easy migration if needed)
- Built-in TypeScript support without extra configuration
- Watch mode with HMR-like experience
- Native code coverage with c8
- Modern, actively maintained (2024+)
- Smaller bundle size and faster startup

**Cons:**
- Relatively newer (less mature than Jest)
- Smaller ecosystem and community
- Some edge cases may have less documentation

**Setup:**
```bash
npm install -D vitest @vitest/coverage-v8
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

### 2. Jest

**Overview**: Mature, battle-tested testing framework from Facebook with extensive ecosystem.

**Pros:**
- Industry standard with massive community
- Extensive documentation and examples
- Rich ecosystem of plugins and extensions
- Built-in mocking capabilities
- Snapshot testing
- Excellent error messages
- Wide IDE support

**Cons:**
- Requires additional configuration for ESM modules
- Slower than Vitest (no Vite optimizations)
- Heavier installation footprint
- TypeScript requires ts-jest or babel transformation
- Node 20+ ESM support can be challenging

**Setup:**
```bash
npm install -D jest @types/jest ts-jest
```

```javascript
// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
};
```

---

### 3. Node.js Native Test Runner

**Overview**: Built-in test runner available in Node.js 18+ (stable in Node 20+).

**Pros:**
- Zero dependencies (built into Node.js)
- Native ESM support
- Minimal configuration
- Fast execution
- No installation or versioning issues
- Official Node.js support

**Cons:**
- Limited features compared to full frameworks
- No built-in code coverage (requires separate tool like c8)
- Less mature ecosystem
- Fewer assertion libraries
- No watch mode (as of Node 20)
- Limited mocking utilities

**Setup:**
```typescript
// test/example.test.ts
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('MyModule', () => {
  test('should work', () => {
    assert.strictEqual(1 + 1, 2);
  });
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "node --test test/**/*.test.ts",
    "test:coverage": "c8 --reporter=lcov --reporter=text npm test"
  }
}
```

---

### Recommendation: **Vitest**

**Reasoning:**
1. **ESM-Native**: MonimeJS uses `"type": "module"`, making Vitest the natural choice
2. **Performance**: 2-10x faster than Jest for TypeScript ESM projects
3. **TypeScript Support**: Zero-config TypeScript support matches project setup
4. **Developer Experience**: Modern watch mode, fast feedback loop
5. **Future-Proof**: Active development, modern architecture
6. **Coverage Built-In**: Native v8 coverage without extra configuration
7. **Jest Compatibility**: Can migrate to Jest later if needed (compatible API)

**Trade-off Analysis:**
- Jest: Better for teams requiring maximum stability and ecosystem
- Node.js Native: Best for zero-dependency constraint (not ideal for payment SDKs)
- **Vitest: Best balance of speed, features, and modern tooling**

---

## Mocking Libraries Comparison

### 1. MSW (Mock Service Worker)

**Overview**: HTTP request interception at the network level using Service Worker API (browser) or Node.js http/https modules.

**Pros:**
- Network-level mocking (most realistic)
- Same mock definitions for browser and Node.js
- No monkey-patching of fetch or http modules
- Type-safe with TypeScript
- Excellent for integration tests
- Can intercept all HTTP libraries (fetch, axios, etc.)
- Great developer experience with handlers

**Cons:**
- Heavier setup than alternatives
- Overkill for simple unit tests
- Requires understanding of request handlers
- Slightly slower than built-in mocks

**Setup:**
```bash
npm install -D msw
```

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.monime.io/v1/payment-codes/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      messages: [],
      result: {
        id: params.id,
        mode: 'one_time',
        status: 'pending',
        amount: { currency: 'SLE', value: 1000 },
        // ... other fields
      },
    });
  }),
];

// test/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### 2. nock

**Overview**: HTTP request mocking for Node.js by intercepting http/https modules.

**Pros:**
- Simple, fluent API
- Battle-tested (10+ years)
- Excellent for REST API mocking
- Recording and playback features
- Assertion on requests (verify calls)
- Lighter than MSW
- Perfect for unit tests

**Cons:**
- Node.js only (no browser support)
- Does not intercept fetch natively (needs adapter)
- Less modern than MSW
- Doesn't work well with undici or native fetch

**Setup:**
```bash
npm install -D nock
```

```typescript
import nock from 'nock';

describe('PaymentCodeModule', () => {
  test('should get payment code', async () => {
    nock('https://api.monime.io')
      .get('/v1/payment-codes/pmc-123')
      .matchHeader('Authorization', 'Bearer test-token')
      .reply(200, {
        success: true,
        result: { id: 'pmc-123', status: 'pending' },
      });

    const client = new MonimeClient({ /* ... */ });
    const result = await client.paymentCode.get('pmc-123');

    expect(result.result.id).toBe('pmc-123');
  });
});
```

---

### 3. Built-in Mocking (Vitest/Jest)

**Overview**: Test framework's native mocking capabilities for functions and modules.

**Pros:**
- Zero external dependencies
- Fast execution
- Simple for unit tests
- Good for mocking internal modules
- Type-safe with TypeScript
- Full control over mock behavior

**Cons:**
- Requires mocking fetch/http manually
- Less realistic (mocks at function level, not network)
- More boilerplate for HTTP requests
- Harder to test retry logic and network errors

**Setup:**
```typescript
import { vi } from 'vitest';

describe('MonimeHttpClient', () => {
  test('should handle timeout', async () => {
    global.fetch = vi.fn(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );

    const client = new MonimeHttpClient({ /* ... */ });

    await expect(client.request({ /* ... */ }))
      .rejects
      .toThrow('timed out');
  });
});
```

---

### Recommendation: **MSW (Mock Service Worker)**

**Reasoning:**
1. **Network-Level Realism**: Tests actual HTTP interactions, closest to production
2. **Comprehensive Testing**: Captures retry logic, timeout handling, header management
3. **Type Safety**: Full TypeScript support for handlers and responses
4. **Maintainability**: Centralized mock definitions in handlers
5. **Future-Proof**: Works with any HTTP client (fetch, axios, got, etc.)
6. **Error Scenarios**: Easy to simulate network errors, rate limits, retries
7. **Production-Like**: Tests the actual request/response cycle

**When to Use Alternatives:**
- **Built-in Mocking**: For pure unit tests of validation logic, error classes
- **nock**: If team is already familiar with it (but consider MSW for new projects)

**Hybrid Approach (Recommended):**
- **MSW**: For HTTP client, module methods, integration tests
- **Built-in Mocking**: For validation functions, schema tests, utility functions

---

## Testing Strategy

### Test Pyramid for MonimeJS

```
       /\
      /  \     E2E Tests (Manual/Postman)
     /    \    - Real API integration
    /------\   - Smoke tests only
   /        \
  /  Integ-  \ Integration Tests (20%)
 /   ration   \- HTTP client + modules
/              \- MSW for API mocking
/----------------\
/   Unit Tests    \ Unit Tests (80%)
/     (80%)        \- Validation
/                   \- Error classes
---------------------\- Pure functions
```

---

### 1. Unit Tests

**Purpose**: Test individual functions and classes in isolation.

**What to Test:**
- Validation functions (schema validation)
- Error classes (instantiation, properties, methods)
- Utility functions (parsing, formatting)
- Edge cases and boundary conditions

**Example: Validation Tests**

```typescript
// test/unit/validation.test.ts
import { describe, test, expect } from 'vitest';
import {
  validatePaymentCodeId,
  validateClientOptions,
  MonimeValidationError,
} from '../src/validation';

describe('validatePaymentCodeId', () => {
  test('should accept valid payment code ID', () => {
    expect(() => validatePaymentCodeId('pmc-abc123')).not.toThrow();
  });

  test('should reject ID without pmc- prefix', () => {
    expect(() => validatePaymentCodeId('abc123')).toThrow(MonimeValidationError);
  });

  test('should reject empty string', () => {
    expect(() => validatePaymentCodeId('')).toThrow(MonimeValidationError);
  });

  test('should provide helpful error message', () => {
    try {
      validatePaymentCodeId('invalid');
    } catch (error) {
      expect(error).toBeInstanceOf(MonimeValidationError);
      expect(error.field).toBe('id');
      expect(error.message).toContain('must start with "pmc-"');
    }
  });
});

describe('validateClientOptions', () => {
  test('should accept valid options', () => {
    const options = {
      spaceId: 'spc-test123',
      accessToken: 'token-abc',
    };
    expect(() => validateClientOptions(options)).not.toThrow();
  });

  test('should reject missing spaceId', () => {
    const options = { accessToken: 'token-abc' } as any;
    expect(() => validateClientOptions(options)).toThrow();
  });

  test('should reject invalid baseUrl (non-HTTPS)', () => {
    const options = {
      spaceId: 'spc-test',
      accessToken: 'token',
      baseUrl: 'http://api.example.com',
    };
    expect(() => validateClientOptions(options)).toThrow(/HTTPS/);
  });

  test('should accept valid timeout values', () => {
    const options = {
      spaceId: 'spc-test',
      accessToken: 'token',
      timeout: 5000,
    };
    expect(() => validateClientOptions(options)).not.toThrow();
  });

  test('should reject negative timeout', () => {
    const options = {
      spaceId: 'spc-test',
      accessToken: 'token',
      timeout: -1000,
    };
    expect(() => validateClientOptions(options)).toThrow();
  });
});
```

**Example: Error Class Tests**

```typescript
// test/unit/errors.test.ts
import { describe, test, expect } from 'vitest';
import {
  MonimeError,
  MonimeApiError,
  MonimeTimeoutError,
  MonimeValidationError,
  MonimeNetworkError,
} from '../src/errors';

describe('MonimeError', () => {
  test('should create error with message', () => {
    const error = new MonimeError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('MonimeError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('MonimeApiError', () => {
  test('should create API error with details', () => {
    const error = new MonimeApiError(
      'Payment failed',
      400,
      'invalid_amount',
      [{ field: 'amount', message: 'Must be positive' }]
    );

    expect(error.message).toBe('Payment failed');
    expect(error.code).toBe(400);
    expect(error.reason).toBe('invalid_amount');
    expect(error.details).toHaveLength(1);
    expect(error.name).toBe('MonimeApiError');
  });

  test('should identify retryable status codes', () => {
    expect(new MonimeApiError('', 429, '', []).isRetryable).toBe(true);
    expect(new MonimeApiError('', 500, '', []).isRetryable).toBe(true);
    expect(new MonimeApiError('', 502, '', []).isRetryable).toBe(true);
    expect(new MonimeApiError('', 503, '', []).isRetryable).toBe(true);
    expect(new MonimeApiError('', 504, '', []).isRetryable).toBe(true);
  });

  test('should identify non-retryable status codes', () => {
    expect(new MonimeApiError('', 400, '', []).isRetryable).toBe(false);
    expect(new MonimeApiError('', 401, '', []).isRetryable).toBe(false);
    expect(new MonimeApiError('', 403, '', []).isRetryable).toBe(false);
    expect(new MonimeApiError('', 404, '', []).isRetryable).toBe(false);
  });

  test('should store retryAfter value', () => {
    const error = new MonimeApiError('', 429, 'rate_limited', [], 5000);
    expect(error.retryAfter).toBe(5000);
  });
});

describe('MonimeTimeoutError', () => {
  test('should create timeout error with context', () => {
    const error = new MonimeTimeoutError(30000, 'https://api.monime.io/v1/test');
    expect(error.timeout).toBe(30000);
    expect(error.url).toBe('https://api.monime.io/v1/test');
    expect(error.message).toContain('30000ms');
  });
});

describe('MonimeValidationError', () => {
  test('should create validation error with field and value', () => {
    const error = new MonimeValidationError(
      'Invalid email format',
      'email',
      'not-an-email'
    );

    expect(error.message).toBe('Invalid email format');
    expect(error.field).toBe('email');
    expect(error.value).toBe('not-an-email');
  });
});

describe('MonimeNetworkError', () => {
  test('should create network error with cause', () => {
    const cause = new TypeError('fetch failed');
    const error = new MonimeNetworkError('Connection failed', cause);

    expect(error.message).toBe('Connection failed');
    expect(error.cause).toBe(cause);
    expect(error.isRetryable).toBe(true);
  });
});
```

---

### 2. Integration Tests

**Purpose**: Test how components work together, especially HTTP client with modules.

**What to Test:**
- HTTP client request/response flow
- Module methods with mocked API responses
- Authentication headers
- Error handling across layers
- Retry logic with various failure scenarios

**Example: HTTP Client Integration**

```typescript
// test/integration/http-client.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { MonimeHttpClient } from '../src/http-client';
import {
  MonimeApiError,
  MonimeTimeoutError,
  MonimeNetworkError,
} from '../src/errors';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MonimeHttpClient', () => {
  const createClient = (options = {}) =>
    new MonimeHttpClient({
      spaceId: 'spc-test123',
      accessToken: 'test-token',
      baseUrl: 'https://api.monime.io',
      ...options,
    });

  describe('Successful Requests', () => {
    test('should make GET request with correct headers', async () => {
      let capturedHeaders: Record<string, string> = {};

      server.use(
        http.get('https://api.monime.io/v1/test', ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({ success: true, result: { id: '123' } });
        })
      );

      const client = createClient();
      await client.request({ method: 'GET', path: '/v1/test' });

      expect(capturedHeaders['monime-space-id']).toBe('spc-test123');
      expect(capturedHeaders['authorization']).toBe('Bearer test-token');
    });

    test('should make POST request with body and idempotency key', async () => {
      let capturedBody: any;
      let capturedKey: string = '';

      server.use(
        http.post('https://api.monime.io/v1/test', async ({ request }) => {
          capturedBody = await request.json();
          capturedKey = request.headers.get('idempotency-key') || '';
          return HttpResponse.json({ success: true, result: capturedBody });
        })
      );

      const client = createClient();
      const body = { name: 'Test', amount: 1000 };

      await client.request({
        method: 'POST',
        path: '/v1/test',
        body,
        idempotencyKey: 'key-123',
      });

      expect(capturedBody).toEqual(body);
      expect(capturedKey).toBe('key-123');
    });

    test('should generate idempotency key if not provided', async () => {
      let capturedKey: string = '';

      server.use(
        http.post('https://api.monime.io/v1/test', ({ request }) => {
          capturedKey = request.headers.get('idempotency-key') || '';
          return HttpResponse.json({ success: true });
        })
      );

      const client = createClient();
      await client.request({ method: 'POST', path: '/v1/test', body: {} });

      expect(capturedKey).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    });

    test('should handle query parameters', async () => {
      let capturedUrl: string = '';

      server.use(
        http.get('https://api.monime.io/v1/test', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ success: true });
        })
      );

      const client = createClient();
      await client.request({
        method: 'GET',
        path: '/v1/test',
        params: { limit: 10, status: 'pending', include: true },
      });

      expect(capturedUrl).toContain('limit=10');
      expect(capturedUrl).toContain('status=pending');
      expect(capturedUrl).toContain('include=true');
    });
  });

  describe('Error Handling', () => {
    test('should throw MonimeApiError for 400 response', async () => {
      server.use(
        http.get('https://api.monime.io/v1/test', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 400,
                reason: 'validation_error',
                message: 'Invalid input',
                details: [{ field: 'amount', message: 'Required' }],
              },
            },
            { status: 400 }
          );
        })
      );

      const client = createClient();

      await expect(
        client.request({ method: 'GET', path: '/v1/test' })
      ).rejects.toThrow(MonimeApiError);

      try {
        await client.request({ method: 'GET', path: '/v1/test' });
      } catch (error: any) {
        expect(error.code).toBe(400);
        expect(error.reason).toBe('validation_error');
        expect(error.details).toHaveLength(1);
      }
    });

    test('should throw MonimeApiError for 500 response', async () => {
      server.use(
        http.get('https://api.monime.io/v1/test', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 500,
                reason: 'internal_error',
                message: 'Server error',
                details: [],
              },
            },
            { status: 500 }
          );
        })
      );

      const client = createClient();

      await expect(
        client.request({ method: 'GET', path: '/v1/test' })
      ).rejects.toThrow(MonimeApiError);
    });

    test('should handle invalid JSON response', async () => {
      server.use(
        http.get('https://api.monime.io/v1/test', () => {
          return new HttpResponse('Not JSON', { status: 200 });
        })
      );

      const client = createClient();

      await expect(
        client.request({ method: 'GET', path: '/v1/test' })
      ).rejects.toThrow(MonimeApiError);
    });
  });

  describe('Timeout Handling', () => {
    test('should timeout after specified duration', async () => {
      server.use(
        http.get('https://api.monime.io/v1/test', async () => {
          await delay(2000); // 2 second delay
          return HttpResponse.json({ success: true });
        })
      );

      const client = createClient({ timeout: 500 }); // 500ms timeout

      await expect(
        client.request({ method: 'GET', path: '/v1/test' })
      ).rejects.toThrow(MonimeTimeoutError);
    });

    test('should allow per-request timeout override', async () => {
      server.use(
        http.get('https://api.monime.io/v1/test', async () => {
          await delay(200);
          return HttpResponse.json({ success: true });
        })
      );

      const client = createClient({ timeout: 50 });

      // Should timeout with client default
      await expect(
        client.request({ method: 'GET', path: '/v1/test' })
      ).rejects.toThrow(MonimeTimeoutError);

      // Should succeed with per-request override
      const result = await client.request({
        method: 'GET',
        path: '/v1/test',
        config: { timeout: 500 },
      });

      expect(result).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    test('should retry on 500 error', async () => {
      let attemptCount = 0;

      server.use(
        http.get('https://api.monime.io/v1/test', () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.json(
              { success: false, error: { code: 500, reason: 'error', message: 'Error', details: [] } },
              { status: 500 }
            );
          }
          return HttpResponse.json({ success: true, result: { id: '123' } });
        })
      );

      const client = createClient({ retries: 2, retryDelay: 100 });
      const result = await client.request({ method: 'GET', path: '/v1/test' });

      expect(attemptCount).toBe(3); // Initial + 2 retries
      expect(result).toEqual({ success: true, result: { id: '123' } });
    });

    test('should retry on 429 with Retry-After header', async () => {
      let attemptCount = 0;

      server.use(
        http.get('https://api.monime.io/v1/test', () => {
          attemptCount++;
          if (attemptCount === 1) {
            return HttpResponse.json(
              { success: false, error: { code: 429, reason: 'rate_limited', message: 'Rate limited', details: [] } },
              { status: 429, headers: { 'Retry-After': '1' } }
            );
          }
          return HttpResponse.json({ success: true });
        })
      );

      const client = createClient({ retries: 1 });
      const result = await client.request({ method: 'GET', path: '/v1/test' });

      expect(attemptCount).toBe(2);
      expect(result).toEqual({ success: true });
    });

    test('should not retry on 400 error', async () => {
      let attemptCount = 0;

      server.use(
        http.get('https://api.monime.io/v1/test', () => {
          attemptCount++;
          return HttpResponse.json(
            { success: false, error: { code: 400, reason: 'bad_request', message: 'Bad request', details: [] } },
            { status: 400 }
          );
        })
      );

      const client = createClient({ retries: 2 });

      await expect(
        client.request({ method: 'GET', path: '/v1/test' })
      ).rejects.toThrow(MonimeApiError);

      expect(attemptCount).toBe(1); // No retries
    });

    test('should not retry on timeout', async () => {
      let attemptCount = 0;

      server.use(
        http.get('https://api.monime.io/v1/test', async () => {
          attemptCount++;
          await delay(1000);
          return HttpResponse.json({ success: true });
        })
      );

      const client = createClient({ timeout: 200, retries: 2 });

      await expect(
        client.request({ method: 'GET', path: '/v1/test' })
      ).rejects.toThrow(MonimeTimeoutError);

      expect(attemptCount).toBe(1); // No retries for timeout
    });
  });

  describe('AbortSignal Support', () => {
    test('should cancel request on abort signal', async () => {
      server.use(
        http.get('https://api.monime.io/v1/test', async () => {
          await delay(1000);
          return HttpResponse.json({ success: true });
        })
      );

      const client = createClient();
      const controller = new AbortController();

      const requestPromise = client.request({
        method: 'GET',
        path: '/v1/test',
        config: { signal: controller.signal },
      });

      setTimeout(() => controller.abort(), 100);

      await expect(requestPromise).rejects.toThrow('abort');
    });
  });
});
```

**Example: Module Integration Tests**

```typescript
// test/integration/payment-code.test.ts
import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { MonimeClient } from '../src/client';
import { MonimeValidationError } from '../src/errors';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PaymentCodeModule', () => {
  const createClient = () =>
    new MonimeClient({
      spaceId: 'spc-test123',
      accessToken: 'test-token',
      baseUrl: 'https://api.monime.io',
    });

  describe('create', () => {
    test('should create payment code successfully', async () => {
      server.use(
        http.post('https://api.monime.io/v1/payment-codes', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            success: true,
            messages: [],
            result: {
              id: 'pmc-123',
              mode: 'one_time',
              status: 'pending',
              name: body.name,
              amount: body.amount,
              ussdCode: '*999#',
              createTime: new Date().toISOString(),
            },
          });
        })
      );

      const client = createClient();
      const result = await client.paymentCode.create({
        name: 'Test Payment',
        amount: { currency: 'SLE', value: 10000 },
      });

      expect(result.success).toBe(true);
      expect(result.result.id).toBe('pmc-123');
      expect(result.result.name).toBe('Test Payment');
    });

    test('should validate input before request', async () => {
      const client = createClient();

      await expect(
        client.paymentCode.create({
          name: '', // Invalid: empty name
          amount: { currency: 'SLE', value: 10000 },
        })
      ).rejects.toThrow(MonimeValidationError);
    });

    test('should use custom idempotency key', async () => {
      let capturedKey = '';

      server.use(
        http.post('https://api.monime.io/v1/payment-codes', ({ request }) => {
          capturedKey = request.headers.get('idempotency-key') || '';
          return HttpResponse.json({
            success: true,
            messages: [],
            result: { id: 'pmc-123' },
          });
        })
      );

      const client = createClient();
      await client.paymentCode.create(
        { name: 'Test', amount: { currency: 'SLE', value: 1000 } },
        'custom-key-123'
      );

      expect(capturedKey).toBe('custom-key-123');
    });
  });

  describe('get', () => {
    test('should retrieve payment code by ID', async () => {
      server.use(
        http.get('https://api.monime.io/v1/payment-codes/pmc-123', () => {
          return HttpResponse.json({
            success: true,
            messages: [],
            result: {
              id: 'pmc-123',
              mode: 'one_time',
              status: 'pending',
              amount: { currency: 'SLE', value: 5000 },
            },
          });
        })
      );

      const client = createClient();
      const result = await client.paymentCode.get('pmc-123');

      expect(result.result.id).toBe('pmc-123');
      expect(result.result.amount.value).toBe(5000);
    });

    test('should validate payment code ID format', async () => {
      const client = createClient();

      await expect(
        client.paymentCode.get('invalid-id')
      ).rejects.toThrow(MonimeValidationError);
    });
  });

  describe('list', () => {
    test('should list payment codes with pagination', async () => {
      server.use(
        http.get('https://api.monime.io/v1/payment-codes', ({ request }) => {
          const url = new URL(request.url);
          const limit = url.searchParams.get('limit');

          return HttpResponse.json({
            success: true,
            messages: [],
            result: [
              { id: 'pmc-1', status: 'pending' },
              { id: 'pmc-2', status: 'completed' },
            ],
            pagination: {
              count: 2,
              next: limit === '2' ? 'pmc-2' : null,
            },
          });
        })
      );

      const client = createClient();
      const result = await client.paymentCode.list({ limit: 10 });

      expect(result.result).toHaveLength(2);
      expect(result.pagination.count).toBe(2);
    });

    test('should filter by status', async () => {
      let capturedStatus = '';

      server.use(
        http.get('https://api.monime.io/v1/payment-codes', ({ request }) => {
          const url = new URL(request.url);
          capturedStatus = url.searchParams.get('status') || '';

          return HttpResponse.json({
            success: true,
            result: [],
            pagination: { count: 0, next: null },
          });
        })
      );

      const client = createClient();
      await client.paymentCode.list({ status: 'pending' });

      expect(capturedStatus).toBe('pending');
    });
  });

  describe('update', () => {
    test('should update payment code', async () => {
      server.use(
        http.patch('https://api.monime.io/v1/payment-codes/pmc-123', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            success: true,
            messages: [],
            result: {
              id: 'pmc-123',
              name: body.name,
              updateTime: new Date().toISOString(),
            },
          });
        })
      );

      const client = createClient();
      const result = await client.paymentCode.update('pmc-123', {
        name: 'Updated Name',
      });

      expect(result.result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    test('should delete payment code', async () => {
      server.use(
        http.delete('https://api.monime.io/v1/payment-codes/pmc-123', () => {
          return HttpResponse.json({
            success: true,
            messages: ['Payment code deleted'],
          });
        })
      );

      const client = createClient();
      const result = await client.paymentCode.delete('pmc-123');

      expect(result.success).toBe(true);
    });
  });
});
```

---

### 3. E2E Tests

**Purpose**: Test the SDK against the real Monime API (use sparingly).

**Considerations for Payment APIs:**
- **Cost**: Real API calls may incur charges
- **Rate Limits**: Can exhaust API quotas
- **State Management**: Creating/deleting test data is complex
- **Slow Execution**: Network latency makes tests slow
- **Flakiness**: Network issues cause false failures

**Recommendation:**
- **Avoid automated E2E tests** for payment SDKs
- Use **manual testing** or **Postman collections** for smoke tests
- Run E2E tests **only in staging environment** with test credentials
- Use E2E tests for **pre-release validation**, not CI/CD

**If E2E Tests Are Required:**

```typescript
// test/e2e/real-api.test.ts
import { describe, test, expect } from 'vitest';
import { MonimeClient } from '../src/client';

describe('E2E: Real API Tests', () => {
  const client = new MonimeClient({
    spaceId: process.env.MONIME_TEST_SPACE_ID!,
    accessToken: process.env.MONIME_TEST_ACCESS_TOKEN!,
  });

  test.skip('should create and retrieve payment code', async () => {
    // Create
    const createResult = await client.paymentCode.create({
      name: 'E2E Test Payment',
      amount: { currency: 'SLE', value: 1000 },
    });

    expect(createResult.success).toBe(true);
    const paymentCodeId = createResult.result.id;

    // Retrieve
    const getResult = await client.paymentCode.get(paymentCodeId);
    expect(getResult.result.id).toBe(paymentCodeId);

    // Cleanup
    await client.paymentCode.delete(paymentCodeId);
  }, 30000); // 30 second timeout
});
```

---

## What to Test

### 1. HTTP Client (`src/http-client.ts`)

**Critical Tests:**
- ✅ Request construction (URL, headers, body)
- ✅ Authentication headers (space ID, access token)
- ✅ Idempotency key generation and usage
- ✅ Query parameter serialization
- ✅ Response parsing (JSON)
- ✅ Error response handling (4xx, 5xx)
- ✅ Invalid JSON response handling

**Retry Logic:**
- ✅ Retry on 500, 502, 503, 504, 429
- ✅ No retry on 4xx (except 429)
- ✅ No retry on timeout
- ✅ Exponential backoff calculation
- ✅ Respect Retry-After header (429 responses)
- ✅ Max retries enforcement

**Timeout Handling:**
- ✅ Request timeout enforcement
- ✅ Per-request timeout override
- ✅ Timeout error message accuracy
- ✅ No retry after timeout

**Edge Cases:**
- ✅ Empty response body
- ✅ Network errors (DNS failure, connection refused)
- ✅ AbortSignal cancellation
- ✅ Concurrent requests
- ✅ HTTPS enforcement (reject HTTP URLs)

---

### 2. Validation Layer (`src/validation.ts`, `src/schemas.ts`)

**Schema Validation:**
- ✅ Valid inputs pass validation
- ✅ Invalid inputs throw `MonimeValidationError`
- ✅ Error messages are descriptive
- ✅ Field names are correctly identified
- ✅ Nested object validation
- ✅ Array validation
- ✅ Optional vs required fields

**Specific Validations:**
- ✅ ID formats (must start with prefix: `pmc-`, `spc-`, etc.)
- ✅ Currency codes (SLE, USD)
- ✅ Amount values (positive numbers)
- ✅ URL formats (HTTPS only)
- ✅ Phone number formats
- ✅ Email formats
- ✅ Enum values (status, mode, type)
- ✅ String length constraints
- ✅ Number range constraints

**Example Test:**

```typescript
describe('Amount Validation', () => {
  test('should accept valid amount', () => {
    expect(() => validateAmount({ currency: 'SLE', value: 1000 })).not.toThrow();
  });

  test('should reject negative amount', () => {
    expect(() => validateAmount({ currency: 'SLE', value: -100 })).toThrow();
  });

  test('should reject invalid currency', () => {
    expect(() => validateAmount({ currency: 'EUR', value: 100 })).toThrow();
  });

  test('should reject zero amount', () => {
    expect(() => validateAmount({ currency: 'SLE', value: 0 })).toThrow();
  });
});
```

---

### 3. Module Methods (All Modules)

**CRUD Operations:**
- ✅ `create()` - Successful creation
- ✅ `get()` - Retrieve by ID
- ✅ `list()` - Pagination and filtering
- ✅ `update()` - Update fields
- ✅ `delete()` - Deletion

**For Each Module:**
- ✅ PaymentCodeModule
- ✅ PaymentModule
- ✅ CheckoutSessionModule
- ✅ PayoutModule
- ✅ WebhookModule
- ✅ InternalTransferModule
- ✅ FinancialAccountModule
- ✅ FinancialTransactionModule
- ✅ BankModule
- ✅ MomoModule
- ✅ ReceiptModule
- ✅ UssdOtpModule

**Common Tests Per Module:**
- ✅ Input validation before request
- ✅ Correct API endpoint construction
- ✅ Request body serialization
- ✅ Response deserialization
- ✅ Error handling (validation, API errors)
- ✅ Idempotency key usage (POST requests)
- ✅ Optional parameters handling

---

### 4. Error Classes (`src/errors.ts`)

**For Each Error Class:**
- ✅ Correct error name property
- ✅ Message formatting
- ✅ Additional properties (code, field, etc.)
- ✅ Inheritance chain (instanceof checks)
- ✅ Stack trace preservation

**Specific Tests:**
- ✅ `MonimeApiError.isRetryable` logic
- ✅ `MonimeNetworkError.isRetryable` logic
- ✅ `MonimeTimeoutError` message formatting
- ✅ `MonimeValidationError` field and value storage

---

### 5. Client (`src/client.ts`)

**Initialization:**
- ✅ Client instantiation with valid options
- ✅ Client instantiation with invalid options
- ✅ Module initialization (all modules accessible)

**Configuration:**
- ✅ Default configuration values
- ✅ Custom configuration (timeout, retries, baseUrl)
- ✅ Validation toggle (`validateInputs: false`)

---

### 6. Edge Cases

**Rate Limiting:**
- ✅ 429 response with Retry-After header
- ✅ Retry delay calculation
- ✅ Multiple consecutive 429 responses

**Network Errors:**
- ✅ Connection refused
- ✅ DNS resolution failure
- ✅ SSL certificate errors
- ✅ Network timeout

**Malformed Responses:**
- ✅ Invalid JSON
- ✅ Missing fields
- ✅ Unexpected data types
- ✅ Empty response body

**Concurrency:**
- ✅ Multiple simultaneous requests
- ✅ Request isolation (no state leakage)

**Security:**
- ✅ Credentials not logged in errors
- ✅ HTTPS enforcement
- ✅ Header injection prevention

---

## Code Coverage Requirements

### Recommended Thresholds

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 80,        // 80% of lines must be executed
    functions: 80,    // 80% of functions must be called
    branches: 75,     // 75% of branches (if/else) must be taken
    statements: 80,   // 80% of statements must be executed
  },
}
```

### Critical Paths (100% Coverage Required)

These components must have near-perfect coverage due to their criticality:

1. **Validation Layer** (`src/validation.ts`, `src/schemas.ts`)
   - Target: 95%+
   - Rationale: Prevents invalid data from reaching API

2. **Error Handling** (`src/errors.ts`, error paths in HTTP client)
   - Target: 90%+
   - Rationale: Errors must be correctly categorized and retried

3. **HTTP Client Retry Logic** (`src/http-client.ts`)
   - Target: 90%+
   - Rationale: Financial transactions must handle failures correctly

4. **Idempotency Key Generation** (`src/http-client.ts`)
   - Target: 100%
   - Rationale: Prevents duplicate transactions

### Coverage Reporting

**Generate Reports:**
```bash
npm run test:coverage
```

**View HTML Report:**
```bash
open coverage/index.html
```

**CI/CD Enforcement:**
```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    fail_ci_if_error: true
```

**Coverage Badge:**
```markdown
[![codecov](https://codecov.io/gh/atisans/monimejs/branch/main/graph/badge.svg)](https://codecov.io/gh/atisans/monimejs)
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x, 22.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run format:check

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        if: matrix.node-version == '20.x'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Build project
        run: npm run build

  test-e2e:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        env:
          MONIME_TEST_SPACE_ID: ${{ secrets.MONIME_TEST_SPACE_ID }}
          MONIME_TEST_ACCESS_TOKEN: ${{ secrets.MONIME_TEST_ACCESS_TOKEN }}
        run: npm run test:e2e
```

---

### Pre-commit Hooks

Install Husky for Git hooks:

```bash
npm install -D husky lint-staged
```

**Configure Husky:**

```bash
npx husky init
```

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Configure lint-staged in `package.json`:**

```json
{
  "lint-staged": {
    "*.ts": [
      "npm run format",
      "npm run test -- --run --reporter=silent"
    ]
  }
}
```

**Alternative: Run tests only on changed files:**

```json
{
  "lint-staged": {
    "*.ts": [
      "npm run format",
      "vitest related --run --reporter=silent"
    ]
  }
}
```

---

### Pre-push Hook (Recommended)

Run full test suite before push:

Create `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run test:coverage
npm run build
```

---

## Task Checklist

### Phase 1: Setup (Priority: High)

- [ ] **Install Testing Dependencies**
  ```bash
  npm install -D vitest @vitest/coverage-v8 msw
  ```

- [ ] **Create Vitest Configuration**
  - Create `vitest.config.ts` with coverage thresholds
  - Configure test environment, globals, and reporters

- [ ] **Setup MSW**
  - Create `test/mocks/handlers.ts` for API mock handlers
  - Create `test/setup.ts` for MSW server initialization
  - Configure Vitest to use setup file

- [ ] **Update package.json Scripts**
  - Add `test`, `test:watch`, `test:coverage` scripts
  - Add `test:ui` for Vitest UI (optional)

- [ ] **Create Test Directory Structure**
  ```
  test/
  ├── unit/
  │   ├── errors.test.ts
  │   ├── validation.test.ts
  │   └── utils.test.ts
  ├── integration/
  │   ├── http-client.test.ts
  │   ├── payment-code.test.ts
  │   ├── checkout-session.test.ts
  │   └── [other modules].test.ts
  ├── e2e/
  │   └── real-api.test.ts
  ├── mocks/
  │   └── handlers.ts
  └── setup.ts
  ```

---

### Phase 2: Unit Tests (Priority: High)

- [ ] **Error Classes Tests**
  - `MonimeError` instantiation
  - `MonimeApiError` with all properties
  - `MonimeApiError.isRetryable` logic (429, 500, 502, 503, 504)
  - `MonimeTimeoutError` with timeout and URL
  - `MonimeValidationError` with field and value
  - `MonimeNetworkError` with cause

- [ ] **Validation Tests**
  - `validateClientOptions` (valid and invalid)
  - All ID validation functions (`validatePaymentCodeId`, etc.)
  - Input validation functions (create and update inputs)
  - Schema validation (amounts, currencies, URLs)
  - Edge cases (empty strings, null, undefined)

- [ ] **Utility Functions** (if any)
  - Date/time parsing
  - String formatting
  - Type guards

---

### Phase 3: Integration Tests (Priority: High)

- [ ] **HTTP Client Tests**
  - Successful requests (GET, POST, PATCH, DELETE)
  - Request headers (authentication, content-type)
  - Idempotency key generation and usage
  - Query parameter serialization
  - Response parsing
  - Error responses (400, 401, 403, 404, 500)
  - Invalid JSON responses

- [ ] **HTTP Client Retry Tests**
  - Retry on 500, 502, 503, 504
  - Retry on 429 with Retry-After header
  - No retry on 4xx (except 429)
  - No retry on timeout
  - Exponential backoff
  - Max retries enforcement

- [ ] **HTTP Client Timeout Tests**
  - Timeout enforcement
  - Per-request timeout override
  - No retry after timeout

- [ ] **HTTP Client Edge Cases**
  - AbortSignal cancellation
  - Network errors
  - Concurrent requests

---

### Phase 4: Module Tests (Priority: Medium)

For each module, test:

- [ ] **PaymentCodeModule**
  - `create()`, `get()`, `list()`, `update()`, `delete()`
  - Input validation
  - Idempotency key usage

- [ ] **CheckoutSessionModule**
  - `create()`, `get()`, `list()`
  - Line items validation

- [ ] **PayoutModule**
  - `create()`, `get()`, `list()`, `update()`
  - Destination types (bank, momo, wallet)

- [ ] **WebhookModule**
  - `create()`, `get()`, `list()`, `update()`, `delete()`
  - Verification method types

- [ ] **InternalTransferModule**
  - `create()`, `get()`, `list()`, `update()`
  - Financial account references

- [ ] **FinancialAccountModule**
  - `create()`, `get()`, `list()`, `update()`, `delete()`
  - Balance queries

- [ ] **FinancialTransactionModule**
  - `get()`, `list()`
  - Filtering by account, reference, type

- [ ] **PaymentModule**
  - `get()`, `list()`, `update()`
  - Read-only operations

- [ ] **BankModule**
  - `get()`, `list()`, `listByCountry()`
  - Provider ID validation

- [ ] **MomoModule**
  - `get()`, `list()`, `listByCountry()`
  - Provider ID validation

- [ ] **ReceiptModule**
  - `get()`, `redeem()`
  - Entitlement redemption

- [ ] **UssdOtpModule**
  - `create()`, `get()`, `list()`
  - Phone number validation

---

### Phase 5: Client Tests (Priority: Low)

- [ ] **MonimeClient Initialization**
  - Valid options
  - Invalid options (should throw)
  - All modules accessible

- [ ] **Configuration Overrides**
  - Custom baseUrl, timeout, retries
  - `validateInputs: false`

---

### Phase 6: Coverage & CI/CD (Priority: High)

- [ ] **Coverage Report Generation**
  - Run `npm run test:coverage`
  - Verify thresholds are met

- [ ] **Coverage Upload**
  - Setup Codecov account
  - Add `CODECOV_TOKEN` to GitHub secrets

- [ ] **GitHub Actions Workflow**
  - Create `.github/workflows/test.yml`
  - Test on Node 20.x and 22.x
  - Fail on coverage drop

- [ ] **Pre-commit Hooks**
  - Install Husky and lint-staged
  - Run formatter and tests on staged files

- [ ] **Coverage Badge**
  - Add badge to README.md

---

### Phase 7: Documentation (Priority: Medium)

- [ ] **Testing Guide in README**
  - How to run tests
  - How to run with coverage
  - How to run watch mode

- [ ] **Example Tests**
  - Add example tests to docs/examples/

- [ ] **Contributing Guide**
  - Testing requirements for PRs
  - Coverage expectations

---

### Phase 8: E2E Tests (Priority: Low, Optional)

- [ ] **Staging Environment Setup**
  - Create test Monime account
  - Generate test API keys

- [ ] **E2E Test Suite**
  - Payment code lifecycle
  - Checkout session flow
  - Payout flow
  - Webhook creation

- [ ] **E2E CI/CD Integration**
  - Run only on main branch
  - Use GitHub secrets for credentials

---

## Summary

**Estimated Effort:**
- **Phase 1 (Setup)**: 2-4 hours
- **Phase 2 (Unit Tests)**: 8-12 hours
- **Phase 3 (Integration Tests)**: 12-16 hours
- **Phase 4 (Module Tests)**: 20-30 hours
- **Phase 5 (Client Tests)**: 2-4 hours
- **Phase 6 (Coverage & CI/CD)**: 4-6 hours
- **Phase 7 (Documentation)**: 2-4 hours
- **Phase 8 (E2E Tests)**: 8-12 hours (optional)

**Total**: 58-88 hours (excluding E2E)

**Priority Sequence:**
1. Setup + HTTP Client Tests (Core functionality)
2. Validation Tests (Prevent bad data)
3. Module Tests (Business logic)
4. CI/CD Integration (Automation)
5. Documentation (Team onboarding)
6. E2E Tests (Optional, manual testing preferred)

**Success Metrics:**
- ✅ 80%+ overall code coverage
- ✅ 95%+ validation layer coverage
- ✅ 90%+ HTTP client coverage
- ✅ All critical error paths tested
- ✅ CI/CD pipeline enforcing coverage
- ✅ Pre-commit hooks preventing regressions

---

**Next Steps:**
1. Install Vitest and MSW
2. Create basic test structure
3. Start with HTTP client integration tests (highest ROI)
4. Add validation tests
5. Iterate through modules
6. Setup CI/CD
7. Celebrate 🎉
