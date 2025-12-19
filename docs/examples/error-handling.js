/**
 * Error Handling Examples
 *
 * The SDK provides typed error classes for different failure scenarios.
 * Assumes `client` is an instantiated MonimeClient.
 */

import {
  MonimeApiError,
  MonimeNetworkError,
  MonimeTimeoutError,
  MonimeValidationError,
} from "monimejs";

// Basic error handling
try {
  const payout = await client.payout.create({
    amount: { currency: "SLE", value: 1000 },
    destination: {
      type: "momo",
      providerId: "m17",
      phoneNumber: "+23276123456",
    },
  });
} catch (error) {
  if (error instanceof MonimeValidationError) {
    // Client-side validation failed (before request is sent)
    // The error contains all validation issues found
    console.log(`Validation error: ${error.message}`);

    // Iterate through all issues
    for (const issue of error.issues) {
      console.log(`  - ${issue.field}: ${issue.message}`);
      if (issue.value !== undefined) {
        console.log(`    Invalid value: ${JSON.stringify(issue.value)}`);
      }
    }
  } else if (error instanceof MonimeApiError) {
    // API returned an error (4xx, 5xx)
    console.log(`API error ${error.code}: ${error.message}`);
    console.log(`Reason: ${error.reason}`);

    // Check if the request can be retried
    if (error.isRetryable) {
      console.log("This request can be retried");
    }
  } else if (error instanceof MonimeTimeoutError) {
    // Request timed out
    console.log(`Request timed out after ${error.timeout}ms`);
  } else if (error instanceof MonimeNetworkError) {
    // Network error (connection refused, DNS failure, etc.)
    console.log(`Network error: ${error.message}`);
    console.log(`Original error: ${error.cause}`);

    // Network errors are always retryable
    if (error.isRetryable) {
      console.log("This request can be retried");
    }
  }
}

// Handling multiple validation errors at once
try {
  await client.checkoutSession.create({
    name: "", // Invalid: empty name
    lineItems: [], // Invalid: empty array
    // Missing required fields will also be caught
  });
} catch (error) {
  if (error instanceof MonimeValidationError) {
    // All validation issues are available
    console.log(`Found ${error.issues.length} validation errors:`);

    for (const issue of error.issues) {
      console.log(`  - ${issue.field}: ${issue.message}`);
    }

    // Example output:
    // Found 2 validation errors:
    //   - name: String must contain at least 1 character(s)
    //   - lineItems: Array must contain at least 1 item(s)
  }
}

// Handling specific API errors
try {
  await client.paymentCode.get("pmc-nonexistent");
} catch (error) {
  if (error instanceof MonimeApiError) {
    switch (error.code) {
      case 400:
        console.log("Bad request - check your input");
        break;
      case 401:
        console.log("Authentication failed - check credentials");
        break;
      case 403:
        console.log("Forbidden - insufficient permissions");
        break;
      case 404:
        console.log("Resource not found");
        break;
      case 429:
        console.log("Rate limited - slow down requests");
        break;
      case 500:
        console.log("Server error - try again later");
        break;
    }
  }
}

// Retry logic with exponential backoff
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable =
        error instanceof MonimeNetworkError ||
        (error instanceof MonimeApiError && error.isRetryable);

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * 2 ** attempt + Math.random() * 500;
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage of retry wrapper
const result = await withRetry(
  () =>
    client.payout.create({
      amount: { currency: "SLE", value: 1000 },
      destination: {
        type: "momo",
        providerId: "m17",
        phoneNumber: "+23276123456",
      },
    }),
  3,
  1000,
);

// Graceful error handling in a real application
async function processPayment(orderId, amount, phoneNumber) {
  try {
    const payout = await client.payout.create({
      amount: { currency: "SLE", value: amount },
      destination: {
        type: "momo",
        providerId: "m17",
        phoneNumber: phoneNumber,
      },
      metadata: { orderId },
    });

    return { success: true, payoutId: payout.result.id };
  } catch (error) {
    if (error instanceof MonimeValidationError) {
      // Return all validation issues for the caller to handle
      return {
        success: false,
        error: "Invalid input",
        issues: error.issues.map((i) => ({
          field: i.field,
          message: i.message,
        })),
      };
    }

    if (error instanceof MonimeApiError) {
      if (error.code === 429) {
        return { success: false, error: "Too many requests, please try later" };
      }
      return { success: false, error: error.message, reason: error.reason };
    }

    if (error instanceof MonimeTimeoutError) {
      return { success: false, error: "Request timed out, please try again" };
    }

    if (error instanceof MonimeNetworkError) {
      return {
        success: false,
        error: "Network error, please check your connection",
      };
    }

    // Unknown error
    throw error;
  }
}
