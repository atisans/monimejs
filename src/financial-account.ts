import type { MonimeHttpClient } from "./http-client";
import type {
  ApiListResponse,
  ApiResponse,
  CreateFinancialAccountInput,
  FinancialAccount,
  GetFinancialAccountParams,
  ListFinancialAccountsParams,
  RequestConfig,
  UpdateFinancialAccountInput,
} from "./types";
import {
  validateCreateFinancialAccountInput,
  validateId,
  validateLimit,
  validateUpdateFinancialAccountInput,
} from "./validation";

/**
 * Module for managing financial accounts.
 *
 * Financial accounts are digital wallets that hold and track funds in your Monime
 * workspace. Each account maintains its own balance, transaction history, and
 * unique identifiers for receiving funds.
 *
 * Account features:
 * - Single currency per account (SLE or USD)
 * - UVAN (Universal Virtual Account Number) for receiving transfers
 * - Real-time balance tracking
 * - Complete transaction ledger
 * - Customizable reference IDs and metadata
 *
 * Use cases:
 * - Separate accounts for different business units or departments
 * - Collection accounts dedicated to receiving customer payments
 * - Disbursement accounts for managing payouts
 * - Escrow or reserve accounts for holding funds
 * - Multi-tenant systems with account-per-customer architecture
 *
 * @see {@link https://docs.monime.io/apis/financial-accounts} Financial Accounts API Documentation
 */
export class FinancialAccountModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Creates a new financial account.
   * @param input - Financial account configuration including name and currency
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The created financial account
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(
    input: CreateFinancialAccountInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<FinancialAccount>> {
    if (this.http_client.shouldValidate) {
      validateCreateFinancialAccountInput(input);
    }

    return this.http_client.request<ApiResponse<FinancialAccount>>({
      method: "POST",
      path: "/financial-accounts",
      body: input,
      config,
    });
  }

  /**
   * Retrieves a financial account by ID.
   * @param id - The financial account ID (must start with "fa-")
   * @param params - Optional parameters
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The financial account
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(
    id: string,
    params?: GetFinancialAccountParams,
    config?: RequestConfig,
  ): Promise<ApiResponse<FinancialAccount>> {
    if (this.http_client.shouldValidate) {
      validateId(id);
    }

    const query_params = params
      ? {
          withBalance: params.withBalance,
        }
      : undefined;

    return this.http_client.request<ApiResponse<FinancialAccount>>({
      method: "GET",
      path: `/financial-accounts/${encodeURIComponent(id)}`,
      params: query_params,
      config,
    });
  }

  /**
   * Lists financial accounts with optional filtering.
   * @param params - Optional filter and pagination parameters
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns A paginated list of financial accounts
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListFinancialAccountsParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<FinancialAccount>> {
    if (this.http_client.shouldValidate && params?.limit !== undefined) {
      validateLimit(params.limit);
    }

    const query_params = params
      ? {
          uvan: params.uvan,
          reference: params.reference,
          withBalance: params.withBalance,
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<FinancialAccount>>({
      method: "GET",
      path: "/financial-accounts",
      params: query_params,
      config,
    });
  }

  /**
   * Updates a financial account.
   * @param id - The financial account ID (must start with "fa-")
   * @param input - Fields to update
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The updated financial account
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(
    id: string,
    input: UpdateFinancialAccountInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<FinancialAccount>> {
    if (this.http_client.shouldValidate) {
      validateId(id);
      validateUpdateFinancialAccountInput(input);
    }

    return this.http_client.request<ApiResponse<FinancialAccount>>({
      method: "PATCH",
      path: `/financial-accounts/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
}
