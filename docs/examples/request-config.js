/**
 * Request Configuration Examples
 *
 * Configure timeouts, retries, and request cancellation.
 * Assumes `client` is an instantiated MonimeClient.
 */

// Custom timeout for slow operations
const payout = await client.payout.create(
  {
    amount: { currency: "SLE", value: 1000 },
    destination: {
      type: "momo",
      providerId: "m17",
      phoneNumber: "+23276123456",
    },
  },
  undefined, // idempotencyKey
  { timeout: 60000 }, // 60 second timeout
);

// Disable retries for specific request
const session = await client.checkoutSession.create(
  {
    name: "Order #123",
    lineItems: [
      {
        type: "custom",
        name: "Product",
        price: { currency: "SLE", value: 10000 },
        quantity: 1,
      },
    ],
    successUrl: "https://yoursite.com/success",
    cancelUrl: "https://yoursite.com/cancel",
  },
  undefined,
  { retries: 0 }, // No retries
);

// Custom idempotency key to prevent duplicate requests
const idempotencyKey = `payout-${orderId}-${Date.now()}`;

const safePayout = await client.payout.create(
  {
    amount: { currency: "SLE", value: 1000 },
    destination: {
      type: "momo",
      providerId: "m17",
      phoneNumber: "+23276123456",
    },
  },
  idempotencyKey,
);

// Abort signal for request cancellation
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const sessions = await client.checkoutSession.list(
    { limit: 50 },
    { signal: controller.signal },
  );
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request was cancelled");
  }
}

// Abort signal with cleanup (React/Svelte pattern)
async function fetchPaymentCode(id, signal) {
  try {
    const { result } = await client.paymentCode.get(id, { signal });
    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      // Request was cancelled, don't update state
      return null;
    }
    throw error;
  }
}

// Svelte 5 example with cleanup
/*
<script>
  let { id } = $props();
  let payment = $state(null);

  $effect(() => {
    const controller = new AbortController();

    client.paymentCode.get(id, { signal: controller.signal })
      .then(({ result }) => (payment = result))
      .catch((e) => {
        if (e.name !== "AbortError") handleError(e);
      });

    return () => controller.abort(); // Cleanup on unmount or id change
  });
</script>
*/

// React example with cleanup
/*
function usePaymentCode(id) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    client.paymentCode.get(id, { signal: controller.signal })
      .then(({ result }) => setData(result))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  return { data, error, loading };
}
*/

// Combining timeout and abort signal
const combinedController = new AbortController();

// External cancellation trigger
document.getElementById("cancel-btn").addEventListener("click", () => {
  combinedController.abort();
});

try {
  const result = await client.payout.create(
    {
      amount: { currency: "SLE", value: 5000 },
      destination: {
        type: "momo",
        providerId: "m17",
        phoneNumber: "+23276123456",
      },
    },
    undefined,
    {
      timeout: 30000, // 30 second timeout
      signal: combinedController.signal, // Also cancelable via button
    },
  );
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request cancelled by user");
  } else if (error.name === "MonimeTimeoutError") {
    console.log("Request timed out");
  }
}

// Per-request override of retry behavior
const noRetryRequest = await client.paymentCode.get("pmc-xxx", {
  retries: 0, // No retries
  timeout: 10000, // 10 second timeout
});

// High-priority request with more retries and longer timeout
const criticalRequest = await client.payout.create(
  {
    amount: { currency: "SLE", value: 100000 },
    destination: {
      type: "bank",
      providerId: "bank-id",
      accountNumber: "1234567890",
    },
  },
  undefined,
  {
    retries: 5, // More retries for critical operations
    timeout: 120000, // 2 minute timeout
  },
);
