/**
 * Payment Code Examples - Comprehensive Guide
 *
 * Payment codes generate USSD codes for receiving payments from mobile money users.
 * This file demonstrates ALL available payment code methods with production-ready patterns.
 *
 * Available methods:
 * - create()  - Create a new payment code
 * - get()     - Retrieve a payment code by ID
 * - list()    - List payment codes with filters
 * - update()  - Update payment code properties
 * - delete()  - Delete a payment code
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

// ============================================================================
// CREATE - Generate payment codes for collecting payments
// ============================================================================

// Scenario 1: Basic one-time payment code (e-commerce checkout)
async function createBasicPaymentCode() {
  try {
    const { result: paymentCode } = await client.paymentCode.create({
      name: "Order #12345",
      amount: { currency: "SLE", value: 50000 }, // 500.00 SLE
      metadata: {
        orderId: "order-12345",
        customerId: "cust-123",
        orderType: "retail",
      },
    });

    console.log("Payment code created:");
    console.log(`  ID: ${paymentCode.id}`);
    console.log(`  USSD Code: ${paymentCode.ussdCode}`); // Customer dials this: *715*123#
    console.log(`  Status: ${paymentCode.status}`); // "active", "inactive", "expired"
    console.log(`  Mode: ${paymentCode.mode}`); // "one_time"

    // Send USSD code to customer via SMS, email, or display on screen
    return paymentCode;
  } catch (error) {
    console.error("Failed to create payment code:", error.message);
    throw error;
  }
}

// Scenario 2: Recurrent payment code (subscription/installment payments)
async function createRecurrentPaymentCode() {
  try {
    const { result: subscription } = await client.paymentCode.create({
      name: "Monthly Subscription - Premium Plan",
      mode: "recurrent",
      amount: { currency: "SLE", value: 10000 }, // 100.00 SLE per payment
      recurrentPaymentTarget: {
        expectedPaymentCount: 12, // Expect 12 monthly payments
      },
      metadata: {
        subscriptionId: "sub-789",
        plan: "premium",
        startDate: new Date().toISOString(),
      },
    });

    console.log("Recurrent payment code created:");
    console.log(`  ID: ${subscription.id}`);
    console.log(`  USSD Code: ${subscription.ussdCode}`);
    console.log(`  Expected payments: ${subscription.recurrentPaymentTarget.expectedPaymentCount}`);

    return subscription;
  } catch (error) {
    console.error("Failed to create recurrent payment code:", error.message);
    throw error;
  }
}

// Scenario 3: Recurrent with total amount target (layaway/payment plan)
async function createLayawayPlan() {
  try {
    const { result: layaway } = await client.paymentCode.create({
      name: "Layaway Plan - Laptop Purchase",
      mode: "recurrent",
      amount: { currency: "SLE", value: 50000 }, // 500.00 SLE per payment
      recurrentPaymentTarget: {
        expectedPaymentTotal: { currency: "SLE", value: 500000 }, // Total: 5,000.00 SLE
      },
      duration: "P30D", // Expires in 30 days
      metadata: {
        productId: "laptop-001",
        customerId: "cust-456",
        downPayment: "100000", // Already paid 1,000.00 SLE
      },
    });

    console.log("Layaway plan created:");
    console.log(`  Total target: ${layaway.recurrentPaymentTarget.expectedPaymentTotal.value / 100}`);
    console.log(`  Per payment: ${layaway.amount.value / 100}`);
    console.log(`  Expires: ${layaway.expireTime}`);

    return layaway;
  } catch (error) {
    console.error("Failed to create layaway plan:", error.message);
    throw error;
  }
}

// Scenario 4: Restricted payment code (specific provider and phone number)
async function createRestrictedPaymentCode() {
  try {
    const { result: restricted } = await client.paymentCode.create({
      name: "VIP Customer Payment",
      amount: { currency: "SLE", value: 100000 },
      authorizedProviders: ["m17"], // Only Africell
      authorizedPhoneNumber: "+23276123456", // Only this number can pay
      duration: "P7D", // Valid for 7 days
      customer: {
        name: "John Doe",
        phoneNumber: "+23276123456",
        email: "john@example.com",
      },
      metadata: {
        customerTier: "vip",
        securityLevel: "high",
      },
    });

    console.log("Restricted payment code created:");
    console.log(`  Authorized providers: ${restricted.authorizedProviders.join(", ")}`);
    console.log(`  Authorized phone: ${restricted.authorizedPhoneNumber}`);

    return restricted;
  } catch (error) {
    console.error("Failed to create restricted payment code:", error.message);
    throw error;
  }
}

// Scenario 5: With idempotency key (prevent duplicate creation)
async function createIdempotentPaymentCode(orderId) {
  try {
    const { result: paymentCode } = await client.paymentCode.create(
      {
        name: `Order #${orderId}`,
        amount: { currency: "SLE", value: 25000 },
        reference: orderId,
      },
      { idempotencyKey: `payment-code-${orderId}` },
    );

    // If called again with same idempotency key, returns same payment code
    return paymentCode;
  } catch (error) {
    console.error("Failed to create payment code:", error.message);
    throw error;
  }
}

// ============================================================================
// GET - Retrieve payment code details and check status
// ============================================================================

// Scenario 6: Check payment code status (polling for completion)
async function checkPaymentCodeStatus(paymentCodeId) {
  try {
    const { result: paymentCode } = await client.paymentCode.get(paymentCodeId);

    console.log("Payment code status:");
    console.log(`  ID: ${paymentCode.id}`);
    console.log(`  Name: ${paymentCode.name}`);
    console.log(`  Status: ${paymentCode.status}`);
    console.log(`  USSD Code: ${paymentCode.ussdCode}`);
    console.log(`  Usage count: ${paymentCode.usageCount || 0}`);

    // Check if payment completed
    if (paymentCode.mode === "one_time" && paymentCode.usageCount > 0) {
      console.log("Payment completed!");
      return { completed: true, paymentCode };
    }

    // Check recurrent payment progress
    if (paymentCode.mode === "recurrent" && paymentCode.recurrentPaymentTarget) {
      const target = paymentCode.recurrentPaymentTarget;
      console.log(`  Progress: ${paymentCode.usageCount}/${target.expectedPaymentCount} payments`);

      if (
        target.expectedPaymentCount &&
        paymentCode.usageCount >= target.expectedPaymentCount
      ) {
        console.log("All payments completed!");
        return { completed: true, paymentCode };
      }
    }

    return { completed: false, paymentCode };
  } catch (error) {
    console.error("Failed to get payment code:", error.message);
    throw error;
  }
}

// Scenario 7: Poll for payment completion with timeout
async function waitForPayment(paymentCodeId, timeoutMs = 300000) {
  const startTime = Date.now();
  const pollInterval = 5000; // Check every 5 seconds

  console.log(`Waiting for payment on code: ${paymentCodeId}`);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const { completed, paymentCode } =
        await checkPaymentCodeStatus(paymentCodeId);

      if (completed) {
        console.log("Payment received!");
        return paymentCode;
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error("Error checking payment status:", error.message);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error("Payment timeout - no payment received");
}

// ============================================================================
// LIST - Search and filter payment codes with pagination
// ============================================================================

// Scenario 8: List all active payment codes
async function listActivePaymentCodes() {
  try {
    const { result: codes, pagination } = await client.paymentCode.list({
      status: "active",
      limit: 50,
    });

    console.log(`Found ${codes.length} active payment codes`);

    for (const code of codes) {
      console.log(`  ${code.id}: ${code.name} - ${code.ussdCode}`);
    }

    return codes;
  } catch (error) {
    console.error("Failed to list payment codes:", error.message);
    throw error;
  }
}

// Scenario 9: Filter by mode (find all recurrent codes)
async function listRecurrentPaymentCodes() {
  try {
    const { result: recurrentCodes } = await client.paymentCode.list({
      mode: "recurrent",
      limit: 100,
    });

    console.log(`Found ${recurrentCodes.length} recurrent payment codes`);

    for (const code of recurrentCodes) {
      const target = code.recurrentPaymentTarget;
      console.log(`  ${code.name}:`);
      console.log(`    Progress: ${code.usageCount}/${target?.expectedPaymentCount || "∞"}`);
    }

    return recurrentCodes;
  } catch (error) {
    console.error("Failed to list recurrent codes:", error.message);
    throw error;
  }
}

// Scenario 10: Search by USSD code
async function findByUssdCode(ussdCode) {
  try {
    const { result: codes } = await client.paymentCode.list({
      ussd_code: ussdCode,
    });

    if (codes.length > 0) {
      console.log(`Found payment code: ${codes[0].name}`);
      return codes[0];
    } else {
      console.log("No payment code found with that USSD code");
      return null;
    }
  } catch (error) {
    console.error("Failed to search by USSD code:", error.message);
    throw error;
  }
}

// Scenario 11: Paginate through ALL payment codes
async function getAllPaymentCodes() {
  const allCodes = [];
  let after = null;

  try {
    do {
      const response = await client.paymentCode.list({
        limit: 100, // Maximum per page
        ...(after && { after }),
      });

      allCodes.push(...response.result);
      console.log(`Fetched ${response.result.length} codes (total: ${allCodes.length})`);

      after = response.pagination.next;
    } while (after);

    console.log(`Total payment codes retrieved: ${allCodes.length}`);
    return allCodes;
  } catch (error) {
    console.error("Failed to fetch all payment codes:", error.message);
    throw error;
  }
}

// Scenario 12: Calculate statistics from payment codes
async function calculatePaymentCodeStats() {
  try {
    const allCodes = await getAllPaymentCodes();

    const stats = {
      total: allCodes.length,
      active: 0,
      inactive: 0,
      expired: 0,
      oneTime: 0,
      recurrent: 0,
      totalUsageCount: 0,
    };

    for (const code of allCodes) {
      // Count by status
      if (code.status === "active") stats.active++;
      if (code.status === "inactive") stats.inactive++;
      if (code.status === "expired") stats.expired++;

      // Count by mode
      if (code.mode === "one_time") stats.oneTime++;
      if (code.mode === "recurrent") stats.recurrent++;

      // Sum usage
      stats.totalUsageCount += code.usageCount || 0;
    }

    console.log("Payment Code Statistics:");
    console.log(JSON.stringify(stats, null, 2));

    return stats;
  } catch (error) {
    console.error("Failed to calculate stats:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE - Modify payment code properties
// ============================================================================

// Scenario 13: Update payment code name and metadata
async function updatePaymentCodeInfo(paymentCodeId) {
  try {
    const { result: updated } = await client.paymentCode.update(paymentCodeId, {
      name: "Updated Order #12345 - Confirmed",
      metadata: {
        status: "confirmed",
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
      },
    });

    console.log("Payment code updated:");
    console.log(`  New name: ${updated.name}`);
    console.log(`  Metadata: ${JSON.stringify(updated.metadata)}`);

    return updated;
  } catch (error) {
    console.error("Failed to update payment code:", error.message);
    throw error;
  }
}

// Scenario 14: Deactivate a payment code
async function deactivatePaymentCode(paymentCodeId) {
  try {
    const { result: deactivated } = await client.paymentCode.update(
      paymentCodeId,
      {
        status: "inactive",
        metadata: {
          deactivatedAt: new Date().toISOString(),
          reason: "Order cancelled",
        },
      },
    );

    console.log(`Payment code ${paymentCodeId} deactivated`);
    return deactivated;
  } catch (error) {
    console.error("Failed to deactivate payment code:", error.message);
    throw error;
  }
}

// Scenario 15: Clear optional fields with null
async function clearPaymentCodeFields(paymentCodeId) {
  try {
    const { result: cleared } = await client.paymentCode.update(paymentCodeId, {
      reference: null, // Clears the reference
      customer: null, // Clears customer info
    });

    console.log("Optional fields cleared");
    return cleared;
  } catch (error) {
    console.error("Failed to clear fields:", error.message);
    throw error;
  }
}

// ============================================================================
// DELETE - Remove payment codes
// ============================================================================

// Scenario 16: Delete a single payment code
async function deletePaymentCode(paymentCodeId) {
  try {
    const { result } = await client.paymentCode.delete(paymentCodeId);

    console.log(`Payment code deleted: ${result.id}`);
    console.log(`Deleted: ${result.deleted}`); // true

    return result;
  } catch (error) {
    console.error("Failed to delete payment code:", error.message);
    throw error;
  }
}

// Scenario 17: Bulk delete expired payment codes
async function cleanupExpiredPaymentCodes() {
  try {
    const { result: expiredCodes } = await client.paymentCode.list({
      status: "expired",
      limit: 100,
    });

    console.log(`Found ${expiredCodes.length} expired payment codes`);

    const deleted = [];
    for (const code of expiredCodes) {
      try {
        await client.paymentCode.delete(code.id);
        deleted.push(code.id);
        console.log(`  Deleted: ${code.id}`);
      } catch (error) {
        console.error(`  Failed to delete ${code.id}:`, error.message);
      }
    }

    console.log(`Cleanup complete: ${deleted.length} codes deleted`);
    return deleted;
  } catch (error) {
    console.error("Failed to cleanup expired codes:", error.message);
    throw error;
  }
}

// ============================================================================
// COMPLETE WORKFLOWS - Real-world use cases
// ============================================================================

// Workflow 1: E-commerce checkout with payment verification
async function ecommerceCheckoutFlow(order) {
  try {
    console.log("Starting e-commerce checkout...");

    // Step 1: Create payment code
    const { result: paymentCode } = await client.paymentCode.create(
      {
        name: `Order #${order.id}`,
        amount: { currency: "SLE", value: order.total },
        reference: order.id,
        customer: {
          name: order.customerName,
          phoneNumber: order.customerPhone,
          email: order.customerEmail,
        },
        metadata: {
          orderId: order.id,
          items: JSON.stringify(order.items),
          createdAt: new Date().toISOString(),
        },
      },
      { idempotencyKey: `order-${order.id}-payment` },
    );

    console.log(`Payment code created: ${paymentCode.ussdCode}`);

    // Step 2: Send USSD code to customer
    // await sendSMS(order.customerPhone, `Pay ${paymentCode.ussdCode} to complete order`);

    // Step 3: Wait for payment (with timeout)
    try {
      const completedCode = await waitForPayment(paymentCode.id, 600000); // 10 min timeout

      // Step 4: Mark order as paid
      console.log("Payment received! Processing order...");
      return { success: true, paymentCode: completedCode };
    } catch (timeoutError) {
      // Step 5: Handle timeout
      console.log("Payment timeout - deactivating code...");
      await deactivatePaymentCode(paymentCode.id);

      return { success: false, reason: "timeout", paymentCode };
    }
  } catch (error) {
    console.error("Checkout flow failed:", error.message);
    return { success: false, reason: "error", error };
  }
}

// Workflow 2: Subscription management with recurrent payments
async function subscriptionManagement(userId, plan) {
  try {
    console.log(`Creating subscription for user ${userId}...`);

    // Create recurrent payment code
    const { result: subscription } = await client.paymentCode.create({
      name: `${plan.name} Subscription - User ${userId}`,
      mode: "recurrent",
      amount: { currency: "SLE", value: plan.monthlyPrice },
      recurrentPaymentTarget: {
        expectedPaymentCount: 12, // Annual subscription
      },
      duration: "P365D", // Valid for 1 year
      metadata: {
        userId,
        planId: plan.id,
        startDate: new Date().toISOString(),
        billingCycle: "monthly",
      },
    });

    console.log("Subscription created:");
    console.log(`  USSD Code: ${subscription.ussdCode}`);
    console.log(`  Monthly: ${plan.monthlyPrice / 100} SLE`);
    console.log(`  Duration: 12 months`);

    // Monitor subscription status
    return {
      subscriptionId: subscription.id,
      ussdCode: subscription.ussdCode,
      checkStatus: () => checkPaymentCodeStatus(subscription.id),
    };
  } catch (error) {
    console.error("Failed to create subscription:", error.message);
    throw error;
  }
}

// Export functions for use in other modules
module.exports = {
  // Create
  createBasicPaymentCode,
  createRecurrentPaymentCode,
  createLayawayPlan,
  createRestrictedPaymentCode,
  createIdempotentPaymentCode,

  // Get
  checkPaymentCodeStatus,
  waitForPayment,

  // List
  listActivePaymentCodes,
  listRecurrentPaymentCodes,
  findByUssdCode,
  getAllPaymentCodes,
  calculatePaymentCodeStats,

  // Update
  updatePaymentCodeInfo,
  deactivatePaymentCode,
  clearPaymentCodeFields,

  // Delete
  deletePaymentCode,
  cleanupExpiredPaymentCodes,

  // Workflows
  ecommerceCheckoutFlow,
  subscriptionManagement,
};
