import { PaymentCode } from "./payment-code";
import type { ClientOptions } from "./types";

export class MonimeClient {
  private space_id: string;
  private access_token: string;

  paymentCode: PaymentCode;

  constructor(options: ClientOptions) {
    this.access_token = options.accessToken;
    this.space_id = options.spaceId;

    this.paymentCode = new PaymentCode({
      accessToken: this.access_token,
      spaceId: this.space_id,
    });
  }
}
