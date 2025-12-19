# ID Prefix Validation

## Overview

This document tracks the ID prefix validations that were removed from validation schemas to simplify the codebase. These validations are nice-to-have but not critical, as the API will reject invalid IDs anyway.

## Removed Validations

The following `v.startsWith()` validations were removed from `/src/schemas.ts`:

| Schema | Prefix | Validation Removed |
|--------|--------|-------------------|
| `ClientOptionsSchema.spaceId` | `spc-` | `v.startsWith("spc-", "spaceId must start with 'spc-'")` |
| `PaymentCodeIdSchema` | `pmc-` | `v.startsWith("pmc-", "Payment code ID must start with 'pmc-'")` |
| `PaymentIdSchema` | `pay-` | `v.startsWith("pay-", "Payment ID must start with 'pay-'")` |
| `CheckoutSessionIdSchema` | `cos-` | `v.startsWith("cos-", "Checkout session ID must start with 'cos-'")` |
| `PayoutIdSchema` | `pot-` | `v.startsWith("pot-", "Payout ID must start with 'pot-'")` |
| `WebhookIdSchema` | `whk-` | `v.startsWith("whk-", "Webhook ID must start with 'whk-'")` |
| `InternalTransferIdSchema` | `trn-` | `v.startsWith("trn-", "Internal transfer ID must start with 'trn-'")` |
| `FinancialTransactionIdSchema` | `ftx-` | `v.startsWith("ftx-", "Financial transaction ID must start with 'ftx-'")` |
| `UssdOtpIdSchema` | `uop-` | `v.startsWith("uop-", "USSD OTP ID must start with 'uop-'")` |
| `FinancialAccountIdSchema` | `fa-` | `v.startsWith("fa-", "Financial account ID must start with 'fa-'")` |

## Why Removed

1. **Simplicity**: Reduces magic strings scattered throughout the validation schemas
2. **API-side validation**: The API already validates ID formats and will reject invalid IDs
3. **Less brittle**: If the API changes its ID prefix convention, the SDK won't break
4. **Developer experience**: Simpler error messages for end users

The core validation (`v.nonEmpty("id is required")`) remains in place to ensure IDs are provided.

## How to Re-add (When Needed)

If you need to add ID prefix validation back in the future, follow these steps:

### Step 1: Create ID Prefix Constants

Add a constants file or section to define all ID prefixes:

```typescript
// src/constants.ts or in schemas.ts
export const ID_PREFIXES = {
  SPACE: "spc-",
  PAYMENT_CODE: "pmc-",
  PAYMENT: "pay-",
  CHECKOUT_SESSION: "cos-",
  PAYOUT: "pot-",
  WEBHOOK: "whk-",
  INTERNAL_TRANSFER: "trn-",
  FINANCIAL_TRANSACTION: "ftx-",
  USSD_OTP: "uop-",
  FINANCIAL_ACCOUNT: "fa-",
} as const;
```

### Step 2: Create a Helper Function

Create a reusable helper for ID validation:

```typescript
function createIdSchema(prefix: string, entityName: string) {
  return v.pipe(
    v.string(),
    v.nonEmpty("id is required"),
    v.startsWith(prefix, `${entityName} ID must start with '${prefix}'`),
  );
}
```

### Step 3: Update Schemas

Replace the simple schemas with the helper:

```typescript
// Before
export const PaymentCodeIdSchema = v.pipe(
  v.string(),
  v.nonEmpty("id is required"),
);

// After
export const PaymentCodeIdSchema = createIdSchema(
  ID_PREFIXES.PAYMENT_CODE,
  "Payment code",
);
```

### Step 4: Update ClientOptionsSchema

For the `spaceId` in `ClientOptionsSchema`, add the validation back:

```typescript
export const ClientOptionsSchema = v.object({
  spaceId: v.pipe(
    v.string(),
    v.nonEmpty("spaceId is required"),
    v.startsWith(ID_PREFIXES.SPACE, "spaceId must start with 'spc-'"),
  ),
  // ... rest of fields
});
```

## Related Files

- `/src/schemas.ts` - Main validation schemas file
- Tests that may need updating if validation is re-added

## Status

- **Removed**: December 18, 2025
- **Reason**: Simplification, rely on API validation
- **Future**: Consider re-adding if client-side validation becomes important for UX
