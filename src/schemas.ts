import * as v from "valibot";

// ============================================================================
// Helper Functions
// ============================================================================

// Helper for optional nullable fields (used in update inputs)
// In update operations: missing field = don't update, null = clear, value = update
function optional_nullable<
  T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(schema: T) {
  return v.optional(v.nullable(schema));
}

// ============================================================================
// Shared Schemas
// ============================================================================

export const CurrencySchema = v.picklist(["SLE", "USD"]);

export const AmountSchema = v.object({
  currency: CurrencySchema,
  value: v.pipe(v.number(), v.minValue(0)),
});

export const MetadataSchema = v.pipe(
  v.record(v.string(), v.pipe(v.string(), v.maxLength(100))),
  v.check(
    (obj) => Object.keys(obj).length <= 64,
    "metadata cannot have more than 64 keys",
  ),
);

// ============================================================================
// Client Options Schema
// ============================================================================

export const ClientOptionsSchema = v.object({
  spaceId: v.pipe(v.string(), v.nonEmpty("spaceId is required")),
  accessToken: v.pipe(v.string(), v.nonEmpty("accessToken is required")),
  baseUrl: v.optional(v.string()),
  timeout: v.optional(v.pipe(v.number(), v.minValue(0))),
  retries: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  retryDelay: v.optional(v.pipe(v.number(), v.minValue(0))),
  retryBackoff: v.optional(v.pipe(v.number(), v.minValue(0))),
  validateInputs: v.optional(v.boolean()),
});

// ============================================================================
// ID Schema (single reusable schema for all resource IDs)
// ============================================================================

export const IdSchema = v.pipe(v.string(), v.nonEmpty("id is required"));

// ============================================================================
// List Params Schema
// ============================================================================

export const LimitSchema = v.optional(
  v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(50)),
);

// ============================================================================
// Payment Code Schemas
// ============================================================================

const PaymentCodeBaseFields = {
  name: v.pipe(v.string(), v.minLength(3), v.maxLength(64)),
  enable: v.optional(v.boolean()),
  amount: v.optional(AmountSchema),
  duration: v.optional(v.string()),
  customer: v.optional(v.object({ name: optional_nullable(v.string()) })),
  reference: v.optional(v.string()),
  authorizedProviders: v.optional(v.array(v.picklist(["m17", "m18", "m13"]))),
  authorizedPhoneNumber: v.optional(v.string()),
  financialAccountId: v.optional(v.string()),
  metadata: v.optional(MetadataSchema),
};

export const RecurrentPaymentTargetSchema = v.object({
  expectedPaymentCount: optional_nullable(v.number()),
  expectedPaymentTotal: optional_nullable(AmountSchema),
});

const CreatePaymentCodeOneTimeSchema = v.object({
  ...PaymentCodeBaseFields,
  mode: v.optional(v.literal("one_time")),
  recurrentPaymentTarget: v.optional(RecurrentPaymentTargetSchema),
});

const CreatePaymentCodeRecurrentSchema = v.object({
  ...PaymentCodeBaseFields,
  mode: v.literal("recurrent"),
  recurrentPaymentTarget: RecurrentPaymentTargetSchema,
});

export const CreatePaymentCodeInputSchema = v.variant("mode", [
  CreatePaymentCodeOneTimeSchema,
  CreatePaymentCodeRecurrentSchema,
]);

// ============================================================================
// Checkout Session Schemas
// ============================================================================

export const LineItemSchema = v.object({
  type: v.literal("custom"),
  name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(100)),
  price: AmountSchema,
  quantity: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100000)),
});

export const CreateCheckoutSessionInputSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(150)),
  lineItems: v.pipe(v.array(LineItemSchema), v.minLength(1), v.maxLength(16)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  cancelUrl: v.optional(v.string()),
  successUrl: v.optional(v.string()),
  callbackState: v.optional(v.pipe(v.string(), v.maxLength(255))),
  reference: v.optional(v.pipe(v.string(), v.maxLength(255))),
  financialAccountId: v.optional(v.string()),
  paymentOptions: v.optional(
    v.object({
      card: v.optional(v.boolean()),
      bank: v.optional(v.boolean()),
      momo: v.optional(v.boolean()),
      wallet: v.optional(v.boolean()),
    }),
  ),
  brandingOptions: v.optional(
    v.object({
      primaryColor: v.optional(v.string()),
    }),
  ),
  metadata: v.optional(MetadataSchema),
});

// ============================================================================
// Payout Schemas
// ============================================================================

const PayoutDestinationBankSchema = v.object({
  type: v.literal("bank"),
  providerId: v.pipe(v.string(), v.nonEmpty()),
  accountNumber: v.pipe(v.string(), v.nonEmpty()),
});

const PayoutDestinationMomoSchema = v.object({
  type: v.literal("momo"),
  providerId: v.pipe(v.string(), v.nonEmpty()),
  phoneNumber: v.pipe(v.string(), v.nonEmpty()),
});

const PayoutDestinationWalletSchema = v.object({
  type: v.literal("wallet"),
  providerId: v.pipe(v.string(), v.nonEmpty()),
  walletId: v.optional(v.pipe(v.string(), v.nonEmpty())),
});

export const PayoutDestinationSchema = v.variant("type", [
  PayoutDestinationBankSchema,
  PayoutDestinationMomoSchema,
  PayoutDestinationWalletSchema,
]);

export const CreatePayoutInputSchema = v.object({
  amount: AmountSchema,
  destination: PayoutDestinationSchema,
  source: v.optional(
    v.object({
      financialAccountId: v.optional(v.string()),
    }),
  ),
  metadata: v.optional(MetadataSchema),
});

// ============================================================================
// Webhook Schemas
// ============================================================================

const WebhookVerificationHS256Schema = v.object({
  type: v.literal("HS256"),
  secret: v.pipe(v.string(), v.minLength(32), v.maxLength(256)),
});

const WebhookVerificationES256Schema = v.object({
  type: v.literal("ES256"),
});

export const WebhookVerificationMethodSchema = v.variant("type", [
  WebhookVerificationHS256Schema,
  WebhookVerificationES256Schema,
]);

export const CreateWebhookInputSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  url: v.pipe(v.string(), v.nonEmpty(), v.maxLength(255)),
  apiRelease: v.picklist(["caph", "siriusb"]),
  events: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(100)),
  enabled: v.optional(v.boolean()),
  verificationMethod: v.optional(WebhookVerificationMethodSchema),
  headers: v.optional(
    v.pipe(
      v.record(v.string(), v.string()),
      v.check(
        (obj) => Object.keys(obj).length <= 10,
        "headers cannot have more than 10 properties",
      ),
    ),
  ),
  alertEmails: v.optional(v.pipe(v.array(v.string()), v.maxLength(2))),
  metadata: v.optional(MetadataSchema),
});

// ============================================================================
// Internal Transfer Schemas
// ============================================================================

export const FinancialAccountRefSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
});

export const CreateInternalTransferInputSchema = v.object({
  amount: AmountSchema,
  sourceFinancialAccount: FinancialAccountRefSchema,
  destinationFinancialAccount: FinancialAccountRefSchema,
  description: v.optional(v.pipe(v.string(), v.maxLength(150))),
  metadata: v.optional(MetadataSchema),
});

// ============================================================================
// USSD OTP Schemas
// ============================================================================


export const CreateUssdOtpInputSchema = v.object({
  authorizedPhoneNumber: v.pipe(v.string(), v.nonEmpty()),
  verificationMessage: v.optional(v.pipe(v.string(), v.maxLength(255))),
  duration: v.optional(v.string()),
  metadata: v.optional(MetadataSchema),
});

// ============================================================================
// Update Input Schemas
// ============================================================================

