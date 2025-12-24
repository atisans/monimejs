# Financial Account Examples

Financial accounts are logical wallets that hold and track money for users or entities. Support multi-currency operations and serve as the foundation for all monetary movements including payouts, transfers, and payments.

## create

Create a new financial account for holding and managing funds.

```javascript
const { success, result } = await client.financialAccount.create({
  name: "Main Wallet",
  currency: "SLE",
});
```

## get

Retrieve financial account details including metadata and UVAN (unique account number).

```javascript
const { success, result } = await client.financialAccount.get(accountId);
```

## get with balance

Retrieve account details including current balance and currency.

```javascript
const { success, result } = await client.financialAccount.get(accountId, {
  withBalance: true,
});
```

## list

List all financial accounts in your space with pagination support.

```javascript
const { success, result, pagination } = await client.financialAccount.list();
```

## list with balances

List all accounts with their current balances included.

```javascript
const { success, result } = await client.financialAccount.list({
  withBalance: true,
});
```

## update

Update account name, description, or metadata.

```javascript
const { success, result } = await client.financialAccount.update(accountId, {
  name: "Updated Account Name",
  description: "Updated description",
});
```
