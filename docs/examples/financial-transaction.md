# Financial Transaction Examples

Financial transactions represent fund movements affecting a financial account, categorized as either a credit (inflow) or debit (outflow). Each transaction adjusts account balances and maintains an audit trail.

## get

Retrieve a single transaction by ID including amount, type, timestamp, and balance impact.

```javascript
const { success, result } = await client.financialTransaction.get("ftx-transaction-id");
```

## list

List all transactions in your space with pagination support.

```javascript
const { success, result, pagination } = await client.financialTransaction.list();
```

## list filtered by account

Get all transactions for a specific financial account for reconciliation and auditing.

```javascript
const { success, result } = await client.financialTransaction.list({
  financialAccountId: "fa-account-id",
});
```

## list filtered by type

Filter transactions by type (credit for inflows, debit for outflows).

```javascript
const { success, result } = await client.financialTransaction.list({
  type: "credit",
});
```

## list filtered by reference

Find transactions by their reference for cross-referencing with external systems.

```javascript
const { success, result } = await client.financialTransaction.list({
  reference: "txn-ref-123",
});
```
