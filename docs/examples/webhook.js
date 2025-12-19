/**
 * Webhook Examples
 *
 * Webhooks provide real-time event notifications to your server. This module demonstrates
 * webhook creation with different verification methods (HMAC, ECDSA), event subscriptions,
 * webhook management (enable/disable), signature verification, and Express.js integration.
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

import crypto from "crypto";

// ============================================================================
// CREATE WEBHOOK WITH HMAC VERIFICATION (HS256)
// ============================================================================

async function createWebhookWithHMAC() {
  try {
    const webhook = await client.webhook.create({
      name: "Production Webhook",
      url: "https://yoursite.com/webhooks/monime",
      apiRelease: "caph",
      events: ["payment.completed", "payment.failed", "payout.completed"],
      verificationMethod: {
        type: "HS256",
        secret: "your-32-character-minimum-secret-key-here", // Min 32 chars
      },
      alertEmails: ["alerts@yoursite.com", "devops@yoursite.com"],
      metadata: {
        environment: "production",
        team: "backend",
      },
    });

    console.log("Webhook created:", webhook.result.id);
    console.log("Status:", webhook.result.enabled ? "Enabled" : "Disabled");

    return webhook.result;
  } catch (error) {
    console.error("Failed to create webhook:", error.message);
    if (error.code === "invalid_secret") {
      console.error("Secret must be at least 32 characters long");
    }
    throw error;
  }
}

// ============================================================================
// CREATE WEBHOOK WITH ECDSA VERIFICATION (ES256)
// ============================================================================

async function createWebhookWithECDSA() {
  try {
    // ECDSA automatically generates a key pair
    const webhook = await client.webhook.create({
      name: "Secure ECDSA Webhook",
      url: "https://yoursite.com/webhooks/monime-secure",
      apiRelease: "caph",
      events: [
        "payment.completed",
        "payment.failed",
        "payout.completed",
        "payout.failed",
      ],
      verificationMethod: {
        type: "ES256",
      },
      alertEmails: ["security@yoursite.com"],
    });

    console.log("Webhook created:", webhook.result.id);

    // The public key is available in the response for signature verification
    if (webhook.result.verificationMethod?.publicKey) {
      console.log("Public key:", webhook.result.verificationMethod.publicKey);
      // Store this public key securely for verifying webhook signatures
    }

    return webhook.result;
  } catch (error) {
    console.error("Failed to create ECDSA webhook:", error.message);
    throw error;
  }
}

// ============================================================================
// CREATE WEBHOOK WITH CUSTOM HEADERS
// ============================================================================

async function createWebhookWithCustomHeaders() {
  try {
    const webhook = await client.webhook.create({
      name: "Authenticated Webhook",
      url: "https://yoursite.com/webhooks/monime",
      apiRelease: "caph",
      events: ["payment.completed", "checkout_session.completed"],
      verificationMethod: {
        type: "HS256",
        secret: "minimum-32-character-secret-for-production",
      },
      headers: {
        "X-Custom-Auth": "your-auth-token-here",
        "X-Environment": "production",
        "X-Service": "monime-webhooks",
      },
    });

    console.log("Webhook with custom headers created:", webhook.result.id);
    return webhook.result;
  } catch (error) {
    console.error("Failed to create webhook with headers:", error.message);
    throw error;
  }
}

// ============================================================================
// SUBSCRIBE TO ALL CRITICAL EVENTS
// ============================================================================

async function createComprehensiveWebhook() {
  try {
    // Define all critical event types
    const paymentEvents = [
      "payment.created",
      "payment.completed",
      "payment.failed",
    ];

    const payoutEvents = [
      "payout.created",
      "payout.processing",
      "payout.completed",
      "payout.failed",
    ];

    const checkoutEvents = [
      "checkout_session.completed",
      "checkout_session.expired",
    ];

    const webhook = await client.webhook.create({
      name: "All Critical Events",
      url: "https://yoursite.com/webhooks/monime/all-events",
      apiRelease: "caph",
      events: [...paymentEvents, ...payoutEvents, ...checkoutEvents],
      verificationMethod: {
        type: "HS256",
        secret: "secure-production-secret-minimum-32-chars",
      },
      alertEmails: ["alerts@yoursite.com"],
      metadata: {
        purpose: "comprehensive-monitoring",
        version: "1.0",
      },
    });

    console.log("Comprehensive webhook created:", webhook.result.id);
    console.log("Subscribed to", webhook.result.events.length, "event types");

    return webhook.result;
  } catch (error) {
    console.error("Failed to create comprehensive webhook:", error.message);
    throw error;
  }
}

// ============================================================================
// GET WEBHOOK DETAILS
// ============================================================================

async function getWebhookDetails(webhookId) {
  try {
    const { result: webhook } = await client.webhook.get(webhookId);

    console.log("Webhook ID:", webhook.id);
    console.log("Name:", webhook.name);
    console.log("URL:", webhook.url);
    console.log("Enabled:", webhook.enabled);
    console.log("API Release:", webhook.apiRelease);
    console.log("Events:", webhook.events);

    if (webhook.alertEmails && webhook.alertEmails.length > 0) {
      console.log("Alert emails:", webhook.alertEmails.join(", "));
    }

    return webhook;
  } catch (error) {
    console.error("Failed to retrieve webhook:", error.message);
    throw error;
  }
}

// ============================================================================
// LIST WEBHOOKS
// ============================================================================

async function listAllWebhooks() {
  try {
    const { result: webhooks, pagination } = await client.webhook.list();

    console.log(`Total webhooks: ${pagination.count}`);

    for (const webhook of webhooks) {
      const status = webhook.enabled ? "ENABLED" : "DISABLED";
      console.log(
        `${webhook.id} - ${webhook.name} - ${status} - Events: ${webhook.events.length}`,
      );
    }

    return webhooks;
  } catch (error) {
    console.error("Failed to list webhooks:", error.message);
    throw error;
  }
}

async function listWebhooksWithPagination() {
  try {
    const { result: webhooks } = await client.webhook.list({ limit: 25 });
    return webhooks;
  } catch (error) {
    console.error("Failed to list webhooks:", error.message);
    throw error;
  }
}

// ============================================================================
// PAGINATE THROUGH ALL WEBHOOKS
// ============================================================================

async function getAllWebhooks() {
  const allWebhooks = [];
  let after = null;

  try {
    do {
      const response = await client.webhook.list({
        limit: 50,
        ...(after && { after }),
      });

      allWebhooks.push(...response.result);

      console.log(
        `Fetched ${response.result.length} webhooks (Total: ${allWebhooks.length})`,
      );

      after = response.pagination.next;
    } while (after);

    console.log(`Retrieved all ${allWebhooks.length} webhooks`);
    return allWebhooks;
  } catch (error) {
    console.error("Pagination failed:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE WEBHOOK - DISABLE
// ============================================================================

async function disableWebhook(webhookId) {
  try {
    const { result: webhook } = await client.webhook.update(webhookId, {
      enabled: false,
    });

    console.log(`Webhook ${webhookId} disabled successfully`);
    return webhook;
  } catch (error) {
    console.error("Failed to disable webhook:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE WEBHOOK - ENABLE
// ============================================================================

async function enableWebhook(webhookId) {
  try {
    const { result: webhook } = await client.webhook.update(webhookId, {
      enabled: true,
    });

    console.log(`Webhook ${webhookId} enabled successfully`);
    return webhook;
  } catch (error) {
    console.error("Failed to enable webhook:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE WEBHOOK URL AND EVENTS
// ============================================================================

async function updateWebhookConfiguration(webhookId) {
  try {
    const { result: webhook } = await client.webhook.update(webhookId, {
      url: "https://yoursite.com/webhooks/monime-v2",
      events: [
        "payment.completed",
        "payment.failed",
        "payout.completed",
        "payout.failed",
        "checkout_session.completed",
      ],
    });

    console.log(`Webhook ${webhookId} configuration updated`);
    return webhook;
  } catch (error) {
    console.error("Failed to update webhook:", error.message);
    throw error;
  }
}

// ============================================================================
// UPDATE ALERT EMAILS
// ============================================================================

async function updateWebhookAlerts(webhookId, emails) {
  try {
    const { result: webhook } = await client.webhook.update(webhookId, {
      alertEmails: emails,
    });

    console.log(`Alert emails updated for webhook ${webhookId}`);
    return webhook;
  } catch (error) {
    console.error("Failed to update alert emails:", error.message);
    throw error;
  }
}

// ============================================================================
// DELETE WEBHOOK
// ============================================================================

async function deleteWebhook(webhookId) {
  try {
    await client.webhook.delete(webhookId);
    console.log(`Webhook ${webhookId} deleted successfully`);
  } catch (error) {
    console.error("Failed to delete webhook:", error.message);
    throw error;
  }
}

// ============================================================================
// VERIFY WEBHOOK SIGNATURE (HMAC)
// ============================================================================

function verifyWebhookSignatureHMAC(payload, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch (error) {
    console.error("Signature verification failed:", error.message);
    return false;
  }
}

// ============================================================================
// VERIFY WEBHOOK SIGNATURE (ECDSA)
// ============================================================================

function verifyWebhookSignatureECDSA(payload, signature, publicKey) {
  try {
    const verify = crypto.createVerify("SHA256");
    verify.update(payload);
    verify.end();

    return verify.verify(
      {
        key: publicKey,
        format: "pem",
        type: "spki",
      },
      signature,
      "base64",
    );
  } catch (error) {
    console.error("ECDSA signature verification failed:", error.message);
    return false;
  }
}

// ============================================================================
// EXPRESS.JS WEBHOOK HANDLER
// ============================================================================

// Example Express.js webhook endpoint with HMAC verification
function setupExpressWebhookHandler(app, webhookSecret) {
  app.post("/webhooks/monime", (req, res) => {
    try {
      const signature = req.headers["x-monime-signature"];
      const payload = JSON.stringify(req.body);

      // Verify signature
      if (!verifyWebhookSignatureHMAC(payload, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return res.status(401).send("Invalid signature");
      }

      // Process the webhook event
      const event = req.body;
      console.log(`Received event: ${event.type}`);

      // Handle different event types
      handleWebhookEvent(event);

      // Always respond with 200 to acknowledge receipt
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook processing error:", error.message);
      res.status(500).send("Internal server error");
    }
  });
}

// ============================================================================
// WEBHOOK EVENT HANDLER
// ============================================================================

async function handleWebhookEvent(event) {
  try {
    switch (event.type) {
      case "payment.completed":
        console.log("Payment completed:", event.data.id);
        // Update order status, send confirmation email, etc.
        break;

      case "payment.failed":
        console.log("Payment failed:", event.data.id);
        // Notify customer, log failure, retry logic, etc.
        break;

      case "payout.completed":
        console.log("Payout completed:", event.data.id);
        // Update disbursement records, notify recipient, etc.
        break;

      case "payout.failed":
        console.log("Payout failed:", event.data.id);
        if (event.data.failureDetail) {
          console.log("Reason:", event.data.failureDetail.message);
        }
        // Retry logic, alert admin, etc.
        break;

      case "checkout_session.completed":
        console.log("Checkout session completed:", event.data.id);
        // Fulfill order, update inventory, etc.
        break;

      case "checkout_session.expired":
        console.log("Checkout session expired:", event.data.id);
        // Clean up pending orders, notify customer, etc.
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }
  } catch (error) {
    console.error("Error handling webhook event:", error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

// Example 1: Create webhook with HMAC
// const hmacWebhook = await createWebhookWithHMAC();

// Example 2: Create webhook with ECDSA
// const ecdsaWebhook = await createWebhookWithECDSA();

// Example 3: Create webhook with custom headers
// const customWebhook = await createWebhookWithCustomHeaders();

// Example 4: Subscribe to all events
// const comprehensiveWebhook = await createComprehensiveWebhook();

// Example 5: Get webhook details
// const webhook = await getWebhookDetails("whk-webhook-id");

// Example 6: List all webhooks
// const webhooks = await listAllWebhooks();

// Example 7: Disable webhook
// await disableWebhook("whk-webhook-id");

// Example 8: Enable webhook
// await enableWebhook("whk-webhook-id");

// Example 9: Update webhook configuration
// await updateWebhookConfiguration("whk-webhook-id");

// Example 10: Update alert emails
// await updateWebhookAlerts("whk-webhook-id", ["new@example.com", "backup@example.com"]);

// Example 11: Delete webhook
// await deleteWebhook("whk-webhook-id");

// Example 12: Setup Express.js handler
// const express = require("express");
// const app = express();
// app.use(express.json());
// setupExpressWebhookHandler(app, "your-webhook-secret");
// app.listen(3000, () => console.log("Webhook server running on port 3000"));
