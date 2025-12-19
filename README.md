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

- [x] **Full API coverage** for Payment Codes and Payments endpoints
- [x] **Client-based** auth: set credentials once per instance
- [x] **Predictable** return shape fully typed: `{ success, result, messages }`
- [x] **Error handling** with typed error classes
- [x] **Timeout configuration** with per-request overrides
- [x] **Retry logic** with exponential backoff
- [x] **AbortController support** for request cancellation
- [x] **Input validation** with clear error messages

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

### Payments

```ts
// Get a payment
const { result: payment } = await client.payment.get("pay-xxx");

// List payments
const { result: payments, pagination } = await client.payment.list({
  limit: 20,
});

// Update a payment
await client.payment.update("pay-xxx", { name: "Updated" });
```

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
    console.log(error.field);   // Which field failed
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
const { result } = await client.paymentCode.list({}, {
  timeout: 60000,
});

// Disable retries for specific request
await client.paymentCode.create(input, undefined, {
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

### Svelte 5 Example

```svelte
<script>
  let { id } = $props();
  let payment = $state(null);

  $effect(() => {
    const controller = new AbortController();

    client.paymentCode.get(id, { signal: controller.signal })
      .then(({ result }) => (payment = result))
      .catch((e) => {
        if (e.name !== "AbortError") handleError(e);
      });

    return () => controller.abort(); // Cleanup on unmount or id change
  });
</script>
```

---

## Idempotency

For POST endpoints, the SDK automatically adds an `Idempotency-Key` header. This helps prevent duplicate requests if you retry the same call. Keys are auto-generated using `crypto.randomUUID()`.

You can provide a custom idempotency key:

```ts
await client.paymentCode.create(input, "my-custom-key");
```

---

## Contributing

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)

### Development Workflow

This project uses **Changesets** for version management and automated publishing:

1. **Make changes** to the codebase
2. **Add a changeset**: `npm run changeset`
   - Select version bump type (patch/minor/major)
   - Describe your changes
3. **Commit** the changeset file with your code
4. **PR to main** triggers automated version bump and publishing

### Release Process

- **CI/CD**: GitHub Actions automatically build and test
- **Publishing**: Changesets create release PRs and publish to npm
- **Changelog**: Automatically generated from changeset descriptions

### Local Development

```bash
# Install dependencies
npm install

# Build the library
npm run build:clean

# Add a changeset for your changes
npm run changeset

# Format code
npm run format
```

---

## License

Apache 2.0 — see [LICENSE](./LICENSE).
