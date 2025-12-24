import type { MonimeHttpClient } from "./http-client";
import type {
  ApiListResponse,
  ApiResponse,
  FinancialTransaction,
  ListFinancialTransactionsParams,
  RequestConfig,
} from "./types";
import { IdSchema, LimitSchema, validate } from "./validation";

/**
 * Module for viewing financial transactions.
 *
 * Financial transactions are immutable ledger entries that record every fund movement
 * across your financial accounts. This module provides read-only access to the complete
 * transaction history for accounting, reconciliation, and audit purposes.
 *
 * Transaction types:
 * - "credit": Money incoming (payments, refunds, transfers in)
 * - "debit": Money outgoing (payouts, fees, transfers out)
 *
 * Each transaction includes:
 * - Precise amount and timestamp
 * - Account balance after the transaction
 * - Reference to the source operation (payment, payout, transfer, etc.)
 * - Unique transaction reference for reconciliation
 * - Metadata for custom tracking
 *
 * Use cases:
 * - Generate account statements
 * - Reconcile with external accounting systems
 * - Track fund flows across accounts
 * - Audit financial operations
 * - Build reporting dashboards
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/financial-transaction/object} Financial Transactions API Documentation
 */
export class FinancialTransactionModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Retrieves a financial transaction by ID.
   * @param id - The financial transaction ID
   * @param config - Optional request configuration
   * @returns The financial transaction
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(
    id: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<FinancialTransaction>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiResponse<FinancialTransaction>>({
      method: "GET",
      path: `/financial-transactions/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Lists financial transactions with optional filtering.
   * @param params - Optional filter and pagination parameters
   * @param config - Optional request configuration
   * @returns A paginated list of financial transactions
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListFinancialTransactionsParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<FinancialTransaction>> {
    if (this.http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }

    const query_params = params
      ? {
          financialAccountId: params.financialAccountId,
          reference: params.reference,
          type: params.type,
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<FinancialTransaction>>({
      method: "GET",
      path: "/financial-transactions",
      params: query_params,
      config,
    });
  }
}
