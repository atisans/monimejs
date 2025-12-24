import type { MonimeHttpClient } from "./http-client";
import type {
  ApiListResponse,
  ApiResponse,
  ListMomosParams,
  Momo,
  RequestConfig,
} from "./types";
import {
  CountryCodeSchema,
  LimitSchema,
  MomoProviderIdSchema,
  validate,
} from "./validation";

/**
 * Module for retrieving mobile money provider information.
 *
 * Provides read-only access to the directory of supported mobile money (MoMo)
 * providers across different countries. Use this module to discover available
 * mobile money networks, populate provider selection interfaces, or validate
 * provider IDs before creating payment or payout transactions.
 *
 * Common providers include:
 * - QCell (m13)
 * - Africell (m17)
 * - Orange Money (m18)
 *
 * Provider information includes:
 * - Unique provider ID and display name
 * - Country of operation
 * - Supported capabilities (payouts, payments, KYC verification)
 * - Current operational status
 * - Network metadata
 *
 * Use cases:
 * - Build mobile money provider selection dropdowns
 * - Validate provider IDs before payment or payout requests
 * - Display available MoMo networks by country
 * - Filter providers by supported features
 * - Check operational status before transactions
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/momo/object} Mobile Money Providers API Documentation
 */
export class MomoModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Lists mobile money providers available in a specified country.
   * @param params - Filter and pagination parameters
   * @param config - Optional request configuration
   * @returns A paginated list of mobile money providers
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params: ListMomosParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<Momo>> {
    if (this.http_client.should_validate) {
      validate(CountryCodeSchema, params.country);
      if (params.limit !== undefined) {
        validate(LimitSchema, params.limit);
      }
    }

    const query_params = {
      country: params.country,
      limit: params.limit,
      after: params.after,
    };

    return this.http_client.request<ApiListResponse<Momo>>({
      method: "GET",
      path: "/momos",
      params: query_params,
      config,
    });
  }

  /**
   * Retrieves a mobile money provider by its provider ID.
   * @param providerId - The mobile money provider ID
   * @param config - Optional request configuration
   * @returns The mobile money provider
   * @throws {MonimeValidationError} If providerId validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(
    providerId: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<Momo>> {
    if (this.http_client.should_validate) {
      validate(MomoProviderIdSchema, providerId);
    }

    return this.http_client.request<ApiResponse<Momo>>({
      method: "GET",
      path: `/momos/${encodeURIComponent(providerId)}`,
      config,
    });
  }
}
