/**
 * Receipt Examples
 *
 * Receipts serve as proof of what a customer is entitled to claim,
 * such as tickets, vouchers, credits, or digital rights.
 * Each entitlement tracks a claimable resource with usage limits.
 *
 * All available methods:
 * - get(orderNumber) - Retrieve a receipt by order number
 * - redeem(orderNumber, input, idempotencyKey?) - Redeem entitlements
 *
 * Redemption states:
 * - "not_redeemed": No entitlements have been used
 * - "partially_redeemed": Some entitlements used
 * - "fully_redeemed": All entitlements exhausted
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

import {
  MonimeApiError,
  MonimeNetworkError,
  MonimeValidationError,
} from "monimejs";

// ===================================
// 1. GET A RECEIPT
// ===================================

try {
  const { result: receipt } = await client.receipt.get("ORDER-12345");

  console.log(receipt.status); // "not_redeemed", "partially_redeemed", "fully_redeemed"
  console.log(receipt.orderNumber); // "ORDER-12345"
  console.log(receipt.orderName); // "Event Tickets for Concert"
  console.log(receipt.orderAmount); // { currency: "SLE", value: 50000 }
  console.log(receipt.createTime); // ISO 8601 datetime

  // Check entitlements
  if (receipt.entitlements) {
    for (const entitlement of receipt.entitlements) {
      console.log(
        `${entitlement.name}: ${entitlement.remaining}/${entitlement.limit} remaining`,
      );
      console.log(`  Key: ${entitlement.key}`);
      console.log(`  Current usage: ${entitlement.current}`);
      console.log(`  Exhausted: ${entitlement.exhausted}`);
    }
  }
} catch (error) {
  if (error instanceof MonimeValidationError) {
    console.error("Invalid order number format:", error.message);
  } else if (error instanceof MonimeApiError && error.code === 404) {
    console.error("Receipt not found");
  } else if (error instanceof MonimeNetworkError) {
    console.error("Network error:", error.message);
  } else {
    throw error;
  }
}

// ===================================
// 2. REDEEM ALL ENTITLEMENTS
// ===================================

try {
  const { result: redeemAll } = await client.receipt.redeem(
    "ORDER-12345",
    { redeemAll: true },
    "unique-idempotency-key-001", // Optional idempotency key
  );

  console.log(redeemAll.redeem); // true if redemption was successful
  console.log(redeemAll.receipt.status); // Updated status after redemption

  if (redeemAll.redeem) {
    console.log("All entitlements successfully redeemed");
  }
} catch (error) {
  if (error instanceof MonimeValidationError) {
    console.error("Validation error:", error.message);
    for (const issue of error.issues) {
      console.error(`  - ${issue.field}: ${issue.message}`);
    }
  } else if (error instanceof MonimeApiError) {
    console.error(`API Error ${error.code}: ${error.message}`);
    if (error.reason) {
      console.error(`Reason: ${error.reason}`);
    }
  } else {
    throw error;
  }
}

// ===================================
// 3. REDEEM SPECIFIC ENTITLEMENTS
// ===================================

// Redeem multiple entitlements with custom units
try {
  const { result: redeemSpecific } = await client.receipt.redeem(
    "ORDER-12345",
    {
      entitlements: [
        { key: "ticket-general", units: 2 },
        { key: "voucher-drink", units: 1 },
      ],
    },
    "unique-idempotency-key-002",
  );

  console.log("Redemption successful:", redeemSpecific.redeem);

  // Check updated entitlements
  for (const ent of redeemSpecific.receipt.entitlements) {
    console.log(`${ent.name}: ${ent.remaining} remaining`);
  }
} catch (error) {
  if (error instanceof MonimeApiError) {
    console.error("Redemption failed:", error.message);
  } else {
    throw error;
  }
}

// Redeem a single unit (units defaults to 1)
try {
  const { result: redeemOne } = await client.receipt.redeem(
    "ORDER-12345",
    {
      entitlements: [{ key: "ticket-vip" }], // units defaults to 1
    },
    "unique-idempotency-key-003",
  );

  console.log("Single ticket redeemed:", redeemOne.redeem);
} catch (error) {
  console.error("Single redemption error:", error.message);
}

// ===================================
// 4. REDEEM WITH METADATA
// ===================================

try {
  const { result: redeemWithMeta } = await client.receipt.redeem(
    "ORDER-12345",
    {
      entitlements: [{ key: "ticket-general", units: 1 }],
      metadata: {
        redeemedBy: "staff-123",
        location: "entrance-gate-a",
        deviceId: "scanner-001",
        timestamp: new Date().toISOString(),
      },
    },
    "unique-idempotency-key-004",
  );

  console.log("Redemption with metadata successful:", redeemWithMeta.redeem);
} catch (error) {
  console.error("Redemption with metadata failed:", error.message);
}

// ===================================
// 5. REAL-WORLD USE CASES
// ===================================

// Use Case 1: Event Ticketing - Check and Scan Ticket
async function scanEventTicket(orderNumber, ticketType, gateId) {
  try {
    // First, check if tickets are available
    const { result: receipt } = await client.receipt.get(orderNumber);

    if (receipt.status === "fully_redeemed") {
      return {
        success: false,
        message: "All tickets have been used",
      };
    }

    const ticket = receipt.entitlements?.find(
      (e) => e.key === ticketType,
    );

    if (!ticket) {
      return {
        success: false,
        message: `Ticket type '${ticketType}' not found`,
      };
    }

    if (ticket.exhausted) {
      return {
        success: false,
        message: `No ${ticket.name} tickets remaining`,
      };
    }

    // Redeem the ticket
    const { result: redemption } = await client.receipt.redeem(
      orderNumber,
      {
        entitlements: [{ key: ticketType, units: 1 }],
        metadata: {
          gate: gateId,
          scannedAt: new Date().toISOString(),
        },
      },
      `scan-${orderNumber}-${ticketType}-${Date.now()}`,
    );

    if (redemption.redeem) {
      const updatedTicket = redemption.receipt.entitlements?.find(
        (e) => e.key === ticketType,
      );

      return {
        success: true,
        message: "Ticket scanned successfully",
        remaining: updatedTicket?.remaining || 0,
      };
    }

    return {
      success: false,
      message: "Redemption failed",
    };
  } catch (error) {
    if (error instanceof MonimeApiError && error.code === 404) {
      return { success: false, message: "Order not found" };
    }
    console.error("Error scanning ticket:", error.message);
    return { success: false, message: "System error" };
  }
}

// Usage
const scanResult = await scanEventTicket("ORDER-789", "ticket-vip", "gate-a");
console.log(scanResult.message);
if (scanResult.success) {
  console.log(`Remaining tickets: ${scanResult.remaining}`);
}

// Use Case 2: Voucher Redemption at Point of Sale
async function redeemVoucher(orderNumber, voucherKey, posId) {
  try {
    const { result: receipt } = await client.receipt.get(orderNumber);

    // Check if voucher exists and is available
    const voucher = receipt.entitlements?.find(
      (e) => e.key === voucherKey,
    );

    if (!voucher) {
      return {
        success: false,
        error: "Voucher not found in order",
      };
    }

    if (voucher.exhausted) {
      return {
        success: false,
        error: "Voucher has already been redeemed",
      };
    }

    // Redeem the voucher
    const { result: redemption } = await client.receipt.redeem(
      orderNumber,
      {
        entitlements: [{ key: voucherKey, units: 1 }],
        metadata: {
          posId,
          transactionTime: new Date().toISOString(),
        },
      },
      `pos-${posId}-${orderNumber}-${Date.now()}`,
    );

    return {
      success: redemption.redeem,
      voucherName: voucher.name,
      receipt: redemption.receipt,
    };
  } catch (error) {
    if (error instanceof MonimeApiError) {
      return {
        success: false,
        error: error.message,
      };
    }
    throw error;
  }
}

// Usage
const voucherResult = await redeemVoucher(
  "VOUCHER-ABC123",
  "discount-20pct",
  "pos-terminal-5",
);

if (voucherResult.success) {
  console.log(`${voucherResult.voucherName} applied successfully`);
} else {
  console.log(`Voucher error: ${voucherResult.error}`);
}

// Use Case 3: Digital Content Access - Manage Download Limits
async function grantContentDownload(orderNumber, contentKey, userId) {
  try {
    const { result: receipt } = await client.receipt.get(orderNumber);

    const downloadEntitlement = receipt.entitlements?.find(
      (e) => e.key === contentKey,
    );

    if (!downloadEntitlement) {
      return {
        allowed: false,
        reason: "Content not found in order",
      };
    }

    if (downloadEntitlement.exhausted) {
      return {
        allowed: false,
        reason: `Download limit reached (${downloadEntitlement.limit} max)`,
        current: downloadEntitlement.current,
        limit: downloadEntitlement.limit,
      };
    }

    // Grant the download by redeeming one unit
    const { result: redemption } = await client.receipt.redeem(
      orderNumber,
      {
        entitlements: [{ key: contentKey, units: 1 }],
        metadata: {
          userId,
          downloadedAt: new Date().toISOString(),
          ipAddress: "192.168.1.1", // Would be actual IP
        },
      },
      `download-${userId}-${orderNumber}-${Date.now()}`,
    );

    if (redemption.redeem) {
      const updated = redemption.receipt.entitlements?.find(
        (e) => e.key === contentKey,
      );

      return {
        allowed: true,
        remaining: updated?.remaining || 0,
        used: updated?.current || 0,
        limit: updated?.limit || 0,
      };
    }

    return {
      allowed: false,
      reason: "Redemption failed",
    };
  } catch (error) {
    console.error("Error granting download:", error.message);
    return {
      allowed: false,
      reason: "System error",
    };
  }
}

// Usage
const downloadResult = await grantContentDownload(
  "CONTENT-XYZ",
  "download-hd",
  "user-456",
);

if (downloadResult.allowed) {
  console.log("Download granted");
  console.log(
    `Remaining downloads: ${downloadResult.remaining}/${downloadResult.limit}`,
  );
} else {
  console.log(`Download denied: ${downloadResult.reason}`);
}

// Use Case 4: Subscription Credits - Track API Usage
async function consumeApiCredit(subscriptionOrderNumber, userId, endpoint) {
  try {
    const { result: receipt } = await client.receipt.get(
      subscriptionOrderNumber,
    );

    const apiCredits = receipt.entitlements?.find(
      (e) => e.key === "api-calls",
    );

    if (!apiCredits) {
      return {
        success: false,
        error: "No API credits found",
      };
    }

    if (apiCredits.exhausted) {
      return {
        success: false,
        error: "API credit limit reached",
        usage: {
          used: apiCredits.current,
          limit: apiCredits.limit,
          remaining: 0,
        },
      };
    }

    // Consume one API credit
    const { result: redemption } = await client.receipt.redeem(
      subscriptionOrderNumber,
      {
        entitlements: [{ key: "api-calls", units: 1 }],
        metadata: {
          userId,
          endpoint,
          timestamp: new Date().toISOString(),
        },
      },
      `api-${userId}-${Date.now()}`,
    );

    const updated = redemption.receipt.entitlements?.find(
      (e) => e.key === "api-calls",
    );

    return {
      success: redemption.redeem,
      usage: {
        used: updated?.current || 0,
        limit: updated?.limit || 0,
        remaining: updated?.remaining || 0,
      },
    };
  } catch (error) {
    console.error("Error consuming API credit:", error.message);
    return {
      success: false,
      error: "System error",
    };
  }
}

// Usage
const apiResult = await consumeApiCredit(
  "SUB-MONTHLY-001",
  "user-789",
  "/api/v1/data",
);

if (apiResult.success) {
  console.log(`API credit consumed. Remaining: ${apiResult.usage.remaining}`);
} else {
  console.log(`API call denied: ${apiResult.error}`);
}

// Use Case 5: Partial Redemption with Availability Check
async function redeemIfAvailable(orderNumber, entitlementKey, units = 1) {
  try {
    const { result: receipt } = await client.receipt.get(orderNumber);

    if (receipt.status === "fully_redeemed") {
      return {
        success: false,
        reason: "Receipt fully redeemed",
      };
    }

    const entitlement = receipt.entitlements?.find(
      (e) => e.key === entitlementKey,
    );

    if (!entitlement) {
      return {
        success: false,
        reason: "Entitlement not found",
      };
    }

    if (entitlement.remaining < units) {
      return {
        success: false,
        reason: `Only ${entitlement.remaining} units remaining, requested ${units}`,
        available: entitlement.remaining,
      };
    }

    // Proceed with redemption
    const { result: redemption } = await client.receipt.redeem(
      orderNumber,
      { entitlements: [{ key: entitlementKey, units }] },
      `redeem-${orderNumber}-${entitlementKey}-${Date.now()}`,
    );

    return {
      success: redemption.redeem,
      receipt: redemption.receipt,
    };
  } catch (error) {
    if (error instanceof MonimeApiError && error.code === 404) {
      return {
        success: false,
        reason: "Order not found",
      };
    }

    console.error("Redemption error:", error.message);
    return {
      success: false,
      reason: "System error",
    };
  }
}

// Usage
const redemptionResult = await redeemIfAvailable("ORDER-789", "ticket-vip", 2);

if (redemptionResult.success) {
  console.log("Redemption successful");
} else {
  console.log("Redemption failed:", redemptionResult.reason);
}

// Use Case 6: Bulk Entitlement Status Check
async function checkEntitlementStatus(orderNumber) {
  try {
    const { result: receipt } = await client.receipt.get(orderNumber);

    console.log(`Order: ${receipt.orderNumber}`);
    console.log(`Status: ${receipt.status}`);
    console.log(`Amount: ${receipt.orderAmount.value} ${receipt.orderAmount.currency}`);

    if (!receipt.entitlements || receipt.entitlements.length === 0) {
      console.log("No entitlements found");
      return { available: [], exhausted: [] };
    }

    const available = [];
    const exhausted = [];

    for (const ent of receipt.entitlements) {
      const status = {
        key: ent.key,
        name: ent.name,
        remaining: ent.remaining,
        used: ent.current,
        limit: ent.limit,
      };

      if (ent.exhausted) {
        exhausted.push(status);
      } else {
        available.push(status);
      }
    }

    console.log("\nAvailable entitlements:");
    for (const ent of available) {
      console.log(`  - ${ent.name}: ${ent.remaining}/${ent.limit} remaining`);
    }

    console.log("\nExhausted entitlements:");
    for (const ent of exhausted) {
      console.log(`  - ${ent.name}: fully used (${ent.limit}/${ent.limit})`);
    }

    return { available, exhausted };
  } catch (error) {
    console.error("Error checking status:", error.message);
    return { available: [], exhausted: [] };
  }
}

// Usage
await checkEntitlementStatus("ORDER-12345");
