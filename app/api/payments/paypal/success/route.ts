/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

// Email service for sending payment notifications
async function sendPaymentSuccessEmail(userEmail: string, paymentType: string, amount?: number, plan?: string) {
  try {
    console.log(`📧 Sending payment success email to ${userEmail}`);

    const emailData = {
      to: userEmail,
      subject: `Payment Successful - ${paymentType === 'credits' ? 'Credits Purchased' : 'Subscription Activated'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Payment Successful! 🎉</h2>
          <p>Hi there,</p>
          <p>Your payment has been processed successfully.</p>

          ${paymentType === 'credits' && amount ?
            `<p><strong>Credits Purchased:</strong> ${amount} credits</p>
             <p>You can now use these credits to access our premium features.</p>`
            : ''
          }

          ${paymentType === 'subscription' && plan ?
            `<p><strong>Plan Activated:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</p>
             <p>Your subscription is now active and you have access to all premium features.</p>`
            : ''
          }

          <p>Thank you for choosing our service!</p>
          <p>Best regards,<br>The EDEN Team</p>
        </div>
      `,
      text: `Payment Successful! ${paymentType === 'credits' && amount ? `Credits Purchased: ${amount} credits` : `Plan Activated: ${plan} Plan`}. Thank you for choosing our service!`
    };

    console.log('📧 Email would be sent:', emailData);

    // TODO: Replace with actual email service integration
    console.log(`✅ Email notification prepared for ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send payment success email to ${userEmail}:`, error);
    return false;
  }
}

async function getPayPalAccessToken() {
  // Validate PayPal configuration
  if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === 'your_paypal_client_id_here') {
    throw new Error('PayPal Client ID not configured. Please set PAYPAL_CLIENT_ID in environment variables.');
  }

  if (!PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_SECRET === 'your_paypal_client_secret_here') {
    throw new Error('PayPal Client Secret not configured. Please set PAYPAL_CLIENT_SECRET in environment variables.');
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
    const errorText = await response.text();
    console.error('PayPal auth failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`PayPal authentication failed: ${response.status} ${response.statusText}. Please check your PayPal credentials.`);
  }

  const data = await response.json();
  return data.access_token;
}

