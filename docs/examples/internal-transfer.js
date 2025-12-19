/**
 * Internal Transfer Examples
 *
 * Internal transfers move funds between financial accounts within the same Space.
 * This module demonstrates fund movement patterns, float management, user wallet operations,
 * escrow handling, business settlements, and comprehensive error handling.
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

// ============================================================================
// BASIC INTERNAL TRANSFER
// ============================================================================

async function createBasicTransfer(sourceId, destinationId, amount) {
  try {
    const transfer = await client.internalTransfer.create({
      amount: {
        currency: "SLE",
        value: amount, // Amount in minor units
      },
      sourceFinancialAccount: {
        id: sourceId,
      },
      destinationFinancialAccount: {
        id: destinationId,
      },
      description: "Internal fund transfer",
      metadata: {
        transferType: "basic",
        timestamp: new Date().toISOString(),
      },
    });

    console.log("Transfer created:", transfer.result.id);
    console.log("Status:", transfer.result.status);

    return transfer.result;
  } catch (error) {
    console.error("Transfer failed:", error.message);
    if (error.code === "insufficient_balance") {
      console.error("Source account has insufficient funds");
    }
    throw error;
  }
}

// ============================================================================
// USER WALLET TOP-UP
// ============================================================================

async function topUpUserWallet(userId, amount) {
  try {
    const transfer = await client.internalTransfer.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      sourceFinancialAccount: {
        id: "fa-operational-float", // Your operational account
      },
      destinationFinancialAccount: {
        id: `fa-user-wallet-${userId}`, // User's wallet account
      },
      description: `Wallet top-up for user ${userId}`,
      metadata: {
        userId: userId,
        transferType: "wallet_topup",
        reason: "customer_deposit",
      },
    });

    console.log(`User ${userId} wallet topped up:`, transfer.result.id);
    return transfer.result;
  } catch (error) {
    console.error(`Wallet top-up failed for user ${userId}:`, error.message);
    throw error;
  }
}

// ============================================================================
// USER WALLET WITHDRAWAL
// ============================================================================

async function withdrawFromUserWallet(userId, amount) {
  try {
    const transfer = await client.internalTransfer.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      sourceFinancialAccount: {
        id: `fa-user-wallet-${userId}`,
      },
      destinationFinancialAccount: {
        id: "fa-operational-float",
      },
      description: `Wallet withdrawal for user ${userId}`,
      metadata: {
        userId: userId,
        transferType: "wallet_withdrawal",
        reason: "customer_withdrawal",
      },
    });

    console.log(`User ${userId} withdrawal processed:`, transfer.result.id);
    return transfer.result;
  } catch (error) {
    console.error(
      `Wallet withdrawal failed for user ${userId}:`,
      error.message,
    );
    throw error;
  }
}

// ============================================================================
// FLOAT MANAGEMENT - REPLENISH DISBURSEMENT ACCOUNT
// ============================================================================

async function replenishDisbursementFloat(amount) {
  try {
    const transfer = await client.internalTransfer.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      sourceFinancialAccount: {
        id: "fa-main-float",
      },
      destinationFinancialAccount: {
        id: "fa-disbursement-float",
      },
      description: "Replenish disbursement float account",
      metadata: {
        transferType: "float_management",
        purpose: "replenishment",
        approvedBy: "finance-team",
      },
    });

    console.log("Disbursement float replenished:", transfer.result.id);
    return transfer.result;
  } catch (error) {
    console.error("Float replenishment failed:", error.message);
    throw error;
  }
}

// ============================================================================
// GET TRANSFER DETAILS
// ============================================================================

async function getTransferDetails(transferId) {
  try {
    const { result: transfer } = await client.internalTransfer.get(transferId);

    console.log("Transfer ID:", transfer.id);
    console.log("Status:", transfer.status);
    console.log("Amount:", transfer.amount.value, transfer.amount.currency);
    console.log("Source:", transfer.sourceFinancialAccount.id);
    console.log("Destination:", transfer.destinationFinancialAccount.id);

    // Status can be: "pending", "processing", "completed", "failed"
    if (transfer.status === "completed") {
      console.log("Transfer completed successfully!");
      if (transfer.financialTransactionReference) {
        console.log("Transaction ref:", transfer.financialTransactionReference);
      }
    } else if (transfer.status === "failed") {
      console.log("Transfer failed!");
      if (transfer.failureDetail) {
        console.log("Failure code:", transfer.failureDetail.code);
        console.log("Failure message:", transfer.failureDetail.message);
      }
    }

    return transfer;
  } catch (error) {
    console.error("Failed to retrieve transfer:", error.message);
    throw error;
  }
}

// ============================================================================
// MONITOR TRANSFER UNTIL COMPLETION
// ============================================================================

async function waitForTransferCompletion(transferId, maxAttempts = 30) {
  console.log(`Monitoring transfer ${transferId}...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { result: transfer } =
        await client.internalTransfer.get(transferId);

      if (transfer.status === "completed") {
        console.log("Transfer completed successfully!");
        return { success: true, transfer };
      }

      if (transfer.status === "failed") {
        console.log("Transfer failed");
        if (transfer.failureDetail) {
          console.log("Reason:", transfer.failureDetail.message);
        }
        return { success: false, transfer };
      }

      console.log(`Attempt ${attempt}: Status is ${transfer.status}`);

      // Wait 1 second before next check
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Poll attempt ${attempt} failed:`, error.message);
    }
  }

  console.log("Monitoring timed out");
  return { success: false, transfer: null };
}

// ============================================================================
// LIST TRANSFERS WITH FILTERS
// ============================================================================

async function listAllTransfers() {
  try {
    const { result: transfers, pagination } =
      await client.internalTransfer.list();

    console.log(`Total transfers: ${pagination.count}`);

    for (const transfer of transfers) {
      console.log(
        `${transfer.id} - ${transfer.status} - ${transfer.amount.value} ${transfer.amount.currency}`,
      );
    }

    return transfers;
  } catch (error) {
    console.error("Failed to list transfers:", error.message);
    throw error;
  }
}

async function listCompletedTransfers() {
  try {
    const { result: transfers } = await client.internalTransfer.list({
      status: "completed",
    });

    console.log(`Found ${transfers.length} completed transfers`);
    return transfers;
  } catch (error) {
    console.error("Failed to list completed transfers:", error.message);
    throw error;
  }
}

async function listTransfersBySourceAccount(sourceAccountId) {
  try {
    const { result: transfers } = await client.internalTransfer.list({
      sourceFinancialAccountId: sourceAccountId,
    });

    console.log(
      `Found ${transfers.length} transfers from account ${sourceAccountId}`,
    );
    return transfers;
  } catch (error) {
    console.error("Failed to list transfers by source:", error.message);
    throw error;
  }
}

async function listTransfersByDestinationAccount(destinationAccountId) {
  try {
    const { result: transfers } = await client.internalTransfer.list({
      destinationFinancialAccountId: destinationAccountId,
    });

    console.log(
      `Found ${transfers.length} transfers to account ${destinationAccountId}`,
    );
    return transfers;
  } catch (error) {
    console.error("Failed to list transfers by destination:", error.message);
    throw error;
  }
}

async function listTransfersByReference(txnReference) {
  try {
    const { result: transfers } = await client.internalTransfer.list({
      financialTransactionReference: txnReference,
    });

    console.log(
      `Found ${transfers.length} transfers with reference ${txnReference}`,
    );
    return transfers;
  } catch (error) {
    console.error("Failed to list transfers by reference:", error.message);
    throw error;
  }
}

// ============================================================================
// PAGINATE THROUGH ALL TRANSFERS
// ============================================================================

async function getAllTransfers() {
  const allTransfers = [];
  let after = null;

  try {
    do {
      const response = await client.internalTransfer.list({
        limit: 50,
        ...(after && { after }),
      });

      allTransfers.push(...response.result);

      console.log(
        `Fetched ${response.result.length} transfers (Total: ${allTransfers.length})`,
      );

      after = response.pagination.next;
    } while (after);

    console.log(`Retrieved all ${allTransfers.length} transfers`);
    return allTransfers;
  } catch (error) {
    console.error("Pagination failed:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE TRANSFER METADATA
// ============================================================================

async function updateTransferMetadata(transferId, updates) {
  try {
    const { result: transfer } = await client.internalTransfer.update(
      transferId,
      {
        description: updates.description,
        metadata: updates.metadata,
      },
    );

    console.log(`Transfer ${transferId} updated successfully`);
    return transfer;
  } catch (error) {
    console.error("Failed to update transfer:", error.message);
    throw error;
  }
}

// ============================================================================
// DELETE PENDING TRANSFER
// ============================================================================

async function cancelTransfer(transferId) {
  try {
    // Can only delete pending transfers
    await client.internalTransfer.delete(transferId);
    console.log(`Transfer ${transferId} cancelled successfully`);
  } catch (error) {
    if (error.code === "invalid_state") {
      console.error(
        "Cannot cancel this transfer - it may already be processing or completed",
      );
    } else {
      console.error("Failed to cancel transfer:", error.message);
    }
    throw error;
  }
}

// ============================================================================
// ESCROW OPERATIONS
// ============================================================================

async function createEscrow(orderId, buyerId, sellerId, amount) {
  try {
    // Transfer from buyer's wallet to escrow account
    const transfer = await client.internalTransfer.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      sourceFinancialAccount: {
        id: `fa-user-wallet-${buyerId}`,
      },
      destinationFinancialAccount: {
        id: "fa-escrow-account",
      },
      description: `Escrow for order ${orderId}`,
      metadata: {
        transferType: "escrow_create",
        orderId: orderId,
        buyerId: buyerId,
        sellerId: sellerId,
      },
    });

    console.log(`Escrow created for order ${orderId}:`, transfer.result.id);
    return transfer.result;
  } catch (error) {
    console.error(
      `Escrow creation failed for order ${orderId}:`,
      error.message,
    );
    throw error;
  }
}

async function releaseEscrow(orderId, sellerId, amount) {
  try {
    // Transfer from escrow to seller's wallet
    const transfer = await client.internalTransfer.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      sourceFinancialAccount: {
        id: "fa-escrow-account",
      },
      destinationFinancialAccount: {
        id: `fa-user-wallet-${sellerId}`,
      },
      description: `Escrow release for order ${orderId}`,
      metadata: {
        transferType: "escrow_release",
        orderId: orderId,
        sellerId: sellerId,
        status: "order_completed",
      },
    });

    console.log(`Escrow released for order ${orderId}:`, transfer.result.id);
    return transfer.result;
  } catch (error) {
    console.error(`Escrow release failed for order ${orderId}:`, error.message);
    throw error;
  }
}

async function refundEscrow(orderId, buyerId, amount) {
  try {
    // Transfer from escrow back to buyer's wallet
    const transfer = await client.internalTransfer.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      sourceFinancialAccount: {
        id: "fa-escrow-account",
      },
      destinationFinancialAccount: {
        id: `fa-user-wallet-${buyerId}`,
      },
      description: `Escrow refund for order ${orderId}`,
      metadata: {
        transferType: "escrow_refund",
        orderId: orderId,
        buyerId: buyerId,
        reason: "order_cancelled",
      },
    });

    console.log(`Escrow refunded for order ${orderId}:`, transfer.result.id);
    return transfer.result;
  } catch (error) {
    console.error(`Escrow refund failed for order ${orderId}:`, error.message);
    throw error;
  }
}

// ============================================================================
// BUSINESS UNIT SETTLEMENT
// ============================================================================

async function settleBetweenBusinessUnits(fromUnit, toUnit, amount, invoiceId) {
  try {
    const transfer = await client.internalTransfer.create({
      amount: {
        currency: "SLE",
        value: amount,
      },
      sourceFinancialAccount: {
        id: `fa-${fromUnit}-account`,
      },
      destinationFinancialAccount: {
        id: `fa-${toUnit}-account`,
      },
      description: `Settlement: ${fromUnit} to ${toUnit}`,
      metadata: {
        transferType: "business_settlement",
        fromBusinessUnit: fromUnit,
        toBusinessUnit: toUnit,
        invoiceId: invoiceId,
        settlementPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM
      },
    });

    console.log(
      `Settlement completed from ${fromUnit} to ${toUnit}:`,
      transfer.result.id,
    );
    return transfer.result;
  } catch (error) {
    console.error(
      `Settlement failed from ${fromUnit} to ${toUnit}:`,
      error.message,
    );
    throw error;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

// Example 1: Basic transfer
// const transfer = await createBasicTransfer("fa-source-id", "fa-dest-id", 100000);

// Example 2: Top up user wallet
// await topUpUserWallet("user-123", 50000);

// Example 3: Withdraw from user wallet
// await withdrawFromUserWallet("user-123", 25000);

// Example 4: Replenish float
// await replenishDisbursementFloat(5000000);

// Example 5: Get transfer details
// const transfer = await getTransferDetails("trn-transfer-id");

// Example 6: Monitor transfer
// const result = await waitForTransferCompletion("trn-transfer-id");

// Example 7: List transfers with filters
// const completed = await listCompletedTransfers();
// const fromAccount = await listTransfersBySourceAccount("fa-operational-float");

// Example 8: Update transfer
// await updateTransferMetadata("trn-transfer-id", {
//   description: "Updated description",
//   metadata: { note: "Corrected details" },
// });

// Example 9: Cancel transfer
// await cancelTransfer("trn-transfer-id");

// Example 10: Escrow operations
// await createEscrow("order-123", "buyer-id", "seller-id", 100000);
// await releaseEscrow("order-123", "seller-id", 100000);
// await refundEscrow("order-123", "buyer-id", 100000);

// Example 11: Business settlement
// await settleBetweenBusinessUnits("sales", "operations", 250000, "inv-2025-001");
