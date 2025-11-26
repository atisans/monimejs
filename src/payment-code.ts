import type { Amount, ClientOptions, PaymentCodeOptions } from "./types";

export class PaymentCode {
  private endpoint = "https://api.monime.io/v1/payment-codes";
  private config!: ClientOptions;

  constructor(options: ClientOptions) {
    this.config = options;
  }

  async createPaymentCode(opts: {
    // mode: "one_time" | "recurring";
    name: string;
    amount: Amount;
    duration: string;
    customer: { name: string };
    reference: string;
    allowedProviders?: string[];
    authorizedPhoneNumber: string;
    // recurrentPaymentTarget?: {
    //   expectedPaymentCount: number;
    //   expectedPaymentTotal: Amount;
    // };
    // financialAccountId?: string;
    metadata?: object;
  }): Promise<{
    success: boolean;
    messages: string[];
    result: PaymentCodeOptions | null;
  }> {
    const options = {
      method: "POST",
      headers: {
        "Idempotency-Key": crypto.randomUUID(),
        "Monime-Space-Id": this.config.spaceId,
        // "Monime-Version": "caph.2025-08-23",
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: opts.name,
        amount: opts.amount,
        duration: opts.duration,
        customer: opts.customer,
        reference: opts.reference,
        authorizedPhoneNumber: opts.authorizedPhoneNumber,
        // allowedProviders: opts.allowedProviders,
        // recurrentPaymentTarget: {
        //   expectedPaymentCount:
        //     opts.recurrentPaymentTarget.expectedPaymentCount,
        //   expectedPaymentTotal:
        //     opts.recurrentPaymentTarget.expectedPaymentTotal,
        // },
        // financialAccountId: opts.financialAccountId,
        metadata: opts.metadata,
      }),
    };

    try {
      const res = await fetch(this.endpoint, options);
      const data = await res.json();

      return data as {
        success: true;
        messages: [];
        result: PaymentCodeOptions;
      };
    } catch (_e) {
      console.log(_e);
      // @ts-expect-error
      return { success: false, messages: [_e.message], result: null };
      /*
        error: {
          code: 400,
          reason: 'arguments_invalid',
          message: 'Phone number must be between 6 and 16 characters (inclusive)',
          details: []
        }
      */
    }
  }

  async getPaymentCode(id: string) {
    const options = {
      method: "GET",
      headers: {
        // "Idempotency-Key": crypto.randomUUID(),
        "Monime-Space-Id": this.config.spaceId,
        // "Monime-Version": "caph.2025-08-23",
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
    };
    try {
      const res = await fetch(`${this.endpoint}/${id}`, options);
      const data = await res.json();

      return data as {
        success: true;
        messages: [];
        result: PaymentCodeOptions;
      };
    } catch (_e) {
      console.log(_e);
      // @ts-expect-error
      return { success: false, messages: [_e.message], result: null };
      /*
        error: {
          code: 400,
          reason: 'arguments_invalid',
          message: 'Phone number must be between 6 and 16 characters (inclusive)',
          details: []
        }
      */
    }
  }
}
