# Internal Naming Conventions Task

## Overview

This task tracks internal identifiers that use camelCase but should use snake_case for consistency with the codebase's internal naming convention.

**Convention:**
- **Public API** (exported, consumer-facing): camelCase (e.g., `isRetryable`, `retryAfter`)
- **Internal** (private, module-internal): snake_case (e.g., `http_client`, `validate_input`)

---

## 1. Identifiers to Rename

### http-client.ts

| Current Name | New Name | Line | Type | Description |
|--------------|----------|------|------|-------------|
| `shouldValidate` | `should_validate` | 88 | getter | Returns whether input validation is enabled |

**Usage locations (all need updating):**

| File | Line(s) |
|------|---------|
| src/bank.ts | 57, 90 |
| src/checkout-session.ts | 53, 77, 100, 128 |
| src/financial-account.ts | 61, 87, 117, 153 |
| src/financial-transaction.ts | 57, 80 |
| src/internal-transfer.ts | 60, 84, 107, 144, 166 |
| src/momo.ts | 63, 96 |
| src/payment.ts | 49, 72, 108 |
| src/payment-code.ts | 54, 78, 101, 137, 159 |
| src/payout.ts | 55, 76, 99, 137, 159 |
| src/receipt.ts | 60, 85 |
| src/ussd-otp.ts | 58, 79, 102, 130 |
| src/webhook.ts | 59, 80, 103, 136, 158 |

**Total occurrences:** 38 usages across 13 files

---

## 2. Identifiers That Should NOT Be Changed

These use camelCase intentionally as they are **public API**:

### errors.ts

| Identifier | Type | Reason to Keep camelCase |
|------------|------|--------------------------|
| `isRetryable` | getter | Public API on exported `MonimeApiError` and `MonimeNetworkError` classes. SDK consumers use `error.isRetryable` to check retry eligibility. |
| `retryAfter` | property | Public API on exported `MonimeApiError`. SDK consumers access `error.retryAfter` to get retry delay. |

### client.ts

| Identifier | Type | Reason to Keep camelCase |
|------------|------|--------------------------|
| `paymentCode` | property | Public API module accessor |
| `checkoutSession` | property | Public API module accessor |
| `financialAccount` | property | Public API module accessor |
| `financialTransaction` | property | Public API module accessor |
| `internalTransfer` | property | Public API module accessor |
| `ussdOtp` | property | Public API module accessor |

---

## 3. Implementation Checklist

### Phase 1: Rename Getter
- [ ] Rename `shouldValidate` to `should_validate` in `src/http-client.ts:88`

### Phase 2: Update All References
- [ ] Update `src/bank.ts` (2 occurrences)
- [ ] Update `src/checkout-session.ts` (4 occurrences)
- [ ] Update `src/financial-account.ts` (4 occurrences)
- [ ] Update `src/financial-transaction.ts` (2 occurrences)
- [ ] Update `src/internal-transfer.ts` (5 occurrences)
- [ ] Update `src/momo.ts` (2 occurrences)
- [ ] Update `src/payment.ts` (3 occurrences)
- [ ] Update `src/payment-code.ts` (5 occurrences)
- [ ] Update `src/payout.ts` (5 occurrences)
- [ ] Update `src/receipt.ts` (2 occurrences)
- [ ] Update `src/ussd-otp.ts` (4 occurrences)
- [ ] Update `src/webhook.ts` (5 occurrences)

### Phase 3: Validation
- [ ] Run TypeScript compiler (`npm run build:types`)
- [ ] Run linter (`npm run lint`)
- [ ] Run tests (`npm test`)
- [ ] Verify no public API changes

---

## 4. Code Examples

### Before

```typescript
// http-client.ts
get shouldValidate(): boolean {
  return this.validate_inputs;
}

// payment-code.ts
if (this.http_client.shouldValidate) {
  validateCreatePaymentCodeInput(input);
}
```

### After

```typescript
// http-client.ts
get should_validate(): boolean {
  return this.validate_inputs;
}

// payment-code.ts
if (this.http_client.should_validate) {
  validateCreatePaymentCodeInput(input);
}
```

---

## 5. Risk Assessment

| Risk | Level | Notes |
|------|-------|-------|
| Breaking public API | None | `shouldValidate` is not exported or documented |
| Type errors | Low | TypeScript will catch all mismatches |
| Runtime errors | None | Simple rename, no logic change |

---

## 6. Related Files Summary

### Already Following snake_case Convention

These files already use snake_case for internal variables:

| File | Examples |
|------|----------|
| http-client.ts | `base_url`, `space_id`, `access_token`, `retry_delay`, `validate_inputs`, `max_retries`, `fetch_options`, `search_params`, `query_string`, `timeout_id`, `last_error`, `retry_index` |
| validation.ts | `to_validation_error`, `validate_input`, `validation_issues`, `first_issue` |
| schemas.ts | `optional_nullable` |
| All module files | `http_client`, `query_params` |

---

## 7. Notes

- This is a low-effort, low-risk change
- No bundle size impact (minifier handles names)
- Improves codebase consistency
- No documentation updates needed (internal only)
