/**
 * Bank Examples
 *
 * Banks represent financial institution providers within the Monime payment platform.
 * Useful for rendering provider selection during payment setup or onboarding.
 *
 * All available methods:
 * - list(params) - List banks for a country with pagination
 * - get(providerId) - Get a specific bank by provider ID
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

import {
  MonimeApiError,
  MonimeNetworkError,
  MonimeValidationError,
} from "monimejs";

// ===================================
// 1. LIST BANKS BY COUNTRY
// ===================================

// List banks in Sierra Leone
try {
  const slBanks = await client.bank.list({
    country: "SL",
  });

  console.log(`Found ${slBanks.pagination.count} banks in Sierra Leone`);

  for (const bank of slBanks.result) {
    console.log(`${bank.name} (${bank.providerId})`);
    console.log(`  Active: ${bank.status.active}`);
    console.log(`  Can pay to: ${bank.featureSet.payout.canPayTo}`);
    console.log(`  Can pay from: ${bank.featureSet.payment.canPayFrom}`);
    console.log(
      `  Can verify KYC: ${bank.featureSet.kycVerification.canVerifyAccount}`,
    );
  }
} catch (error) {
  if (error instanceof MonimeValidationError) {
    console.error("Invalid country code:", error.message);
  } else if (error instanceof MonimeApiError) {
    console.error(`API Error ${error.code}: ${error.message}`);
  } else if (error instanceof MonimeNetworkError) {
    console.error("Network error:", error.message);
  } else {
    throw error;
  }
}

// List banks in Ghana
try {
  const ghBanks = await client.bank.list({
    country: "GH",
  });

  console.log(`Found ${ghBanks.pagination.count} banks in Ghana`);
} catch (error) {
  console.error("Error listing Ghana banks:", error.message);
}

// ===================================
// 2. PAGINATION
// ===================================

// List banks with pagination
try {
  const paginatedBanks = await client.bank.list({
    country: "SL",
    limit: 10,
  });

  console.log(`Page 1: ${paginatedBanks.result.length} banks`);

  // Fetch next page using cursor
  if (paginatedBanks.pagination.next) {
    const nextPage = await client.bank.list({
      country: "SL",
      limit: 10,
      after: paginatedBanks.pagination.next,
    });

    console.log(`Page 2: ${nextPage.result.length} banks`);
  }
} catch (error) {
  console.error("Pagination error:", error.message);
}

// Fetch all banks using pagination
async function getAllBanks(country) {
  try {
    let cursor = null;
    const allBanks = [];

    do {
      const response = await client.bank.list({
        country,
        limit: 50,
        ...(cursor && { after: cursor }),
      });

      allBanks.push(...response.result);
      cursor = response.pagination.next;
    } while (cursor);

    return allBanks;
  } catch (error) {
    console.error(`Error fetching all banks for ${country}:`, error.message);
    return [];
  }
}

// Usage
const allSLBanks = await getAllBanks("SL");
console.log(`Total banks in Sierra Leone: ${allSLBanks.length}`);

// ===================================
// 3. GET A SPECIFIC BANK
// ===================================

try {
  const { result: bank } = await client.bank.get("slb004");

  console.log(`Bank: ${bank.name}`);
  console.log(`Provider ID: ${bank.providerId}`);
  console.log(`Country: ${bank.country}`);
  console.log(`Active: ${bank.status.active}`);
  console.log(`Created: ${bank.createTime}`);
  console.log(`Updated: ${bank.updateTime}`);

  // Check payout capabilities
  if (bank.featureSet.payout.canPayTo) {
    console.log(
      "Supported payout schemes:",
      bank.featureSet.payout.schemes.join(", "),
    );
  }

  // Check payment capabilities
  if (bank.featureSet.payment.canPayFrom) {
    console.log(
      "Supported payment schemes:",
      bank.featureSet.payment.schemes.join(", "),
    );
  }

  // Check KYC verification capabilities
  if (bank.featureSet.kycVerification.canVerifyAccount) {
    console.log("KYC verification: Supported");
  }
} catch (error) {
  if (error instanceof MonimeValidationError) {
    console.error("Invalid provider ID format:", error.message);
  } else if (error instanceof MonimeApiError && error.code === 404) {
    console.error("Bank not found");
  } else {
    throw error;
  }
}

// ===================================
// 4. REAL-WORLD USE CASES
// ===================================

// Use Case 1: Build Bank Dropdown for Payout Form
// Filter banks that support payouts and are active
async function getBanksForPayoutDropdown(country) {
  try {
    const response = await client.bank.list({ country });

    const payoutBanks = response.result.filter(
      (bank) => bank.status.active && bank.featureSet.payout.canPayTo,
    );

    // Format for dropdown
    const dropdownOptions = payoutBanks.map((bank) => ({
      value: bank.providerId,
      label: bank.name,
    }));

    console.log(`Available payout banks in ${country}:`);
    dropdownOptions.forEach((option) => {
      console.log(`  - ${option.label} (${option.value})`);
    });

    return dropdownOptions;
  } catch (error) {
    console.error("Error building payout dropdown:", error.message);
    return [];
  }
}

// Usage
const payoutBanks = await getBanksForPayoutDropdown("SL");

// Use Case 2: Build Bank Dropdown for Payment Form
// Filter banks that support payments and are active
async function getBanksForPaymentDropdown(country) {
  try {
    const response = await client.bank.list({ country });

    const paymentBanks = response.result.filter(
      (bank) => bank.status.active && bank.featureSet.payment.canPayFrom,
    );

    // Format for dropdown with additional metadata
    const dropdownOptions = paymentBanks.map((bank) => ({
      value: bank.providerId,
      label: bank.name,
      schemes: bank.featureSet.payment.schemes,
    }));

    console.log(`Available payment banks in ${country}:`);
    dropdownOptions.forEach((option) => {
      console.log(
        `  - ${option.label}: ${option.schemes.join(", ")} (${option.value})`,
      );
    });

    return dropdownOptions;
  } catch (error) {
    console.error("Error building payment dropdown:", error.message);
    return [];
  }
}

// Usage
const paymentBanks = await getBanksForPaymentDropdown("SL");

// Use Case 3: Validate Provider ID
// Check if a provider ID is valid and supports required features
async function validateBankProvider(providerId, requiredFeature = null) {
  try {
    const { result: bank } = await client.bank.get(providerId);

    // Check if bank is active
    if (!bank.status.active) {
      return {
        valid: false,
        reason: `${bank.name} is currently inactive`,
      };
    }

    // Check if required feature is supported
    if (requiredFeature === "payout" && !bank.featureSet.payout.canPayTo) {
      return {
        valid: false,
        reason: `${bank.name} does not support payouts`,
      };
    }

    if (requiredFeature === "payment" && !bank.featureSet.payment.canPayFrom) {
      return {
        valid: false,
        reason: `${bank.name} does not support payments`,
      };
    }

    if (
      requiredFeature === "kyc" &&
      !bank.featureSet.kycVerification.canVerifyAccount
    ) {
      return {
        valid: false,
        reason: `${bank.name} does not support KYC verification`,
      };
    }

    return {
      valid: true,
      bank,
    };
  } catch (error) {
    if (error instanceof MonimeApiError && error.code === 404) {
      return {
        valid: false,
        reason: "Bank provider not found",
      };
    }

    console.error("Error validating provider:", error.message);
    return {
      valid: false,
      reason: "Validation error",
    };
  }
}

// Usage
const validation = await validateBankProvider("slb004", "payout");
if (validation.valid) {
  console.log(`Provider ${validation.bank.name} is valid for payouts`);
} else {
  console.log(`Validation failed: ${validation.reason}`);
}

// Use Case 4: Get Provider Details for Display
// Fetch and display comprehensive bank information
async function getProviderDetails(providerId) {
  try {
    const { result: bank } = await client.bank.get(providerId);

    const details = {
      name: bank.name,
      providerId: bank.providerId,
      country: bank.country,
      active: bank.status.active,
      capabilities: {
        payout: {
          supported: bank.featureSet.payout.canPayTo,
          schemes: bank.featureSet.payout.schemes,
        },
        payment: {
          supported: bank.featureSet.payment.canPayFrom,
          schemes: bank.featureSet.payment.schemes,
        },
        kycVerification:
          bank.featureSet.kycVerification.canVerifyAccount,
      },
      metadata: {
        created: bank.createTime,
        updated: bank.updateTime,
      },
    };

    console.log("\n=== Bank Provider Details ===");
    console.log(`Name: ${details.name}`);
    console.log(`ID: ${details.providerId}`);
    console.log(`Country: ${details.country}`);
    console.log(`Status: ${details.active ? "Active" : "Inactive"}`);
    console.log("\nCapabilities:");
    console.log(
      `  Payouts: ${details.capabilities.payout.supported ? "Yes" : "No"}`,
    );
    if (details.capabilities.payout.supported) {
      console.log(
        `    Schemes: ${details.capabilities.payout.schemes.join(", ")}`,
      );
    }
    console.log(
      `  Payments: ${details.capabilities.payment.supported ? "Yes" : "No"}`,
    );
    if (details.capabilities.payment.supported) {
      console.log(
        `    Schemes: ${details.capabilities.payment.schemes.join(", ")}`,
      );
    }
    console.log(
      `  KYC Verification: ${details.capabilities.kycVerification ? "Yes" : "No"}`,
    );

    return details;
  } catch (error) {
    console.error("Error fetching provider details:", error.message);
    return null;
  }
}

// Usage
await getProviderDetails("slb004");

// Use Case 5: Filter Banks by Capability
// Get banks that support specific schemes
async function getBanksByScheme(country, scheme) {
  try {
    const response = await client.bank.list({ country });

    const matchingBanks = response.result.filter((bank) => {
      const payoutSchemes = bank.featureSet.payout.schemes;
      const paymentSchemes = bank.featureSet.payment.schemes;
      return (
        payoutSchemes.includes(scheme) || paymentSchemes.includes(scheme)
      );
    });

    console.log(`Banks supporting ${scheme} in ${country}:`);
    matchingBanks.forEach((bank) => {
      console.log(`  - ${bank.name} (${bank.providerId})`);
    });

    return matchingBanks;
  } catch (error) {
    console.error("Error filtering banks by scheme:", error.message);
    return [];
  }
}

// Usage
await getBanksByScheme("SL", "instant");

// Use Case 6: Compare Multiple Banks
// Fetch and compare capabilities of multiple banks
async function compareBanks(providerIds) {
  const comparisons = [];

  for (const providerId of providerIds) {
    try {
      const { result: bank } = await client.bank.get(providerId);

      comparisons.push({
        name: bank.name,
        providerId: bank.providerId,
        active: bank.status.active,
        payout: bank.featureSet.payout.canPayTo,
        payment: bank.featureSet.payment.canPayFrom,
        kyc: bank.featureSet.kycVerification.canVerifyAccount,
        payoutSchemes: bank.featureSet.payout.schemes,
        paymentSchemes: bank.featureSet.payment.schemes,
      });
    } catch (error) {
      console.error(`Error fetching ${providerId}:`, error.message);
    }
  }

  console.log("\n=== Bank Comparison ===");
  console.log(
    "Bank Name".padEnd(20),
    "Payout".padEnd(8),
    "Payment".padEnd(8),
    "KYC".padEnd(8),
  );
  console.log("-".repeat(50));

  comparisons.forEach((bank) => {
    console.log(
      bank.name.padEnd(20),
      (bank.payout ? "Yes" : "No").padEnd(8),
      (bank.payment ? "Yes" : "No").padEnd(8),
      (bank.kyc ? "Yes" : "No").padEnd(8),
    );
  });

  return comparisons;
}

// Usage
await compareBanks(["slb004", "slb005", "slb006"]);

// Use Case 7: Get KYC-Enabled Banks
// Filter banks that support KYC verification
async function getKycEnabledBanks(country) {
  try {
    const response = await client.bank.list({ country });

    const kycBanks = response.result.filter(
      (bank) =>
        bank.status.active && bank.featureSet.kycVerification.canVerifyAccount,
    );

    console.log(`Banks supporting KYC verification in ${country}:`);
    console.log(`Found ${kycBanks.length} banks`);

    const dropdownOptions = kycBanks.map((bank) => ({
      value: bank.providerId,
      label: bank.name,
    }));

    dropdownOptions.forEach((option) => {
      console.log(`  - ${option.label} (${option.value})`);
    });

    return dropdownOptions;
  } catch (error) {
    console.error("Error fetching KYC banks:", error.message);
    return [];
  }
}

// Usage
const kycBanks = await getKycEnabledBanks("SL");

// Use Case 8: Cache Bank List for Performance
// Cache bank list to reduce API calls
class BankCache {
  constructor(client) {
    this.client = client;
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  async getBanks(country) {
    const cacheKey = `banks:${country}`;
    const cached = this.cache.get(cacheKey);

    // Check if cache is valid
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`Returning cached banks for ${country}`);
      return cached.data;
    }

    // Fetch fresh data
    try {
      console.log(`Fetching fresh bank list for ${country}`);
      const response = await this.client.bank.list({ country });

      // Store in cache
      this.cache.set(cacheKey, {
        data: response.result,
        timestamp: Date.now(),
      });

      return response.result;
    } catch (error) {
      console.error("Error fetching banks:", error.message);

      // Return stale cache if available
      if (cached) {
        console.log("Returning stale cache due to error");
        return cached.data;
      }

      return [];
    }
  }

  clearCache(country = null) {
    if (country) {
      this.cache.delete(`banks:${country}`);
    } else {
      this.cache.clear();
    }
  }
}

// Usage
const bankCache = new BankCache(client);
const cachedBanks = await bankCache.getBanks("SL");
console.log(`Retrieved ${cachedBanks.length} banks`);
