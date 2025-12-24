# Payment Code Examples

Payment codes generate USSD codes for receiving payments from mobile money users. Create one-time or recurrent payment codes with optional access restrictions for KYC or customer verification.

## create

Create a one-time payment code that customers can dial via USSD. Useful for e-commerce checkouts.

```javascript
const { success, result } = await client.paymentCode.create({
  name: "Order #12345",
  amount: { currency: "SLE", value: 50000 },
  metadata: {
    orderId: "order-12345",
    customerId: "cust-123",
  },
});
```

## create recurrent

Create a recurrent payment code for subscriptions or installment plans. Specify the expected payment count.

```javascript
const { success, result } = await client.paymentCode.create({
  name: "Monthly Subscription - Premium Plan",
  mode: "recurrent",
  amount: { currency: "SLE", value: 10000 },
  recurrentPaymentTarget: {
    expectedPaymentCount: 12,
  },
  metadata: {
    subscriptionId: "sub-789",
    plan: "premium",
  },
});
```

## create with restricted access

Create a payment code restricted to specific providers and/or phone numbers for KYC verification or customer-specific payments.

```javascript
const { success, result } = await client.paymentCode.create({
  name: "VIP Customer Payment",
  amount: { currency: "SLE", value: 100000 },
  authorizedProviders: ["m17"],
  authorizedPhoneNumber: "+23276123456",
  duration: "P7D",
  customer: {
    name: "John Doe",
    phoneNumber: "+23276123456",
    email: "john@example.com",
  },
  metadata: {
    customerTier: "vip",
  },
});
```

## get

Retrieve payment code details including USSD code, status, and payment information.

```javascript
const { success, result } = await client.paymentCode.get(paymentCodeId);
```

## list

List payment codes filtered by status with pagination support.

```javascript
const { success, result, pagination } = await client.paymentCode.list({
  status: "active",
  limit: 50,
});
```

## list recurrent

List only recurrent payment codes for subscription and installment management.

```javascript
const { success, result } = await client.paymentCode.list({
  mode: "recurrent",
  limit: 100,
});
```

## update

Update payment code name and metadata for internal tracking.

```javascript
const { success, result } = await client.paymentCode.update(paymentCodeId, {
  name: "Updated Order #12345 - Confirmed",
  metadata: {
    status: "confirmed",
  },
});
```

## delete

Cancel and remove a payment code. Code must be inactive or expired to be deleted.

```javascript
const { success } = await client.paymentCode.delete(paymentCodeId);
```
