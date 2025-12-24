# Bank Examples

Banks represent financial institution providers in the Monime payment platform. Retrieve available banks for rendering provider selection during payment setup or onboarding.

## list

List all banks available in a specific country with pagination support.

```javascript
const { result: slBanks } = await client.bank.list({
  country: "SL",
});
```

## get

Retrieve detailed information about a specific bank including supported features and status.

```javascript
const { result: bank } = await client.bank.get("slb004");
```
