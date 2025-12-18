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
| [bank.js](./bank.js) | List and retrieve bank providers |
| [financial-account.js](./financial-account.js) | Create and manage financial accounts |
| [financial-transaction.js](./financial-transaction.js) | Retrieve and list financial transactions |
| [momo.js](./momo.js) | List and retrieve mobile money providers |
| [payment-code.js](./payment-code.js) | Create and manage USSD payment codes |
| [payment.js](./payment.js) | Retrieve and list payments |
| [checkout-session.js](./checkout-session.js) | Hosted checkout pages |
| [payout.js](./payout.js) | Disbursements to mobile money, bank, wallet |
| [webhook.js](./webhook.js) | Webhook management and signature verification |
| [internal-transfer.js](./internal-transfer.js) | Transfer funds between accounts |
| [receipt.js](./receipt.js) | Retrieve and redeem customer entitlements |
| [ussd-otp.js](./ussd-otp.js) | Phone verification via USSD |
| [error-handling.js](./error-handling.js) | Handle SDK errors |
| [request-config.js](./request-config.js) | Timeouts, retries, abort signals |
