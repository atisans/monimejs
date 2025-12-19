/**
 * Payout Examples
 *
 * Payouts are disbursements to external accounts including mobile money, bank accounts,
 * and digital wallets. This module demonstrates various payout scenarios, error handling,
 * status monitoring, fee tracking, and batch processing patterns.
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

// ============================================================================
// MOBILE MONEY PAYOUT
// ============================================================================

async function createMobileMoneyPayout(phoneNumber, amount, provider) {
  try {
    const payout = await client.payout.create({
      amount: {
        currency: "SLE",
        value: amount, // Amount in minor units (e.g., 50000 = 500.00 SLE)
      },
      destination: {
        type: "momo",
        providerId: provider, // e.g., "m17" for Orange Money
        phoneNumber: phoneNumber,
      },
      metadata: {
        payoutType: "mobile_money",
        timestamp: new Date().toISOString(),
      },
    });

    console.log("Mobile money payout created:", payout.result.id);
    console.log("Status:", payout.result.status);

    return payout.result;
  } catch (error) {
    console.error("Mobile money payout failed:", error.message);
    if (error.code === "insufficient_balance") {
      console.error("Insufficient funds in source account");
    }
    throw error;
  }
}

// ============================================================================
// BANK ACCOUNT PAYOUT
// ============================================================================

async function createBankPayout(accountNumber, amount, bankProviderId) {
  try {
    const payout = await client.payout.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      destination: {
        type: "bank",
        providerId: bankProviderId,
        accountNumber: accountNumber,
      },
      source: {
        financialAccountId: "fa-disbursement-account", // Optional: specify source
      },
      metadata: {
        payoutType: "bank_transfer",
        beneficiaryName: "John Doe",
      },
    });

    console.log("Bank payout created:", payout.result.id);
    return payout.result;
  } catch (error) {
    console.error("Bank payout failed:", error.message);
    throw error;
  }
}

// ============================================================================
// WALLET PAYOUT
// ============================================================================

async function createWalletPayout(walletId, amount, providerId) {
  try {
    // Wallet payout with walletId
    const payout = await client.payout.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      destination: {
        type: "wallet",
        providerId: providerId, // e.g., "dw001"
        walletId: walletId, // Optional
      },
      metadata: {
        payoutType: "digital_wallet",
      },
    });

    console.log("Wallet payout created:", payout.result.id);
    return payout.result;
  } catch (error) {
    console.error("Wallet payout failed:", error.message);
    throw error;
  }
}

async function createWalletPayoutWithoutId(amount, providerId) {
  try {
    // Wallet payout without walletId (provider-specific handling)
    const payout = await client.payout.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      destination: {
        type: "wallet",
        providerId: providerId,
      },
    });

    return payout.result;
  } catch (error) {
    console.error("Wallet payout failed:", error.message);
    throw error;
  }
}

// ============================================================================
// SALARY DISBURSEMENT
// ============================================================================

async function processSalaryPayment(employee) {
  try {
    const payout = await client.payout.create({
      amount: {
        currency: "SLE",
        value: employee.salaryAmount,
      },
      destination: {
        type: "momo",
        providerId: employee.mobileProvider,
        phoneNumber: employee.phoneNumber,
      },
      source: {
        financialAccountId: "fa-payroll-account",
      },
      metadata: {
        payoutType: "salary",
        employeeId: employee.id,
        employeeName: employee.name,
        month: employee.payPeriod,
        department: employee.department,
      },
    });

    console.log(
      `Salary payout for ${employee.name}: ${payout.result.id} - ${payout.result.status}`,
    );
    return payout.result;
  } catch (error) {
    console.error(`Salary payout failed for ${employee.name}:`, error.message);
    throw error;
  }
}

// ============================================================================
// GET PAYOUT STATUS AND DETAILS
// ============================================================================

async function getPayoutDetails(payoutId) {
  try {
    const { result: payout } = await client.payout.get(payoutId);

    console.log("Payout ID:", payout.id);
    console.log("Status:", payout.status);
    console.log("Amount:", payout.amount.value, payout.amount.currency);

    // Status can be: "pending", "processing", "completed", "failed"
    if (payout.status === "completed") {
      console.log("Payout completed successfully!");

      // Check fees
      if (payout.fees && payout.fees.length > 0) {
        console.log("Fees:");
        for (const fee of payout.fees) {
          console.log(
            `  ${fee.code}: ${fee.amount.value} ${fee.amount.currency}`,
          );
        }
      }
    } else if (payout.status === "failed") {
      console.log("Payout failed!");

      if (payout.failureDetail) {
        console.log("Failure code:", payout.failureDetail.code);
        console.log("Failure message:", payout.failureDetail.message);
      }
    }

    return payout;
  } catch (error) {
    console.error("Failed to retrieve payout:", error.message);
    throw error;
  }
}

// ============================================================================
// MONITOR PAYOUT UNTIL COMPLETION
// ============================================================================

async function waitForPayoutCompletion(payoutId, maxAttempts = 30) {
  console.log(`Monitoring payout ${payoutId}...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { result: payout } = await client.payout.get(payoutId);

      if (payout.status === "completed") {
        console.log("Payout completed successfully!");
        return { success: true, payout };
      }

      if (payout.status === "failed") {
        console.log("Payout failed");
        if (payout.failureDetail) {
          console.log("Reason:", payout.failureDetail.message);
        }
        return { success: false, payout };
      }

      console.log(`Attempt ${attempt}: Status is ${payout.status}`);

      // Wait 2 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Poll attempt ${attempt} failed:`, error.message);
    }
  }

  console.log("Monitoring timed out");
  return { success: false, payout: null };
}

// ============================================================================
// LIST PAYOUTS WITH FILTERS
// ============================================================================

async function listAllPayouts() {
  try {
    const { result: payouts, pagination } = await client.payout.list();

    console.log(`Total payouts: ${pagination.count}`);

    for (const payout of payouts) {
      console.log(
        `${payout.id} - ${payout.status} - ${payout.amount.value} ${payout.amount.currency}`,
      );
    }

    return payouts;
  } catch (error) {
    console.error("Failed to list payouts:", error.message);
    throw error;
  }
}

async function listCompletedPayouts() {
  try {
    const { result: payouts } = await client.payout.list({
      status: "completed",
    });

    console.log(`Found ${payouts.length} completed payouts`);
    return payouts;
  } catch (error) {
    console.error("Failed to list completed payouts:", error.message);
    throw error;
  }
}

async function listFailedPayouts() {
  try {
    const { result: payouts } = await client.payout.list({
      status: "failed",
      limit: 20,
    });

    console.log(`Found ${payouts.length} failed payouts`);

    for (const payout of payouts) {
      if (payout.failureDetail) {
        console.log(
          `${payout.id}: ${payout.failureDetail.code} - ${payout.failureDetail.message}`,
        );
      }
    }

    return payouts;
  } catch (error) {
    console.error("Failed to list failed payouts:", error.message);
    throw error;
  }
}

async function listPayoutsByAccount(accountId) {
  try {
    const { result: payouts } = await client.payout.list({
      sourceFinancialAccountId: accountId,
    });

    console.log(`Found ${payouts.length} payouts from account ${accountId}`);
    return payouts;
  } catch (error) {
    console.error("Failed to list payouts by account:", error.message);
    throw error;
  }
}

// ============================================================================
// PAGINATE THROUGH ALL PAYOUTS
// ============================================================================

async function getAllPayouts() {
  const allPayouts = [];
  let after = null;

  try {
    do {
      const response = await client.payout.list({
        limit: 50,
        ...(after && { after }),
      });

      allPayouts.push(...response.result);

      console.log(
        `Fetched ${response.result.length} payouts (Total: ${allPayouts.length})`,
      );

      after = response.pagination.next;
    } while (after);

    console.log(`Retrieved all ${allPayouts.length} payouts`);
    return allPayouts;
  } catch (error) {
    console.error("Pagination failed:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE PAYOUT METADATA
// ============================================================================

async function updatePayoutMetadata(payoutId, updates) {
  try {
    // Can only update payouts that haven't been processed yet
    const { result: payout } = await client.payout.update(payoutId, {
      metadata: updates,
    });

    console.log(`Payout ${payoutId} updated successfully`);
    return payout;
  } catch (error) {
    if (error.code === "invalid_state") {
      console.error("Cannot update this payout - it may already be processing");
    } else {
      console.error("Failed to update payout:", error.message);
    }
    throw error;
  }
}

// ============================================================================
// DELETE PENDING PAYOUT
// ============================================================================

async function cancelPayout(payoutId) {
  try {
    // Can only delete pending payouts
    await client.payout.delete(payoutId);
    console.log(`Payout ${payoutId} cancelled successfully`);
  } catch (error) {
    if (error.code === "invalid_state") {
      console.error(
        "Cannot cancel this payout - it may already be processing or completed",
      );
    } else {
      console.error("Failed to cancel payout:", error.message);
    }
    throw error;
  }
}

// ============================================================================
// BATCH PAYOUT PROCESSING
// ============================================================================

async function processBatchPayouts(payoutRequests) {
  console.log(`Processing batch of ${payoutRequests.length} payouts...`);

  const results = {
    successful: [],
    failed: [],
  };

  for (const request of payoutRequests) {
    try {
      const payout = await client.payout.create(request);
      results.successful.push({
        id: payout.result.id,
        request,
      });
      console.log(`✓ Created payout: ${payout.result.id}`);
    } catch (error) {
      results.failed.push({
        request,
        error: error.message,
      });
      console.error(`✗ Failed to create payout:`, error.message);
    }

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(
    `Batch complete: ${results.successful.length} successful, ${results.failed.length} failed`,
  );
  return results;
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

// Example 1: Mobile money payout
// const momoPayout = await createMobileMoneyPayout("+23276123456", 50000, "m17");

// Example 2: Bank payout
// const bankPayout = await createBankPayout("1234567890", 1000000, "bank-provider-id");

// Example 3: Wallet payout
// const walletPayout = await createWalletPayout("wallet-123", 25000, "dw001");

// Example 4: Process salary payments
// const employee = {
//   id: "emp-001",
//   name: "Jane Doe",
//   phoneNumber: "+23276123456",
//   mobileProvider: "m17",
//   salaryAmount: 500000,
//   payPeriod: "2025-01",
//   department: "Engineering",
// };
// await processSalaryPayment(employee);

// Example 5: Get payout details
// const payout = await getPayoutDetails("pot-payout-id");

// Example 6: Monitor payout
// const result = await waitForPayoutCompletion("pot-payout-id");

// Example 7: List payouts with filters
// const completed = await listCompletedPayouts();
// const failed = await listFailedPayouts();

// Example 8: Update payout metadata
// await updatePayoutMetadata("pot-payout-id", { approvedBy: "admin", note: "Verified" });

// Example 9: Cancel pending payout
// await cancelPayout("pot-payout-id");

// Example 10: Batch processing
// const batch = [
//   {
//     amount: { currency: "SLE", value: 50000 },
//     destination: { type: "momo", providerId: "m17", phoneNumber: "+23276111111" },
//   },
//   {
//     amount: { currency: "SLE", value: 75000 },
//     destination: { type: "momo", providerId: "m17", phoneNumber: "+23276222222" },
//   },
// ];
// await processBatchPayouts(batch);
