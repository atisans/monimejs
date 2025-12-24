import type { MonimeHttpClient } from "./http-client";
import type {
  ApiListResponse,
  ApiResponse,
  ListPaymentsParams,
  Payment,
  RequestConfig,
  UpdatePaymentInput,
} from "./types";
import {
  IdSchema,
  LimitSchema,
  UpdatePaymentInputSchema,
  validate,
} from "./validation";

/**
 * Module for managing payments.
 *
 * Payments represent completed payment transactions from customers. This module
 * provides read-only access to view and query payment records. Payments are
 * automatically created when customers complete transactions via payment codes,
 * checkout sessions, or other payment channels.
 *
 * Features:
 * - View payment details and status
 * - Track payment sources (payment code, checkout session)
 * - Filter by order number or financial account
 * - Access transaction references for accounting
 * - Update metadata for record keeping
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/payment/object} Payments API Documentation
 */
export class PaymentModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Retrieves a payment by ID.
   * @param id - The payment ID
   * @param config - Optional request configuration
   * @returns The payment
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id: string, config?: RequestConfig): Promise<ApiResponse<Payment>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiResponse<Payment>>({
      method: "GET",
      path: `/payments/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Lists payments with optional filtering and pagination.
   * @param params - Optional filter and pagination parameters
   * @param config - Optional request configuration
   * @returns A paginated list of payments
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListPaymentsParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<Payment>> {
    if (this.http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }

    const query_params = params
      ? {
          orderNumber: params.orderNumber,
          financialAccountId: params.financialAccountId,
          financialTransactionReference: params.financialTransactionReference,
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<Payment>>({
      method: "GET",
      path: "/payments",
      params: query_params,
      config,
    });
  }

  /**
   * Updates a payment.
   * @param id - The payment ID
   * @param input - Fields to update
   * @param config - Optional request configuration
   * @returns The updated payment
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(
    id: string,
    input: UpdatePaymentInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<Payment>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdatePaymentInputSchema, input);
    }

    return this.http_client.request<ApiResponse<Payment>>({
      method: "PATCH",
      path: `/payments/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
}
