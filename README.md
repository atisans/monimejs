# monimejs

Unofficial lightweight and easy js/ts SDK for interacting with monime's endpoints.

![npm version](https://img.shields.io/npm/v/monimejs.svg)
![npm downloads](https://img.shields.io/npm/dm/monimejs.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-%3E=20-green.svg)
![License](https://img.shields.io/badge/license-Apache_2.0-lightgrey.svg)

---

## Table of Contents

- **[Features](#features)**
- **[Installation](#installation)**
- **[Environment Variables](#environment-variables)**
- **[Quick Start](#quick-start)**
- **[Error Handling](#error-handling)**
- **[Timeout & Retry](#timeout--retry)**
- **[AbortController](#abortcontroller)**
- **[Idempotency](#idempotency)**
- **[Contributing](#contributing)**
- **[License](#license)**

---

## Features

- [x] **Complete API coverage** for 12 resource modules:
  - [x] Payment Codes
  - [x] Payments
  - [x] Financial Accounts
  - [x] Financial Transactions
  - [x] Checkout Sessions
  - [x] Payouts
  - [x] Webhooks
  - [x] Internal Transfers
  - [x] Receipts
  - [x] Banks
  - [x] Mobile Money Providers
  - [x] USSD OTP
- [x] **Client-based** auth: set credentials once per instance
- [x] **Predictable** return shape fully typed: `{ success, result, messages }` and `{ success, messages }` for lists with pagination
- [x] **Error handling** with typed error classes and validation details
- [x] **Timeout configuration** with per-request overrides
- [x] **Retry logic** with exponential backoff and Retry-After header support
- [x] **AbortController support** for request cancellation
- [x] **Input validation** with detailed field-level error messages
- [x] **Idempotency** keys auto-generated for POST requests

---

## Installation

```bash
npm install monimejs
```

---

## Environment Variables

Recommended to store credentials in `.env`:

```bash
MONIME_SPACE_ID=spc-your-space-id
MONIME_ACCESS_TOKEN=your-access-token
```

> **Note:** The space ID must start with `spc-` prefix.

You can also pass credentials directly when creating the client.

---

## Quick Start

### Create a client

```ts
import { MonimeClient } from "monimejs";

const client = new MonimeClient({
  spaceId: process.env.MONIME_SPACE_ID!,
  accessToken: process.env.MONIME_ACCESS_TOKEN!,
});
```

Now all methods use the client's credentials automatically.

- **Authentication**: Both values are required. Prefer environment variables.
- **Headers**: SDK automatically sets `Authorization` and `Monime-Space-Id` for each call.

### Payment Codes

```ts
// Create a payment code
const { result: paymentCode } = await client.paymentCode.create({
  name: "Order #1234",
  amount: { currency: "SLE", value: 1000 },
});

// Get a payment code
const { result } = await client.paymentCode.get("pmc-xxx");

// List payment codes
const { result: codes, pagination } = await client.paymentCode.list({
  status: "pending",
  limit: 10,
});

// Update a payment code
await client.paymentCode.update("pmc-xxx", { name: "Updated Name" });

// Delete a payment code
await client.paymentCode.delete("pmc-xxx");
```

### Other Modules

The SDK includes the following additional modules:

- **`client.financialTransaction`** - View immutable transaction ledger (`get`, `list`)
- **`client.internalTransfer`** - Transfer between financial accounts (`create`, `get`, `list`, `update`)
- **`client.checkoutSession`** - Create and manage hosted payment pages (`create`, `get`, `list`)
- **`client.payout`** - Disburse funds to external accounts (`create`, `get`, `list`, `update`, `delete`)
- **`client.webhook`** - Subscribe to payment and transaction events (`create`, `get`, `list`, `update`, `delete`)
- **`client.receipt`** - Manage digital receipts and entitlements (`get`, `redeem`)
- **`client.bank`** - List and query bank providers by country (`list`, `get`)
- **`client.momo`** - List and query mobile money providers (`list`, `get`)
- **`client.ussdOtp`** - Create USSD-based phone verification sessions (`create`, `get`, `list`)

For complete type definitions and API details, see [docs/examples](./docs/examples/README.md).

---

## Error Handling

The SDK provides typed error classes for different failure scenarios:

```ts
import {
  MonimeClient,
  MonimeApiError,
  MonimeTimeoutError,
  MonimeValidationError,
  MonimeNetworkError,
} from "monimejs";

try {
  await client.paymentCode.get("pmc-xxx");
} catch (error) {
  if (error instanceof MonimeApiError) {
    // API returned an error (4xx, 5xx)
    console.log(error.code);    // HTTP status code
    console.log(error.reason);  // Error reason from API
    console.log(error.message); // Error message
  } else if (error instanceof MonimeTimeoutError) {
    // Request timed out
    console.log(error.timeout); // Timeout value in ms
  } else if (error instanceof MonimeValidationError) {
    // Input validation failed
    console.log(error.issues);  // Array of validation issues
    error.issues.forEach((issue) => {
      console.log(`${issue.field}: ${issue.message}`);
    });
  } else if (error instanceof MonimeNetworkError) {
    // Network error (connection refused, DNS failure, etc.)
    console.log(error.cause);   // Original error
  }
}
```

---

## Timeout & Retry

### Configuration

```ts
const client = new MonimeClient({
  spaceId: process.env.MONIME_SPACE_ID!,
  accessToken: process.env.MONIME_ACCESS_TOKEN!,
  timeout: 30000,      // 30 seconds (default)
  retries: 2,          // Retry up to 2 times (default)
  retryDelay: 1000,    // Start with 1s delay (default)
  retryBackoff: 2,     // Double delay each retry (default)
});
```

### Per-Request Overrides

```ts
// Longer timeout for slow operations
const { result, pagination } = await client.paymentCode.list({
  status: "pending",
  limit: 10,
}, {
  timeout: 60000,
});

// Disable retries for specific request
await client.paymentCode.create(input, {
  retries: 0,
});
```

The SDK automatically retries on:
- Network errors (connection reset, DNS failure)
- HTTP 429 (rate limited)
- HTTP 500, 502, 503, 504 (server errors)

For more details, see [docs/FEATURE_REFERENCE.md](./docs/FEATURE_REFERENCE.md).

---

## AbortController

Cancel requests using the standard `AbortController` API:

```ts
const controller = new AbortController();

// Start request
const promise = client.paymentCode.get("pmc-xxx", {
  signal: controller.signal,
});

// Cancel it
controller.abort();

// Handle cancellation
try {
  await promise;
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request was cancelled");
  }
}
```

---

## Idempotency

For POST endpoints, the SDK automatically adds an `Idempotency-Key` header. This helps prevent duplicate requests if you retry the same call. Keys are auto-generated using `crypto.randomUUID()`.

You can provide a custom idempotency key:

```ts
await client.paymentCode.create(input, {
  idempotencyKey: "my-custom-key",
});
```

---

## Contributing

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## License

Apache 2.0 — see [LICENSE](./LICENSE).
