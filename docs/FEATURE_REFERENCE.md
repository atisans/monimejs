# Implementation Reference

Technical details for contributors and those curious about how features are implemented.

---

## Architecture Overview

```
MonimeClient
├── bank: BankModule
├── financialAccount: FinancialAccountModule
├── financialTransaction: FinancialTransactionModule
├── paymentCode: PaymentCodeModule
├── payment: PaymentModule
├── checkoutSession: CheckoutSessionModule
├── payout: PayoutModule
├── webhook: WebhookModule
├── internalTransfer: InternalTransferModule
├── momo: MomoModule
├── receipt: ReceiptModule
└── ussdOtp: UssdOtpModule
    └── All modules use → MonimeHttpClient
                              ├── Timeout handling
                              ├── Retry with backoff
                              ├── AbortController support
                              └── Input validation
```

---

## 1. HTTP Client (`src/http-client.ts`)

### Request Flow

```
request() → build_url() → build_headers() → execute_with_retry() → execute_request()
                                                      ↓
                                              Retry loop with backoff
                                                      ↓
                                              fetch() with combined signals
```

### Timeout Implementation

Uses manual `AbortController` + `setTimeout` (not `AbortSignal.timeout()` for cleanup control):

```typescript
const timeout_controller = new AbortController();
const timeout_id = setTimeout(() => timeout_controller.abort(), timeout);

try {
  await fetch(url, { signal: timeout_controller.signal });
} finally {
  clearTimeout(timeout_id); // Always cleanup
}
```

**Why not `AbortSignal.timeout()`?** We need to clear the timeout on success to prevent memory leaks in long-running processes.

### Signal Combination

Combines user signal + timeout signal using `AbortSignal.any()` (Node 20+):

```typescript
const signals = [timeout_controller.signal];
if (external_signal) signals.push(external_signal);
const combined = AbortSignal.any(signals);
```

After abort, we check which signal fired to throw the right error:
- `timeout_controller.signal.aborted` → `MonimeTimeoutError`
- `external_signal.aborted` → Re-throw `AbortError`

### Retry Logic

**Retryable conditions:**
- Network errors (`MonimeNetworkError`)
- HTTP 429, 500, 502, 503, 504

**Backoff formula:**
```typescript
delay = retryDelay * (retryBackoff ^ attempt) + random(0-500ms)
```

**Retry-After header:** Parsed from 429 responses, supports both seconds and HTTP-date formats.

### JSON Parsing Safety

```typescript
let data: unknown;
try {
  data = await res.json();
} catch {
  throw new MonimeApiError("Invalid JSON response...", res.status, "invalid_json", []);
}
```

Prevents crashes when server returns HTML error pages (proxies, CDNs).

---

## 2. Validation (`src/validation.ts` + `src/schemas.ts`)

### Schema Library

