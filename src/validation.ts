import * as v from "valibot";
import { MonimeValidationError, type ValidationIssue } from "./errors";

export {
  BankProviderIdSchema,
  ClientOptionsSchema,
  CountryCodeSchema,
  CreateCheckoutSessionInputSchema,
  CreateFinancialAccountInputSchema,
  CreateInternalTransferInputSchema,
  CreatePaymentCodeInputSchema,
  CreatePayoutInputSchema,
  CreateUssdOtpInputSchema,
  CreateWebhookInputSchema,
  IdSchema,
  LimitSchema,
  MomoProviderIdSchema,
  ReceiptOrderNumberSchema,
  RedeemReceiptInputSchema,
  UpdateFinancialAccountInputSchema,
  UpdateInternalTransferInputSchema,
  UpdatePaymentCodeInputSchema,
  UpdatePaymentInputSchema,
  UpdatePayoutInputSchema,
  UpdateWebhookInputSchema,
} from "./schemas";

/**
 * Converts valibot validation issues to a MonimeValidationError.
 *
 * Transforms valibot's raw issue format into a structured ValidationIssue array
 * and creates a MonimeValidationError with appropriate error messaging. Handles
 * nested field paths by joining path segments with dots (e.g., "customer.name").
 *
 * @internal
 * @param issues - Array of valibot validation issues from failed parse operations
 * @returns A MonimeValidationError with formatted validation issues
 *
 * @example
 * ```typescript
 * const result = v.safeParse(schema, data);
 * if (!result.success) {
 *   throw to_validation_error(result.issues);
 * }
 * ```
 */
function to_validation_error(
  issues: v.BaseIssue<unknown>[],
): MonimeValidationError {
  if (issues.length === 0) {
    return new MonimeValidationError("Validation failed", [
      { message: "Validation failed", field: "unknown" },
    ]);
  }

  const validation_issues: ValidationIssue[] = issues.map((issue) => ({
    message: issue.message,
    field: issue.path?.map((p) => p.key).join(".") ?? "unknown",
    value: issue.input,
  }));

  // Safe: we know validation_issues has at least 1 element since issues.length > 0
  const first_issue = validation_issues.at(0);
  const message =
    validation_issues.length === 1
      ? first_issue?.message
      : `Validation failed with ${validation_issues.length} errors`;

  return new MonimeValidationError(String(message), validation_issues);
}

/**
 * Validates data against a valibot schema and throws on validation failure.
 *
 * A generic validation function that accepts any valibot schema and input data,
 * parses it against the schema, and throws a MonimeValidationError if validation
 * fails. This is the single entry point for all input validation in the SDK.
 *
 * The function performs type-safe validation using valibot's schema definitions
 * while maintaining detailed error information about what failed and why. All
 * validation errors are caught and transformed into structured MonimeValidationError
 * instances with field paths, messages, and problematic values.
 *
 * @template T - The expected type of valid data (inferred from schema)
 * @param schema - A valibot schema to validate against
 * @param data - Unknown input data to validate
 * @throws {MonimeValidationError} If validation fails with details about validation issues
 *
 * @example
 * ```typescript
 * // Validate a payment code creation request
 * validate(CreatePaymentCodeInputSchema, { name: "Monthly Plan", mode: "recurrent" });
 *
 * // Validate an ID
 * validate(IdSchema, "pc-12345");
 *
 * // Validate pagination limit
 * validate(LimitSchema, 50);
 * ```
 */
export function validate<T>(
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
  data: unknown,
): void {
  const result = v.safeParse(schema, data);
  if (!result.success) {
    throw to_validation_error(result.issues);
  }
}
