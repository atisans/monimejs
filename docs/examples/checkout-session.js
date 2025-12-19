/**
 * Checkout Session Examples
 *
 * Checkout sessions create hosted payment pages for customers to complete purchases.
 * This module demonstrates e-commerce cart scenarios, subscription payments, branding,
 * redirect handling, session management, and comprehensive error handling.
 *
 * Assumes `client` is an instantiated MonimeClient.
 */

// ============================================================================
// BASIC CHECKOUT SESSION CREATION
// ============================================================================

async function createBasicCheckout() {
  try {
    const session = await client.checkoutSession.create({
      name: "Order #12345",
      lineItems: [
        {
          type: "custom",
          name: "Premium T-Shirt",
          price: { currency: "SLE", value: 15000 }, // 150.00 SLE
          quantity: 2,
        },
        {
          type: "custom",
          name: "Shipping Fee",
          price: { currency: "SLE", value: 2500 }, // 25.00 SLE
          quantity: 1,
        },
      ],
      successUrl: "https://yoursite.com/checkout/success",
      cancelUrl: "https://yoursite.com/checkout/cancel",
      description: "Order from Your Store",
      reference: "order-12345",
      metadata: {
        customerId: "cust-123",
        source: "web",
        cartId: "cart-abc-789",
      },
    });

    console.log("Checkout session created:", session.result.id);
    console.log("Redirect customer to:", session.result.redirectUrl);
    console.log("Order number:", session.result.orderNumber);

    return session.result;
  } catch (error) {
    console.error("Failed to create checkout session:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    throw error;
  }
}

// ============================================================================
// E-COMMERCE SHOPPING CART
// ============================================================================

async function createShoppingCartCheckout(cart) {
  try {
    // Convert cart items to line items
    const lineItems = cart.items.map((item) => ({
      type: "custom",
      name: item.productName,
      price: {
        currency: cart.currency,
        value: item.unitPrice, // Should be in minor units
      },
      quantity: item.quantity,
    }));

    // Add shipping if applicable
    if (cart.shippingCost > 0) {
      lineItems.push({
        type: "custom",
        name: "Shipping & Handling",
        price: { currency: cart.currency, value: cart.shippingCost },
        quantity: 1,
      });
    }

    // Add tax if applicable
    if (cart.taxAmount > 0) {
      lineItems.push({
        type: "custom",
        name: "Sales Tax",
        price: { currency: cart.currency, value: cart.taxAmount },
        quantity: 1,
      });
    }

    const session = await client.checkoutSession.create({
      name: `Order #${cart.orderId}`,
      lineItems,
      successUrl: `https://yoursite.com/orders/${cart.orderId}/success`,
      cancelUrl: `https://yoursite.com/cart`,
      description: `Purchase of ${cart.items.length} items`,
      reference: cart.orderId,
      metadata: {
        customerId: cart.customerId,
        customerEmail: cart.customerEmail,
        cartSessionId: cart.sessionId,
        promotionCode: cart.promotionCode || null,
      },
    });

    return session.result;
  } catch (error) {
    console.error("Shopping cart checkout failed:", error.message);
    throw error;
  }
}

// Example cart structure
const exampleCart = {
  orderId: "ORD-2025-001",
  customerId: "cust-456",
  customerEmail: "customer@example.com",
  sessionId: "sess-xyz",
  currency: "SLE",
  items: [
    { productName: "Laptop Stand", unitPrice: 50000, quantity: 1 },
    { productName: "Wireless Mouse", unitPrice: 25000, quantity: 2 },
  ],
  shippingCost: 5000,
  taxAmount: 8000,
  promotionCode: "SAVE10",
};

// ============================================================================
// SUBSCRIPTION PAYMENT WITH BRANDING
// ============================================================================

async function createSubscriptionCheckout() {
  try {
    const session = await client.checkoutSession.create({
      name: "Annual Premium Subscription",
      lineItems: [
        {
          type: "custom",
          name: "Premium Plan - Annual",
          price: { currency: "SLE", value: 100000 }, // 1,000.00 SLE
          quantity: 1,
        },
      ],
      successUrl: "https://yoursite.com/subscription/activated",
      cancelUrl: "https://yoursite.com/pricing",
      description: "Annual subscription with full access to all features",
      reference: `sub-${Date.now()}`,
      brandingOptions: {
        primaryColor: "#4F46E5", // Indigo brand color
      },
      paymentOptions: {
        momo: true, // Enable mobile money
        card: true, // Enable card payments
        bank: false, // Disable bank transfers
        wallet: false, // Disable wallet payments
      },
      metadata: {
        subscriptionType: "annual",
        planId: "premium-annual",
        billingCycle: "yearly",
      },
    });

    console.log("Subscription checkout created:", session.result.id);
    console.log("Customer should visit:", session.result.redirectUrl);

    return session.result;
  } catch (error) {
    console.error("Subscription checkout failed:", error.message);
    throw error;
  }
}

// ============================================================================
// RETRIEVE AND CHECK SESSION STATUS
// ============================================================================

async function getCheckoutSessionStatus(sessionId) {
  try {
    const { result: session } = await client.checkoutSession.get(sessionId);

    console.log("Session ID:", session.id);
    console.log("Status:", session.status);
    console.log("Order Number:", session.orderNumber);

    // Status can be: "pending", "completed", "cancelled", "expired"
    switch (session.status) {
      case "completed":
        console.log("Payment completed successfully!");
        if (session.paymentReference) {
          console.log("Payment reference:", session.paymentReference);
        }
        break;

      case "pending":
        console.log("Waiting for customer payment...");
        console.log("Redirect URL:", session.redirectUrl);
        break;

      case "cancelled":
        console.log("Customer cancelled the payment");
        break;

      case "expired":
        console.log("Session expired without payment");
        break;

      default:
        console.log("Unknown status:", session.status);
    }

    return session;
  } catch (error) {
    console.error("Failed to retrieve session:", error.message);
    throw error;
  }
}

// ============================================================================
// POLL FOR PAYMENT COMPLETION
// ============================================================================

async function waitForPaymentCompletion(sessionId, maxAttempts = 60) {
  console.log(`Polling session ${sessionId} for completion...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { result: session } = await client.checkoutSession.get(sessionId);

      if (session.status === "completed") {
        console.log("Payment completed!");
        return { success: true, session };
      }

      if (session.status === "cancelled" || session.status === "expired") {
        console.log(`Session ${session.status}`);
        return { success: false, session };
      }

      // Wait 3 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`Poll attempt ${attempt} failed:`, error.message);
    }
  }

  console.log("Polling timed out");
  return { success: false, session: null };
}

// ============================================================================
// LIST CHECKOUT SESSIONS WITH FILTERING
// ============================================================================

async function listRecentCheckouts() {
  try {
    // Get recent sessions with default pagination
    const { result: sessions, pagination } =
      await client.checkoutSession.list();

    console.log(`Total sessions: ${pagination.count}`);

    for (const session of sessions) {
      console.log(
        `${session.id} - ${session.status} - ${session.name} - Order: ${session.orderNumber}`,
      );
    }

    return sessions;
  } catch (error) {
    console.error("Failed to list sessions:", error.message);
    throw error;
  }
}

async function listCheckoutsWithCustomLimit() {
  try {
    // Get up to 25 sessions
    const { result: sessions } = await client.checkoutSession.list({
      limit: 25,
    });

    return sessions;
  } catch (error) {
    console.error("Failed to list sessions:", error.message);
    throw error;
  }
}

// ============================================================================
// PAGINATE THROUGH ALL SESSIONS
// ============================================================================

async function getAllCheckoutSessions() {
  const allSessions = [];
  let after = null;

  try {
    do {
      const response = await client.checkoutSession.list({
        limit: 50,
        ...(after && { after }),
      });

      allSessions.push(...response.result);

      console.log(
        `Fetched ${response.result.length} sessions (Total: ${allSessions.length})`,
      );

      after = response.pagination.next;
    } while (after);

    console.log(`Retrieved all ${allSessions.length} checkout sessions`);
    return allSessions;
  } catch (error) {
    console.error("Pagination failed:", error.message);
    throw error;
  }
}

// ============================================================================
// DELETE PENDING SESSION
// ============================================================================

async function cancelCheckoutSession(sessionId) {
  try {
    // Can only delete sessions that haven't been initiated by the customer
    await client.checkoutSession.delete(sessionId);
    console.log(`Session ${sessionId} deleted successfully`);
  } catch (error) {
    if (error.code === "invalid_state") {
      console.error(
        "Cannot delete this session - it may have already been initiated",
      );
    } else {
      console.error("Failed to delete session:", error.message);
    }
    throw error;
  }
}

// ============================================================================
// COMPLETE E-COMMERCE FLOW
// ============================================================================

async function completeEcommerceFlow(cart) {
  console.log("Starting e-commerce checkout flow...");

  try {
    // Step 1: Create checkout session
    const session = await createShoppingCartCheckout(cart);
    console.log(`Checkout created: ${session.id}`);

    // Step 2: Customer would be redirected to session.redirectUrl
    console.log(`Redirect customer to: ${session.redirectUrl}`);

    // Step 3: Optionally poll for completion (or use webhooks)
    const result = await waitForPaymentCompletion(session.id, 20);

    if (result.success) {
      console.log("Order completed successfully!");
      console.log("Payment reference:", result.session.paymentReference);

      // Step 4: Fulfill the order
      // await fulfillOrder(cart.orderId, result.session);
    } else {
      console.log("Payment was not completed");
      // Handle cancellation or expiration
    }

    return result;
  } catch (error) {
    console.error("E-commerce flow failed:", error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

// Example 1: Basic checkout
// const basicSession = await createBasicCheckout();

// Example 2: Shopping cart checkout
// const cartSession = await createShoppingCartCheckout(exampleCart);

// Example 3: Subscription payment
// const subSession = await createSubscriptionCheckout();

// Example 4: Check session status
// const session = await getCheckoutSessionStatus("cos-session-id");

// Example 5: List recent checkouts
// const recentSessions = await listRecentCheckouts();

// Example 6: Get all sessions with pagination
// const allSessions = await getAllCheckoutSessions();

// Example 7: Delete a pending session
// await cancelCheckoutSession("cos-session-id");

// Example 8: Complete flow
// await completeEcommerceFlow(exampleCart);