Uses [Valibot](https://valibot.dev/) (~10KB) for schema validation.

### Validation Points

| When | What | Schema |
|------|------|--------|
| Client init | `spaceId`, `accessToken`, `baseUrl` | `ClientOptionsSchema` |
| Before request | Resource IDs (`pmc-*`, `pay-*`, etc.) | `*IdSchema` |
| Before create | Input fields | `Create*InputSchema` |
| Before update | Update fields | `Update*InputSchema` |
| List params | `limit` (1-50) | `LimitSchema` |

### ID Prefix Validation

Each resource type has a required prefix:

| Resource | Prefix |
|----------|--------|
| Payment Code | `pmc-` |
| Payment | `pay-` |
| Checkout Session | `cos-` |
| Payout | `pot-` |
| Webhook | `whk-` |
| Internal Transfer | `trn-` |
| USSD OTP | `uop-` |

### HTTPS Enforcement

```typescript
if (options.baseUrl !== undefined && !options.baseUrl.startsWith("https://")) {
  throw new MonimeValidationError("baseUrl must use HTTPS for security", [
    {
      message: "baseUrl must use HTTPS for security",
      field: "baseUrl",
      value: options.baseUrl,
    },
  ]);
}
```

---

## 3. Error Classes (`src/errors.ts`)

### Hierarchy

```
MonimeError (base)
├── MonimeApiError      - API returned 4xx/5xx
├── MonimeTimeoutError  - Request timed out
├── MonimeValidationError - Input validation failed
└── MonimeNetworkError  - Connection failed
```

### Prototype Fix

All error classes include prototype chain fix for proper `instanceof` checks:

```typescript
constructor(message: string) {
  super(message);
  Object.setPrototypeOf(this, new.target.prototype);
}
```

### Retryable Detection

```typescript
// MonimeApiError
get isRetryable(): boolean {
  return [429, 500, 502, 503, 504].includes(this.code);
}

// MonimeNetworkError
get isRetryable(): boolean {
  return true; // Network errors are always retryable
}
```

---

## 4. Module Pattern (`src/*-module.ts`)

Each module follows the same pattern:

```typescript
export class XxxModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  async create(input, config?) {
    if (this.http_client.should_validate) {
      validate(CreateXxxInputSchema, input);
    }
    return this.http_client.request({
      method: "POST",
      path: "/xxx",
      body: input,
      config,
    });
  }

  async get(id, config?) { /* validate ID, GET request */ }
  async list(params?, config?) { /* validate limit, GET with query params */ }
  async update(id, input, config?) { /* validate ID + input, PATCH request */ }
  async delete(id, config?) { /* validate ID, DELETE request */ }
}
```

### Idempotency Keys

Auto-generated for POST requests using `crypto.randomUUID()`:

```typescript
if (method === "POST") {
  headers["Idempotency-Key"] = idempotency_key ?? crypto.randomUUID();
}
```

**Note:** Idempotency keys are auto-generated internally in `http-client.ts` and passed via `RequestConfig.idempotencyKey` from modules.

---

## 5. Type System (`src/types.ts`)

### Response Wrappers

```typescript
type ApiResponse<T> = { success: boolean; messages: string[]; result: T };
type ApiListResponse<T> = { success: boolean; messages: string[]; result: T[]; pagination: PaginationInfo };
type ApiDeleteResponse = { success: boolean; messages: string[] };
```

### Client Configuration

```typescript
type ClientOptions = {
  spaceId: string;           // Required, must start with "spc-"
  accessToken: string;       // Required
  baseUrl?: string;          // Default: "https://api.monime.io"
  timeout?: number;          // Default: 30000ms
  retries?: number;          // Default: 2
  retryDelay?: number;       // Default: 1000ms
  retryBackoff?: number;     // Default: 2
  validateInputs?: boolean;  // Default: true
};

type RequestConfig = {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  idempotencyKey?: string;
};
```

---

## 6. Build System

### esbuild Configuration

```bash
esbuild src/index.ts \
  --bundle \
  --format=esm \
  --outfile=dist/index.js \
  --target=node20 \
  --minify \
  --tree-shaking=true \
  --external:valibot
```

- **ESM only** - No CommonJS build
- **Node 20+** - Required for `AbortSignal.any()`
- **External valibot** - Not bundled, listed as dependency
- **Minified** - ~20KB output

### TypeScript Declaration Generation

```bash
dts-bundle-generator -o dist/index.d.ts src/index.ts --no-banner
```

Generates bundled `.d.ts` file for type hints in consumers. All types are merged into a single file for distribution.

---

## 7. Naming Conventions

| Scope | Convention | Example |
|-------|------------|---------|
| Public API | camelCase | `paymentCode.create()`, `financialAccount.get()` |
| Private members | snake_case | `http_client`, `build_url()`, `execute_request()` |
| Private getters | snake_case | `should_validate` |
| Constants | UPPER_SNAKE | `API_VERSION`, `DEFAULT_TIMEOUT` |
| Types | PascalCase | `ClientOptions`, `PaymentCode` |
| Request methods | UPPER_CASE | `GET`, `POST`, `PATCH`, `DELETE` |

---

## 8. Modules Overview

All modules follow the standard pattern and support CRUD operations where applicable.

| Module | File | Purpose | Operations |
|--------|------|---------|------------|
| `bank` | `src/bank.ts` | Retrieve bank provider information | `list(params)`, `get(providerId)` |
| `financialAccount` | `src/financial-account.ts` | Manage digital wallets/accounts | `create`, `get`, `list`, `update`, `getBalance` |
| `financialTransaction` | `src/financial-transaction.ts` | View immutable transaction ledger | `get`, `list` (read-only) |
| `paymentCode` | `src/payment-code.ts` | Create USSD payment links | `create`, `get`, `list`, `update`, `delete` |
| `payment` | `src/payment.ts` | View payments created by payment codes | `get`, `list`, `update` (read-mostly) |
| `checkoutSession` | `src/checkout-session.ts` | Hosted payment page sessions | `create`, `get`, `list` |
| `payout` | `src/payout.ts` | Disburse funds to external accounts | `create`, `get`, `list`, `update`, `delete` |
| `webhook` | `src/webhook.ts` | Event notification subscriptions | `create`, `get`, `list`, `update`, `delete` |
| `internalTransfer` | `src/internal-transfer.ts` | Transfer between financial accounts | `create`, `get`, `list`, `update` |
| `momo` | `src/momo.ts` | Retrieve mobile money provider info | `list(params)`, `get(providerId)` |
| `receipt` | `src/receipt.ts` | Manage digital receipts with entitlements | `get`, `redeem` |
| `ussdOtp` | `src/ussd-otp.ts` | USSD-based phone verification | `create`, `get`, `list` |

### Module Constructor Pattern

All modules receive the HTTP client singleton in their constructor:

```typescript
export class XxxModule {
  private http_client: MonimeHttpClient;
  
  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }
}
```

Modules are instantiated once in `MonimeClient` constructor and reused for the client's lifetime.

---

## Key Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `valibot` | Schema validation | ~10KB |

**Build Output:**
- `dist/index.js` - Minified bundle | ~20KB
- `dist/index.d.ts` - Type declarations | Bundled single file

**Dev dependencies:**
- `esbuild` - Fast bundler for production build
- `typescript` - TypeScript compiler
- `dts-bundle-generator` - Bundles .d.ts files
- `@biomejs/biome` - Code linting/formatting
- `@changesets/cli` - Changelog and version management
- `@types/node` - Node.js type definitions

---

## Testing Strategy

See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for comprehensive testing guidelines and examples.
