# monimejs

Unofficial _(meaning not made by the Monime team)_, lightweight and easy js/ts SDK for interacting with monime's endpoints.

![npm version](https://img.shields.io/npm/v/monimejs.svg)
![npm downloads](https://img.shields.io/npm/dm/monimejs.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-%3E=14-green.svg)
![License](https://img.shields.io/badge/license-Apache_2.0-lightgrey.svg)

---

## Table of Contents

- **[Features](#features)**
- **[Installation](#installation)**
- **[Environment Variables](#environment-variables)**
- **[Quick Start](#quick-start)**
- **[Idempotency](#idempotency)**
- **[Contributing](#contributing)**
- **[License](#license)**

---

## Features

- [ ] **Full API coverage** for all Monime endpoints
- [ ] **Client-based** auth: set credentials once per instance
- [ ] **Predictable** return shape: `{ success, data?, error? }`
- [ ] **Bank transfers** and digital wallet integrations

---

## Installation

```bash
npm install monimejs
```

---

## Environment Variables

Recommended to store credentials in `.env`:

```bash
MONIME_SPACE_ID=space_XXXXXXXX
MONIME_ACCESS_TOKEN=sk_access_token
```

You can also pass credentials directly when creating the client.

---

## Quick Start

### Create a client

```ts
import { MonimeClient } from "monimejs";

const client = new MonimeClient({
  monimeSpaceId: process.env.MONIME_SPACE_ID!,
  accessToken: process.env.MONIME_ACCESS_TOKEN!,
});
```

Now all methods use the client’s credentials automatically.

- **Authentication**: Both values are required. Prefer environment variables.
- **Headers**: SDK automatically sets `Authorization` and `Monime-Space-Id` for each call.

---

## Idempotency

For POST endpoints, the SDK automatically adds an `Idempotency-Key` header. This helps prevent duplicate requests if you retry the same call. Keys are generated per module instance.
> you can change the key by passing a custom `idempotencyKey` option.

---

## Contributing

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## License

MIT — see [LICENSE](./LICENSE).
