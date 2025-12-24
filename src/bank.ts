import type { MonimeHttpClient } from "./http-client";
import type {
  ApiListResponse,
  ApiResponse,
  Bank,
  ListBanksParams,
  RequestConfig,
} from "./types";
import {
  BankProviderIdSchema,
  CountryCodeSchema,
  LimitSchema,
  validate,
} from "./validation";

/**
 * Module for retrieving bank provider information.
 *
 * Provides read-only access to the directory of supported bank providers across
 * different countries. Use this module to discover available banks for payouts,
 * populate selection interfaces, or validate provider IDs before creating transactions.
 *
 * Provider information includes:
 * - Unique provider ID and display name
 * - Country of operation
 * - Supported capabilities (payouts, payments, KYC verification)
 * - Current operational status
 * - Integration metadata
 *
 * Use cases:
 * - Build bank selection dropdowns for payout forms
 * - Validate provider IDs before initiating transfers
 * - Display available banking options by country
 * - Filter banks by supported features
 * - Check operational status before transactions
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/bank/object} Banks API Documentation
 */
export class BankModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Lists banks available in a specified country.
   * @param params - Filter and pagination parameters
   * @param config - Optional request configuration
   * @returns A paginated list of banks
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params: ListBanksParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<Bank>> {
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

    return this.http_client.request<ApiListResponse<Bank>>({
      method: "GET",
      path: "/banks",
      params: query_params,
      config,
    });
  }

  /**
   * Retrieves a bank by its provider ID.
   * @param providerId - The bank provider ID
   * @param config - Optional request configuration
   * @returns The bank
   * @throws {MonimeValidationError} If providerId validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(
    providerId: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<Bank>> {
    if (this.http_client.should_validate) {
      validate(BankProviderIdSchema, providerId);
    }

    return this.http_client.request<ApiResponse<Bank>>({
      method: "GET",
      path: `/banks/${encodeURIComponent(providerId)}`,
      config,
    });
  }
}
