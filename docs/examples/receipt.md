# Receipt Examples

Receipts serve as proof of what a customer is entitled to claim, such as tickets, vouchers, credits, or digital rights. Track entitlements and manage redemptions with idempotent operations.

## get

Retrieve receipt details including entitlements, usage limits, and current redemption status.

```javascript
const { success, result } = await client.receipt.get("ORDER-12345");
```

## redeem all

Redeem all available entitlements on a receipt at once.

```javascript
const { success, result } = await client.receipt.redeem(
  "ORDER-12345",
  { redeemAll: true },
  "unique-idempotency-key-001",
);
```

## redeem specific entitlements

Redeem specific entitlements with specified units, useful for tickets or vouchers.

```javascript
const { success, result } = await client.receipt.redeem(
  "ORDER-12345",
  {
    entitlements: [
      { key: "ticket-general", units: 2 },
      { key: "voucher-drink", units: 1 },
    ],
  },
  "unique-idempotency-key-002",
);
```

## redeem single unit

Redeem a single unit of an entitlement, useful for scanning one ticket at a time.

```javascript
const { success, result } = await client.receipt.redeem(
  "ORDER-12345",
  {
    entitlements: [{ key: "ticket-vip" }],
  },
  "unique-idempotency-key-003",
);
```

## redeem with metadata

Redeem entitlements while adding metadata for audit trail (POS ID, location, staff, timestamp).

```javascript
const { success, result } = await client.receipt.redeem(
  "ORDER-12345",
  {
    entitlements: [{ key: "ticket-general", units: 1 }],
    metadata: {
      redeemedBy: "staff-123",
      location: "entrance-gate-a",
      deviceId: "scanner-001",
      timestamp: new Date().toISOString(),
    },
  },
  "unique-idempotency-key-004",
);
```
