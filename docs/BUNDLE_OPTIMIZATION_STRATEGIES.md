# Bundle Optimization Strategies

This document provides detailed analysis and implementation guidance for reducing the bundle size of the Monime JS SDK. Strategies are organized by effort level and impact.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Quick Reference: All Strategies](#quick-reference-all-strategies)
3. [Low-Effort Strategies](#low-effort-strategies)
   - [#1 Shorten Error Messages](#1-shorten-error-messages)
   - [#2 Use Shorter Internal Variable Names](#2-use-shorter-internal-variable-names)
   - [#3 Remove Validation Comments (Detailed)](#3-remove-validation-comments)
4. [Medium-Effort Strategies](#medium-effort-strategies)
   - [#4 Make Validation Lazy-Loadable](#4-make-validation-lazy-loadable)
   - [#5 Use a Single Generic Validate Function (Detailed)](#5-use-a-single-generic-validate-function)
5. [High-Effort Strategies](#high-effort-strategies)
   - [#6 Drop Valibot Entirely (Detailed)](#6-drop-valibot-entirely)
6. [Recommendation Matrix](#recommendation-matrix)
7. [Implementation Priority](#implementation-priority)

---

## Current State Analysis

### Bundle Composition

| Component | Estimated Size | Notes |
|-----------|---------------|-------|
| Valibot (external) | ~8-12KB | Not bundled, but required dependency |
| schemas.ts | ~370 lines | 35+ schema definitions |
| validation.ts | ~189 lines | 25+ wrapper functions |
| Module files (13) | ~45 validation calls | Conditional validation pattern |
| Error messages | ~2-3KB | Verbose descriptive messages |

### Current Optimizations Already Applied

1. **Valibot marked as external** - Not bundled in dist
2. **Tree shaking enabled** - Unused code eliminated
3. **ESM-only distribution** - No CJS overhead
4. **Minification enabled** - Whitespace/comments removed in dist
5. **Conditional validation** - `validateInputs: false` bypasses validation

---

## Quick Reference: All Strategies

| # | Strategy | Effort | Impact | Risk |
|---|----------|--------|--------|------|
| 1 | Shorten error messages | Low | ~200-400 bytes | Low |
| 2 | Shorter internal variable names | Low | ~100-200 bytes | Low |
| 3 | Remove validation comments | Low | ~100 bytes | None |
| 4 | Lazy-loadable validation | Medium | ~5-8KB | Medium |
| 5 | Single generic validate function | Medium | ~500 bytes | Low |
| 6 | Drop Valibot entirely | High | ~8-12KB | High |

---

## Low-Effort Strategies

### #1 Shorten Error Messages

**Current State:**
Error messages in schemas.ts are verbose and descriptive:
- `"id is required"`
- `"country must be a 2-letter ISO 3166-1 alpha-2 code"`
- `"metadata cannot have more than 64 keys"`

**Proposed Change:**
Shorten to minimal identifiers:
- `"id is required"` → `"required"`
- `"country must be a 2-letter ISO 3166-1 alpha-2 code"` → `"invalid country"`
- `"metadata cannot have more than 64 keys"` → `"max 64 keys"`

**Savings:** ~200-400 bytes

**Pros:**
- Minimal code change
- No API changes
- No breaking changes

**Cons:**
- Less helpful error messages for developers
- Debugging becomes slightly harder
- May require documentation updates

**Risk Level:** Low

**Implementation Notes:**
- Search for all `v.check()` calls with custom messages
- Search for all validation error strings in schemas.ts
- Consider providing verbose messages in dev mode only (conditional)

---

### #2 Use Shorter Internal Variable Names

**Current State:**
Internal (private) variables use descriptive names:
- `http_client` in module classes
- `validate_input` function name
- `to_validation_error` function name

**Proposed Change:**
Use abbreviated names for private internals:
- `http_client` → `_hc`
- `validate_input` → `_v`
- `to_validation_error` → `_tve`

**Savings:** ~100-200 bytes

**Pros:**
- No API changes (internal only)
- Minifier may already handle this
- Quick to implement

**Cons:**
- Reduced code readability
- Makes debugging stack traces harder
- Minifier already shortens in production

**Risk Level:** Low

**Implementation Notes:**
- Only rename private/internal identifiers
- Verify minifier isn't already doing this
- May have negligible impact if minification is aggressive

---

### #3 Remove Validation Comments

**Current State:**

The validation files contain inline comments explaining validation logic:

```typescript
// validation.ts comments:
// Line 29: "Converts valibot issues to MonimeValidationError with all issues included"
// Line 34-37: Empty issues array fallback handling
// Line 46: "Safe: we know validation_issues has at least 1 element since issues.length > 0"
// Line 56-57: "Generic validation function using valibot schema"

// schemas.ts comments:
// Line 7-8: "Helper for optional nullable fields (used in update inputs)"
// Line 8: "In update operations: missing field = don't update, null = clear, value = update"
// Line 27-28: Metadata constraint: max 64 keys
// Line 206-210: Headers constraint: max 10 properties
```

**Analysis:**

This strategy has **zero actual impact** on the distributed bundle because:

1. **Minification already removes comments** - The build process uses `esbuild --minify` which strips all comments from the output
2. **Comments only exist in source files** - The dist/index.js file contains no comments
3. **TypeScript compilation removes comments** - Unless `removeComments: false` is set (it's not)

**Detailed Breakdown:**

| File | Comment Lines | In Source | In Dist |
|------|---------------|-----------|---------|
| validation.ts | ~10 | Yes | No (minified) |
| schemas.ts | ~15 | Yes | No (minified) |
| Other files | ~20 | Yes | No (minified) |

**Recommendation: DO NOT IMPLEMENT**

Removing source comments provides:
- **Zero bundle savings** (already stripped)
- **Negative developer experience** (harder to understand code)
- **Increased maintenance burden** (less context for future changes)

**When Comments Matter:**

Comments WOULD affect bundle size only if:
1. Using `esbuild` without `--minify` flag
2. Setting `removeComments: false` in tsconfig
3. Using a bundler that preserves comments
4. Distributing unminified source

**Alternative Approach:**

If comments are needed in source but bundle size is critical:
1. Keep comments in source for maintainability
2. Ensure minification is enabled in build
3. Verify dist output is comment-free with: `grep -c "//" dist/index.js`

**Verdict:**

| Aspect | Assessment |
|--------|------------|
| Actual Savings | 0 bytes |
| Implementation Effort | Low |
| Code Quality Impact | Negative |
| Recommendation | Skip entirely |

---

## Medium-Effort Strategies

### #4 Make Validation Lazy-Loadable

**Current State:**
All validation code is bundled together and loaded immediately, even when `validateInputs: false`.

**Proposed Change:**
Create a separate entry point for validation:
```
dist/index.js        - Core SDK (no validation)
dist/validation.js   - Validation module (lazy-loaded)
```

**Savings:** ~5-8KB when validation disabled

**Pros:**
- Users who disable validation get smaller bundles
- Tree-shaking can eliminate entire validation module
- No breaking changes if done correctly

**Cons:**
- More complex build configuration
- Dynamic imports add complexity
- May break some bundler configurations
- Requires async loading pattern

**Risk Level:** Medium

**Implementation Notes:**
- Requires changes to package.json exports field
- Module files need conditional dynamic imports
- Testing required across different bundlers

---

### #5 Use a Single Generic Validate Function

**Current State:**

The codebase exports 25+ individual validation wrapper functions:

```typescript
// validation.ts current pattern
export function validateCreatePaymentCodeInput(input: unknown): void {
  validate_input(CreatePaymentCodeInputSchema, input)
}

export function validateUpdatePaymentCodeInput(input: unknown): void {
  validate_input(UpdatePaymentCodeInputSchema, input)
}

export function validateCreateCheckoutSessionInput(input: unknown): void {
  validate_input(CreateCheckoutSessionInputSchema, input)
}

// ... 22+ more functions following identical pattern
```

Each function:
- Has a unique name (~30-50 characters)
- Contains identical logic (single line calling `validate_input`)
- Adds function declaration overhead
- Creates a unique export

**Proposed Architecture:**

Replace all wrapper functions with a single generic validate function and direct schema exports:

```typescript
// New validation.ts structure
import * as v from "valibot"
import { to_validation_error } from "./errors"

// Single generic validate function
export function validate<T>(
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
  data: unknown
): void {
  const result = v.safeParse(schema, data)
  if (!result.success) {
    throw to_validation_error(result.issues)
  }
}

// Export schemas directly
export {
  CreatePaymentCodeInputSchema,
  UpdatePaymentCodeInputSchema,
  // ... all schemas
} from "./schemas"
```

**Module consumption changes from:**
```typescript
import { validateCreatePaymentCodeInput } from "./validation"

if (this.http_client.shouldValidate) {
  validateCreatePaymentCodeInput(input)
}
```

**To:**
```typescript
import { validate, CreatePaymentCodeInputSchema } from "./validation"

if (this.http_client.shouldValidate) {
  validate(CreatePaymentCodeInputSchema, input)
}
```

**Detailed Savings Calculation:**

| Item | Current | Proposed | Savings |
|------|---------|----------|---------|
| Function declarations | 25 × ~80 bytes | 1 × ~150 bytes | ~1,850 bytes |
| Export statements | 25 × ~40 bytes | 25 × ~30 bytes | ~250 bytes |
| Import statements (modules) | 25 × ~45 bytes | 26 × ~35 bytes | ~215 bytes |
| **Total (pre-minification)** | | | **~2,315 bytes** |
| **Estimated minified savings** | | | **~500 bytes** |

**Pros:**

1. **Reduced code duplication** - Single function instead of 25+ identical wrappers
2. **Smaller bundle size** - ~500 bytes savings after minification
3. **More flexible** - Modules can validate any schema, not just pre-defined ones
4. **Easier maintenance** - Changes to validation logic happen in one place
5. **Better tree-shaking potential** - Unused schemas can be eliminated
6. **Type safety preserved** - Generic function maintains full type inference

**Cons:**

1. **Slightly more verbose call sites** - Need to import schema + function vs single function
2. **Public schema exposure** - Schemas become part of public API
3. **Breaking change** - Existing consumers using old function names must update
4. **Less IDE autocomplete** - Generic function doesn't hint at available schemas

**Risk Assessment:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing consumers | High | Medium | Deprecation period, migration guide |
| Type inference issues | Low | Low | Thorough TypeScript testing |
| Increased call site complexity | Certain | Low | Clear documentation |

**Migration Strategy:**

**Phase 1: Add new pattern (non-breaking)**
- Add generic `validate()` function
- Export all schemas publicly
- Keep existing wrapper functions (mark deprecated)

**Phase 2: Update internal usage**
- Migrate all 13 module files to new pattern
- Update tests

**Phase 3: Remove deprecated functions**
- Remove 25+ wrapper functions
- Update documentation
- Publish as minor/major version

**Verdict:**

| Aspect | Assessment |
|--------|------------|
| Actual Savings | ~500 bytes (minified) |
| Implementation Effort | Medium |
| Code Quality Impact | Positive (less duplication) |
| Breaking Change | Yes (can be phased) |
| Recommendation | **Implement with deprecation period** |

---

## High-Effort Strategies

### #6 Drop Valibot Entirely

**Current State:**

Valibot is the sole runtime dependency:
- Version: `^1.2.0`
- Size: ~8-12KB (gzipped: ~3.5KB)
- Usage: 134 `v.pipe()` calls, 35+ schema definitions
- Build: Marked as `--external:valibot`

**Valibot Features Currently Used:**

| Feature | Usage Count | Complexity to Replace |
|---------|-------------|----------------------|
| `v.object()` | ~40 | Low |
| `v.pipe()` | 134 | Medium |
| `v.string()` | ~60 | Low |
| `v.number()` | ~20 | Low |
| `v.optional()` | ~45 | Low |
| `v.nullable()` | ~15 | Low |
| `v.variant()` | ~8 | High |
| `v.picklist()` | ~12 | Low |
| `v.check()` | ~25 | Medium |
| `v.record()` | ~5 | Medium |
| `v.array()` | ~10 | Low |
| `v.safeParse()` | 1 | Medium |

**Proposed Architecture:**

Replace Valibot with hand-written validation functions:

```typescript
// New manual validation approach

interface ValidationResult {
  success: boolean
  issues: ValidationIssue[]
}

interface ValidationIssue {
  field: string
  message: string
  value?: unknown
}

// Manual validators
function validateString(value: unknown, field: string): ValidationIssue | null {
  if (typeof value !== "string") {
    return { field, message: "must be string", value }
  }
  return null
}

function validateRequired(value: unknown, field: string): ValidationIssue | null {
  if (value === undefined || value === null) {
    return { field, message: "required" }
  }
  return null
}

// Schema definition becomes validation function
function validateCreatePaymentCodeInput(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = []
  const data = input as Record<string, unknown>

  // Required fields
  issues.push(validateRequired(data.name, "name"))
  issues.push(validateString(data.name, "name"))
  issues.push(validateRequired(data.amount, "amount"))
  // ... continue for all fields

  return {
    success: issues.filter(Boolean).length === 0,
    issues: issues.filter(Boolean)
  }
}
```

**Detailed Implementation Requirements:**

**1. Core Validation Primitives (~200 lines)**

| Primitive | Implementation |
|-----------|----------------|
| `isString` | `typeof x === "string"` |
| `isNumber` | `typeof x === "number" && !isNaN(x)` |
| `isBoolean` | `typeof x === "boolean"` |
| `isObject` | `x !== null && typeof x === "object"` |
| `isArray` | `Array.isArray(x)` |
| `isOptional` | Skip validation if undefined |
| `isNullable` | Allow null values |

**2. Constraint Validators (~150 lines)**

| Constraint | Implementation |
|------------|----------------|
| `minLength` | `str.length >= min` |
| `maxLength` | `str.length <= max` |
| `minValue` | `num >= min` |
| `maxValue` | `num <= max` |
| `pattern` | `regex.test(str)` |
| `oneOf` | `allowedValues.includes(x)` |
| `integer` | `Number.isInteger(x)` |

**3. Complex Validators (~300 lines)**

| Validator | Complexity | Notes |
|-----------|------------|-------|
| Object validation | Medium | Nested field validation |
| Array validation | Medium | Item validation + length constraints |
| Discriminated unions | High | Must match `v.variant()` behavior |
| Record validation | Medium | Dynamic key validation |
| Custom checks | Low | Direct function calls |

**4. Schema Definitions Rewrite (~500 lines)**

Each of the 35+ schemas must be rewritten as validation functions. Example transformation:

**Before (Valibot):**
```typescript
const CreatePaymentCodeInputSchema = v.variant("mode", [
  v.object({
    mode: v.literal("one_time"),
    name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(100)),
    amount: AmountSchema,
    metadata: v.optional(MetadataSchema),
  }),
  v.object({
    mode: v.literal("recurrent"),
    name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(100)),
    suggested_amounts: v.optional(v.array(AmountSchema)),
    metadata: v.optional(MetadataSchema),
  }),
])
```

**After (Manual):**
```typescript
function validateCreatePaymentCodeInput(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = []

  if (!isObject(input)) {
    return { success: false, issues: [{ field: "", message: "must be object" }] }
  }

  const data = input as Record<string, unknown>

  // Discriminated union handling
  if (data.mode === "one_time") {
    collectIssues(issues, validateString(data.name, "name"))
    collectIssues(issues, validateNonEmpty(data.name, "name"))
    collectIssues(issues, validateMaxLength(data.name, 100, "name"))
    collectIssues(issues, validateAmount(data.amount, "amount"))
    if (data.metadata !== undefined) {
      collectIssues(issues, validateMetadata(data.metadata, "metadata"))
    }
  } else if (data.mode === "recurrent") {
    // Similar validation for recurrent mode
  } else {
    issues.push({ field: "mode", message: "must be one_time or recurrent" })
  }

  return { success: issues.length === 0, issues }
}
```

**Savings Analysis:**

| Component | With Valibot | Without Valibot | Difference |
|-----------|--------------|-----------------|------------|
| Valibot dependency | ~8-12KB | 0KB | -8-12KB |
| schemas.ts | ~370 lines | ~500 lines | +130 lines |
| validation.ts | ~189 lines | ~350 lines | +161 lines |
| New primitives | 0 | ~200 lines | +200 lines |
| **Net code change** | | | +491 lines |
| **Net bundle change** | | | **-5-8KB** |

**Pros:**

1. **Zero external dependencies** - SDK becomes fully self-contained
2. **Smaller total bundle** - Net savings of ~5-8KB
3. **Full control** - Can optimize validation for specific use cases
4. **No version conflicts** - No risk of Valibot version mismatches
5. **Faster validation** - Potential for more optimized code paths
6. **Simpler debugging** - All code is visible in SDK source

**Cons:**

1. **Significant development effort** - ~1000 lines of new code
2. **Increased maintenance burden** - Must maintain validation logic
3. **Potential for bugs** - Valibot is battle-tested, new code isn't
4. **Less sophisticated errors** - Valibot provides detailed error messages
5. **No type inference from schemas** - Must maintain types separately
6. **Loss of Valibot ecosystem** - No access to future improvements
7. **Testing overhead** - Must write comprehensive validation tests

**Risk Assessment:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Validation bugs | Medium | High | Comprehensive test suite |
| Edge case handling | Medium | Medium | Port Valibot test cases |
| Type safety regression | Low | High | Strict TypeScript, thorough testing |
| Performance regression | Low | Low | Benchmark critical paths |
| Maintenance burden | Certain | Medium | Clear documentation, modular design |

**Implementation Phases:**

**Phase 1: Foundation (2-3 days)**
- Create validation primitives
- Create constraint validators
- Set up test infrastructure
- Port basic Valibot tests

**Phase 2: Schema Migration (3-4 days)**
- Migrate simple schemas (strings, numbers, objects)
- Migrate complex schemas (arrays, records)
- Migrate discriminated unions (variant)
- Ensure 100% feature parity

**Phase 3: Integration (1-2 days)**
- Update all module files
- Update error transformation
- Update exports
- Integration testing

**Phase 4: Validation (1-2 days)**
- End-to-end testing
- Performance benchmarking
- Edge case validation
- Documentation updates

**Verdict:**

| Aspect | Assessment |
|--------|------------|
| Actual Savings | ~5-8KB |
| Implementation Effort | High (7-11 days) |
| Code Quality Impact | Neutral to Negative |
| Breaking Change | No (if API preserved) |
| Risk Level | High |
| Recommendation | **Only if bundle size is critical constraint** |

**When to Drop Valibot:**

- Bundle size is a hard constraint (e.g., edge functions, embedded)
- Zero-dependency policy requirement
- Need full control over validation behavior
- Willing to invest in maintenance

**When to Keep Valibot:**

- Development speed is priority
- Want battle-tested validation
- Benefit from type inference
- Prefer smaller codebase over smaller bundle

---

## Recommendation Matrix

Based on the analysis, here is the recommended approach for each optimization:

| Strategy | Recommend? | Rationale |
|----------|------------|-----------|
| #1 Shorten error messages | Maybe | Small gains, worse DX |
| #2 Shorter variable names | No | Minifier handles this |
| #3 Remove comments | **No** | Zero impact (already minified) |
| #4 Lazy-load validation | Yes | Good ROI if validation often disabled |
| #5 Generic validate function | **Yes** | Good savings, cleaner code |
| #6 Drop Valibot | Conditional | Only if bundle size is critical |

---

## Implementation Priority

**Recommended Order:**

1. **#5 Generic validate function** - Best effort/impact ratio, improves code quality
2. **#4 Lazy-loadable validation** - Good savings for users who disable validation
3. **#1 Shorten error messages** - Quick win, consider dev-mode verbose messages
4. **#6 Drop Valibot** - Only if above optimizations insufficient

**Skip entirely:**
- #2 Shorter variable names (minifier handles)
- #3 Remove comments (already removed in build)

---

## Appendix: Current File Sizes

Reference for measuring optimization impact:

| File | Lines | Purpose |
|------|-------|---------|
| src/schemas.ts | 370 | Valibot schema definitions |
| src/validation.ts | 189 | Validation wrapper functions |
| src/types.ts | 1490 | TypeScript type definitions |
| src/client.ts | ~200 | Main client class |
| src/*.ts (modules) | ~100 each | 13 API modules |

**Build output:**
- dist/index.js: Minified ESM bundle
- dist/index.d.ts: TypeScript declarations
