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

    if (!token && !subscriptionId) {
      console.error('❌ [PAYPAL] No token or subscription ID provided');
      return NextResponse.redirect(new URL('/purchase/cancelled', request.url));
    }

    await dbConnect();
    console.log('✅ [PAYPAL] Database connected');

    let paymentDetails: any = null;
    let userEmail: string | null = null;

    if (token) {
      // Handle one-time payment (credits)
      console.log('🔄 [PAYPAL] Processing credit payment...');
      paymentDetails = await capturePayPalOrder(token);

      if (paymentDetails.status !== 'COMPLETED') {
        console.error('❌ [PAYPAL] Payment not completed:', paymentDetails.status);
        return NextResponse.redirect(new URL('/purchase/cancelled', request.url));
      }

      // Extract user email from PayPal response
      userEmail = paymentDetails.payer?.email_address || null;

      if (!userEmail) {
        console.error('❌ [PAYPAL] No user email found in PayPal response');
        return NextResponse.redirect(new URL('/purchase/cancelled', request.url));
      }

      console.log(`✅ [PAYPAL] Payment completed for user: ${userEmail}`);

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

      // Extract credit amount from PayPal metadata or calculate from payment amount
      const paymentAmount = parseFloat(paymentDetails.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0');
      const creditAmount = Math.floor(paymentAmount * 500); // 1 USD = 500 credits

      console.log(`💰 [PAYPAL] Payment amount: $${paymentAmount}, Credits to add: ${creditAmount}`);

      // Update user credits with validation
      const previousCredits = user.credits || 0;
      const newCreditTotal = previousCredits + creditAmount;

      // Ensure credits don't go negative and are properly calculated
      user.credits = Math.max(0, newCreditTotal);

      // Update last credit purchase timestamp for balance tracking
      user.lastCreditPurchase = new Date();

      // Log the credit addition with comprehensive tracking
      const usageRecord = {
        action: 'credit',
        amount: creditAmount,
        description: `Credit purchase - ${creditAmount} credits via PayPal`,
        timestamp: new Date(),
        metadata: {
          type: 'credit_purchase',
          reason: 'paypal_payment_success',
          paymentMethod: 'paypal',
          orderId: token,
          previousCredits: previousCredits,
          newTotalCredits: user.credits,
          paymentAmount: paymentAmount,
          currency: 'USD'
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

      // Save with retry logic for database issues
      try {
        await user.save();
        console.log(`✅ Successfully added ${creditAmount} credits to user ${userEmail}. Total credits: ${user.credits}`);
      } catch (saveError) {
        console.error(`❌ Failed to save user ${userEmail}:`, saveError);
        // Try to save again with fresh data
        await new Promise(resolve => setTimeout(resolve, 1000));
        await user.save();
        console.log(`✅ Successfully saved user ${userEmail} on retry`);
      }

      // Send success email
      await sendPaymentSuccessEmail(userEmail, 'credits', creditAmount);

      // Redirect to success page with credit details
      const successUrl = new URL('/purchase/success', request.url);
      successUrl.searchParams.set('type', 'credits');
      successUrl.searchParams.set('amount', creditAmount.toString());
      successUrl.searchParams.set('method', 'paypal');

      return NextResponse.redirect(successUrl);
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

      // Add monthly credits based on subscription type
      const monthlyCreditAmounts = {
        pro: 1000,      // Pro: 1000 credits per month
        enterprise: 5000 // Enterprise: 5000 credits per month
      };

      const monthlyCredits = monthlyCreditAmounts[subscriptionType as keyof typeof monthlyCreditAmounts] || 1000;
      user.credits = (user.credits || 0) + monthlyCredits;

      // Update subscription activation timestamp
      user.lastSubscriptionActivation = new Date();

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
          nextCreditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next month
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

      // Save with retry logic for subscription updates
      try {
        await user.save();
        console.log(`✅ Successfully activated ${subscriptionType} subscription for user ${userEmail}`);
        console.log(`📊 Credits updated: ${previousCredits} → ${user.credits} (monthly: ${monthlyCredits})`);
      } catch (saveError) {
        console.error(`❌ Failed to save subscription for user ${userEmail}:`, saveError);
        // Try to save again with fresh data
        await new Promise(resolve => setTimeout(resolve, 1000));
        await user.save();
        console.log(`✅ Successfully saved subscription for user ${userEmail} on retry`);
      }

      // NextAuth session will automatically refresh on next request due to updated database values
      console.log(`🔄 User data updated in database - session will refresh automatically on next request`);

      // Send success email
      await sendPaymentSuccessEmail(userEmail, 'subscription', undefined, subscriptionType);

      // Redirect to success page with subscription details
      const successUrl = new URL('/purchase/success', request.url);
      successUrl.searchParams.set('type', 'subscription');
      successUrl.searchParams.set('plan', subscriptionType);
      successUrl.searchParams.set('method', 'paypal');

      return NextResponse.redirect(successUrl);
    }

    console.error('❌ [PAYPAL] Invalid payment type or missing parameters');
    return NextResponse.redirect(new URL('/purchase/cancelled', request.url));

  } catch (error) {
    console.error('❌ [PAYPAL] Error processing PayPal payment:', error);
    return NextResponse.redirect(new URL('/purchase/cancelled', request.url));
  }
}
