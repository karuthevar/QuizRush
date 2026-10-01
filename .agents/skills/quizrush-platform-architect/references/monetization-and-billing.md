# QuizRush Monetization & Billing Engine

This document details the pricing model, checkout flows, credit ledger, and simulated payment capabilities of QuizRush.

---

## 1. Monetization Rules

- **Trial Model**: Every new host receives **1 Free Match Trial** out of the box.
- **Paid Passes**: After the free trial is consumed, hosting a live quiz requires a **Quiz Pass at $4.99 USD**.
- **Credit Deductions**: Credits are deducted upon launching a match from `/host/lobby/[pin]`.
- **Pass Benefits**: Unlimited players (up to 100 per game), live audio engine, custom questions, QR code joining, podium celebration, and email scorecard dispatch.

---

## 2. Stripe Checkout Integration

### Endpoint: `/api/checkout`
- **Method**: `POST`
- **Parameters**: `{ userId, userEmail, origin }`
- **Unit Amount**: `499` ($4.99 USD)
- **Currency**: `usd`
- **Success URL**: `${origin}/host/checkout/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel URL**: `${origin}/host/dashboard`

### Fallback Simulation Mode
If `STRIPE_SECRET_KEY` is absent or configured to a test placeholder, `/api/checkout` safely generates a simulated checkout response allowing organizers to test without real card processing.

---

## 3. Host Billing Profile Structure (`billingEngine.ts`)

```typescript
export interface HostBillingProfile {
  hostId: string;
  freeTrialsUsed: number;
  freeTrialsTotal: number; // Defaults to 1
  paidCredits: number;
  paymentHistory: PaymentTransaction[];
  updatedAt: number;
}

export interface PaymentTransaction {
  id: string;
  amount: number; // e.g. 499 for $4.99
  currency: string;
  timestamp: number;
  stripeSessionId?: string;
  status: 'succeeded' | 'simulated';
}
```

---

## 4. UI Components

- **Navbar Pass Indicator**: Displays remaining free trial (`1 Free Pass`), current credit balance (`N Passes`), or a `Get Pass ($4.99)` button.
- **PaywallModal**: An interactive modal that explains pass features, offers a direct Stripe Checkout button, and includes a **"Simulate $4.99 Test Purchase"** button for staging verification.
- **Admin Revenue Center**: Accessible on `/admin`, displays real-time aggregated metrics: Total Passes Sold, Estimated Revenue ($), and transactions ledger.
