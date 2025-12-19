/**
 * Financial Account Examples
 *
 * Financial accounts are logical wallets that hold and track money for users or entities.
 * They support multi-currency operations and serve as the foundation for all monetary
 * movement. This module demonstrates account creation, balance queries, filtering,
 * idempotency, metadata management, and comprehensive account lifecycle management.
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

// ============================================================================
// BASIC FINANCIAL ACCOUNT CREATION
// ============================================================================

async function createBasicAccount(name, currency = "SLE") {
  try {
    const { result: account } = await client.financialAccount.create({
      name: name,
      currency: currency,
    });

    console.log("Account created:", account.id);
    console.log("UVAN:", account.uvan);
    console.log("Name:", account.name);
    console.log("Currency:", account.currency);

    return account;
  } catch (error) {
    console.error("Failed to create account:", error.message);
    throw error;
  }
}

// ============================================================================
// CREATE ACCOUNT WITH FULL DETAILS
// ============================================================================

async function createDetailedAccount(config) {
  try {
    const { result: account } = await client.financialAccount.create({
      name: config.name,
      currency: config.currency,
      reference: config.reference, // External reference for reconciliation
      description: config.description,
      metadata: config.metadata,
    });

    console.log("Detailed account created:", account.id);
    console.log("Reference:", account.reference);
    console.log("Description:", account.description);

    return account;
  } catch (error) {
    console.error("Failed to create detailed account:", error.message);
    throw error;
  }
}

// Example configuration
const operationsAccountConfig = {
  name: "Operations Reserve",
  currency: "SLE",
  reference: "ops-reserve-001",
  description: "Float account for operational disbursements",
  metadata: {
    department: "finance",
    costCenter: "CC-100",
    accountType: "reserve",
  },
};

// ============================================================================
// CREATE ACCOUNT WITH IDEMPOTENCY
// ============================================================================

async function createAccountWithIdempotency(name, idempotencyKey) {
  try {
    const { result: account } = await client.financialAccount.create(
      {
        name: name,
        currency: "SLE",
        reference: `ref-${idempotencyKey}`,
        metadata: {
          createdVia: "api",
          idempotencyKey: idempotencyKey,
        },
      },
      idempotencyKey,
    );

    console.log(
      `Account created with idempotency key ${idempotencyKey}:`,
      account.id,
    );
    return account;
  } catch (error) {
    console.error("Failed to create account with idempotency:", error.message);
    throw error;
  }
}

// ============================================================================
// USER WALLET CREATION
// ============================================================================

async function createUserWallet(userId, userName) {
  try {
    const { result: wallet } = await client.financialAccount.create(
      {
        name: `${userName} Wallet`,
        currency: "SLE",
        reference: `user-wallet-${userId}`,
        description: `Personal wallet for user ${userName}`,
        metadata: {
          accountType: "user_wallet",
          userId: userId,
          userName: userName,
          tier: "standard",
        },
      },
      `user-wallet-${userId}`, // Idempotency key ensures no duplicates
    );

    console.log(`Wallet created for user ${userId}:`, wallet.id);
    console.log("UVAN:", wallet.uvan);

    return wallet;
  } catch (error) {
    console.error(`Failed to create wallet for user ${userId}:`, error.message);
    throw error;
  }
}

// ============================================================================
// MULTI-CURRENCY ACCOUNT CREATION
// ============================================================================

async function createMultiCurrencyAccounts(accountName) {
  const currencies = ["SLE", "USD", "GBP", "EUR"];
  const accounts = [];

  for (const currency of currencies) {
    try {
      const { result: account } = await client.financialAccount.create({
        name: `${accountName} - ${currency}`,
        currency: currency,
        description: `${currency} account for ${accountName}`,
        metadata: {
          accountGroup: accountName,
          currency: currency,
        },
      });

      console.log(`${currency} account created:`, account.id);
      accounts.push(account);
    } catch (error) {
      console.error(`Failed to create ${currency} account:`, error.message);
    }
  }

  return accounts;
}

// ============================================================================
// GET ACCOUNT BY ID
// ============================================================================

async function getAccountDetails(accountId) {
  try {
    const { result: account } = await client.financialAccount.get(accountId);

    console.log("Account ID:", account.id);
    console.log("Name:", account.name);
    console.log("Currency:", account.currency);
    console.log("UVAN:", account.uvan);
    console.log("Created:", account.createTime);
    console.log("Updated:", account.updateTime);

    if (account.reference) {
      console.log("Reference:", account.reference);
    }

    if (account.description) {
      console.log("Description:", account.description);
    }

    return account;
  } catch (error) {
    console.error("Failed to retrieve account:", error.message);
    throw error;
  }
}

// ============================================================================
// GET ACCOUNT WITH BALANCE
// ============================================================================

async function getAccountWithBalance(accountId) {
  try {
    const { result: account } = await client.financialAccount.get(accountId, {
      withBalance: true,
    });

    console.log("Account:", account.name);

    if (account.balance) {
      const availableAmount = account.balance.available.value / 100; // Convert to major units
      console.log(
        `Available balance: ${availableAmount.toFixed(2)} ${account.balance.available.currency}`,
      );
    } else {
      console.log("Balance not available");
    }

    return account;
  } catch (error) {
    console.error("Failed to retrieve account with balance:", error.message);
    throw error;
  }
}

// ============================================================================
// LIST ALL ACCOUNTS
// ============================================================================

async function listAllAccounts() {
  try {
    const { result: accounts, pagination } =
      await client.financialAccount.list();

    console.log(`Total accounts: ${pagination.count}`);

    for (const account of accounts) {
      console.log(`${account.id} - ${account.name} (${account.currency})`);
    }

    return accounts;
  } catch (error) {
    console.error("Failed to list accounts:", error.message);
    throw error;
  }
}

// ============================================================================
// LIST ACCOUNTS WITH BALANCES
// ============================================================================

async function listAccountsWithBalances() {
  try {
    const { result: accounts } = await client.financialAccount.list({
      withBalance: true,
    });

    console.log(`Accounts with balances:`);

    for (const account of accounts) {
      if (account.balance) {
        const amount = account.balance.available.value / 100;
        console.log(
          `${account.name}: ${amount.toFixed(2)} ${account.balance.available.currency}`,
        );
      }
    }

    return accounts;
  } catch (error) {
    console.error("Failed to list accounts with balances:", error.message);
    throw error;
  }
}

// ============================================================================
// FILTER ACCOUNTS BY UVAN
// ============================================================================

async function findAccountByUVAN(uvan) {
  try {
    const { result: accounts } = await client.financialAccount.list({
      uvan: uvan,
    });

    if (accounts.length > 0) {
      console.log(`Found account with UVAN ${uvan}:`, accounts[0].name);
      return accounts[0];
    } else {
      console.log(`No account found with UVAN ${uvan}`);
      return null;
    }
  } catch (error) {
    console.error("Failed to find account by UVAN:", error.message);
    throw error;
  }
}

// ============================================================================
// FILTER ACCOUNTS BY REFERENCE
// ============================================================================

async function findAccountByReference(reference) {
  try {
    const { result: accounts } = await client.financialAccount.list({
      reference: reference,
    });

    if (accounts.length > 0) {
      console.log(
        `Found account with reference ${reference}:`,
        accounts[0].name,
      );
      return accounts[0];
    } else {
      console.log(`No account found with reference ${reference}`);
      return null;
    }
  } catch (error) {
    console.error("Failed to find account by reference:", error.message);
    throw error;
  }
}

// ============================================================================
// PAGINATE THROUGH ALL ACCOUNTS
// ============================================================================

async function getAllAccounts() {
  const allAccounts = [];
  let after = null;

  try {
    do {
      const response = await client.financialAccount.list({
        limit: 10,
        ...(after && { after }),
      });

      allAccounts.push(...response.result);

      console.log(
        `Fetched ${response.result.length} accounts (Total: ${allAccounts.length})`,
      );

      after = response.pagination.next;
    } while (after);

    console.log(`Retrieved all ${allAccounts.length} accounts`);
    return allAccounts;
  } catch (error) {
    console.error("Pagination failed:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE ACCOUNT NAME AND DESCRIPTION
// ============================================================================

async function updateAccountDetails(accountId, updates) {
  try {
    const { result: account } = await client.financialAccount.update(
      accountId,
      {
        name: updates.name,
        description: updates.description,
      },
    );

    console.log(`Account ${accountId} updated successfully`);
    console.log("New name:", account.name);
    console.log("New description:", account.description);

    return account;
  } catch (error) {
    console.error("Failed to update account:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE ACCOUNT METADATA
// ============================================================================

async function updateAccountMetadata(accountId, metadata) {
  try {
    const { result: account } = await client.financialAccount.update(
      accountId,
      {
        metadata: metadata,
      },
    );

    console.log(`Metadata updated for account ${accountId}`);
    return account;
  } catch (error) {
    console.error("Failed to update metadata:", error.message);
    throw error;
  }
}

// ============================================================================
// CLEAR OPTIONAL FIELDS
// ============================================================================

async function clearAccountFields(accountId) {
  try {
    const { result: account } = await client.financialAccount.update(
      accountId,
      {
        description: null, // Clears the description
        reference: null, // Clears the reference
      },
    );

    console.log(`Optional fields cleared for account ${accountId}`);
    return account;
  } catch (error) {
    console.error("Failed to clear fields:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE SINGLE FIELD
// ============================================================================

async function updateAccountName(accountId, newName) {
  try {
    const { result: account } = await client.financialAccount.update(
      accountId,
      {
        name: newName,
        // Other fields remain unchanged
      },
    );

    console.log(`Account name updated to: ${account.name}`);
    return account;
  } catch (error) {
    console.error("Failed to update account name:", error.message);
    throw error;
  }
}

// ============================================================================
// ACCOUNT BALANCE SUMMARY
// ============================================================================

async function generateBalanceSummary() {
  try {
    const { result: accounts } = await client.financialAccount.list({
      withBalance: true,
    });

    const summary = {
      totalAccounts: accounts.length,
      byCurrency: {},
    };

    for (const account of accounts) {
      if (account.balance) {
        const currency = account.balance.available.currency;
        const amount = account.balance.available.value;

        if (!summary.byCurrency[currency]) {
          summary.byCurrency[currency] = {
            count: 0,
            totalBalance: 0,
            accounts: [],
          };
        }

        summary.byCurrency[currency].count++;
        summary.byCurrency[currency].totalBalance += amount;
        summary.byCurrency[currency].accounts.push({
          id: account.id,
          name: account.name,
          balance: amount,
        });
      }
    }

    console.log("Balance Summary:");
    console.log(`Total accounts: ${summary.totalAccounts}`);

    for (const [currency, data] of Object.entries(summary.byCurrency)) {
      const totalInMajorUnits = data.totalBalance / 100;
      console.log(
        `${currency}: ${data.count} accounts, Total: ${totalInMajorUnits.toFixed(2)}`,
      );
    }

    return summary;
  } catch (error) {
    console.error("Failed to generate balance summary:", error.message);
    throw error;
  }
}

// ============================================================================
// ACCOUNT SETUP FOR NEW BUSINESS
// ============================================================================

async function setupBusinessAccounts(businessName) {
  console.log(`Setting up accounts for ${businessName}...`);

  const accounts = {};

  try {
    // Main operational account
    const { result: mainAccount } = await client.financialAccount.create({
      name: `${businessName} - Main Account`,
      currency: "SLE",
      reference: "main-account",
      description: "Primary operational account",
      metadata: {
        business: businessName,
        accountType: "main",
      },
    });
    accounts.main = mainAccount;
    console.log("Main account created:", mainAccount.id);

    // Disbursement account
    const { result: disbursementAccount } =
      await client.financialAccount.create({
        name: `${businessName} - Disbursement`,
        currency: "SLE",
        reference: "disbursement-account",
        description: "Account for payouts and disbursements",
        metadata: {
          business: businessName,
          accountType: "disbursement",
        },
      });
    accounts.disbursement = disbursementAccount;
    console.log("Disbursement account created:", disbursementAccount.id);

    // Escrow account
    const { result: escrowAccount } = await client.financialAccount.create({
      name: `${businessName} - Escrow`,
      currency: "SLE",
      reference: "escrow-account",
      description: "Escrow holding account",
      metadata: {
        business: businessName,
        accountType: "escrow",
      },
    });
    accounts.escrow = escrowAccount;
    console.log("Escrow account created:", escrowAccount.id);

    // Reserve account
    const { result: reserveAccount } = await client.financialAccount.create({
      name: `${businessName} - Reserve`,
      currency: "SLE",
      reference: "reserve-account",
      description: "Financial reserve account",
      metadata: {
        business: businessName,
        accountType: "reserve",
      },
    });
    accounts.reserve = reserveAccount;
    console.log("Reserve account created:", reserveAccount.id);

    console.log(`All accounts created for ${businessName}`);
    return accounts;
  } catch (error) {
    console.error("Failed to setup business accounts:", error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

// Example 1: Basic account creation
// const account = await createBasicAccount("Main Wallet", "SLE");

// Example 2: Detailed account creation
// const detailedAccount = await createDetailedAccount(operationsAccountConfig);

// Example 3: Account with idempotency
// const idempotentAccount = await createAccountWithIdempotency("Test Wallet", "unique-key-123");

// Example 4: User wallet creation
// const userWallet = await createUserWallet("user-123", "John Doe");

// Example 5: Multi-currency accounts
// const multiCurrencyAccounts = await createMultiCurrencyAccounts("Settlement Account");

// Example 6: Get account details
// const account = await getAccountDetails("fa-account-id");

// Example 7: Get account with balance
// const accountWithBalance = await getAccountWithBalance("fa-account-id");

// Example 8: List all accounts
// const accounts = await listAllAccounts();

// Example 9: List accounts with balances
// const accountsWithBalances = await listAccountsWithBalances();

// Example 10: Find by UVAN
// const account = await findAccountByUVAN("1234567890123456");

// Example 11: Find by reference
// const account = await findAccountByReference("user-wallet-123");

// Example 12: Paginate through accounts
// const allAccounts = await getAllAccounts();

// Example 13: Update account details
// await updateAccountDetails("fa-account-id", {
//   name: "Updated Account Name",
//   description: "Updated description",
// });

// Example 14: Update metadata
// await updateAccountMetadata("fa-account-id", {
//   tier: "premium",
//   lastReviewed: "2025-01-15",
// });

// Example 15: Clear optional fields
// await clearAccountFields("fa-account-id");

// Example 16: Update single field
// await updateAccountName("fa-account-id", "New Account Name");

// Example 17: Generate balance summary
// const summary = await generateBalanceSummary();

// Example 18: Setup business accounts
// const businessAccounts = await setupBusinessAccounts("Acme Corporation");
