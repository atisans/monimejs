# Mobile Money (Momo) Examples

Mobile money (Momo) providers represent mobile payment operators in the Monime platform. Retrieve available providers for rendering provider selection during payment setup or payout operations.

## list

List all mobile money providers available in a specific country with pagination support.

```javascript
const { success, result } = await client.momo.list({
  country: "SL",
});
```

## get

Retrieve detailed information about a specific mobile money provider including features and status.

```javascript
const { success, result } = await client.momo.get("m17");
```
