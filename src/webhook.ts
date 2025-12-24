import type { MonimeHttpClient } from "./http-client";
import type {
  ApiDeleteResponse,
  ApiListResponse,
  ApiResponse,
  CreateWebhookInput,
  ListWebhooksParams,
  RequestConfig,
  UpdateWebhookInput,
  Webhook,
} from "./types";
import {
  CreateWebhookInputSchema,
  IdSchema,
  LimitSchema,
  UpdateWebhookInputSchema,
  validate,
} from "./validation";

/**
 * Module for managing webhooks.
 *
 * Webhooks enable real-time HTTP notifications when events occur in your Monime
 * account. Configure endpoints to receive instant updates about payments, payouts,
 * and other transactions, eliminating the need for polling.
 *
 * Supported events:
 * - payment.created, payment.completed
 * - payout.created, payout.completed, payout.failed
 * - checkout_session.completed
 * - internal_transfer.completed
 *
 * Security features:
 * - Request signatures for verification (HS256 HMAC or ES256 ECDSA)
 * - Automatic retry with exponential backoff
 * - Configurable timeout settings
 * - Enable/disable endpoints without deletion
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/webhook/object} Webhooks API Documentation
 */
export class WebhookModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Creates a new webhook.
   * @param input - Webhook configuration including URL and events
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The created webhook
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(
    input: CreateWebhookInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<Webhook>> {
    if (this.http_client.should_validate) {
      validate(CreateWebhookInputSchema, input);
    }

    return this.http_client.request<ApiResponse<Webhook>>({
      method: "POST",
      path: "/webhooks",
      body: input,
      config,
    });
  }

  /**
   * Retrieves a webhook by ID.
   * @param id - The webhook ID (must start with "whk-")
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The webhook
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id: string, config?: RequestConfig): Promise<ApiResponse<Webhook>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiResponse<Webhook>>({
      method: "GET",
      path: `/webhooks/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Lists webhooks with optional pagination.
   * @param params - Optional pagination parameters
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns A paginated list of webhooks
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListWebhooksParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<Webhook>> {
    if (this.http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }

    const query_params = params
      ? {
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<Webhook>>({
      method: "GET",
      path: "/webhooks",
      params: query_params,
      config,
    });
  }

  /**
   * Updates a webhook.
   * @param id - The webhook ID (must start with "whk-")
   * @param input - Fields to update
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The updated webhook
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(
    id: string,
    input: UpdateWebhookInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<Webhook>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdateWebhookInputSchema, input);
    }

    return this.http_client.request<ApiResponse<Webhook>>({
      method: "PATCH",
      path: `/webhooks/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }

  /**
   * Deletes a webhook.
   * @param id - The webhook ID (must start with "whk-")
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
      path: `/webhooks/${encodeURIComponent(id)}`,
      config,
    });
  }
}
