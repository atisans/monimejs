# Payout Examples

Payouts are disbursements to external accounts including mobile money, bank accounts, and digital wallets. Manage payout status, track fees, and handle retries for failed disbursements.

## create mobile money payout

Disburse funds to a mobile money account. Specify provider ID (e.g., "m17" for Orange) and phone number.

```javascript
const { success, result } = await client.payout.create({
  amount: {
    currency: "SLE",
    value: amount,
  },
  destination: {
    type: "momo",
    providerId: provider,
    phoneNumber: phoneNumber,
  },
  metadata: {
    payoutType: "mobile_money",
  },
});
```

## create bank payout

Disburse funds to a bank account using the bank provider ID and account number.

```javascript
const { success, result } = await client.payout.create({
  amount: {
    currency: "SLE",
    value: amount,
  },
  destination: {
    type: "bank",
    providerId: bankProviderId,
    accountNumber: accountNumber,
  },
  metadata: {
    payoutType: "bank_transfer",
  },
});
```

## create wallet payout

Disburse funds to a digital wallet with optional wallet ID for provider-specific handling.

```javascript
const { success, result } = await client.payout.create({
  amount: {
    currency: "SLE",
    value: amount,
  },
  destination: {
    type: "wallet",
    providerId: providerId,
    walletId: walletId,
  },
  metadata: {
    payoutType: "digital_wallet",
  },
});
```

## get

Retrieve detailed payout information including status, fees, and failure reasons.

```javascript
const { success, result } = await client.payout.get(payoutId);
```

## list

Retrieve all payouts in your space with pagination support.

```javascript
const { success, result, pagination } = await client.payout.list();
```

## list by status

Filter payouts by their current status (processing, completed, failed).

```javascript
const { success, result } = await client.payout.list({
  status: "completed",
});
```

## list by account

```javascript
const { success, result } = await client.payout.list({
  sourceFinancialAccountId: accountId,
});
```

## update

```javascript
const { success, result } = await client.payout.update(payoutId, {
  metadata: updates,
});
```

## delete

```javascript
const { success } = await client.payout.delete(payoutId);
```