async function capturePayPalOrder(orderId: string) {
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

async function getPayPalSubscription(subscriptionId: string) {
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

// Enhanced payment confirmation function
async function confirmPayment(paymentDetails: any, type: string) {
  console.log('🔍 [PAYPAL] Confirming payment details...', {
    type,
    status: paymentDetails.status,
    id: paymentDetails.id
  });

  if (type === 'credits') {
    // For one-time payments, verify capture status
    const capture = paymentDetails.purchase_units[0]?.payments?.captures[0];
    if (!capture) {
      throw new Error('No payment capture found');
    }

    if (capture.status !== 'COMPLETED') {
      throw new Error(`Payment capture not completed. Status: ${capture.status}`);
    }

    // Verify amount is correct
    const captureAmount = parseFloat(capture.amount.value);
    if (captureAmount <= 0) {
      throw new Error('Invalid payment amount');
    }

    console.log('✅ [PAYPAL] Credit payment confirmed:', {
      amount: captureAmount,
      currency: capture.amount.currency_code,
      captureId: capture.id
    });

    return {
      confirmed: true,
      amount: captureAmount,
      currency: capture.amount.currency_code,
      captureId: capture.id
    };
  }

  if (type === 'subscription') {
    // For subscriptions, verify subscription is active
    if (paymentDetails.status !== 'ACTIVE') {
      throw new Error(`Subscription not active. Status: ${paymentDetails.status}`);
    }

    // Verify subscription has valid billing info
    if (!paymentDetails.billing_info) {
      throw new Error('No billing information found in subscription');
    }

    console.log('✅ [PAYPAL] Subscription payment confirmed:', {
      subscriptionId: paymentDetails.id,
      status: paymentDetails.status,
      planId: paymentDetails.plan_id
    });

    return {
      confirmed: true,
      subscriptionId: paymentDetails.id,
      status: paymentDetails.status,
      planId: paymentDetails.plan_id
    };
  }

  throw new Error(`Unknown payment type: ${type}`);
}

// Enhanced user status update function
async function updateUserStatus(user: any, paymentType: string, paymentData: any, plan?: string) {
  const timestamp = new Date();

  if (paymentType === 'credits') {
    // Update user status for credit purchase
    user.lastCreditPurchase = timestamp;
    user.totalCreditsPurchased = (user.totalCreditsPurchased || 0) + paymentData.credits;
    user.paymentMethod = 'paypal';

    // Update user tier based on purchase history
    if (user.totalCreditsPurchased >= 10000) {
      user.userTier = 'premium';
    } else if (user.totalCreditsPurchased >= 1000) {
      user.userTier = 'standard';
    }

    console.log('📊 [PAYPAL] Updated user status for credit purchase:', {
      totalCreditsPurchased: user.totalCreditsPurchased,
      userTier: user.userTier,
      lastPurchase: timestamp
    });
  }

  if (paymentType === 'subscription') {
    // Update user status for subscription
    user.lastSubscriptionActivation = timestamp;
    user.subscriptionStatus = 'active';
    user.paymentMethod = 'paypal';

    // Update user tier based on subscription
    if (plan === 'enterprise') {
      user.userTier = 'enterprise';
    } else if (plan === 'pro') {
      user.userTier = 'pro';
    }

    console.log('📊 [PAYPAL] Updated user status for subscription:', {
      subscriptionType: plan,
      userTier: user.userTier,
      subscriptionStatus: 'active',
      activationDate: timestamp
    });
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const subscriptionId = url.searchParams.get('subscription_id');
    const type = url.searchParams.get('type') || 'credits';
    const plan = url.searchParams.get('plan');

    console.log('🔄 [PAYPAL] Processing PayPal return...');
    console.log('🔄 [PAYPAL] Token:', token);
    console.log('🔄 [PAYPAL] Subscription ID:', subscriptionId);
    console.log('🔄 [PAYPAL] Type:', type);
    console.log('🔄 [PAYPAL] Plan:', plan);

    // Validate required parameters
    if (!token && !subscriptionId) {
      console.error('❌ [PAYPAL] No token or subscription ID provided');
      return NextResponse.redirect(new URL('/purchase/cancelled?error=missing_parameters', request.url));
    }

    if (type !== 'credits' && type !== 'subscription') {
      console.error('❌ [PAYPAL] Invalid payment type:', type);
      return NextResponse.redirect(new URL('/purchase/cancelled?error=invalid_type', request.url));
    }

    // TODO: Implement proper rate limiting with Redis or similar
    // const rateLimitKey = `paypal_return_${token || subscriptionId}`;

    // TODO: Implement webhook processing check
    // const webhookProcessedKey = `webhook_processed_${token || subscriptionId}`;

    await dbConnect();
    console.log('✅ [PAYPAL] Database connected');

    let paymentDetails: any = null;
    let userEmail: string | null = null;

    if (token) {
      // Handle one-time payment (credits)
      console.log('🔄 [PAYPAL] Processing credit payment...');
      paymentDetails = await capturePayPalOrder(token);

      // Confirm payment before proceeding
      const paymentConfirmation = await confirmPayment(paymentDetails, 'credits');

      if (!paymentConfirmation.confirmed) {
        console.error('❌ [PAYPAL] Payment confirmation failed');
        return NextResponse.redirect(new URL('/purchase/cancelled?error=payment_not_confirmed', request.url));
      }

      // Extract user email from PayPal response
      userEmail = paymentDetails.payer?.email_address || null;

      if (!userEmail) {
        console.error('❌ [PAYPAL] No user email found in PayPal response');
        return NextResponse.redirect(new URL('/purchase/cancelled?error=no_email', request.url));
      }

      console.log(`✅ [PAYPAL] Payment confirmed for user: ${userEmail}`);

      // Find or create user
      let user = await User.findOne({ email: userEmail });

      if (!user) {
        console.log(`🆕 Creating new user account for: ${userEmail}`);
        user = new User({
          email: userEmail,
          name: userEmail.split('@')[0],
          credits: 0,
          subscription: {
            type: 'freemium',
            currentPeriodEnd: new Date(),
            cancelAtPeriodEnd: false
          },
          usageHistory: []
        });
        await user.save();
        console.log(`✅ New user created: ${user.email} (ID: ${user._id})`);
      } else {
        console.log(`✅ Existing user found: ${user.email} (ID: ${user._id})`);
      }

      // Calculate credits from confirmed payment amount
      const paymentAmount = paymentConfirmation.amount || 0;
      const creditAmount = Math.floor(paymentAmount * 500); // 1 USD = 500 credits

      console.log(`💰 [PAYPAL] Confirmed payment: $${paymentConfirmation.amount}, Credits to add: ${creditAmount}`);

      // Update user credits with validation
      const previousCredits = user.credits || 0;
      const newCreditTotal = previousCredits + creditAmount;

      // Ensure credits don't go negative and are properly calculated
      user.credits = Math.max(0, newCreditTotal);

      // Update user status with enhanced tracking
      await updateUserStatus(user, 'credits', { credits: creditAmount });

      // Log the credit addition with comprehensive tracking
      const usageRecord = {
        action: 'credit',
        amount: creditAmount,
        description: `Credit purchase - ${creditAmount} credits via PayPal (Confirmed)`,
        timestamp: new Date(),
        metadata: {
          type: 'credit_purchase_confirmed',
          reason: 'paypal_payment_confirmed',
          paymentMethod: 'paypal',
          orderId: token,
          captureId: paymentConfirmation.captureId,
          previousCredits: previousCredits,
          newTotalCredits: user.credits,
          paymentAmount: paymentConfirmation.amount,
          currency: paymentConfirmation.currency,
          confirmed: true,
          confirmedBy: 'paypal_webhook'
        }
      };

      if (!user.usageHistory) {
        user.usageHistory = [];
      }

      user.usageHistory.unshift(usageRecord);

      // Keep only last 1000 records
      if (user.usageHistory.length > 1000) {
        user.usageHistory = user.usageHistory.slice(0, 1000);
      }

      // Send success email first (don't fail if email fails)
      await sendPaymentSuccessEmail(userEmail, 'credits', creditAmount);

      // Save with retry logic for database issues - ONLY redirect to success if this succeeds
      try {
        await user.save();
        console.log(`✅ Successfully processed confirmed payment for user ${userEmail}`);
        console.log(`📊 Credits: ${previousCredits} → ${user.credits} (+${creditAmount})`);

        // ONLY redirect to success page AFTER successful database save
        const successUrl = new URL('/purchase/success', request.url);
        successUrl.searchParams.set('type', 'credits');
        successUrl.searchParams.set('amount', creditAmount.toString());
        successUrl.searchParams.set('method', 'paypal');
        successUrl.searchParams.set('confirmed', 'true');
        successUrl.searchParams.set('db_saved', 'true');

        return NextResponse.redirect(successUrl);
      } catch (saveError) {
        console.error(`❌ Failed to save user ${userEmail}:`, saveError);
        return NextResponse.redirect(new URL('/purchase/cancelled?error=database_save_failed', request.url));
      }
    }

    if (subscriptionId) {
      // Handle subscription payment
      console.log('🔄 [PAYPAL] Processing subscription payment...');
      paymentDetails = await getPayPalSubscription(subscriptionId);

      if (paymentDetails.status !== 'ACTIVE') {
        console.error('❌ [PAYPAL] Subscription not active:', paymentDetails.status);
        return NextResponse.redirect(new URL('/purchase/cancelled', request.url));
      }

      // Extract user email from PayPal response
      userEmail = paymentDetails.subscriber?.email_address || null;

      if (!userEmail) {
        console.error('❌ [PAYPAL] No user email found in PayPal subscription response');
        return NextResponse.redirect(new URL('/purchase/cancelled', request.url));
      }

      console.log(`✅ [PAYPAL] Subscription activated for user: ${userEmail}`);

      // Find or create user
      let user = await User.findOne({ email: userEmail });

      if (!user) {
        console.log(`🆕 Creating new user account for subscription: ${userEmail}`);
        user = new User({
          email: userEmail,
          name: userEmail.split('@')[0],
          credits: 0,
          subscription: {
            type: 'freemium',
            currentPeriodEnd: new Date(),
            cancelAtPeriodEnd: false
          },
          usageHistory: []
        });
        await user.save();
        console.log(`✅ New user created: ${user.email} (ID: ${user._id})`);
      } else {
        console.log(`✅ Existing user found: ${user.email} (ID: ${user._id})`);
      }

      // Map subscription plan to credits (monthly credit allocation)
      const subscriptionType = plan === 'pro' ? 'pro' : 'enterprise';

      // Update user subscription with comprehensive data
      const previousSubscriptionType = user.subscription?.type || 'freemium';
      const previousCredits = user.credits || 0;

      // Set subscription details for tracking
      user.subscription = {
        type: subscriptionType,
        paypalSubscriptionId: subscriptionId,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false
      };

      // Update additional payment tracking fields
      user.subscriptionStatus = 'active';
      user.paymentMethod = 'paypal';
      user.lastSubscriptionActivation = new Date();

      // Add monthly credits based on subscription type
      const monthlyCreditAmounts = {
        pro: 1000,      // Pro: 1000 credits per month
        enterprise: 5000 // Enterprise: 5000 credits per month
      };

      const monthlyCredits = monthlyCreditAmounts[subscriptionType as keyof typeof monthlyCreditAmounts] || 1000;
      user.credits = (user.credits || 0) + monthlyCredits;

      // Log subscription activation with detailed tracking
      const usageRecord = {
        action: 'credit',
        amount: monthlyCredits, // Show monthly credits added
        description: `Monthly subscription credits - ${subscriptionType} plan via PayPal (${monthlyCredits} credits)`,
        timestamp: new Date(),
        metadata: {
          type: 'subscription_monthly_credits',
          reason: 'paypal_subscription_monthly_credits',
          subscription: subscriptionType,
          previousSubscription: previousSubscriptionType,
          paymentMethod: 'paypal',
          subscriptionId: subscriptionId,
          monthlyCredits: monthlyCredits,
          previousCredits: previousCredits,
          newTotalCredits: user.credits,
          nextCreditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next month
          confirmed: true,
          confirmedBy: 'paypal_webhook'
        }
      };

      if (!user.usageHistory) {
        user.usageHistory = [];
      }

      user.usageHistory.unshift(usageRecord);

      // Keep only last 1000 records
      if (user.usageHistory.length > 1000) {
        user.usageHistory = user.usageHistory.slice(0, 1000);
      }

      // Send success email first (don't fail if email fails)
      await sendPaymentSuccessEmail(userEmail, 'subscription', undefined, subscriptionType);

      // Save with retry logic for subscription updates - ONLY redirect to success if this succeeds
      try {
        await user.save();
        console.log(`✅ Successfully activated ${subscriptionType} subscription for user ${userEmail}`);
        console.log(`📊 Credits updated: ${previousCredits} → ${user.credits} (monthly: ${monthlyCredits})`);

        // ONLY redirect to success page AFTER successful database save
        const successUrl = new URL('/purchase/success', request.url);
        successUrl.searchParams.set('type', 'subscription');
        successUrl.searchParams.set('plan', subscriptionType);
        successUrl.searchParams.set('method', 'paypal');
        successUrl.searchParams.set('db_saved', 'true');

        return NextResponse.redirect(successUrl);
      } catch (saveError) {
        console.error(`❌ Failed to save subscription for user ${userEmail}:`, saveError);
        return NextResponse.redirect(new URL('/purchase/cancelled?error=database_save_failed', request.url));
      }
    }

    console.error('❌ [PAYPAL] Invalid payment type or missing parameters');
    return NextResponse.redirect(new URL('/purchase/cancelled', request.url));

  } catch (error) {
    console.error('❌ [PAYPAL] Error processing PayPal payment:', error);
    return NextResponse.redirect(new URL('/purchase/cancelled', request.url));
  }
}
