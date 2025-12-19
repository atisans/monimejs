/**
 * Configuration options for initializing the Monime API client.
 */
export type ClientOptions = {
  /** Your Monime workspace identifier */
  spaceId: string;
  /** API access token for authentication */
  accessToken: string;
  /** Base URL for API requests (defaults to Monime production API) */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum number of retry attempts for failed requests */
  retries?: number;
  /** Initial delay between retries in milliseconds */
  retryDelay?: number;
  /** Multiplier for exponential backoff between retries */
  retryBackoff?: number;
  /** Whether to validate input data before sending requests */
  validateInputs?: boolean;
};

/**
 * Per-request configuration options that override client-level settings.
 */
export type RequestConfig = {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum number of retry attempts */
  retries?: number;
  /** AbortSignal for cancelling the request */
  signal?: AbortSignal;
  /** Idempotency key to prevent duplicate processing of requests */
  idempotencyKey?: string;
};

/**
 * ISO 4217 currency codes supported by Monime.
 * - SLE: Sierra Leonean Leone
 * - USD: United States Dollar
 */
export type Currency = "SLE" | "USD";

/**
 * Monetary amount with currency and value.
 * Values are expressed in minor units (e.g., 100 = 1 Leone or 1 Dollar).
 */
export type Amount = {
  /** ISO 4217 currency code */
  currency: Currency;
  /** Amount value in minor units (cents/kobo/etc.) */
  value: number;
};

/**
 * Custom key-value pairs for storing additional information.
 * Maximum of 64 key-value pairs allowed.
 */
export type Metadata = Record<string, string>;

/**
 * Recursive ownership structure representing the chain of objects that led to creation.
 * Each owner can have its own parent owner, forming an audit trail.
 */
export type OwnershipGraphOwner = {
  /** Unique identifier of the owning object */
  id: string;
  /** Type of the owning object (e.g., "payment_code", "checkout_session") */
  type: string;
  /** Additional metadata about the owner */
  metadata?: Metadata;
  /** Parent owner in the ownership chain */
  owner?: OwnershipGraphOwner;
};

/**
 * Audit trail tracing the origin of an object across related resources.
 * Tracks the chain of ownership from the current object back to its root creator.
 */
export type OwnershipGraph = {
  /** Root owner in the ownership chain */
  owner: OwnershipGraphOwner;
};

/**
 * Pagination information for list responses.
 */
export type PaginationInfo = {
  /** Number of items in the current page */
  count: number;
  /** Cursor for fetching the next page, null if no more pages */
  next: string | null;
};

/**
 * Standard API response wrapper for single resource operations.
 * @template T - The type of the result data
 */
export type ApiResponse<T> = {
  /** Whether the request succeeded */
  success: boolean;
  /** Array of informational messages or error details */
  messages: string[];
  /** The requested resource data */
  result: T;
};

/**
 * Standard API response wrapper for list operations.
 * @template T - The type of items in the result array
 */
export type ApiListResponse<T> = {
  /** Whether the request succeeded */
  success: boolean;
  /** Array of informational messages or error details */
  messages: string[];
  /** Array of resource items */
  result: T[];
  /** Pagination metadata for traversing result sets */
  pagination: PaginationInfo;
};

/**
 * API response for delete operations.
 */
export type ApiDeleteResponse = {
  /** Whether the deletion succeeded */
  success: boolean;
  /** Array of informational messages or error details */
  messages: string[];
};

/**
 * Payment code usage mode.
 * - "one_time": Accepts a single payment then expires
 * - "recurrent": Accepts multiple payments until target is met or manually disabled
 */
export type PaymentCodeMode = "one_time" | "recurrent";

/**
 * Payment code lifecycle states.
 * - "pending": Created and waiting for first payment
 * - "processing": Payment is being processed
 * - "expired": Past expireTime without completion
 * - "completed": All expected payments received
 * - "cancelled": Manually cancelled before completion
 */
export type PaymentCodeStatus =
  | "pending"
  | "cancelled"
  | "processing"
  | "expired"
  | "completed";

/**
 * Mobile money provider identifiers.
 * - "m13": QCell
 * - "m17": Africell
 * - "m18": Orange
 */
export type PaymentCodeProvider = "m13" | "m17" | "m18";

/**
 * Optional customer contact information associated with a payment code.
 */
export type PaymentCodeCustomer = {
  /** Customer's full name */
  name?: string | null;
};

/**
 * Completion criteria for recurrent payment codes.
 * Code completes when either count or total is reached, whichever comes first.
 */
export type RecurrentPaymentTarget = {
  /** Expected number of successful payments */
  expectedPaymentCount?: number | null;
  /** Expected cumulative payment total */
  expectedPaymentTotal?: Amount | null;
};

/**
 * Payment details available when a payment code processes a payment.
 * Included in webhook events and status queries after payment processing.
 */
