# Error Handling Examples

The SDK provides typed error classes for different failure scenarios: validation errors, API errors, timeouts, and network errors.

## Basic error handling

Catch and handle different error types with appropriate responses for each scenario.

```javascript
try {
  const { result } = await client.payout.create({
    amount: { currency: "SLE", value: 1000 },
    destination: {
      type: "momo",
      providerId: "m17",
      phoneNumber: "+23276123456",
    },
  });
} catch (error) {
  if (error instanceof MonimeValidationError) {
    console.log(`Validation error: ${error.message}`);
    for (const issue of error.issues) {
      console.log(`  - ${issue.field}: ${issue.message}`);
    }
  } else if (error instanceof MonimeApiError) {
    console.log(`API error ${error.code}: ${error.message}`);
    if (error.isRetryable) {
      console.log("This request can be retried");
    }
  } else if (error instanceof MonimeTimeoutError) {
    console.log(`Request timed out after ${error.timeout}ms`);
  } else if (error instanceof MonimeNetworkError) {
    console.log(`Network error: ${error.message}`);
  }
}
```
