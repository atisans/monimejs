import type { MonimeHttpClient } from "./http-client";
import type {
  ApiDeleteResponse,
  ApiListResponse,
  ApiResponse,
  CreateInternalTransferInput,
  InternalTransfer,
  ListInternalTransfersParams,
  RequestConfig,
  UpdateInternalTransferInput,
} from "./types";
import {
  CreateInternalTransferInputSchema,
  IdSchema,
  LimitSchema,
  UpdateInternalTransferInputSchema,
  validate,
} from "./validation";

/**
 * Module for managing internal transfers.
 *
 * Internal transfers move funds between financial accounts within the same
 * Monime workspace. Unlike payouts (which send funds externally), internal
 * transfers are instant, free, and ideal for fund management operations.
 *
 * Use cases:
 * - Move funds from collection accounts to disbursement accounts
 * - Split revenue between multiple business units
 * - Reserve funds for specific purposes or escrow
 * - Consolidate balances across accounts
 *
 * Features:
 * - Instant settlement between accounts
 * - No transaction fees
 * - Same-currency transfers only
 * - Automatic balance updates
 * - Full audit trail via financial transactions
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/internal-transfer/object} Internal Transfers API Documentation
 */
export class InternalTransferModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Creates a new internal transfer.
   * @param input - Transfer configuration including amount and accounts
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The created internal transfer
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(
    input: CreateInternalTransferInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<InternalTransfer>> {
    if (this.http_client.should_validate) {
      validate(CreateInternalTransferInputSchema, input);
    }

    return this.http_client.request<ApiResponse<InternalTransfer>>({
      method: "POST",
      path: "/internal-transfers",
      body: input,
      config,
    });
  }

  /**
   * Retrieves an internal transfer by ID.
   * @param id - The internal transfer ID (must start with "trn-")
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The internal transfer
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(
    id: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<InternalTransfer>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiResponse<InternalTransfer>>({
      method: "GET",
      path: `/internal-transfers/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Lists internal transfers with optional filtering.
   * @param params - Optional filter and pagination parameters
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns A paginated list of internal transfers
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListInternalTransfersParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<InternalTransfer>> {
    if (this.http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }

    const query_params = params
      ? {
          status: params.status,
          sourceFinancialAccountId: params.sourceFinancialAccountId,
          destinationFinancialAccountId: params.destinationFinancialAccountId,
          financialTransactionReference: params.financialTransactionReference,
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<InternalTransfer>>({
      method: "GET",
      path: "/internal-transfers",
      params: query_params,
      config,
    });
  }

  /**
   * Updates an internal transfer.
   * @param id - The internal transfer ID (must start with "trn-")
   * @param input - Fields to update
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The updated internal transfer
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(
    id: string,
    input: UpdateInternalTransferInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<InternalTransfer>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdateInternalTransferInputSchema, input);
    }

    return this.http_client.request<ApiResponse<InternalTransfer>>({
      method: "PATCH",
      path: `/internal-transfers/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }

  /**
   * Deletes an internal transfer.
   * @param id - The internal transfer ID (must start with "trn-")
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
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
      path: `/internal-transfers/${encodeURIComponent(id)}`,
      config,
    });
  }
}
