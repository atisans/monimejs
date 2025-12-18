import { BankModule } from "./bank";
import { CheckoutSessionModule } from "./checkout-session";
import { FinancialAccountModule } from "./financial-account";
import { FinancialTransactionModule } from "./financial-transaction";
import { MonimeHttpClient } from "./http-client";
import { InternalTransferModule } from "./internal-transfer";
import { MomoModule } from "./momo";
import { PaymentModule } from "./payment";
import { PaymentCodeModule } from "./payment-code";
import { PayoutModule } from "./payout";
import { ReceiptModule } from "./receipt";
import type { ClientOptions } from "./types";
import { UssdOtpModule } from "./ussd-otp";
import { WebhookModule } from "./webhook";

/**
 * The main Monime SDK client.
 *
 * Creates a client instance with the provided credentials and configuration.
 * All API modules are accessible as properties of this client.
 *
 * @example
 * ```typescript
 * import { MonimeClient } from "monimejs";
 *
 * const client = new MonimeClient({
 *   spaceId: process.env.MONIME_SPACE_ID!,
 *   accessToken: process.env.MONIME_ACCESS_TOKEN!,
 * });
 *
 * // Create a payment code
 * const { result } = await client.paymentCode.create({
 *   name: "Order #1234",
 *   amount: { currency: "SLE", value: 1000 },
 * });
 * ```
 */
export class MonimeClient {
  private http_client: MonimeHttpClient;

  /** Module for retrieving bank information (financial institution providers) */
  bank: BankModule;

  /** Module for managing financial accounts (wallets that hold and track money) */
  financialAccount: FinancialAccountModule;

  /** Module for managing financial transactions (fund movements affecting accounts) */
  financialTransaction: FinancialTransactionModule;

  /** Module for managing payment codes (USSD payment links) */
  paymentCode: PaymentCodeModule;

  /** Module for managing payments (read-only, created via payment codes) */
  payment: PaymentModule;

  /** Module for managing checkout sessions (hosted payment pages) */
  checkoutSession: CheckoutSessionModule;

  /** Module for managing payouts (disbursements to external accounts) */
  payout: PayoutModule;

  /** Module for managing webhooks (event notifications) */
  webhook: WebhookModule;

  /** Module for managing internal transfers (between financial accounts) */
  internalTransfer: InternalTransferModule;

  /** Module for retrieving mobile money provider information */
  momo: MomoModule;

  /** Module for managing receipts (proof of customer entitlements) */
  receipt: ReceiptModule;

  /** Module for managing USSD OTP verification */
  ussdOtp: UssdOtpModule;

  /**
   * Creates a new Monime client instance.
   *
   * @param options - Client configuration options
   * @param options.spaceId - Your Monime space ID (must start with "spc-")
   * @param options.accessToken - Your Monime API access token
   * @param options.baseUrl - Optional custom API base URL (must use HTTPS)
   * @param options.timeout - Request timeout in milliseconds (default: 30000)
   * @param options.retries - Number of retry attempts (default: 2)
   * @param options.retryDelay - Initial retry delay in milliseconds (default: 1000)
   * @param options.retryBackoff - Retry backoff multiplier (default: 2)
   * @param options.validateInputs - Whether to validate inputs before requests (default: true)
   *
   * @throws {MonimeValidationError} If options validation fails
   *
   * @example
   * ```typescript
   * // Basic usage
   * const client = new MonimeClient({
   *   spaceId: "spc-your-space-id",
   *   accessToken: "your-access-token",
   * });
   *
   * // With custom configuration
   * const client = new MonimeClient({
   *   spaceId: "spc-your-space-id",
   *   accessToken: "your-access-token",
   *   timeout: 60000,
   *   retries: 3,
   * });
   * ```
   */
  constructor(options: ClientOptions) {
    this.http_client = new MonimeHttpClient(options);

    this.bank = new BankModule(this.http_client);
    this.financialAccount = new FinancialAccountModule(this.http_client);
    this.financialTransaction = new FinancialTransactionModule(
      this.http_client,
    );
    this.paymentCode = new PaymentCodeModule(this.http_client);
    this.payment = new PaymentModule(this.http_client);
    this.checkoutSession = new CheckoutSessionModule(this.http_client);
    this.payout = new PayoutModule(this.http_client);
    this.webhook = new WebhookModule(this.http_client);
    this.internalTransfer = new InternalTransferModule(this.http_client);
    this.momo = new MomoModule(this.http_client);
    this.receipt = new ReceiptModule(this.http_client);
    this.ussdOtp = new UssdOtpModule(this.http_client);
  }
}
