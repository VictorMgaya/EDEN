/**
 * Centralized Payment Service
 * Handles all payment-related operations in a simple, secure way
 */

import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

// Types for better type safety
export interface PaymentData {
  type: 'credits' | 'subscription';
  amount?: number;
  plan?: string;
  paymentMethod: string;
  paymentId: string;
  userEmail: string;
}

export interface PaymentResult {
  success: boolean;
  creditsAdded?: number;
  totalCredits?: number;
  userTier?: string;
  subscriptionType?: string;
  error?: string;
}

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

/**
 * Get PayPal access token with validation
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === 'your_paypal_client_id_here') {
    throw new Error('PayPal Client ID not configured');
  }

  if (!PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_SECRET === 'your_paypal_client_secret_here') {
    throw new Error('PayPal Client Secret not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Capture PayPal order
 */
export async function capturePayPalOrder(orderId: string): Promise<Record<string, unknown>> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`PayPal order capture failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get PayPal subscription details
 */
export async function getPayPalSubscription(subscriptionId: string): Promise<Record<string, unknown>> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`PayPal subscription fetch failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Find or create user by email
 */
export async function findOrCreateUser(email: string): Promise<Record<string, unknown>> {
  await dbConnect();

  let user = await User.findOne({ email });

  if (!user) {
    user = new User({
      email,
      name: email.split('@')[0],
      credits: 0,
      subscription: {
        type: 'freemium',
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false
      },
      usageHistory: []
    });
    await user.save();
    console.log(`✅ New user created: ${email}`);
  } else {
    console.log(`✅ Existing user found: ${email}`);
  }

  return user;
}

/**
 * Calculate credits from payment amount
 */
export function calculateCredits(amount: number, type: string): number {
  if (type === 'subscription') {
    const monthlyCredits = {
      pro: 1000,
      enterprise: 5000
    };
    return monthlyCredits[type as keyof typeof monthlyCredits] || 1000;
  }

  // For one-time payments: 1 USD = 500 credits
  return Math.floor(amount * 500);
}

/**
 * Update user credits and status
 */
export async function updateUserCredits(user: Record<string, unknown>, creditsToAdd: number, paymentData: PaymentData): Promise<void> {
  const previousCredits = (user.credits as number) || 0;
  const newCredits = Math.max(0, previousCredits + creditsToAdd);
  user.credits = newCredits;

  // Update user status based on payment type
  if (paymentData.type === 'credits') {
    user.lastCreditPurchase = new Date();
    const currentTotal = (user.totalCreditsPurchased as number) || 0;
    user.totalCreditsPurchased = currentTotal + creditsToAdd;
    user.paymentMethod = paymentData.paymentMethod;

    // Update tier based on purchase history
    const totalCreditsPurchased = user.totalCreditsPurchased as number;
    if (totalCreditsPurchased >= 10000) {
      user.userTier = 'premium';
    } else if (totalCreditsPurchased >= 1000) {
      user.userTier = 'standard';
    }
  } else if (paymentData.type === 'subscription') {
    user.subscription = {
      type: paymentData.plan || 'pro',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    };
    user.subscriptionStatus = 'active';
    user.paymentMethod = paymentData.paymentMethod;
    user.lastSubscriptionActivation = new Date();

    // Update tier based on subscription
    if (paymentData.plan === 'enterprise') {
      user.userTier = 'enterprise';
    } else if (paymentData.plan === 'pro') {
      user.userTier = 'pro';
    }
  }

  // Add usage record
  const usageRecord = {
    action: 'credit',
    amount: creditsToAdd,
    description: `${paymentData.type === 'credits' ? 'Credit purchase' : 'Subscription'} - ${creditsToAdd} credits via ${paymentData.paymentMethod}`,
    timestamp: new Date(),
    metadata: {
      type: paymentData.type === 'credits' ? 'credit_purchase' : 'subscription_credits',
      reason: 'payment_success',
      paymentMethod: paymentData.paymentMethod,
      paymentId: paymentData.paymentId,
      previousCredits: previousCredits,
      newTotalCredits: newCredits,
      confirmed: true
    }
  };

  if (!user.usageHistory) {
    user.usageHistory = [];
  }

  (user.usageHistory as Array<Record<string, unknown>>).unshift(usageRecord);

  // Keep only last 1000 records
  if ((user.usageHistory as Array<Record<string, unknown>>).length > 1000) {
    user.usageHistory = (user.usageHistory as Array<Record<string, unknown>>).slice(0, 1000);
  }

  await (user as { save: () => Promise<void> }).save();
  console.log(`✅ Updated user ${(user.email as string)}: ${previousCredits} → ${newCredits} credits (+${creditsToAdd})`);
}

/**
 * Process payment success - Main entry point
 */
export async function processPaymentSuccess(paymentData: PaymentData): Promise<PaymentResult> {
  try {
    // Find or create user
    const user = await findOrCreateUser(paymentData.userEmail);

    // Check for duplicate payments
    const existingPayment = (user.usageHistory as Array<Record<string, unknown>>)?.find(
      (record) => (record.metadata as Record<string, unknown>)?.paymentId === paymentData.paymentId
    );

    if (existingPayment) {
      console.log(`⚠️ Payment already processed: ${paymentData.paymentId}`);
      return {
        success: true,
        creditsAdded: existingPayment.amount as number,
        totalCredits: user.credits as number,
        userTier: user.userTier as string,
        subscriptionType: (user.subscription as Record<string, unknown>)?.type as string
      };
    }

    // Calculate credits to add
    let creditsToAdd = 0;

    if (paymentData.type === 'credits' && paymentData.amount) {
      creditsToAdd = calculateCredits(paymentData.amount, 'credits');
    } else if (paymentData.type === 'subscription' && paymentData.plan) {
      creditsToAdd = calculateCredits(0, paymentData.plan);
    } else {
      throw new Error('Invalid payment data');
    }

    // Update user
    await updateUserCredits(user, creditsToAdd, paymentData);

    return {
      success: true,
      creditsAdded: creditsToAdd,
      totalCredits: user.credits as number,
      userTier: user.userTier as string,
      subscriptionType: (user.subscription as Record<string, unknown>)?.type as string
    };

  } catch (error) {
    console.error('❌ Payment processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    };
  }
}

/**
 * Send payment success email (placeholder for future email service integration)
 */
export async function sendPaymentSuccessEmail(userEmail: string, paymentType: string, amount?: number, plan?: string): Promise<boolean> {
  try {
    console.log(`📧 Payment success email would be sent to ${userEmail}`);

    // TODO: Replace with actual email service integration
    const emailData = {
      to: userEmail,
      subject: `Payment Successful - ${paymentType === 'credits' ? 'Credits Purchased' : 'Subscription Activated'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Payment Successful! 🎉</h2>
          <p>Your payment has been processed successfully.</p>
          ${paymentType === 'credits' && amount ?
            `<p><strong>Credits:</strong> ${amount} credits</p>`
            : ''
          }
          ${paymentType === 'subscription' && plan ?
            `<p><strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</p>`
            : ''
          }
          <p>Thank you for choosing our service!</p>
        </div>
      `
    };

    console.log('📧 Email prepared:', emailData);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}
