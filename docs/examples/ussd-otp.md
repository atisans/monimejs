# USSD OTP Examples

USSD OTP provides phone-bound verification through a USSD dial flow. Useful for phone number verification, transaction authorization, account verification, and password resets.

## create

Create a basic OTP for phone number verification with a custom message.

```javascript
const { success, result } = await client.ussdOtp.create({
  authorizedPhoneNumber: phoneNumber,
  verificationMessage: "You have successfully verified your account.",
  duration: "5m",
  metadata: {
    action: "basic_verification",
  },
});
```

## create for registration

Create an OTP during user registration to verify phone number ownership.

```javascript
const { success, result } = await client.ussdOtp.create({
  authorizedPhoneNumber: phoneNumber,
  verificationMessage: "Welcome! Your account is now verified.",
  duration: "5m",
  metadata: {
    flow: "user_registration",
    userId: userId,
  },
});
```

## create for transaction authorization

Create an OTP for authorizing high-value transactions or sensitive operations.

```javascript
const { success, result } = await client.ussdOtp.create({
  authorizedPhoneNumber: phoneNumber,
  verificationMessage: `Transaction of ${amount} SLE approved. Thank you!`,
  duration: "2m",
  metadata: {
    flow: "transaction_authorization",
    transactionId: transactionId,
  },
});
```

## create for password reset

Create an OTP for password reset flow to ensure account security.

```javascript
const { success, result } = await client.ussdOtp.create({
  authorizedPhoneNumber: phoneNumber,
  verificationMessage: "Password reset verified. Check your email for next steps.",
  duration: "10m",
  metadata: {
    flow: "password_reset",
    userId: userId,
  },
});
```

## get

```javascript
const { success, result } = await client.ussdOtp.get(otpId);
```

## list

```javascript
const { success, result, pagination } = await client.ussdOtp.list();
```

## delete

```javascript
await client.ussdOtp.delete(otpId);
```