export type ProcessedPaymentData = {
  /** Amount paid by the customer */
  amount: Amount;
  /** Unique order identifier */
  orderId: string;
  /** Unique payment identifier */
  paymentId: string;
  /** Human-readable order number */
  orderNumber: string;
  /** Payment channel information */
  channelData: {
    /** Mobile money provider identifier */
    providerId: string;
    /** Customer's account/phone number */
    accountId: string;
    /** Provider's transaction reference */
    reference: string;
  };
  /** Reference to the resulting financial transaction(s) */
  financialTransactionReference: string;
  /** Custom metadata attached to the payment */
  metadata?: Metadata;
};

/**
 * Represents a payment code - a programmable, short-lived token enabling users to collect payments.
 * Supports both one-time and recurrent collection modes with configurable restrictions.
 */
export type PaymentCode = {
  /** Unique identifier for the payment code */
  id: string;
  /** Usage type - "one_time" for single payment, "recurrent" for multiple payments */
  mode: PaymentCodeMode;
  /** Current lifecycle state (pending, processing, expired, completed, cancelled) */
  status: PaymentCodeStatus;
  /** Human-readable label for tracking purposes */
  name?: string | null;
  /** Payment amount with currency (ISO 4217: SLE/USD) and value in minor units */
  amount: Amount;
  /** Current operational status - controls whether payment code accepts payments */
  enable: boolean;
  /** ISO 8601 timestamp when payment code expires */
  expireTime: string;
  /** Optional contact details including customer name */
  customer?: PaymentCodeCustomer | null;
  /** USSD dial string for payment initiation (e.g., *715*12345#) */
  ussdCode: string;
  /** Transaction reconciliation tag for external system tracking */
  reference?: string | null;
  /** Array of permitted mobile money providers */
  authorizedProviders?: PaymentCodeProvider[] | null;
  /** MSISDN restriction limiting payment to a single phone number */
  authorizedPhoneNumber: string;
  /** For recurrent codes - completion criteria with expectedPaymentCount and expectedPaymentTotal */
  recurrentPaymentTarget?: RecurrentPaymentTarget | null;
  /** ID of destination settlement account where funds will be credited */
  financialAccountId?: string | null;
  /** Payment details available during webhook events */
  processedPaymentData?: ProcessedPaymentData | null;
  /** ISO 8601 timestamp when payment code was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime?: string | null;
  /** Audit trail tracing origin across related objects */
  ownershipGraph?: OwnershipGraph | null;
  /** Custom key-value pairs for additional information */
  metadata?: Metadata | null;
};

/**
 * Base input fields shared by all payment code creation requests.
 */
type CreatePaymentCodeBaseInput = {
  /** Human-readable label for the payment code */
  name: string;
  /** Whether the payment code is active and accepting payments (defaults to true) */
  enable?: boolean;
  /** Payment amount to collect */
  amount?: Amount;
  /** ISO 8601 duration until expiration (e.g., "P1D" for 1 day) */
  duration?: string;
  /** Optional customer contact information */
  customer?: PaymentCodeCustomer;
  /** External reference for reconciliation */
  reference?: string;
  /** Restrict to specific mobile money providers */
  authorizedProviders?: PaymentCodeProvider[];
  /** Restrict to a single phone number (MSISDN format) */
  authorizedPhoneNumber?: string;
  /** Destination account for credited funds */
  financialAccountId?: string;
  /** Custom key-value pairs */
  metadata?: Metadata;
};

/**
 * Input for creating a one-time payment code that accepts a single payment.
 */
export type CreatePaymentCodeOneTimeInput = CreatePaymentCodeBaseInput & {
  /** Payment mode (defaults to "one_time" if omitted) */
  mode?: "one_time";
  /** Optional recurrent payment target (not applicable for one-time codes) */
  recurrentPaymentTarget?: RecurrentPaymentTarget;
};

/**
 * Input for creating a recurrent payment code that accepts multiple payments.
 */
export type CreatePaymentCodeRecurrentInput = CreatePaymentCodeBaseInput & {
  /** Payment mode - must be "recurrent" */
  mode: "recurrent";
  /** Required completion criteria for recurrent codes */
  recurrentPaymentTarget: RecurrentPaymentTarget;
};

/**
 * Union type for creating either one-time or recurrent payment codes.
 */
export type CreatePaymentCodeInput =
  | CreatePaymentCodeOneTimeInput
  | CreatePaymentCodeRecurrentInput;

/**
 * Input for updating an existing payment code.
 * All fields are optional - only provided fields will be updated.
 */
