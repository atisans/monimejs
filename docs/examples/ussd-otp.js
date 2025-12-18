/**
 * USSD OTP Examples
 *
 * USSD OTP provides phone-bound verification through a USSD dial flow. This is useful
 * for scenarios requiring phone number verification, transaction authorization, account
 * verification, and password resets. This module demonstrates OTP creation, status polling,
 * verification flows, and comprehensive error handling.
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

// ============================================================================
// BASIC USSD OTP CREATION
// ============================================================================

async function createBasicOTP(phoneNumber) {
  try {
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      verificationMessage: "You have successfully verified your account.",
      duration: "5m", // Valid for 5 minutes
      metadata: {
        action: "basic_verification",
        timestamp: new Date().toISOString(),
      },
    });

    console.log("OTP created:", otp.result.id);
    console.log("Dial code:", otp.result.dialCode);
    console.log("Status:", otp.result.status);
    console.log("Expires at:", otp.result.expireTime);

    return otp.result;
  } catch (error) {
    console.error("Failed to create OTP:", error.message);
    throw error;
  }
}

// ============================================================================
// USER REGISTRATION VERIFICATION
// ============================================================================

async function verifyNewUserRegistration(phoneNumber, userId) {
  try {
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      verificationMessage: "Welcome! Your account is now verified.",
      duration: "5m",
      metadata: {
        flow: "user_registration",
        userId: userId,
        action: "account_verification",
      },
    });

    console.log(`Registration OTP for user ${userId}:`, otp.result.id);
    console.log(`Instruct user to dial: ${otp.result.dialCode}`);

    return {
      otpId: otp.result.id,
      dialCode: otp.result.dialCode,
      expireTime: otp.result.expireTime,
    };
  } catch (error) {
    console.error("Failed to create registration OTP:", error.message);
    throw error;
  }
}

// ============================================================================
// TRANSACTION AUTHORIZATION
// ============================================================================

async function authorizeTransaction(phoneNumber, amount, transactionId) {
  try {
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      verificationMessage: `Transaction of ${amount} SLE approved. Thank you!`,
      duration: "2m", // Shorter duration for transaction authorization
      metadata: {
        flow: "transaction_authorization",
        transactionId: transactionId,
        amount: String(amount),
      },
    });

    console.log(`Transaction auth OTP created:`, otp.result.id);
    console.log(`Dial code: ${otp.result.dialCode}`);

    return otp.result;
  } catch (error) {
    console.error("Failed to create transaction auth OTP:", error.message);
    throw error;
  }
}

// ============================================================================
// PASSWORD RESET VERIFICATION
// ============================================================================

async function initiatePasswordReset(phoneNumber, userId) {
  try {
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      verificationMessage:
        "Password reset verified. Check your email for next steps.",
      duration: "10m", // Longer duration for password reset flow
      metadata: {
        flow: "password_reset",
        userId: userId,
      },
    });

    console.log(`Password reset OTP for user ${userId}:`, otp.result.id);
    console.log(`Dial code: ${otp.result.dialCode}`);

    return otp.result.dialCode;
  } catch (error) {
    console.error("Failed to create password reset OTP:", error.message);
    throw error;
  }
}

// ============================================================================
// WITHDRAWAL CONFIRMATION
// ============================================================================

async function confirmWithdrawal(phoneNumber, amount, withdrawalId) {
  try {
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      verificationMessage: `Withdrawal of ${amount} SLE confirmed successfully.`,
      duration: "3m",
      metadata: {
        flow: "withdrawal_confirmation",
        withdrawalId: withdrawalId,
        amount: String(amount),
      },
    });

    console.log(`Withdrawal confirmation OTP:`, otp.result.id);
    return otp.result;
  } catch (error) {
    console.error("Failed to create withdrawal OTP:", error.message);
    throw error;
  }
}

// ============================================================================
// GET OTP STATUS
// ============================================================================

async function getOTPStatus(otpId) {
  try {
    const { result: otp } = await client.ussdOtp.get(otpId);

    console.log("OTP ID:", otp.id);
    console.log("Status:", otp.status);
    console.log("Dial code:", otp.dialCode);
    console.log("Phone number:", otp.authorizedPhoneNumber);

    // Status can be: "pending", "verified", or "expired"
    switch (otp.status) {
      case "verified":
        console.log("User has been verified!");
        break;
      case "expired":
        console.log("OTP expired, please request a new one.");
        break;
      case "pending":
        console.log("Waiting for user to dial the code...");
        break;
      default:
        console.log("Unknown status:", otp.status);
    }

    return otp;
  } catch (error) {
    console.error("Failed to retrieve OTP:", error.message);
    throw error;
  }
}

// ============================================================================
// POLL FOR VERIFICATION STATUS
// ============================================================================

async function waitForVerification(otpId, maxAttempts = 30, intervalMs = 2000) {
  console.log(`Polling OTP ${otpId} for verification...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { result: otp } = await client.ussdOtp.get(otpId);

      if (otp.status === "verified") {
        console.log("Verification successful!");
        return { verified: true, otp };
      }

      if (otp.status === "expired") {
        console.log("OTP expired before verification");
        return { verified: false, expired: true, otp };
      }

      console.log(`Attempt ${attempt}: Status is ${otp.status}`);

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error(`Poll attempt ${attempt} failed:`, error.message);
    }
  }

  console.log("Polling timed out");
  return { verified: false, timeout: true };
}

// ============================================================================
// COMPLETE VERIFICATION FLOW
// ============================================================================

async function completeVerificationFlow(phoneNumber, purpose) {
  console.log(`Starting verification flow for ${phoneNumber}...`);

  try {
    // Step 1: Create OTP
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      verificationMessage: "Verification successful!",
      duration: "5m",
      metadata: { purpose },
    });

    console.log(`Please dial ${otp.result.dialCode} to verify.`);

    // Step 2: Wait for verification
    const result = await waitForVerification(otp.result.id, 60, 2000);

    if (result.verified) {
      console.log("Phone number verified successfully!");
      return { success: true, otpId: otp.result.id };
    } else if (result.expired) {
      console.log("OTP expired. Please request a new one.");
      return { success: false, reason: "expired" };
    } else {
      console.log("Verification timed out.");
      return { success: false, reason: "timeout" };
    }
  } catch (error) {
    console.error("Verification flow failed:", error.message);
    return { success: false, reason: "error", error: error.message };
  }
}

// ============================================================================
// RETRY LOGIC WITH NEW OTP
// ============================================================================

async function verifyWithRetry(
  phoneNumber,
  maxRetries = 3,
  verificationMessage,
) {
  for (let retry = 1; retry <= maxRetries; retry++) {
    try {
      console.log(`Verification attempt ${retry} of ${maxRetries}`);

      const otp = await client.ussdOtp.create({
        authorizedPhoneNumber: phoneNumber,
        verificationMessage:
          verificationMessage || "Phone verification successful.",
        duration: "5m",
        metadata: {
          retryAttempt: retry,
        },
      });

      console.log(`Dial code: ${otp.result.dialCode}`);

      // Wait for verification (30 attempts * 2 seconds = 60 seconds)
      const result = await waitForVerification(otp.result.id, 30, 2000);

      if (result.verified) {
        console.log(`Verified on attempt ${retry}`);
        return { success: true, attempts: retry };
      }

      if (retry < maxRetries) {
        console.log(`Attempt ${retry} failed. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s before retry
      }
    } catch (error) {
      console.error(`Retry ${retry} failed:`, error.message);
      if (retry === maxRetries) {
        return { success: false, error: error.message };
      }
    }
  }

  console.log("All verification attempts exhausted");
  return { success: false, reason: "max_retries_exceeded" };
}

// ============================================================================
// LIST USSD OTPS
// ============================================================================

async function listAllOTPs() {
  try {
    const { result: otps, pagination } = await client.ussdOtp.list();

    console.log(`Total OTPs: ${pagination.count}`);

    for (const otp of otps) {
      console.log(
        `${otp.id} - ${otp.status} - ${otp.authorizedPhoneNumber} - ${otp.dialCode}`,
      );
    }

    return otps;
  } catch (error) {
    console.error("Failed to list OTPs:", error.message);
    throw error;
  }
}

async function listOTPsWithPagination() {
  try {
    const { result: otps } = await client.ussdOtp.list({ limit: 25 });
    return otps;
  } catch (error) {
    console.error("Failed to list OTPs:", error.message);
    throw error;
  }
}

// ============================================================================
// PAGINATE THROUGH ALL OTPS
// ============================================================================

async function getAllOTPs() {
  const allOTPs = [];
  let after = null;

  try {
    do {
      const response = await client.ussdOtp.list({
        limit: 50,
        ...(after && { after }),
      });

      allOTPs.push(...response.result);

      console.log(
        `Fetched ${response.result.length} OTPs (Total: ${allOTPs.length})`,
      );

      after = response.pagination.next;
    } while (after);

    console.log(`Retrieved all ${allOTPs.length} OTPs`);
    return allOTPs;
  } catch (error) {
    console.error("Pagination failed:", error.message);
    throw error;
  }
}

// ============================================================================
// DELETE USSD OTP
// ============================================================================

async function cancelOTP(otpId) {
  try {
    await client.ussdOtp.delete(otpId);
    console.log(`OTP ${otpId} deleted successfully`);
  } catch (error) {
    console.error("Failed to delete OTP:", error.message);
    throw error;
  }
}

// ============================================================================
// DURATION VARIATIONS
// ============================================================================

async function createQuickOTP(phoneNumber) {
  // Very short-lived OTP (30 seconds)
  try {
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      duration: "30s",
      verificationMessage: "Quick verification complete!",
    });

    console.log("Quick OTP (30s):", otp.result.dialCode);
    return otp.result;
  } catch (error) {
    console.error("Failed to create quick OTP:", error.message);
    throw error;
  }
}

async function createLongOTP(phoneNumber) {
  // Long-lived OTP (10 minutes)
  try {
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      duration: "10m",
      verificationMessage: "Extended verification complete!",
    });

    console.log("Long OTP (10m):", otp.result.dialCode);
    return otp.result;
  } catch (error) {
    console.error("Failed to create long OTP:", error.message);
    throw error;
  }
}

// ============================================================================
// TWO-FACTOR AUTHENTICATION FLOW
// ============================================================================

async function twoFactorAuthentication(userId, phoneNumber) {
  try {
    console.log(`Initiating 2FA for user ${userId}...`);

    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      verificationMessage: "Two-factor authentication successful.",
      duration: "3m",
      metadata: {
        flow: "2fa",
        userId: userId,
        loginAttempt: Date.now(),
      },
    });

    console.log(`2FA dial code: ${otp.result.dialCode}`);

    // Poll for verification with shorter timeout
    const result = await waitForVerification(otp.result.id, 45, 2000);

    if (result.verified) {
      console.log("2FA verification successful - access granted");
      return { authenticated: true, otpId: otp.result.id };
    } else {
      console.log("2FA verification failed - access denied");
      return { authenticated: false, reason: result.expired ? "expired" : "timeout" };
    }
  } catch (error) {
    console.error("2FA failed:", error.message);
    return { authenticated: false, error: error.message };
  }
}

// ============================================================================
// ACCOUNT LINKING VERIFICATION
// ============================================================================

async function verifyAccountLinking(phoneNumber, accountId) {
  try {
    const otp = await client.ussdOtp.create({
      authorizedPhoneNumber: phoneNumber,
      verificationMessage: "Account linked successfully!",
      duration: "5m",
      metadata: {
        flow: "account_linking",
        accountId: accountId,
      },
    });

    console.log(`Account linking verification: ${otp.result.dialCode}`);

    const result = await waitForVerification(otp.result.id);

    if (result.verified) {
      console.log(`Account ${accountId} linked to ${phoneNumber}`);
      return { linked: true, accountId };
    } else {
      console.log("Account linking verification failed");
      return { linked: false };
    }
  } catch (error) {
    console.error("Account linking failed:", error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

// Example 1: Basic OTP
// const otp = await createBasicOTP("+23276123456");

// Example 2: User registration verification
// const regOtp = await verifyNewUserRegistration("+23276123456", "user-123");

// Example 3: Transaction authorization
// const txnOtp = await authorizeTransaction("+23276123456", 100000, "txn-456");

// Example 4: Password reset
// const resetCode = await initiatePasswordReset("+23276123456", "user-123");

// Example 5: Withdrawal confirmation
// const withdrawOtp = await confirmWithdrawal("+23276123456", 50000, "withdrawal-789");

// Example 6: Get OTP status
// const status = await getOTPStatus("uop-otp-id");

// Example 7: Wait for verification
// const result = await waitForVerification("uop-otp-id");

// Example 8: Complete verification flow
// const flowResult = await completeVerificationFlow("+23276123456", "account_verification");

// Example 9: Verify with retry
// const retryResult = await verifyWithRetry("+23276123456", 3, "Verification successful!");

// Example 10: List OTPs
// const otps = await listAllOTPs();

// Example 11: Cancel OTP
// await cancelOTP("uop-otp-id");

// Example 12: Duration variations
// const quickOtp = await createQuickOTP("+23276123456");
// const longOtp = await createLongOTP("+23276123456");

// Example 13: Two-factor authentication
// const authResult = await twoFactorAuthentication("user-123", "+23276123456");

// Example 14: Account linking
// const linkResult = await verifyAccountLinking("+23276123456", "account-789");