export const UpdatePaymentCodeInputSchema = v.object({
  name: optional_nullable(v.pipe(v.string(), v.minLength(3), v.maxLength(64))),
  amount: optional_nullable(AmountSchema),
  duration: optional_nullable(v.string()),
  enable: optional_nullable(v.boolean()),
  customer: optional_nullable(
    v.object({ name: optional_nullable(v.string()) }),
  ),
  reference: optional_nullable(v.string()),
  authorizedProviders: optional_nullable(
    v.array(v.picklist(["m17", "m18", "m13"])),
  ),
  authorizedPhoneNumber: optional_nullable(v.string()),
  recurrentPaymentTarget: optional_nullable(
    v.object({
      expectedPaymentCount: optional_nullable(v.number()),
      expectedPaymentTotal: optional_nullable(AmountSchema),
    }),
  ),
  financialAccountId: optional_nullable(v.string()),
  metadata: optional_nullable(MetadataSchema),
});

export const UpdatePaymentInputSchema = v.object({
  name: optional_nullable(v.string()),
  metadata: optional_nullable(MetadataSchema),
});

export const UpdatePayoutInputSchema = v.object({
  metadata: optional_nullable(MetadataSchema),
});

export const UpdateWebhookInputSchema = v.object({
  name: optional_nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  url: optional_nullable(v.pipe(v.string(), v.nonEmpty(), v.maxLength(255))),
  enabled: optional_nullable(v.boolean()),
  apiRelease: optional_nullable(v.picklist(["caph", "siriusb"])),
  events: optional_nullable(
    v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(100)),
  ),
  headers: optional_nullable(
    v.pipe(
      v.record(v.string(), v.string()),
      v.check(
        (obj) => Object.keys(obj).length <= 10,
        "headers cannot have more than 10 properties",
      ),
    ),
  ),
  alertEmails: optional_nullable(v.pipe(v.array(v.string()), v.maxLength(2))),
  metadata: optional_nullable(MetadataSchema),
});

export const UpdateInternalTransferInputSchema = v.object({
  description: optional_nullable(v.pipe(v.string(), v.maxLength(150))),
  metadata: optional_nullable(MetadataSchema),
});

// ============================================================================
// Financial Account Schemas
// ============================================================================

export const CreateFinancialAccountInputSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  currency: CurrencySchema,
  reference: v.optional(v.pipe(v.string(), v.maxLength(64))),
  description: v.optional(v.pipe(v.string(), v.maxLength(150))),
  metadata: v.optional(MetadataSchema),
});

export const UpdateFinancialAccountInputSchema = v.object({
  name: optional_nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  reference: optional_nullable(v.pipe(v.string(), v.maxLength(64))),
  description: optional_nullable(v.pipe(v.string(), v.maxLength(150))),
  metadata: optional_nullable(MetadataSchema),
});

// ============================================================================
// Receipt Schemas
// ============================================================================

export const ReceiptOrderNumberSchema = v.pipe(
  v.string(),
  v.nonEmpty("orderNumber is required"),
  v.maxLength(20, "orderNumber cannot exceed 20 characters"),
);

export const RedeemEntitlementInputSchema = v.object({
  key: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  units: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
});

export const RedeemReceiptInputSchema = v.object({
  redeemAll: optional_nullable(v.boolean()),
  entitlements: optional_nullable(
    v.pipe(v.array(RedeemEntitlementInputSchema), v.minLength(1)),
  ),
  metadata: v.optional(MetadataSchema),
});

// ============================================================================
// Bank Schemas
// ============================================================================

export const BankProviderIdSchema = v.pipe(
  v.string(),
  v.nonEmpty("providerId is required"),
);

export const CountryCodeSchema = v.pipe(
  v.string(),
  v.nonEmpty("country is required"),
  v.length(2, "country must be a 2-letter ISO 3166-1 alpha-2 code"),
);

// ============================================================================
// Momo Schemas
// ============================================================================

export const MomoProviderIdSchema = v.pipe(
  v.string(),
  v.nonEmpty("providerId is required"),
);
