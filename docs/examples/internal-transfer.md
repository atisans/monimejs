# Internal Transfer Examples

Internal transfers move funds between financial accounts within the same Space. Use for user wallet management, escrow handling, float management, and business settlements.

## create

Create a fund transfer between two financial accounts in your space.

```javascript
const { success, result } = await client.internalTransfer.create({
  amount: {
    currency: "SLE",
    value: amount,
  },
  sourceFinancialAccount: {
    id: sourceId,
  },
  destinationFinancialAccount: {
    id: destinationId,
  },
  description: "Internal fund transfer",
  metadata: {
    transferType: "basic",
  },
});
```

## get

Retrieve transfer details including status, amount, source, and destination accounts.

```javascript
const { success, result } = await client.internalTransfer.get(transferId);
```

## list

List all transfers in your space with pagination support.

```javascript
const { success, result, pagination } = await client.internalTransfer.list();
```

## list by source account

Get all transfers from a specific source account for auditing.

```javascript
const { success, result } = await client.internalTransfer.list({
  sourceFinancialAccountId: sourceAccountId,
});
```

## list by destination account

Get all transfers to a specific destination account for reconciliation.

```javascript
const { success, result } = await client.internalTransfer.list({
  destinationFinancialAccountId: destinationAccountId,
});
```

## list by status

Filter transfers by status (processing, completed, failed).

```javascript
const { success, result } = await client.internalTransfer.list({
  status: "completed",
});
```

## update

Update transfer description or metadata for internal tracking.

```javascript
const { success, result } = await client.internalTransfer.update(transferId, {
  description: "Updated description",
  metadata: { note: "Corrected details" },
});
```

## delete

Cancel and remove a transfer. Can only delete if not yet processed.

```javascript
const { success, success } = await client.internalTransfer.delete(transferId);
```


## User wallet top-up

Transfer funds from operational account to a user's wallet account.

```javascript
const { success, result } = await client.internalTransfer.create({
  amount: {
    currency: "SLE",
    value: amount,
  },
  sourceFinancialAccount: {
    id: "fa-operational-float",
  },
  destinationFinancialAccount: {
    id: `fa-user-wallet-${userId}`,
  },
  description: `Wallet top-up for user ${userId}`,
  metadata: {
    userId: userId,
    transferType: "wallet_topup",
  },
});

if (!success) {
  throw new Error(`Failed to create internal transfer: ${transfer.error}`);
}
```
## Escrow create

Lock funds in an escrow account when a buyer initiates a purchase.

```javascript
const { success, result } = await client.internalTransfer.create({
  amount: {
    currency: "SLE",
    value: amount,
  },
  sourceFinancialAccount: {
    id: `fa-user-wallet-${buyerId}`,
  },
  destinationFinancialAccount: {
    id: "fa-escrow-account",
  },
  description: `Escrow for order ${orderId}`,
  metadata: {
    transferType: "escrow_create",
    orderId: orderId,
    buyerId: buyerId,
    sellerId: sellerId,
  },
});
```

## Escrow release

Release escrowed funds to the seller after order completion or approval.

```javascript
const { success, result } = await client.internalTransfer.create({
  amount: {
    currency: "SLE",
    value: amount,
  },
  sourceFinancialAccount: {
    id: "fa-escrow-account",
  },
  destinationFinancialAccount: {
    id: `fa-user-wallet-${sellerId}`,
  },
  description: `Escrow release for order ${orderId}`,
  metadata: {
    transferType: "escrow_release",
    orderId: orderId,
    sellerId: sellerId,
  },
});
```
