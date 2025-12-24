import type { MonimeHttpClient } from "./http-client";
import type {
  ApiDeleteResponse,
  ApiListResponse,
  ApiResponse,
  CreateUssdOtpInput,
  ListUssdOtpsParams,
  RequestConfig,
  UssdOtp,
} from "./types";
import {
  CreateUssdOtpInputSchema,
  IdSchema,
  LimitSchema,
  validate,
} from "./validation";

/**
 * Module for USSD OTP verification.
 *
 * USSD OTP provides passwordless phone number verification through USSD dial codes.
 * Instead of SMS codes, users dial a unique USSD string to prove phone ownership.
 * This method works on all mobile phones including feature phones without internet.
 *
 * Verification flow:
 * 1. Create an OTP session with the phone number to verify
 * 2. Display the generated USSD code to the user
 * 3. User dials the USSD code (e.g., *715*12345#) from their phone
 * 4. Poll the session status until verified
 *
 * Benefits:
 * - Works without internet connectivity
 * - No SMS delivery delays or costs
 * - Supports all mobile networks
 * - Instant verification feedback
 * - Secure proof of phone ownership
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/ussd-otp/object} USSD OTP API Documentation
 */
export class UssdOtpModule {
  private http_client: MonimeHttpClient;

  constructor(http_client: MonimeHttpClient) {
    this.http_client = http_client;
  }

  /**
   * Creates a new USSD OTP verification request.
   * @param input - OTP configuration including phone number
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The created USSD OTP with dial code
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(
    input: CreateUssdOtpInput,
    config?: RequestConfig,
  ): Promise<ApiResponse<UssdOtp>> {
    if (this.http_client.should_validate) {
      validate(CreateUssdOtpInputSchema, input);
    }

    return this.http_client.request<ApiResponse<UssdOtp>>({
      method: "POST",
      path: "/ussd-otps",
      body: input,
      config,
    });
  }

  /**
   * Retrieves a USSD OTP by ID.
   * @param id - The USSD OTP ID (must start with "uop-")
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns The USSD OTP
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id: string, config?: RequestConfig): Promise<ApiResponse<UssdOtp>> {
    if (this.http_client.should_validate) {
      validate(IdSchema, id);
    }

    return this.http_client.request<ApiResponse<UssdOtp>>({
      method: "GET",
      path: `/ussd-otps/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Lists USSD OTPs with optional pagination.
   * @param params - Optional pagination parameters
   * @param config - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns A paginated list of USSD OTPs
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(
    params?: ListUssdOtpsParams,
    config?: RequestConfig,
  ): Promise<ApiListResponse<UssdOtp>> {
    if (this.http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }

    const query_params = params
      ? {
          limit: params.limit,
          after: params.after,
        }
      : undefined;

    return this.http_client.request<ApiListResponse<UssdOtp>>({
      method: "GET",
      path: "/ussd-otps",
      params: query_params,
      config,
    });
  }

  /**
   * Deletes a USSD OTP.
   * @param id - The USSD OTP ID (must start with "uop-")
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
      path: `/ussd-otps/${encodeURIComponent(id)}`,
      config,
    });
  }
}
