import * as v from "valibot";
import { MonimeValidationError, type ValidationIssue } from "./errors";
import {
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
import type { ClientOptions } from "./types";

/**
 * Converts valibot issues to MonimeValidationError with all issues included
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
  const first_issue = validation_issues[0]!;
  const message =
    validation_issues.length === 1
      ? first_issue.message
      : `Validation failed with ${validation_issues.length} errors`;

  return new MonimeValidationError(message, validation_issues);
}

/**
 * Generic validation function using valibot schema
 */
function validate_input<T>(
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
  data: unknown,
): void {
  const result = v.safeParse(schema, data);
  if (!result.success) {
    throw to_validation_error(result.issues);
  }
}

// ============================================================================
// Client Options Validation
// ============================================================================

export function validateClientOptions(options: ClientOptions): void {
  validate_input(ClientOptionsSchema, options);
}

// ============================================================================
// ID Validation (single function for all resource IDs)
// ============================================================================

export function validateId(id: string): void {
  validate_input(IdSchema, id);
}

// ============================================================================
// List Params Validation
// ============================================================================

export function validateLimit(limit: number | undefined): void {
  if (limit === undefined) return;
  validate_input(LimitSchema, limit);
}

// ============================================================================
// Create Input Validations
// ============================================================================

export function validateCreatePaymentCodeInput(input: unknown): void {
  validate_input(CreatePaymentCodeInputSchema, input);
}

export function validateCreateCheckoutSessionInput(input: unknown): void {
  validate_input(CreateCheckoutSessionInputSchema, input);
}

export function validateCreatePayoutInput(input: unknown): void {
  validate_input(CreatePayoutInputSchema, input);
}

export function validateCreateWebhookInput(input: unknown): void {
  validate_input(CreateWebhookInputSchema, input);
}

export function validateCreateInternalTransferInput(input: unknown): void {
  validate_input(CreateInternalTransferInputSchema, input);
}

export function validateCreateUssdOtpInput(input: unknown): void {
  validate_input(CreateUssdOtpInputSchema, input);
}

// ============================================================================
// Update Input Validations
// ============================================================================

export function validateUpdatePaymentCodeInput(input: unknown): void {
  validate_input(UpdatePaymentCodeInputSchema, input);
}

export function validateUpdatePaymentInput(input: unknown): void {
  validate_input(UpdatePaymentInputSchema, input);
}

export function validateUpdatePayoutInput(input: unknown): void {
  validate_input(UpdatePayoutInputSchema, input);
}

export function validateUpdateWebhookInput(input: unknown): void {
  validate_input(UpdateWebhookInputSchema, input);
}

export function validateUpdateInternalTransferInput(input: unknown): void {
  validate_input(UpdateInternalTransferInputSchema, input);
}

// ============================================================================
// Financial Account Validations
// ============================================================================

export function validateCreateFinancialAccountInput(input: unknown): void {
  validate_input(CreateFinancialAccountInputSchema, input);
}

export function validateUpdateFinancialAccountInput(input: unknown): void {
  validate_input(UpdateFinancialAccountInputSchema, input);
}

// ============================================================================
// Receipt Validations
// ============================================================================

export function validateReceiptOrderNumber(orderNumber: string): void {
  validate_input(ReceiptOrderNumberSchema, orderNumber);
}

export function validateRedeemReceiptInput(input: unknown): void {
  validate_input(RedeemReceiptInputSchema, input);
}

// ============================================================================
// Bank Validations
// ============================================================================

export function validateBankProviderId(providerId: string): void {
  validate_input(BankProviderIdSchema, providerId);
}

export function validateCountryCode(country: string): void {
  validate_input(CountryCodeSchema, country);
}

// ============================================================================
// Momo Validations
// ============================================================================

export function validateMomoProviderId(providerId: string): void {
  validate_input(MomoProviderIdSchema, providerId);
}
