import type { MonimeHttpClient } from "./http-client";
import type {
  ApiDeleteResponse,
  ApiListResponse,
  ApiResponse,
  CheckoutSession,
  CreateCheckoutSessionInput,
  ListCheckoutSessionsParams,
  RequestConfig,
} from "./types";
import {
  CreateCheckoutSessionInputSchema,
  IdSchema,
  LimitSchema,
  validate,
} from "./validation";

/**
 * Module for managing checkout sessions.
 *
 * Checkout sessions provide hosted payment pages for e-commerce integrations.
 * Create a session with line items and redirect customers to a Monime-hosted
 * checkout page that handles the entire payment flow.
 *
 * Features:
 * - Hosted payment pages with customizable branding
 * - Support for multiple line items (products, fees, discounts)
 * - Automatic receipt generation
 * - Success and cancel URL redirects
 * - Session expiration controls
 * - Payment method selection (mobile money, bank transfer)
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/checkout-session/object} Checkout Sessions API Documentation
 */
export class CheckoutSessionModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Creates a new checkout session.
   * @param input - Checkout session configuration including line items
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The created checkout session with redirect URL
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(
    input: CreateCheckoutSessionInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<CheckoutSession>> {
    if (this.http_client.should_validate) {
      validate(CreateCheckoutSessionInputSchema, input);
    }

    return this.http_client.request<ApiResponse<CheckoutSession>>({
      method: "POST",
      path: "/checkout-sessions",
      body: input,
      config,
    });
  }

  /**
   * Retrieves a checkout session by ID.
   * @param id - The checkout session ID
   * @param config - Optional request configuration
   * @returns The checkout session
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(
    id: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<CheckoutSession>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiResponse<CheckoutSession>>({
      method: "GET",
      path: `/checkout-sessions/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Lists checkout sessions with optional pagination.
   * @param params - Optional pagination parameters
   * @param config - Optional request configuration
   * @returns A paginated list of checkout sessions
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListCheckoutSessionsParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<CheckoutSession>> {
    if (this.http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }

    const query_params = params
      ? {
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<CheckoutSession>>({
      method: "GET",
      path: "/checkout-sessions",
      params: query_params,
      config,
    });
  }

  /**
   * Deletes a checkout session.
   * @param id - The checkout session ID
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
      path: `/checkout-sessions/${encodeURIComponent(id)}`,
      config,
    });
  }
}
