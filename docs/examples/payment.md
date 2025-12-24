# Payment Examples

Payments are transaction records created when customers complete payments via payment codes or checkout sessions. This module is read-only except for metadata updates. Retrieve, filter, and track payment statuses across your accounts.

## get

Retrieve detailed payment information including amount, status, fees, and references.

```javascript
const { success, result } = await client.payment.get(paymentId);
```

## list

Retrieve recent payments with pagination support. Useful for dashboards and reporting.

```javascript
const { success, result, pagination } = await client.payment.list({
  limit: 20,
});
```

## list by order number

Filter payments by a specific order number to track all payments for a single order.

```javascript
const { success, result } = await client.payment.list({
  orderNumber,
});
```

## list by account

Get all payments for a specific financial account, useful for account reconciliation.

```javascript
const { success, result } = await client.payment.list({
  financialAccountId,
  limit: 50,
});
```

## list by transaction reference

Find a payment using its financial transaction reference for cross-referencing.

```javascript
const { success, result } = await client.payment.list({
  financialTransactionReference: transactionRef,
});
```

## update

Update payment metadata and descriptions for internal tracking and audit purposes.

```javascript
const { success, result } = await client.payment.update(paymentId, {
  metadata: {
    processed: "true",
    processedAt: new Date().toISOString(),
  },
});
```