export type UpdatePaymentCodeInput = {
  /** Human-readable label */
  name?: string | null;
  /** Payment amount */
  amount?: Amount | null;
  /** ISO 8601 duration to extend expiration */
  duration?: string | null;
  /** Enable/disable payment acceptance */
  enable?: boolean | null;
  /** Customer contact information */
  customer?: PaymentCodeCustomer | null;
  /** External reference */
  reference?: string | null;
  /** Allowed mobile money providers */
  authorizedProviders?: PaymentCodeProvider[] | null;
  /** Authorized phone number */
  authorizedPhoneNumber?: string | null;
  /** Recurrent payment target */
  recurrentPaymentTarget?: RecurrentPaymentTarget | null;
  /** Destination financial account */
  financialAccountId?: string | null;
  /** Custom metadata */
  metadata?: Metadata | null;
};

/**
 * Query parameters for listing payment codes.
 */
export type ListPaymentCodesParams = {
  /** Filter by specific USSD code */
  ussd_code?: string;
  /** Filter by payment mode */
  mode?: PaymentCodeMode;
  /** Filter by status */
  status?: PaymentCodeStatus;
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Payment processing states.
 * - "pending": Payment initiated, awaiting processing
 * - "processing": Payment is being processed
 * - "completed": Payment successfully completed
 */
export type PaymentStatus = "pending" | "processing" | "completed";

/**
 * Payment method channel types.
 */
export type ChannelType = "bank" | "card" | "momo" | "wallet";

/**
 * Payment method details.
 */
export type Channel = {
  /** Type of payment channel used (bank, card, momo, wallet) */
  type: ChannelType;
};

/**
 * Fee charged during a transaction.
 */
export type Fee = {
  /** Fee type identifier */
  code: string;
  /** Fee amount */
  amount: Amount;
  /** Additional fee metadata */
  metadata?: Metadata;
};

/**
 * Represents a payment transaction from a customer.
 * Created when a customer pays via checkout session, payment code, or other payment methods.
 */
export type Payment = {
  /** Unique identifier for the payment */
  id: string;
  /** Current payment state (pending, processing, completed) */
  status: PaymentStatus;
  /** Total payment amount from payer */
  amount: Amount;
  /** Payment method details with type (bank, card, momo, wallet) */
  channel?: Channel | null;
  /** Optional label for identification */
  name?: string | null;
  /** External system reference for reconciliation */
  reference?: string | null;
  /** Internal Monime order identifier */
  orderNumber?: string | null;
  /** ID of destination account for credited funds */
  financialAccountId?: string | null;
  /** Reference to resulting financial transaction(s) */
  financialTransactionReference?: string | null;
  /** Applied fees including platform and processing charges */
  fees?: Fee[] | null;
  /** ISO 8601 timestamp when payment was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime?: string | null;
  /** Audit trail of related objects */
  ownershipGraph?: OwnershipGraph | null;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Query parameters for listing payments.
 */
export type ListPaymentsParams = {
  /** Filter by order number */
  orderNumber?: string;
  /** Filter by destination financial account */
  financialAccountId?: string;
  /** Filter by financial transaction reference */
  financialTransactionReference?: string;
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Input for updating a payment.
 */
export type UpdatePaymentInput = {
  /** Payment label */
  name?: string | null;
  /** Custom metadata */
  metadata?: Metadata | null;
};

/**
 * Checkout session lifecycle states.
 * - "pending": Created and awaiting payment
 * - "completed": Payment successfully received
 * - "cancelled": User cancelled or abandoned checkout
 * - "expired": Session expired before payment
 */
export type CheckoutSessionStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | "expired";

/**
 * Line item types for checkout sessions.
 * Currently only "custom" is supported.
 */
export type LineItemType = "custom";

/**
 * Individual product or service in a checkout session.
 */
export type LineItem = {
  /** Line item type */
  type: LineItemType;
  /** Product or service name */
  name: string;
  /** Unit price */
  price: Amount;
  /** Number of units */
  quantity: number;
};

/**
 * Collection of line items in a checkout session.
 */
export type LineItems = {
  /** Array of line items being purchased */
  data: LineItem[];
};

/**
 * UI customization options for the checkout page.
 */
export type BrandingOptions = {
  /** Primary brand color (hex code) */
  primaryColor?: string;
};

/**
 * Configuration for available payment methods in checkout.
 */
export type PaymentOptions = {
  /** Enable card payments */
  card?: boolean;
  /** Enable bank transfers */
  bank?: boolean;
  /** Enable mobile money payments */
  momo?: boolean;
  /** Enable wallet payments */
  wallet?: boolean;
};

/**
 * Represents a hosted checkout session for collecting payments.
 * Provides a customer-facing payment page with customizable branding and line items.
 */
export type CheckoutSession = {
  /** Unique identifier */
  id: string;
  /** Current state (pending, completed, cancelled, expired) */
  status: CheckoutSessionStatus;
  /** Title displayed in customer-facing interfaces */
  name: string;
  /** Generated identifier linking to associated payment */
  orderNumber: string;
  /** External identifier for backend integration */
  reference?: string | null;
  /** Context explaining session purpose */
  description?: string | null;
  /** URL where customer begins checkout */
  redirectUrl: string;
  /** Destination URL if user abandons checkout */
  cancelUrl?: string | null;
  /** Destination URL after successful payment */
  successUrl?: string | null;
  /** Products/services being purchased with type, name, price, quantity */
  lineItems: LineItems;
  /** Receiving account ID */
  financialAccountId?: string | null;
  /** UI customization (primaryColor) */
  brandingOptions?: BrandingOptions | null;
  /** Auto-expiration timestamp */
  expireTime: string;
  /** ISO 8601 timestamp when session was created */
  createTime: string;
  /** Audit trail of related objects */
  ownershipGraph?: OwnershipGraph | null;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Input for creating a new checkout session.
 */
export type CreateCheckoutSessionInput = {
  /** Session title shown to customer */
  name: string;
  /** Products/services being sold */
  lineItems: LineItem[];
  /** Optional description of the session */
  description?: string;
  /** URL for customer to return if they cancel */
  cancelUrl?: string;
  /** URL for customer to return after successful payment */
  successUrl?: string;
  /** Optional state parameter passed to callback URLs */
  callbackState?: string;
  /** External reference for tracking */
  reference?: string;
  /** Destination account for funds */
  financialAccountId?: string;
  /** Enable/disable specific payment methods */
  paymentOptions?: PaymentOptions;
  /** Customize checkout page appearance */
  brandingOptions?: BrandingOptions;
  /** Custom metadata */
  metadata?: Metadata;
};

/**
 * Query parameters for listing checkout sessions.
 */
export type ListCheckoutSessionsParams = {
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Payout processing states.
 * - "pending": Payout created, awaiting processing
 * - "processing": Payout is being sent to recipient
 * - "completed": Funds successfully disbursed
 * - "failed": Payout failed (see failureDetail)
 */
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Destination account types for payouts.
 */
export type PayoutDestinationType = "bank" | "momo" | "wallet";

/**
 * Payout failure reason codes.
 * - "unknown": Unspecified error
 * - "fund_insufficient": Source account has insufficient funds
 * - "authorization_failed": Authorization check failed
 * - "provider_unknown": Provider not recognized
 * - "provider_account_blocked": Recipient account is blocked
 * - "provider_account_missing": Recipient account does not exist
 * - "provider_account_quota_exhausted": Recipient account quota exceeded
 */
export type PayoutFailureCode =
  | "unknown"
  | "fund_insufficient"
  | "authorization_failed"
  | "provider_unknown"
  | "provider_account_blocked"
  | "provider_account_missing"
  | "provider_account_quota_exhausted";

/**
 * Source of funds for a payout.
 */
export type PayoutSource = {
  /** ID of the financial account to debit */
  financialAccountId: string;
  /** Optional specific transaction reference */
  transactionReference?: string | null;
};

/**
 * Bank account destination for payout.
 */
export type PayoutDestinationBank = {
  /** Destination type */
  type: "bank";
  /** Bank provider identifier */
  providerId: string;
  /** Recipient bank account number */
  accountNumber: string;
};

/**
 * Mobile money account destination for payout.
 */
export type PayoutDestinationMomo = {
  /** Destination type */
  type: "momo";
  /** Mobile money provider identifier */
  providerId: string;
  /** Recipient phone number (MSISDN format) */
  phoneNumber: string;
};

/**
 * Wallet account destination for payout.
 */
export type PayoutDestinationWallet = {
  /** Destination type */
  type: "wallet";
  /** Wallet provider identifier */
  providerId: string;
  /** Recipient wallet identifier */
  walletId: string;
};

/**
 * Union type for all payout destination types.
 */
export type PayoutDestination =
  | PayoutDestinationBank
  | PayoutDestinationMomo
  | PayoutDestinationWallet;

/**
 * Details about why a payout failed.
 */
export type PayoutFailureDetail = {
  /** Error code categorizing the failure */
  code: PayoutFailureCode;
  /** Human-readable error description */
  message: string;
};

/**
 * Represents a payout (money out) from your account to a recipient.
 * Used for disbursements to bank accounts, mobile money, or wallets.
 */
export type Payout = {
  /** Unique identifier */
  id: string;
  /** Processing state (pending, processing, completed, failed) */
  status: PayoutStatus;
  /** Funds to be disbursed */
  amount: Amount;
  /** Originating financial account with financialAccountId and transactionReference */
  source: PayoutSource;
  /** Recipient account (bank, momo, or wallet type) */
  destination: PayoutDestination;
  /** Charges applied during processing */
  fees?: Fee[] | null;
  /** Error info if transaction fails with code and message */
  failureDetail?: PayoutFailureDetail | null;
  /** ISO 8601 timestamp when payout was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime?: string | null;
  /** Audit trail of related objects */
  ownershipGraph?: OwnershipGraph | null;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Input for specifying payout source account.
 */
export type CreatePayoutSourceInput = {
  /** Source financial account ID (defaults to primary account if omitted) */
  financialAccountId?: string;
};

/**
 * Input for creating a bank account payout destination.
 */
export type CreatePayoutDestinationBankInput = {
  /** Destination type */
  type: "bank";
  /** Bank provider identifier */
  providerId: string;
  /** Recipient's bank account number */
  accountNumber: string;
};

/**
 * Input for creating a mobile money payout destination.
 */
export type CreatePayoutDestinationMomoInput = {
  /** Destination type */
  type: "momo";
  /** Mobile money provider identifier */
  providerId: string;
  /** Recipient's phone number */
  phoneNumber: string;
};

/**
 * Input for creating a wallet payout destination.
 */
export type CreatePayoutDestinationWalletInput = {
  /** Destination type */
  type: "wallet";
  /** Wallet provider identifier */
  providerId: string;
  /** Recipient's wallet ID (optional) */
  walletId?: string;
};

/**
 * Union type for all payout destination input types.
 */
export type CreatePayoutDestinationInput =
  | CreatePayoutDestinationBankInput
  | CreatePayoutDestinationMomoInput
  | CreatePayoutDestinationWalletInput;

/**
 * Input for creating a new payout.
 */
export type CreatePayoutInput = {
  /** Amount to disburse */
  amount: Amount;
  /** Recipient account details */
  destination: CreatePayoutDestinationInput;
  /** Source account (optional, uses primary if omitted) */
  source?: CreatePayoutSourceInput;
  /** Custom metadata */
  metadata?: Metadata;
};

/**
 * Input for updating a payout.
 */
export type UpdatePayoutInput = {
  /** Custom metadata */
  metadata?: Metadata | null;
};

/**
 * Query parameters for listing payouts.
 */
export type ListPayoutsParams = {
  /** Filter by payout status */
  status?: PayoutStatus;
  /** Filter by source financial account ID */
  sourceFinancialAccountId?: string;
  /** Filter by source transaction reference */
  sourceTransactionReference?: string;
  /** Filter by destination transaction reference */
  destinationTransactionReference?: string;
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Monime API version identifiers for webhooks.
 * Different releases may have different event schemas.
 */
export type WebhookApiRelease = "caph" | "siriusb";

/**
 * Webhook signature verification algorithms.
 */
export type WebhookVerificationType = "HS256" | "ES256";

/**
 * HMAC-based webhook verification using a shared secret.
 */
export type WebhookVerificationMethodHS256 = {
  /** Verification algorithm type */
  type: "HS256";
  /** Shared secret for HMAC signature verification */
  secret: string;
};

/**
 * Elliptic curve-based webhook verification using public key cryptography.
 */
export type WebhookVerificationMethodES256 = {
  /** Verification algorithm type */
  type: "ES256";
  /** Public key for signature verification (Monime generates if not provided) */
  publicKey?: string;
};

/**
 * Union type for webhook verification methods.
 */
export type WebhookVerificationMethod =
  | WebhookVerificationMethodHS256
  | WebhookVerificationMethodES256;

/**
 * Custom HTTP headers to include with webhook requests.
 * Useful for authentication or routing.
 */
export type WebhookHeaders = Record<string, string>;

/**
 * Represents a webhook configuration for receiving event notifications.
 * Monime sends POST requests to the webhook URL when subscribed events occur.
 */
export type Webhook = {
  /** Unique webhook identifier */
  id: string;
  /** Human-readable configuration name */
  name: string;
  /** Publicly accessible endpoint receiving POST requests */
  url: string;
  /** Controls whether webhook is active */
  enabled: boolean;
  /** List of event types triggering the webhook */
  events: string[];
  /** API version identifier (caph, siriusb) */
  apiRelease: WebhookApiRelease;
  /** Security config for request integrity (ES256 or HS256) */
  verificationMethod: WebhookVerificationMethod;
  /** Custom HTTP headers for authentication */
  headers?: WebhookHeaders | null;
  /** Emails to notify for delivery failures */
  alertEmails?: string[] | null;
  /** ISO 8601 timestamp when webhook was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime?: string | null;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Input for configuring webhook verification method.
 */
export type CreateWebhookVerificationMethodInput =
  | { type: "HS256"; secret: string }
  | { type: "ES256" };

/**
 * Input for creating a new webhook.
 */
export type CreateWebhookInput = {
  /** Webhook name for identification */
  name: string;
  /** Endpoint URL to receive webhook events */
  url: string;
  /** API version to use for event payloads */
  apiRelease: WebhookApiRelease;
  /** Array of event types to subscribe to */
  events: string[];
  /** Whether webhook is active (defaults to true) */
  enabled?: boolean;
  /** Signature verification configuration */
  verificationMethod?: CreateWebhookVerificationMethodInput;
  /** Custom headers to include in requests */
  headers?: WebhookHeaders;
  /** Email addresses for failure notifications */
  alertEmails?: string[];
  /** Custom metadata */
  metadata?: Metadata;
};

/**
 * Input for updating an existing webhook.
 */
export type UpdateWebhookInput = {
  /** Webhook name */
  name?: string | null;
  /** Endpoint URL */
  url?: string | null;
  /** Enable/disable webhook */
  enabled?: boolean | null;
  /** API version */
  apiRelease?: WebhookApiRelease | null;
  /** Event subscriptions */
  events?: string[] | null;
  /** Custom headers */
  headers?: WebhookHeaders | null;
  /** Alert email addresses */
  alertEmails?: string[] | null;
  /** Custom metadata */
  metadata?: Metadata | null;
};

/**
 * Query parameters for listing webhooks.
 */
export type ListWebhooksParams = {
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Internal transfer processing states.
 * - "pending": Transfer created, awaiting processing
 * - "processing": Transfer is being executed
 * - "failed": Transfer failed (see failureDetail)
 * - "completed": Transfer successfully completed
 */
export type InternalTransferStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/**
 * Internal transfer failure reason codes.
 */
export type InternalTransferFailureCode = "unknown" | "fund_insufficient";

/**
 * Details about why an internal transfer failed.
 */
export type InternalTransferFailureDetail = {
  /** Error code (unknown, fund_insufficient) */
  code: InternalTransferFailureCode;
  /** Human-readable error description */
  message?: string | null;
};

/**
 * Reference to a financial account by ID.
 */
export type FinancialAccountRef = {
  /** Financial account identifier */
  id: string;
};

/**
 * Represents a transfer between two financial accounts within your Monime workspace.
 * Used for moving funds between your own accounts.
 */
export type InternalTransfer = {
  /** Unique identifier */
  id: string;
  /** Transfer state (pending, processing, failed, completed) */
  status: InternalTransferStatus;
  /** Transfer value and currency */
  amount: Amount;
  /** Account being debited */
  sourceFinancialAccount: FinancialAccountRef;
  /** Account being credited */
  destinationFinancialAccount: FinancialAccountRef;
  /** Reference to resulting transaction(s) */
  financialTransactionReference?: string | null;
  /** Human-readable context */
  description?: string | null;
  /** Error info (unknown, fund_insufficient) */
  failureDetail?: InternalTransferFailureDetail | null;
  /** Audit trail of related objects */
  ownershipGraph?: OwnershipGraph | null;
  /** ISO 8601 timestamp when transfer was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime?: string | null;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Input for creating a new internal transfer.
 */
export type CreateInternalTransferInput = {
  /** Amount to transfer */
  amount: Amount;
  /** Source account to debit from */
  sourceFinancialAccount: FinancialAccountRef;
  /** Destination account to credit to */
  destinationFinancialAccount: FinancialAccountRef;
  /** Optional description */
  description?: string;
  /** Custom metadata */
  metadata?: Metadata;
};

/**
 * Input for updating an internal transfer.
 */
export type UpdateInternalTransferInput = {
  /** Transfer description */
  description?: string | null;
  /** Custom metadata */
  metadata?: Metadata | null;
};

/**
 * Query parameters for listing internal transfers.
 */
export type ListInternalTransfersParams = {
  /** Filter by transfer status */
  status?: InternalTransferStatus;
  /** Filter by source account ID */
  sourceFinancialAccountId?: string;
  /** Filter by destination account ID */
  destinationFinancialAccountId?: string;
  /** Filter by financial transaction reference */
  financialTransactionReference?: string;
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * USSD OTP session states.
 * - "pending": Session created, awaiting user verification
 * - "verified": User successfully dialed the code
 * - "expired": Session expired before verification
 */
export type UssdOtpStatus = "pending" | "verified" | "expired";

/**
 * Represents a USSD-based one-time password verification session.
 * Users dial a USSD code to verify their phone number.
 */
export type UssdOtp = {
  /** Unique session identifier */
  id: string;
  /** Session state (pending, verified, expired) */
  status: UssdOtpStatus;
  /** USSD code users dial to verify */
  dialCode: string;
  /** Associated phone number */
  authorizedPhoneNumber: string;
  /** User-facing confirmation message (max 255 chars) */
  verificationMessage?: string | null;
  /** ISO 8601 timestamp when session was created */
  createTime: string;
  /** Validity deadline */
  expireTime: string;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Input for creating a new USSD OTP session.
 */
export type CreateUssdOtpInput = {
  /** Phone number to authorize (MSISDN format) */
  authorizedPhoneNumber: string;
  /** Optional custom message shown after verification (max 255 characters) */
  verificationMessage?: string;
  /** ISO 8601 duration until expiration (e.g., "PT5M" for 5 minutes) */
  duration?: string;
  /** Custom metadata */
  metadata?: Metadata;
};

/**
 * Query parameters for listing USSD OTP sessions.
 */
export type ListUssdOtpsParams = {
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Financial account balance information.
 */
export type FinancialAccountBalance = {
  /** Current available funds (when requested) */
  available: Amount;
};

/**
 * Represents a financial account for holding and managing funds.
 * Serves as source or destination for payments, payouts, and internal transfers.
 */
export type FinancialAccount = {
  /** Unique account identifier */
  id: string;
  /** Universal Virtual Account Number - checksum alias for secure, error-resistant inbound transfers */
  uvan: string;
  /** Human-readable account label */
  name: string;
  /** ISO 4217 currency code (SLE, USD) */
  currency: Currency;
  /** External reference for reconciliation */
  reference?: string | null;
  /** Context about account purpose */
  description?: string | null;
  /** Current available funds (when requested) */
  balance?: FinancialAccountBalance | null;
  /** ISO 8601 timestamp when account was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime?: string | null;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Input for creating a new financial account.
 */
export type CreateFinancialAccountInput = {
  /** Account name */
  name: string;
  /** Account currency (SLE or USD) */
  currency: Currency;
  /** External reference */
  reference?: string;
  /** Account description */
  description?: string;
  /** Custom metadata */
  metadata?: Metadata;
};

/**
 * Input for updating a financial account.
 */
export type UpdateFinancialAccountInput = {
  /** Account name */
  name?: string | null;
  /** External reference */
  reference?: string | null;
  /** Account description */
  description?: string | null;
  /** Custom metadata */
  metadata?: Metadata | null;
};

/**
 * Query parameters for listing financial accounts.
 */
export type ListFinancialAccountsParams = {
  /** Filter by UVAN */
  uvan?: string;
  /** Filter by reference */
  reference?: string;
  /** Include current balance in response */
  withBalance?: boolean;
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Query parameters for retrieving a single financial account.
 */
export type GetFinancialAccountParams = {
  /** Include current balance in response */
  withBalance?: boolean;
};

/**
 * Financial transaction direction.
 * - "credit": Inflow of funds (increasing balance)
 * - "debit": Outflow of funds (decreasing balance)
 */
export type FinancialTransactionType = "credit" | "debit";

/**
 * Account balance after a financial transaction.
 */
export type FinancialTransactionAccountBalance = {
  /** Balance after the transaction was applied */
  after: Amount;
};

/**
 * Financial account information in a transaction record.
 */
export type FinancialTransactionAccount = {
  /** Affected account with id and balance.after */
  id: string;
  /** Account balance after transaction */
  balance: FinancialTransactionAccountBalance;
};

/**
 * Information about the original transaction being reversed.
 * Present when a transaction represents a refund or reversal.
 */
export type OriginatingReversal = {
  /** ID of the original transaction being reversed */
  originTxnId: string;
  /** Reference of the original transaction being reversed */
  originTxnRef: string;
};

/**
 * Information about the fee this transaction represents.
 * Present when a transaction is a fee deduction.
 */
export type OriginatingFee = {
  /** Fee type code */
  code: string;
};

/**
 * Represents a ledger entry recording a financial movement on an account.
 * Created automatically when payments, payouts, or transfers are processed.
 */
export type FinancialTransaction = {
  /** Unique identifier */
  id: string;
  /** Direction - credit (inflow) or debit (outflow) */
  type: FinancialTransactionType;
  /** Monetary value with currency and minor units */
  amount: Amount;
  /** When transaction was recorded */
  timestamp: string;
  /** Internal identifier for reconciliation */
  reference?: string | null;
  /** Affected account with id and balance.after */
  financialAccount: FinancialTransactionAccount;
  /** References reversed transaction for refunds */
  originatingReversal?: OriginatingReversal | null;
  /** Fee info when transaction represents fee deduction */
  originatingFee?: OriginatingFee | null;
  /** Audit trail of related objects */
  ownershipGraph?: OwnershipGraph | null;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Query parameters for listing financial transactions.
 */
export type ListFinancialTransactionsParams = {
  /** Filter by financial account ID */
  financialAccountId?: string;
  /** Filter by transaction reference */
  reference?: string;
  /** Filter by transaction type (credit or debit) */
  type?: FinancialTransactionType;
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Receipt redemption progress states.
 * - "not_redeemed": No entitlements have been used
 * - "partially_redeemed": Some entitlements used, some remaining
 * - "fully_redeemed": All entitlements exhausted
 */
export type ReceiptStatus =
  | "not_redeemed"
  | "partially_redeemed"
  | "fully_redeemed";

/**
 * Represents a redeemable claim attached to a receipt.
 * Tracks available units and consumption.
 */
export type Entitlement = {
  /** Unique identifier for entitlement type */
  key: string;
  /** Human-readable description */
  name?: string | null;
  /** Total units available */
  limit: number;
  /** Units already consumed */
  current: number;
  /** Units still available */
  remaining: number;
  /** Whether all units used */
  exhausted: boolean;
};

/**
 * Represents a digital receipt with redeemable entitlements.
 * Created after successful payment completion.
 */
export type Receipt = {
  /** Redemption progress (not_redeemed, partially_redeemed, fully_redeemed) */
  status: ReceiptStatus;
  /** Human-friendly order identifier */
  orderName?: string | null;
  /** Order reference number */
  orderNumber: string;
  /** Transaction total */
  orderAmount?: Amount | null;
  /** ISO 8601 timestamp when receipt was created */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime?: string | null;
  /** Redeemable claims */
  entitlements?: Entitlement[] | null;
  /** Custom key-value pairs */
  metadata?: Metadata | null;
};

/**
 * Input for redeeming a specific entitlement.
 */
export type RedeemEntitlementInput = {
  /** Entitlement key to redeem */
  key: string;
  /** Number of units to redeem (defaults to 1) */
  units?: number;
};

/**
 * Input for redeeming receipt entitlements.
 */
export type RedeemReceiptInput = {
  /** Whether to redeem all remaining entitlements */
  redeemAll?: boolean | null;
  /** Specific entitlements to redeem */
  entitlements?: RedeemEntitlementInput[] | null;
  /** Custom metadata */
  metadata?: Metadata;
};

/**
 * Result of a receipt redemption operation.
 */
export type RedeemReceiptResult = {
  /** Whether redemption was successful */
  redeem: boolean;
  /** Updated receipt after redemption */
  receipt: Receipt;
};

/**
 * Provider operational status.
 */
export type ProviderStatus = {
  /** Whether the provider is currently active and accepting transactions */
  active: boolean;
};

/**
 * Payout capabilities of a financial provider.
 */
export type PayoutFeature = {
  /** Whether payouts to this provider are supported */
  canPayTo: boolean;
  /** Supported payment schemes */
  schemes: string[];
  /** Additional provider-specific metadata */
  metadata: Metadata;
};

/**
 * Payment collection capabilities of a financial provider.
 */
export type PaymentFeature = {
  /** Whether payments from this provider are supported */
  canPayFrom: boolean;
  /** Supported payment schemes */
  schemes: string[];
  /** Additional provider-specific metadata */
  metadata: Metadata;
};

/**
 * KYC verification capabilities of a financial provider.
 */
export type KycVerificationFeature = {
  /** Whether account verification is available */
  canVerifyAccount: boolean;
  /** Additional verification metadata */
  metadata: Metadata;
};

/**
 * Complete set of features supported by a financial provider.
 */
export type ProviderFeatureSet = {
  /** Payout capabilities */
  payout: PayoutFeature;
  /** Payment collection capabilities */
  payment: PaymentFeature;
  /** KYC verification capabilities */
  kycVerification: KycVerificationFeature;
};

/**
 * Represents a bank provider available for payouts and payments.
 * Contains metadata about the bank's capabilities and supported features.
 */
export type Bank = {
  /** Unique provider identifier */
  providerId: string;
  /** Bank name */
  name: string;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** Provider operational status */
  status: ProviderStatus;
  /** Supported features (payout, payment, KYC verification) */
  featureSet: ProviderFeatureSet;
  /** ISO 8601 timestamp when provider was added */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime: string;
};

/**
 * Query parameters for listing bank providers.
 */
export type ListBanksParams = {
  /** Filter by country code (e.g., "SL" for Sierra Leone) */
  country: string;
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};

/**
 * Represents a mobile money provider available for payouts and payments.
 * Contains metadata about the provider's capabilities and supported features.
 */
export type Momo = {
  /** Unique provider identifier */
  providerId: string;
  /** Mobile money provider name */
  name: string;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** Provider operational status */
  status: ProviderStatus;
  /** Supported features (payout, payment, KYC verification) */
  featureSet: ProviderFeatureSet;
  /** ISO 8601 timestamp when provider was added */
  createTime: string;
  /** ISO 8601 timestamp of last update */
  updateTime: string;
};

/**
 * Query parameters for listing mobile money providers.
 */
export type ListMomosParams = {
  /** Filter by country code (e.g., "SL" for Sierra Leone) */
  country: string;
  /** Maximum number of results per page */
  limit?: number;
  /** Pagination cursor for next page */
  after?: string;
};
