# Checkout Session Examples

Checkout sessions create hosted payment pages for customers to complete purchases. Redirect customers to a payment form with configurable line items, branding, and success/cancel URLs.

## create

Create a checkout session with line items, redirect URLs, and optional branding. Returns a redirect URL for the customer.

```javascript
const { success, result } = await client.checkoutSession.create({
  name: "Order #12345",
  lineItems: [
    {
      type: "custom",
      name: "Premium T-Shirt",
      price: { currency: "SLE", value: 15000 },
      quantity: 2,
    },
  ],
  successUrl: "https://yoursite.com/checkout/success",
  cancelUrl: "https://yoursite.com/checkout/cancel",
  description: "Order from Your Store",
  reference: "order-12345",
  metadata: {
    customerId: "cust-123",
    source: "web",
  },
});
```

## get

Retrieve checkout session details including status, order number, and redirect URL.

```javascript
const { success, result } = await client.checkoutSession.get(sessionId);
```

## list

List all checkout sessions in your space with pagination support.

```javascript
const { success, result, pagination } = await client.checkoutSession.list();
```

## delete

Cancel and remove a checkout session. Sessions can only be deleted if not yet completed.

```javascript
await client.checkoutSession.delete(sessionId);
```
