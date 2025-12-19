/**
 * Payment Examples - Comprehensive Guide
 *
 * Payments are transaction records created when customers complete payments via
 * payment codes or checkout sessions. This module is read-only except for metadata updates.
 *
 * Available methods:
 * - get()    - Retrieve a payment by ID
 * - list()   - List payments with filters and pagination
 * - update() - Update payment metadata/description
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

// ============================================================================
// GET - Retrieve payment details
// ============================================================================

// Scenario 1: Get payment details with error handling
async function getPaymentDetails(paymentId) {
  try {
    const { result: payment } = await client.payment.get(paymentId);

    console.log("Payment Details:");
    console.log(`  ID: ${payment.id}`);
    console.log(`  Status: ${payment.status}`); // "pending", "completed", "failed"
    console.log(
      `  Amount: ${payment.amount.value / 100} ${payment.amount.currency}`,
    );
    console.log(`  Order: ${payment.orderNumber}`);
    console.log(`  Created: ${payment.createTime}`);

    // Check financial transaction reference
    if (payment.financialTransactionReference) {
      console.log(
        `  Transaction Ref: ${payment.financialTransactionReference}`,
      );
    }

    // Check fees
    if (payment.fees && payment.fees.length > 0) {
      console.log("  Fees:");
      for (const fee of payment.fees) {
        console.log(
          `    ${fee.code}: ${fee.amount.value / 100} ${fee.amount.currency}`,
        );
      }
    }

    return payment;
  } catch (error) {
    console.error("Failed to get payment:", error.message);
    throw error;
  }
}

// Scenario 2: Verify payment completion
async function verifyPaymentCompletion(paymentId) {
  try {
    const { result: payment } = await client.payment.get(paymentId);

    if (payment.status === "completed") {
      console.log("Payment completed successfully!");
      console.log(
        `  Amount received: ${payment.amount.value / 100} ${payment.amount.currency}`,
      );
      console.log(`  Financial account: ${payment.financialAccountId}`);

      return { verified: true, payment };
    } else if (payment.status === "failed") {
      console.log("Payment failed!");

      if (payment.failureDetail) {
        console.log(`  Reason: ${payment.failureDetail.message}`);
        console.log(`  Code: ${payment.failureDetail.code}`);
      }

      return { verified: false, reason: "failed", payment };
    } else {
      console.log("Payment still pending...");
      return { verified: false, reason: "pending", payment };
    }
  } catch (error) {
    console.error("Failed to verify payment:", error.message);
    throw error;
  }
}

// ============================================================================
// LIST - Search and filter payments with pagination
// ============================================================================

// Scenario 3: List recent payments
async function listRecentPayments(limit = 20) {
  try {
    const { result: payments, pagination } = await client.payment.list({
      limit,
    });

    console.log(`Found ${payments.length} recent payments`);

    for (const payment of payments) {
      const amount = `${payment.amount.value / 100} ${payment.amount.currency}`;
      console.log(`  ${payment.id}: ${amount} - ${payment.status}`);
    }

    return payments;
  } catch (error) {
    console.error("Failed to list payments:", error.message);
    throw error;
  }
}

// Scenario 4: Filter payments by order number
async function getPaymentsForOrder(orderNumber) {
  try {
    const { result: payments } = await client.payment.list({
      orderNumber,
    });

    console.log(`Found ${payments.length} payments for order ${orderNumber}`);

    for (const payment of payments) {
      console.log(`  ${payment.id}:`);
      console.log(`    Status: ${payment.status}`);
      console.log(
        `    Amount: ${payment.amount.value / 100} ${payment.amount.currency}`,
      );
      console.log(`    Created: ${payment.createTime}`);
    }

    return payments;
  } catch (error) {
    console.error("Failed to get payments for order:", error.message);
    throw error;
  }
}

// Scenario 5: Filter payments by financial account
async function getAccountPayments(financialAccountId) {
  try {
    const { result: payments } = await client.payment.list({
      financialAccountId,
      limit: 50,
    });

    console.log(
      `Found ${payments.length} payments for account ${financialAccountId}`,
    );

    // Calculate totals
    let completed = 0;
    let totalAmount = 0;
    let failed = 0;

    for (const payment of payments) {
      if (payment.status === "completed") {
        completed++;
        totalAmount += payment.amount.value;
      } else if (payment.status === "failed") {
        failed++;
      }
    }

    console.log("Summary:");
    console.log(`  Completed: ${completed}`);
    console.log(`  Failed: ${failed}`);
    console.log(
      `  Total amount: ${totalAmount / 100} ${payments[0]?.amount.currency || "SLE"}`,
    );

    return payments;
  } catch (error) {
    console.error("Failed to get account payments:", error.message);
    throw error;
  }
}

// Scenario 6: Filter by transaction reference
async function findPaymentByTransactionRef(transactionRef) {
  try {
    const { result: payments } = await client.payment.list({
      financialTransactionReference: transactionRef,
    });

    if (payments.length > 0) {
      console.log("Found payment:");
      console.log(`  ID: ${payments[0].id}`);
      console.log(`  Status: ${payments[0].status}`);
      return payments[0];
    } else {
      console.log("No payment found for transaction reference");
      return null;
    }
  } catch (error) {
    console.error("Failed to find payment:", error.message);
    throw error;
  }
}

// Scenario 7: Paginate through all payments
async function getAllPayments() {
  const allPayments = [];
  let after = null;

  try {
    do {
      const response = await client.payment.list({
        limit: 100,
        ...(after && { after }),
      });

      allPayments.push(...response.result);
      console.log(
        `Fetched ${response.result.length} payments (total: ${allPayments.length})`,
      );

      after = response.pagination.next;
    } while (after);

    console.log(`Total payments retrieved: ${allPayments.length}`);
    return allPayments;
  } catch (error) {
    console.error("Failed to fetch all payments:", error.message);
    throw error;
  }
}

// Scenario 8: Calculate payment statistics
async function calculatePaymentStats(financialAccountId) {
  try {
    const allPayments = financialAccountId
      ? (await client.payment.list({ financialAccountId, limit: 100 })).result
      : await getAllPayments();

    const stats = {
      total: allPayments.length,
      completed: 0,
      pending: 0,
      failed: 0,
      totalRevenue: 0,
      totalFees: 0,
      averageAmount: 0,
    };

    for (const payment of allPayments) {
      // Count by status
      if (payment.status === "completed") {
        stats.completed++;
        stats.totalRevenue += payment.amount.value;
      } else if (payment.status === "pending") {
        stats.pending++;
      } else if (payment.status === "failed") {
        stats.failed++;
      }

      // Sum fees
      if (payment.fees) {
        for (const fee of payment.fees) {
          stats.totalFees += fee.amount.value;
        }
      }
    }

    stats.averageAmount =
      stats.completed > 0 ? stats.totalRevenue / stats.completed : 0;

    console.log("Payment Statistics:");
    console.log(`  Total: ${stats.total}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Pending: ${stats.pending}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Total Revenue: ${stats.totalRevenue / 100} SLE`);
    console.log(`  Total Fees: ${stats.totalFees / 100} SLE`);
    console.log(`  Average: ${(stats.averageAmount / 100).toFixed(2)} SLE`);

    return stats;
  } catch (error) {
    console.error("Failed to calculate payment stats:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE - Update payment metadata
// ============================================================================

// Scenario 9: Update payment metadata
async function updatePaymentMetadata(paymentId, metadata) {
  try {
    const { result: updated } = await client.payment.update(paymentId, {
      metadata,
    });

    console.log("Payment metadata updated:");
    console.log(JSON.stringify(updated.metadata, null, 2));

    return updated;
  } catch (error) {
    console.error("Failed to update payment metadata:", error.message);
    throw error;
  }
}

// Scenario 10: Update payment name/description
async function updatePaymentInfo(paymentId, name) {
  try {
    const { result: updated } = await client.payment.update(paymentId, {
      name,
      metadata: {
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
      },
    });

    console.log(`Payment name updated to: ${updated.name}`);
    return updated;
  } catch (error) {
    console.error("Failed to update payment info:", error.message);
    throw error;
  }
}

// Scenario 11: Mark payment as processed
async function markPaymentProcessed(paymentId) {
  try {
    const { result: payment } = await client.payment.get(paymentId);

    const { result: updated } = await client.payment.update(paymentId, {
      metadata: {
        ...payment.metadata,
        processed: "true",
        processedAt: new Date().toISOString(),
        fulfillmentStatus: "completed",
      },
    });

    console.log("Payment marked as processed");
    return updated;
  } catch (error) {
    console.error("Failed to mark payment as processed:", error.message);
    throw error;
  }
}

// ============================================================================
// COMPLETE WORKFLOWS - Real-world use cases
// ============================================================================

// Workflow 1: Order fulfillment tracking
async function fulfillmentWorkflow(orderNumber) {
  try {
    console.log(`Processing fulfillment for order: ${orderNumber}`);

    // Step 1: Find payments for order
    const { result: payments } = await client.payment.list({ orderNumber });

    if (payments.length === 0) {
      console.log("No payments found for order");
      return { success: false, reason: "no_payments" };
    }

    // Step 2: Check if payment is completed
    const completedPayments = payments.filter((p) => p.status === "completed");

    if (completedPayments.length === 0) {
      console.log("No completed payments found");
      return { success: false, reason: "payment_not_completed" };
    }

    // Step 3: Update payment metadata to track fulfillment
    const payment = completedPayments[0];
    await client.payment.update(payment.id, {
      metadata: {
        ...payment.metadata,
        fulfillmentStarted: new Date().toISOString(),
        orderStatus: "processing",
        trackingNumber: "TRK-" + Date.now(),
      },
    });

    console.log("Fulfillment started");

    // Step 4: Simulate fulfillment process
    // ... fulfill order ...

    // Step 5: Mark as fulfilled
    await client.payment.update(payment.id, {
      metadata: {
        ...payment.metadata,
        fulfillmentCompleted: new Date().toISOString(),
        orderStatus: "fulfilled",
      },
    });

    console.log("Order fulfilled successfully");

    return { success: true, payment };
  } catch (error) {
    console.error("Fulfillment workflow failed:", error.message);
    return { success: false, error };
  }
}

// Workflow 2: Daily reconciliation report
async function dailyReconciliationReport(financialAccountId, date) {
  try {
    console.log(`Generating reconciliation report for ${date}...`);

    // Get all payments for the account
    const allPayments = [];
    let after = null;

    do {
      const response = await client.payment.list({
        financialAccountId,
        limit: 100,
        ...(after && { after }),
      });

      allPayments.push(...response.result);
      after = response.pagination.next;
    } while (after);

    // Filter by date
    const targetDate = new Date(date).toDateString();
    const dailyPayments = allPayments.filter((p) => {
      const paymentDate = new Date(p.createTime).toDateString();
      return paymentDate === targetDate;
    });

    // Generate report
    const report = {
      date,
      totalPayments: dailyPayments.length,
      completed: 0,
      failed: 0,
      totalRevenue: 0,
      totalFees: 0,
      netRevenue: 0,
      payments: [],
    };

    for (const payment of dailyPayments) {
      if (payment.status === "completed") {
        report.completed++;
        report.totalRevenue += payment.amount.value;

        if (payment.fees) {
          for (const fee of payment.fees) {
            report.totalFees += fee.amount.value;
          }
        }
      } else if (payment.status === "failed") {
        report.failed++;
      }

      report.payments.push({
        id: payment.id,
        orderNumber: payment.orderNumber,
        amount: payment.amount.value / 100,
        status: payment.status,
        time: payment.createTime,
      });
    }

    report.netRevenue = report.totalRevenue - report.totalFees;

    console.log("Daily Reconciliation Report:");
    console.log(`  Date: ${report.date}`);
    console.log(`  Total Payments: ${report.totalPayments}`);
    console.log(`  Completed: ${report.completed}`);
    console.log(`  Failed: ${report.failed}`);
    console.log(`  Gross Revenue: ${report.totalRevenue / 100} SLE`);
    console.log(`  Fees: ${report.totalFees / 100} SLE`);
    console.log(`  Net Revenue: ${report.netRevenue / 100} SLE`);

    return report;
  } catch (error) {
    console.error("Failed to generate reconciliation report:", error.message);
    throw error;
  }
}

// Workflow 3: Payment status monitoring with webhook
async function monitorPaymentStatus(paymentId) {
  const maxAttempts = 30;
  const pollInterval = 5000; // 5 seconds

  console.log(`Monitoring payment: ${paymentId}`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { result: payment } = await client.payment.get(paymentId);

      console.log(`Attempt ${attempt + 1}: Status = ${payment.status}`);

      if (payment.status === "completed") {
        console.log("Payment completed!");
        return { success: true, payment };
      }

      if (payment.status === "failed") {
        console.log("Payment failed!");
        return { success: false, reason: "failed", payment };
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error(`Error checking payment status: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  console.log("Payment monitoring timeout");
  return { success: false, reason: "timeout" };
}

// Export functions
module.exports = {
  // Get
  getPaymentDetails,
  verifyPaymentCompletion,

  // List
  listRecentPayments,
  getPaymentsForOrder,
  getAccountPayments,
  findPaymentByTransactionRef,
  getAllPayments,
  calculatePaymentStats,

  // Update
  updatePaymentMetadata,
  updatePaymentInfo,
  markPaymentProcessed,

  // Workflows
  fulfillmentWorkflow,
  dailyReconciliationReport,
  monitorPaymentStatus,
};
