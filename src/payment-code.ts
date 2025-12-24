import type { MonimeHttpClient } from "./http-client";
import type {
  ApiDeleteResponse,
  ApiListResponse,
  ApiResponse,
  CreatePaymentCodeInput,
  ListPaymentCodesParams,
  PaymentCode,
  RequestConfig,
  UpdatePaymentCodeInput,
} from "./types";
import {
  CreatePaymentCodeInputSchema,
  IdSchema,
  LimitSchema,
  UpdatePaymentCodeInputSchema,
  validate,
} from "./validation";

/**
 * Module for managing payment codes.
 *
 * Payment codes are programmable, short-lived tokens that generate USSD dial strings
 * for receiving mobile money payments. They support one-time payments (single use)
 * and recurrent payments (multiple uses until a target is met).
 *
 * Features:
 * - Generate USSD codes like *715*12345#
 * - Restrict to specific mobile money providers (Orange, Africell, QCell)
 * - Restrict to a single authorized phone number
 * - Set expiration duration
 * - Track payment completion status
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/payment-code/object} Payment Codes API Documentation
 */
export class PaymentCodeModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Creates a new payment code.
   * @param input - Payment code configuration
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The created payment code
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(
    input: CreatePaymentCodeInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<PaymentCode>> {
    if (this.http_client.should_validate) {
      validate(CreatePaymentCodeInputSchema, input);
    }

    return this.http_client.request<ApiResponse<PaymentCode>>({
      method: "POST",
      path: "/payment-codes",
      body: input,
      config,
    });
  }

  /**
   * Retrieves a payment code by ID.
   * @param id - The payment code ID
   * @param config - Optional request configuration
   * @returns The payment code
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(
    id: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<PaymentCode>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiResponse<PaymentCode>>({
      method: "GET",
      path: `/payment-codes/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Lists payment codes with optional filtering and pagination.
   * @param params - Optional filter and pagination parameters
   * @param config - Optional request configuration
   * @returns A paginated list of payment codes
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListPaymentCodesParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<PaymentCode>> {
    if (this.http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }

    const query_params = params
      ? {
          ussd_code: params.ussd_code,
          mode: params.mode,
          status: params.status,
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<PaymentCode>>({
      method: "GET",
      path: "/payment-codes",
      params: query_params,
      config,
    });
  }

  /**
   * Updates a payment code.
   * @param id - The payment code ID
   * @param input - Fields to update
   * @param config - Optional request configuration
   * @returns The updated payment code
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(
    id: string,
    input: UpdatePaymentCodeInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<PaymentCode>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdatePaymentCodeInputSchema, input);
    }

    return this.http_client.request<ApiResponse<PaymentCode>>({
      method: "PATCH",
      path: `/payment-codes/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }

  /**
   * Deletes a payment code.
   * @param id - The payment code ID
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
      path: `/payment-codes/${encodeURIComponent(id)}`,
      config,
    });
  }
}
