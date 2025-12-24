import type { MonimeHttpClient } from "./http-client";
import type {
  ApiResponse,
  Receipt,
  RedeemReceiptInput,
  RedeemReceiptResult,
  RequestConfig,
} from "./types";
import {
  ReceiptOrderNumberSchema,
  RedeemReceiptInputSchema,
  validate,
} from "./validation";

/**
 * Module for managing receipts and entitlements.
 *
 * Receipts provide digital proof of purchase with redeemable entitlements attached.
 * Each entitlement represents a claimable resource like event tickets, credits,
 * access passes, or vouchers. Receipts are automatically generated from successful
 * checkout sessions and can be redeemed incrementally.
 *
 * Entitlement types:
 * - Event tickets with QR codes
 * - Service credits or points
 * - Access rights or memberships
 * - Vouchers or gift cards
 *
 * Redemption states:
 * - "not_redeemed": No entitlements have been claimed
 * - "partially_redeemed": Some entitlements used, some remaining
 * - "fully_redeemed": All entitlements exhausted
 *
 * Use cases:
 * - Event ticketing with check-in tracking
 * - Loyalty points and rewards systems
 * - Gift card management
 * - Access control for digital or physical resources
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/receipt/object} Receipts API Documentation
 */
export class ReceiptModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Retrieves a receipt by order number.
   * @param orderNumber - The order number of the receipt
   * @param config - Optional request configuration
   * @returns The receipt
   * @throws {MonimeValidationError} If orderNumber validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(
    orderNumber: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<Receipt>> {
    if (this.http_client.should_validate) {
      validate(ReceiptOrderNumberSchema, orderNumber);
    }

    return this.http_client.request<ApiResponse<Receipt>>({
      method: "GET",
      path: `/receipts/${encodeURIComponent(orderNumber)}`,
      config,
    });
  }

  /**
   * Redeems entitlements from a receipt.
   * @param orderNumber - The order number of the receipt
   * @param input - Redemption configuration specifying what to redeem
   * @param config - Optional request configuration
   * @returns The redemption result with updated receipt
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async redeem(
    orderNumber: string,
    input: RedeemReceiptInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<RedeemReceiptResult>> {
    if (this.http_client.should_validate) {
      validate(ReceiptOrderNumberSchema, orderNumber);
      validate(RedeemReceiptInputSchema, input);
    }

    return this.http_client.request<ApiResponse<RedeemReceiptResult>>({
      method: "POST",
      path: `/receipts/${encodeURIComponent(orderNumber)}/redeem`,
      body: input,
      config,
    });
  }
}
