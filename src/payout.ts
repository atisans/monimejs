import type { MonimeHttpClient } from "./http-client";
import type {
  ApiDeleteResponse,
  ApiListResponse,
  ApiResponse,
  CreatePayoutInput,
  ListPayoutsParams,
  Payout,
  RequestConfig,
  UpdatePayoutInput,
} from "./types";
import {
  CreatePayoutInputSchema,
  IdSchema,
  LimitSchema,
  UpdatePayoutInputSchema,
  validate,
} from "./validation";

/**
 * Module for managing payouts.
 *
 * Payouts enable disbursements from your financial accounts to external recipients
 * via bank transfers, mobile money, or wallet transfers. Use payouts for vendor
 * payments, refunds, salary disbursements, and other outbound transfers.
 *
 * Features:
 * - Send funds to bank accounts (local and international)
 * - Disburse to mobile money wallets (Orange, Africell, QCell)
 * - Transfer to other Monime wallet addresses
 * - Track payout status (pending, completed, failed)
 * - Batch processing support
 * - Transaction reference tracking
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/payout/object} Payouts API Documentation
 */
export class PayoutModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Creates a new payout.
   * @param input - Payout configuration including amount and destination
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The created payout
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(
    input: CreatePayoutInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<Payout>> {
    if (this.http_client.should_validate) {
      validate(CreatePayoutInputSchema, input);
    }

    return this.http_client.request<ApiResponse<Payout>>({
      method: "POST",
      path: "/payouts",
      body: input,
      config,
    });
  }

  /**
   * Retrieves a payout by ID.
   * @param id - The payout ID
   * @param config - Optional request configuration
   * @returns The payout
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id: string, config?: RequestConfig): Promise<ApiResponse<Payout>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiResponse<Payout>>({
      method: "GET",
      path: `/payouts/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Lists payouts with optional filtering and pagination.
   * @param params - Optional filter and pagination parameters
   * @param config - Optional request configuration
   * @returns A paginated list of payouts
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListPayoutsParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<Payout>> {
    if (this.http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }

    const query_params = params
      ? {
          status: params.status,
          sourceFinancialAccountId: params.sourceFinancialAccountId,
          sourceTransactionReference: params.sourceTransactionReference,
          destinationTransactionReference:
            params.destinationTransactionReference,
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<Payout>>({
      method: "GET",
      path: "/payouts",
      params: query_params,
      config,
    });
  }

  /**
   * Updates a payout.
   * @param id - The payout ID
   * @param input - Fields to update
   * @param config - Optional request configuration
   * @returns The updated payout
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(
    id: string,
    input: UpdatePayoutInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<Payout>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdatePayoutInputSchema, input);
    }

    return this.http_client.request<ApiResponse<Payout>>({
      method: "PATCH",
      path: `/payouts/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }

  /**
   * Deletes a payout.
   * @param id - The payout ID
   * @param config - Optional request configuration
   * @returns Confirmation of deletion
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async delete(id: string, config?: RequestConfig): Promise<ApiDeleteResponse> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiDeleteResponse>({
      method: "DELETE",
      path: `/payouts/${encodeURIComponent(id)}`,
      config,
    });
  }
}
