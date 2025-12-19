/**
 * Financial Transaction Examples
 *
 * Financial transactions represent fund movements affecting a financial account,
 * categorized as either a credit (inflow) or debit (outflow).
 * Each transaction adjusts account balances and maintains an audit trail.
 *
 * All available methods:
 * - get(id) - Retrieve a transaction by ID
 * - list(params?) - List transactions with filtering and pagination
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

import {
  MonimeApiError,
  MonimeNetworkError,
  MonimeValidationError,
} from "monimejs";

// ===================================
// 1. GET A SINGLE TRANSACTION
// ===================================

try {
  const { result: transaction } =
    await client.financialTransaction.get("ftx-transaction-id");

  console.log(transaction.id); // "ftx-..."
  console.log(transaction.type); // "credit" or "debit"
  console.log(transaction.amount.currency); // "SLE"
  console.log(transaction.amount.value); // Amount in minor units (e.g., 50000 = 500.00 SLE)
  console.log(transaction.timestamp); // ISO 8601 datetime
  console.log(transaction.reference); // Transaction reference for reconciliation

  // Access the affected financial account and its post-transaction balance
  console.log(transaction.financialAccount.id); // "fa-..."
  console.log(transaction.financialAccount.balance.after.currency); // "SLE"
  console.log(transaction.financialAccount.balance.after.value); // Balance after transaction

  // Check if transaction is a reversal
  if (transaction.originatingReversal) {
    console.log(
      "This is a reversal of:",
      transaction.originatingReversal.originTxnId,
    );
    console.log(
      "Original reference:",
      transaction.originatingReversal.originTxnRef,
    );
  }

  // Check if transaction has an associated fee
  if (transaction.originatingFee) {
    console.log("Fee code:", transaction.originatingFee.code);
  }

  // Access ownership graph to trace the originating resource
  if (transaction.ownershipGraph) {
    console.log("Owner type:", transaction.ownershipGraph.owner.type);
    console.log("Owner ID:", transaction.ownershipGraph.owner.id);

    // Ownership can be nested (e.g., payment -> checkout session)
    if (transaction.ownershipGraph.owner.owner) {
      console.log("Parent owner:", transaction.ownershipGraph.owner.owner.type);
    }
  }
} catch (error) {
  if (error instanceof MonimeValidationError) {
    console.error("Invalid transaction ID:", error.message);
  } else if (error instanceof MonimeApiError && error.code === 404) {
    console.error("Transaction not found");
  } else if (error instanceof MonimeNetworkError) {
    console.error("Network error:", error.message);
  } else {
    throw error;
  }
}

// ===================================
// 2. LIST ALL TRANSACTIONS
// ===================================

try {
  const { result: transactions, pagination } =
    await client.financialTransaction.list();

  console.log(`Found ${pagination.count} transactions`);

  for (const txn of transactions) {
    const direction = txn.type === "credit" ? "+" : "-";
    console.log(
      `${direction}${txn.amount.value} ${txn.amount.currency} (${txn.reference})`,
    );
  }
} catch (error) {
  if (error instanceof MonimeApiError) {
    console.error(`API Error ${error.code}: ${error.message}`);
  } else {
    throw error;
  }
}

// ===================================
// 3. FILTER BY FINANCIAL ACCOUNT
// ===================================

try {
  const { result: accountTransactions } =
    await client.financialTransaction.list({
      financialAccountId: "fa-account-id",
    });

  console.log(`Found ${accountTransactions.length} transactions for account`);

  for (const txn of accountTransactions) {
    console.log(`${txn.type}: ${txn.amount.value} ${txn.amount.currency}`);
  }
} catch (error) {
  if (error instanceof MonimeValidationError) {
    console.error("Invalid account ID:", error.message);
  } else {
    throw error;
  }
}

// ===================================
// 4. FILTER BY TRANSACTION TYPE
// ===================================

// Credits only (money coming in)
try {
  const { result: credits } = await client.financialTransaction.list({
    type: "credit",
  });

  console.log(`Found ${credits.length} credit transactions`);

  // Calculate total credits
  const totalCredits = credits.reduce((sum, txn) => sum + txn.amount.value, 0);
  console.log(`Total credits: ${totalCredits}`);
} catch (error) {
  console.error("Error fetching credits:", error.message);
}

// Debits only (money going out)
try {
  const { result: debits } = await client.financialTransaction.list({
    type: "debit",
  });

  console.log(`Found ${debits.length} debit transactions`);

  // Calculate total debits
  const totalDebits = debits.reduce((sum, txn) => sum + txn.amount.value, 0);
  console.log(`Total debits: ${totalDebits}`);
} catch (error) {
  console.error("Error fetching debits:", error.message);
}

// ===================================
// 5. FILTER BY REFERENCE
// ===================================

try {
  const { result: byReference } = await client.financialTransaction.list({
    reference: "txn-ref-123",
  });

  if (byReference.length > 0) {
    console.log("Transaction found:", byReference[0]);
  } else {
    console.log("No transaction found with this reference");
  }
} catch (error) {
  console.error("Error searching by reference:", error.message);
}

// ===================================
// 6. COMBINE FILTERS
// ===================================

try {
  // Credits for a specific account
  const { result: accountCredits } = await client.financialTransaction.list({
    financialAccountId: "fa-account-id",
    type: "credit",
  });

  console.log(
    `Found ${accountCredits.length} credit transactions for this account`,
  );
} catch (error) {
  console.error("Error with combined filters:", error.message);
}

// ===================================
// 7. PAGINATION PATTERNS
// ===================================

// Basic pagination with cursor
try {
  let after = null;
  let totalProcessed = 0;

  do {
    const response = await client.financialTransaction.list({
      limit: 50, // Max 50 per page
      ...(after && { after }),
    });

    for (const txn of response.result) {
      console.log(`${txn.timestamp}: ${txn.type} ${txn.amount.value}`);
      totalProcessed++;
    }

    after = response.pagination.next;
  } while (after);

  console.log(`Processed ${totalProcessed} total transactions`);
} catch (error) {
  if (error instanceof MonimeApiError) {
    console.error("Error during pagination:", error.message);
  } else {
    throw error;
  }
}

// ===================================
// 8. REAL-WORLD USE CASES
// ===================================

// Use Case 1: Ledger Reconciliation
// Match transactions against external records
async function reconcileTransactions(externalReferences) {
  const unmatched = [];

  for (const ref of externalReferences) {
    try {
      const { result: transactions } = await client.financialTransaction.list({
        reference: ref,
      });

      if (transactions.length === 0) {
        unmatched.push(ref);
      } else {
        console.log(`Matched reference ${ref}:`, transactions[0].id);
      }
    } catch (error) {
      console.error(`Error checking reference ${ref}:`, error.message);
      unmatched.push(ref);
    }
  }

  return unmatched;
}

// Usage
const externalRefs = ["txn-001", "txn-002", "txn-003"];
const unmatchedRefs = await reconcileTransactions(externalRefs);
if (unmatchedRefs.length > 0) {
  console.log("Unmatched references:", unmatchedRefs);
}

// Use Case 2: Account Activity Report
// Generate account statement for a date range
async function generateAccountStatement(accountId) {
  try {
    let cursor = null;
    const statement = {
      accountId,
      transactions: [],
      summary: { credits: 0, debits: 0, net: 0 },
    };

    do {
      const response = await client.financialTransaction.list({
        financialAccountId: accountId,
        limit: 50,
        ...(cursor && { after: cursor }),
      });

      statement.transactions.push(...response.result);

      // Calculate summary
      for (const txn of response.result) {
        if (txn.type === "credit") {
          statement.summary.credits += txn.amount.value;
        } else {
          statement.summary.debits += txn.amount.value;
        }
      }

      cursor = response.pagination.next;
    } while (cursor);

    statement.summary.net =
      statement.summary.credits - statement.summary.debits;

    return statement;
  } catch (error) {
    if (error instanceof MonimeApiError) {
      console.error(`Failed to generate statement: ${error.message}`);
      return null;
    }
    throw error;
  }
}

// Usage
const statement = await generateAccountStatement("fa-account-id");
if (statement) {
  console.log(`Total Credits: ${statement.summary.credits}`);
  console.log(`Total Debits: ${statement.summary.debits}`);
  console.log(`Net Position: ${statement.summary.net}`);
  console.log(`Transaction Count: ${statement.transactions.length}`);
}

// Use Case 3: Detect Reversals
// Find all reversed transactions
async function findReversals(accountId = null) {
  try {
    const params = accountId ? { financialAccountId: accountId } : {};
    const { result: transactions } =
      await client.financialTransaction.list(params);

    const reversals = transactions.filter((txn) => txn.originatingReversal);

    console.log(`Found ${reversals.length} reversed transactions`);

    for (const reversal of reversals) {
      console.log(
        `Reversal ${reversal.id} of ${reversal.originatingReversal.originTxnId}`,
      );
      console.log(`  Amount: ${reversal.amount.value}`);
      console.log(
        `  Original ref: ${reversal.originatingReversal.originTxnRef}`,
      );
    }

    return reversals;
  } catch (error) {
    console.error("Error finding reversals:", error.message);
    return [];
  }
}

// Usage
await findReversals("fa-account-id");

// Use Case 4: Fee Analysis
// Calculate total fees paid
async function calculateTotalFees(accountId) {
  try {
    let cursor = null;
    let totalFees = 0;
    const feeBreakdown = {};

    do {
      const response = await client.financialTransaction.list({
        financialAccountId: accountId,
        type: "debit", // Fees are debits
        limit: 50,
        ...(cursor && { after: cursor }),
      });

      for (const txn of response.result) {
        if (txn.originatingFee) {
          totalFees += txn.amount.value;
          const feeCode = txn.originatingFee.code;
          feeBreakdown[feeCode] = (feeBreakdown[feeCode] || 0) + 1;
        }
      }

      cursor = response.pagination.next;
    } while (cursor);

    return { totalFees, feeBreakdown };
  } catch (error) {
    console.error("Error calculating fees:", error.message);
    return { totalFees: 0, feeBreakdown: {} };
  }
}

// Usage
const { totalFees, feeBreakdown } = await calculateTotalFees("fa-account-id");
console.log(`Total fees paid: ${totalFees}`);
console.log("Fee breakdown by code:", feeBreakdown);

// Use Case 5: Balance Verification
// Verify current balance by replaying transaction history
async function verifyBalance(accountId) {
  try {
    // Get account with current balance
    const { result: account } = await client.financialAccount.get(accountId, {
      withBalance: true,
    });

    if (!account.balance) {
      throw new Error("Account balance not available");
    }

    const currentBalance = account.balance.available.value;

    // Replay all transactions
    let cursor = null;
    let calculatedBalance = 0;

    do {
      const response = await client.financialTransaction.list({
        financialAccountId: accountId,
        limit: 50,
        ...(cursor && { after: cursor }),
      });

      for (const txn of response.result) {
        if (txn.type === "credit") {
          calculatedBalance += txn.amount.value;
        } else {
          calculatedBalance -= txn.amount.value;
        }
      }

      cursor = response.pagination.next;
    } while (cursor);

    const matches = calculatedBalance === currentBalance;
    console.log(`Current Balance: ${currentBalance}`);
    console.log(`Calculated Balance: ${calculatedBalance}`);
    console.log(`Verification: ${matches ? "PASSED" : "FAILED"}`);

    return matches;
  } catch (error) {
    console.error("Error verifying balance:", error.message);
    return false;
  }
}

// Usage
await verifyBalance("fa-account-id");
