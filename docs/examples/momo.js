/**
 * Mobile Money (Momo) Examples
 *
 * Momos represent mobile money providers within the Monime payment platform.
 * Useful for rendering provider selection during payment setup or onboarding.
 *
 * All available methods:
 * - list(params) - List mobile money providers for a country with pagination
 * - get(providerId) - Get a specific mobile money provider by provider ID
 *
 * Common providers in Sierra Leone:
 * - m13: QCell
 * - m17: Africell
 * - m18: Orange
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

import {
  MonimeApiError,
  MonimeNetworkError,
  MonimeValidationError,
} from "monimejs";

// ===================================
// 1. LIST MOBILE MONEY PROVIDERS BY COUNTRY
// ===================================

// List mobile money providers in Sierra Leone
try {
  const slMomos = await client.momo.list({
    country: "SL",
  });

  console.log(
    `Found ${slMomos.pagination.count} mobile money providers in Sierra Leone`,
  );

  for (const momo of slMomos.result) {
    console.log(`${momo.name} (${momo.providerId})`);
    console.log(`  Active: ${momo.status.active}`);
    console.log(`  Can pay to: ${momo.featureSet.payout.canPayTo}`);
    console.log(`  Can pay from: ${momo.featureSet.payment.canPayFrom}`);
    console.log(
      `  Can verify KYC: ${momo.featureSet.kycVerification.canVerifyAccount}`,
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

// List mobile money providers in Ghana
try {
  const ghMomos = await client.momo.list({
    country: "GH",
  });

  console.log(`Found ${ghMomos.pagination.count} providers in Ghana`);
} catch (error) {
  console.error("Error listing Ghana providers:", error.message);
}

// ===================================
// 2. PAGINATION
// ===================================

// List mobile money providers with pagination
try {
  const paginatedMomos = await client.momo.list({
    country: "SL",
    limit: 10,
  });

  console.log(`Page 1: ${paginatedMomos.result.length} providers`);

  // Fetch next page using cursor
  if (paginatedMomos.pagination.next) {
    const nextPage = await client.momo.list({
      country: "SL",
      limit: 10,
      after: paginatedMomos.pagination.next,
    });

    console.log(`Page 2: ${nextPage.result.length} providers`);
  }
} catch (error) {
  console.error("Pagination error:", error.message);
}

// Fetch all mobile money providers using pagination
async function getAllMomos(country) {
  try {
    let cursor = null;
    const allMomos = [];

    do {
      const response = await client.momo.list({
        country,
        limit: 50,
        ...(cursor && { after: cursor }),
      });

      allMomos.push(...response.result);
      cursor = response.pagination.next;
    } while (cursor);

    return allMomos;
  } catch (error) {
    console.error(`Error fetching all momos for ${country}:`, error.message);
    return [];
  }
}

// Usage
const allSLMomos = await getAllMomos("SL");
console.log(`Total mobile money providers in Sierra Leone: ${allSLMomos.length}`);

// ===================================
// 3. GET A SPECIFIC MOBILE MONEY PROVIDER
// ===================================

try {
  const { result: momo } = await client.momo.get("m17");

  console.log(`Provider: ${momo.name}`);
  console.log(`Provider ID: ${momo.providerId}`);
  console.log(`Country: ${momo.country}`);
  console.log(`Active: ${momo.status.active}`);
  console.log(`Created: ${momo.createTime}`);
  console.log(`Updated: ${momo.updateTime}`);

  // Check payout capabilities
  if (momo.featureSet.payout.canPayTo) {
    console.log(
      "Supported payout schemes:",
      momo.featureSet.payout.schemes.join(", "),
    );
  }

  // Check payment capabilities
  if (momo.featureSet.payment.canPayFrom) {
    console.log(
      "Supported payment schemes:",
      momo.featureSet.payment.schemes.join(", "),
    );
  }

  // Check KYC verification capabilities
  if (momo.featureSet.kycVerification.canVerifyAccount) {
    console.log("KYC verification: Supported");
  }
} catch (error) {
  if (error instanceof MonimeValidationError) {
    console.error("Invalid provider ID format:", error.message);
  } else if (error instanceof MonimeApiError && error.code === 404) {
    console.error("Mobile money provider not found");
  } else {
    throw error;
  }
}

// ===================================
// 4. REAL-WORLD USE CASES
// ===================================

// Use Case 1: Build Mobile Money Dropdown for Payout Form
// Filter providers that support payouts and are active
async function getMomosForPayoutDropdown(country) {
  try {
    const response = await client.momo.list({ country });

    const payoutMomos = response.result.filter(
      (momo) => momo.status.active && momo.featureSet.payout.canPayTo,
    );

    // Format for dropdown
    const dropdownOptions = payoutMomos.map((momo) => ({
      value: momo.providerId,
      label: momo.name,
    }));

    console.log(`Available payout mobile money providers in ${country}:`);
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
const payoutMomos = await getMomosForPayoutDropdown("SL");

// Use Case 2: Build Mobile Money Dropdown for Payment Form
// Filter providers that support payments and are active
async function getMomosForPaymentDropdown(country) {
  try {
    const response = await client.momo.list({ country });

    const paymentMomos = response.result.filter(
      (momo) => momo.status.active && momo.featureSet.payment.canPayFrom,
    );

    // Format for dropdown with additional metadata
    const dropdownOptions = paymentMomos.map((momo) => ({
      value: momo.providerId,
      label: momo.name,
      schemes: momo.featureSet.payment.schemes,
    }));

    console.log(`Available payment mobile money providers in ${country}:`);
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
const paymentMomos = await getMomosForPaymentDropdown("SL");

// Use Case 3: Validate Provider ID
// Check if a provider ID is valid and supports required features
async function validateMomoProvider(providerId, requiredFeature = null) {
  try {
    const { result: momo } = await client.momo.get(providerId);

    // Check if provider is active
    if (!momo.status.active) {
      return {
        valid: false,
        reason: `${momo.name} is currently inactive`,
      };
    }

    // Check if required feature is supported
    if (requiredFeature === "payout" && !momo.featureSet.payout.canPayTo) {
      return {
        valid: false,
        reason: `${momo.name} does not support payouts`,
      };
    }

    if (requiredFeature === "payment" && !momo.featureSet.payment.canPayFrom) {
      return {
        valid: false,
        reason: `${momo.name} does not support payments`,
      };
    }

    if (
      requiredFeature === "kyc" &&
      !momo.featureSet.kycVerification.canVerifyAccount
    ) {
      return {
        valid: false,
        reason: `${momo.name} does not support KYC verification`,
      };
    }

    return {
      valid: true,
      provider: momo,
    };
  } catch (error) {
    if (error instanceof MonimeApiError && error.code === 404) {
      return {
        valid: false,
        reason: "Mobile money provider not found",
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
const validation = await validateMomoProvider("m17", "payout");
if (validation.valid) {
  console.log(`Provider ${validation.provider.name} is valid for payouts`);
} else {
  console.log(`Validation failed: ${validation.reason}`);
}

// Use Case 4: Get Provider Details for Display
// Fetch and display comprehensive mobile money provider information
async function getProviderDetails(providerId) {
  try {
    const { result: momo } = await client.momo.get(providerId);

    const details = {
      name: momo.name,
      providerId: momo.providerId,
      country: momo.country,
      active: momo.status.active,
      capabilities: {
        payout: {
          supported: momo.featureSet.payout.canPayTo,
          schemes: momo.featureSet.payout.schemes,
        },
        payment: {
          supported: momo.featureSet.payment.canPayFrom,
          schemes: momo.featureSet.payment.schemes,
        },
        kycVerification:
          momo.featureSet.kycVerification.canVerifyAccount,
      },
      metadata: {
        created: momo.createTime,
        updated: momo.updateTime,
      },
    };

    console.log("\n=== Mobile Money Provider Details ===");
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
await getProviderDetails("m17");

// Use Case 5: Filter Providers by Capability
// Get providers that support specific schemes
async function getMomosByScheme(country, scheme) {
  try {
    const response = await client.momo.list({ country });

    const matchingMomos = response.result.filter((momo) => {
      const payoutSchemes = momo.featureSet.payout.schemes;
      const paymentSchemes = momo.featureSet.payment.schemes;
      return (
        payoutSchemes.includes(scheme) || paymentSchemes.includes(scheme)
      );
    });

    console.log(`Mobile money providers supporting ${scheme} in ${country}:`);
    matchingMomos.forEach((momo) => {
      console.log(`  - ${momo.name} (${momo.providerId})`);
    });

    return matchingMomos;
  } catch (error) {
    console.error("Error filtering providers by scheme:", error.message);
    return [];
  }
}

// Usage
await getMomosByScheme("SL", "instant");

// Use Case 6: Compare Multiple Providers
// Fetch and compare capabilities of multiple mobile money providers
async function compareMomos(providerIds) {
  const comparisons = [];

  for (const providerId of providerIds) {
    try {
      const { result: momo } = await client.momo.get(providerId);

      comparisons.push({
        name: momo.name,
        providerId: momo.providerId,
        active: momo.status.active,
        payout: momo.featureSet.payout.canPayTo,
        payment: momo.featureSet.payment.canPayFrom,
        kyc: momo.featureSet.kycVerification.canVerifyAccount,
        payoutSchemes: momo.featureSet.payout.schemes,
        paymentSchemes: momo.featureSet.payment.schemes,
      });
    } catch (error) {
      console.error(`Error fetching ${providerId}:`, error.message);
    }
  }

  console.log("\n=== Mobile Money Provider Comparison ===");
  console.log(
    "Provider Name".padEnd(20),
    "Payout".padEnd(8),
    "Payment".padEnd(8),
    "KYC".padEnd(8),
  );
  console.log("-".repeat(50));

  comparisons.forEach((momo) => {
    console.log(
      momo.name.padEnd(20),
      (momo.payout ? "Yes" : "No").padEnd(8),
      (momo.payment ? "Yes" : "No").padEnd(8),
      (momo.kyc ? "Yes" : "No").padEnd(8),
    );
  });

  return comparisons;
}

// Usage
await compareMomos(["m13", "m17", "m18"]);

// Use Case 7: Get KYC-Enabled Providers
// Filter providers that support KYC verification
async function getKycEnabledMomos(country) {
  try {
    const response = await client.momo.list({ country });

    const kycMomos = response.result.filter(
      (momo) =>
        momo.status.active && momo.featureSet.kycVerification.canVerifyAccount,
    );

    console.log(`Mobile money providers supporting KYC verification in ${country}:`);
    console.log(`Found ${kycMomos.length} providers`);

    const dropdownOptions = kycMomos.map((momo) => ({
      value: momo.providerId,
      label: momo.name,
    }));

    dropdownOptions.forEach((option) => {
      console.log(`  - ${option.label} (${option.value})`);
    });

    return dropdownOptions;
  } catch (error) {
    console.error("Error fetching KYC providers:", error.message);
    return [];
  }
}

// Usage
const kycMomos = await getKycEnabledMomos("SL");

// Use Case 8: Phone Number Validation Helper
// Validate phone number format for a specific provider (client-side helper)
function validatePhoneNumber(phoneNumber, providerId) {
  // Remove spaces and hyphens
  const cleaned = phoneNumber.replace(/[\s-]/g, "");

  // Check for international format
  if (!/^\+\d{1,3}\d{7,14}$/.test(cleaned)) {
    return {
      valid: false,
      reason: "Invalid phone number format. Use international format (e.g., +23276123456)",
    };
  }

  // Provider-specific validation for Sierra Leone
  const slProviders = {
    m13: { name: "QCell", prefixes: ["+23276", "+23278"] },
    m17: { name: "Africell", prefixes: ["+23277", "+23279"] },
    m18: { name: "Orange", prefixes: ["+23275", "+23288"] },
  };

  const provider = slProviders[providerId];
  if (provider) {
    const hasValidPrefix = provider.prefixes.some((prefix) =>
      cleaned.startsWith(prefix),
    );

    if (!hasValidPrefix) {
      return {
        valid: false,
        reason: `Phone number doesn't match ${provider.name} prefixes: ${provider.prefixes.join(", ")}`,
        expectedPrefixes: provider.prefixes,
      };
    }
  }

  return {
    valid: true,
    formatted: cleaned,
  };
}

// Usage
const phoneValidation = validatePhoneNumber("+232 77 123456", "m17");
if (phoneValidation.valid) {
  console.log("Valid phone number:", phoneValidation.formatted);
} else {
  console.log("Invalid:", phoneValidation.reason);
}

// Use Case 9: Cache Provider List for Performance
// Cache mobile money provider list to reduce API calls
class MomoCache {
  constructor(client) {
    this.client = client;
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  async getMomos(country) {
    const cacheKey = `momos:${country}`;
    const cached = this.cache.get(cacheKey);

    // Check if cache is valid
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`Returning cached mobile money providers for ${country}`);
      return cached.data;
    }

    // Fetch fresh data
    try {
      console.log(`Fetching fresh mobile money provider list for ${country}`);
      const response = await this.client.momo.list({ country });

      // Store in cache
      this.cache.set(cacheKey, {
        data: response.result,
        timestamp: Date.now(),
      });

      return response.result;
    } catch (error) {
      console.error("Error fetching mobile money providers:", error.message);

      // Return stale cache if available
      if (cached) {
        console.log("Returning stale cache due to error");
        return cached.data;
      }

      return [];
    }
  }

  async getProvider(providerId) {
    const cacheKey = `momo:${providerId}`;
    const cached = this.cache.get(cacheKey);

    // Check if cache is valid
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`Returning cached provider ${providerId}`);
      return cached.data;
    }

    // Fetch fresh data
    try {
      const { result } = await this.client.momo.get(providerId);

      // Store in cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Error fetching provider ${providerId}:`, error.message);

      // Return stale cache if available
      if (cached) {
        console.log("Returning stale cache due to error");
        return cached.data;
      }

      return null;
    }
  }

  clearCache(country = null, providerId = null) {
    if (providerId) {
      this.cache.delete(`momo:${providerId}`);
    } else if (country) {
      this.cache.delete(`momos:${country}`);
    } else {
      this.cache.clear();
    }
  }
}

// Usage
const momoCache = new MomoCache(client);
const cachedMomos = await momoCache.getMomos("SL");
console.log(`Retrieved ${cachedMomos.length} mobile money providers`);

const cachedProvider = await momoCache.getProvider("m17");
if (cachedProvider) {
  console.log(`Retrieved provider: ${cachedProvider.name}`);
}

// Use Case 10: Group Providers by Feature
// Organize providers by their capabilities
async function groupMomosByFeature(country) {
  try {
    const response = await client.momo.list({ country });

    const grouped = {
      payoutOnly: [],
      paymentOnly: [],
      both: [],
      kycEnabled: [],
    };

    for (const momo of response.result) {
      if (!momo.status.active) continue;

      const canPayout = momo.featureSet.payout.canPayTo;
      const canPayment = momo.featureSet.payment.canPayFrom;
      const canKyc = momo.featureSet.kycVerification.canVerifyAccount;

      if (canPayout && canPayment) {
        grouped.both.push(momo);
      } else if (canPayout) {
        grouped.payoutOnly.push(momo);
      } else if (canPayment) {
        grouped.paymentOnly.push(momo);
      }

      if (canKyc) {
        grouped.kycEnabled.push(momo);
      }
    }

    console.log(`\nMobile Money Providers in ${country} by Feature:`);
    console.log(`  Payout & Payment: ${grouped.both.length}`);
    console.log(`  Payout Only: ${grouped.payoutOnly.length}`);
    console.log(`  Payment Only: ${grouped.paymentOnly.length}`);
    console.log(`  KYC Enabled: ${grouped.kycEnabled.length}`);

    return grouped;
  } catch (error) {
    console.error("Error grouping providers:", error.message);
    return null;
  }
}

// Usage
await groupMomosByFeature("SL");
