# Examples

This directory contains usage examples for each module in the monimejs SDK.

## Setup

Before using any examples, initialize the client:

```js
import { MonimeClient } from "monimejs";

const client = new MonimeClient({
  spaceId: process.env.MONIME_SPACE_ID,
  accessToken: process.env.MONIME_ACCESS_TOKEN,
});
```

Store your credentials in a `.env` file:

```bash
MONIME_SPACE_ID=spc-your-space-id
MONIME_ACCESS_TOKEN=your-access-token
```

## Examples

| File | Description |
|------|-------------|
| [bank.md](./bank.md) | List and retrieve bank providers |
| [financial-account.md](./financial-account.md) | Create and manage financial accounts |
| [financial-transaction.md](./financial-transaction.md) | Retrieve and list financial transactions |
| [momo.md](./momo.md) | List and retrieve mobile money providers |
| [payment-code.md](./payment-code.md) | Create and manage USSD payment codes |
| [payment.md](./payment.md) | Retrieve and list payments |
| [checkout-session.md](./checkout-session.md) | Hosted checkout pages |
| [payout.md](./payout.md) | Disbursements to mobile money, bank, wallet |
| [webhook.md](./webhook.md) | Webhook management and signature verification |
| [internal-transfer.md](./internal-transfer.md) | Transfer funds between accounts |
| [receipt.md](./receipt.md) | Retrieve and redeem customer entitlements |
| [ussd-otp.md](./ussd-otp.md) | Phone verification via USSD |
| [error-handling.md](./error-handling.md) | Handle SDK errors |
| [request-config.md](./request-config.md) | Timeouts, retries, abort signals |
