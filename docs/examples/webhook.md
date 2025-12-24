# Webhook Examples

Webhooks provide real-time event notifications to your server. Configure webhooks to receive instant updates on payments, payouts, checkout sessions, and other platform events. Choose between HMAC or ECDSA signature verification for security.

## create with HMAC verification

Create a webhook with HMAC-SHA256 signature verification (symmetric key, requires secret minimum 32 characters).

```javascript
const { success, result } = await client.webhook.create({
  name: "Production Webhook",
  url: "https://yoursite.com/webhooks/monime",
  apiRelease: "caph",
  events: ["payment.completed", "payment.failed", "payout.completed"],
  verificationMethod: {
    type: "HS256",
    secret: "your-32-character-minimum-secret-key-here",
  },
  alertEmails: ["alerts@yoursite.com"],
  metadata: {
    environment: "production",
  },
});
```

## create with ECDSA verification

Create a webhook with ECDSA-SHA256 signature verification (asymmetric key pair, automatically generated).

```javascript
const { success, result } = await client.webhook.create({
  name: "Secure ECDSA Webhook",
  url: "https://yoursite.com/webhooks/monime-secure",
  apiRelease: "caph",
  events: [
    "payment.completed",
    "payment.failed",
    "payout.completed",
    "payout.failed",
  ],
  verificationMethod: {
    type: "ES256",
  },
  alertEmails: ["security@yoursite.com"],
});
```

## create with custom headers

Add custom headers to webhook requests for additional authentication or routing.

```javascript
const { success, result } = await client.webhook.create({
  name: "Authenticated Webhook",
  url: "https://yoursite.com/webhooks/monime",
  apiRelease: "caph",
  events: ["payment.completed", "checkout_session.completed"],
  verificationMethod: {
    type: "HS256",
    secret: "minimum-32-character-secret-for-production",
  },
  headers: {
    "X-Custom-Auth": "your-auth-token-here",
    "X-Environment": "production",
  },
});
```

## get

Retrieve detailed information about a specific webhook including its configuration and status.

```javascript
const { success, result } = await client.webhook.get(webhookId);
```

## list

List all webhooks in your space with pagination support.

```javascript
const { success, result, pagination } = await client.webhook.list();
```

## update - enable

Re-enable a webhook to start receiving events.

```javascript
const { success, result } = await client.webhook.update(webhookId, {
  enabled: true,
});
```

## update - disable

Disable a webhook to temporarily stop receiving events without deleting it.

```javascript
const { success, result } = await client.webhook.update(webhookId, {
  enabled: false,
});
```

## update configuration

Update webhook URL, events, or other settings.

```javascript
const { success, result } = await client.webhook.update(webhookId, {
  url: "https://yoursite.com/webhooks/monime-v2",
  events: [
    "payment.completed",
    "payment.failed",
    "payout.completed",
    "checkout_session.completed",
  ],
});
```

## delete

Permanently delete a webhook and stop receiving events.

```javascript
await client.webhook.delete(webhookId);
```
