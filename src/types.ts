export type ClientOptions = {
  spaceId: string;
  accessToken: string;
};

export type PaymentCodeOptions = {
  id: string;
  mode: "one_time" | "recurrent";
  status: Status;
  name: string;
  amount: Amount;
  enable: boolean;
  expireTime: string;
  customer: {
    name: string;
  };
  ussdCode: string;
  reference: string;
  authorizedProviders:
    | ["m13", "m17"]
    | ["m13", "m18"]
    | ["m17", "m18"]
    | ["m17", "m18", "m13"];
  authorizedPhoneNumber: string;
  recurrentPaymentTarget: {
    expectedPaymentCount?: number;
    expectedPaymentTotal?: Amount;
  };
  financialAccountId: string;
  processedPaymentData: {
    amount: Amount;
    orderId: string;
    paymentId: string;
    orderNumber: string;
    channelData: {
      providerId: string;
      accountId: string;
      reference: string;
    };
    financialTransactionReference: string;
    metadata: object;
  };
  createTime: string;
  updateTime: string;
  ownershipGraph: {
    owner: {
      id: string;
      type: string;
      metadata: object;
    };
  };
  metadata: object;
};

export type Amount = {
  currency: "SLE" | "USD";
  value: number;
};

type Status = "pending" | "cancelled" | "processing" | "expired" | "completed";
