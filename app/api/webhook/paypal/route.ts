/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

// TODO: Add PayPal webhook signature verification when needed
// const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
// const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
// const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

async function verifyPayPalWebhook(request: NextRequest) {
  try {
    // const body = await request.text();
    const signature = request.headers.get('paypal-transmission-signature');
    const authAlgo = request.headers.get('paypal-auth-algo');
    const certUrl = request.headers.get('paypal-cert-url');
    const transmissionId = request.headers.get('paypal-transmission-id');

    if (!signature || !authAlgo || !certUrl || !transmissionId) {
      console.error('❌ [WEBHOOK] Missing PayPal webhook verification headers');
      return false;
    }

    // TODO: Implement proper PayPal webhook signature verification
    // This is a simplified version - in production, you should verify the signature
    console.log('🔐 [WEBHOOK] Webhook signature verification (simplified)');
    console.log('🔐 [WEBHOOK] Signature:', signature);
    console.log('🔐 [WEBHOOK] Auth Algo:', authAlgo);
    console.log('🔐 [WEBHOOK] Cert URL:', certUrl);
    console.log('🔐 [WEBHOOK] Transmission ID:', transmissionId);

    // For now, we'll accept all webhooks but log them for verification
    // In production, implement proper signature verification using PayPal SDK
    return true;
  } catch (error) {
    console.error('❌ [WEBHOOK] Webhook verification failed:', error);
    return false;
  }
}

async function processPaymentSale(eventData: any) {
  console.log('💰 [WEBHOOK] Processing payment sale event:', eventData.id);

  const resource = eventData.resource;
  const paymentId = resource.id;
  const paymentStatus = resource.status;

  if (paymentStatus !== 'COMPLETED') {
    console.log(`⏳ [WEBHOOK] Payment not completed yet. Status: ${paymentStatus}`);
    return { success: false, message: 'Payment not completed' };
  }

  // Find user by payment ID in usage history
  await dbConnect();
  const user = await User.findOne({
    'usageHistory.metadata.orderId': paymentId
  });

  if (!user) {
    console.error(`❌ [WEBHOOK] No user found for payment ID: ${paymentId}`);
    return { success: false, message: 'User not found' };
  }

  // Check if payment already processed
  const existingPayment = user.usageHistory?.find(
    (record: any) => record.metadata?.confirmedBy === 'paypal_webhook' &&
                     (record.metadata?.orderId === paymentId || record.metadata?.paymentId === paymentId)
  );

  if (existingPayment) {
    console.log(`⚠️ [WEBHOOK] Payment already processed by webhook: ${paymentId}`);
    return { success: true, message: 'Payment already processed', alreadyProcessed: true };
  }

  // Get payment amount from resource
  const amount = resource.amount?.total ? parseFloat(resource.amount.total) : 0;
  if (amount <= 0) {
    console.error(`❌ [WEBHOOK] Invalid payment amount: ${amount}`);
    return { success: false, message: 'Invalid payment amount' };
  }

  // Calculate credits (1 USD = 500 credits)
  const creditAmount = Math.floor(amount * 500);
  const previousCredits = user.credits || 0;
  const newCreditTotal = previousCredits + creditAmount;

  // Update user credits
  user.credits = Math.max(0, newCreditTotal);
  user.lastCreditPurchase = new Date();
  user.totalCreditsPurchased = (user.totalCreditsPurchased || 0) + creditAmount;
  user.paymentMethod = 'paypal';

  // Update user tier based on purchase history
  if (user.totalCreditsPurchased >= 10000) {
    user.userTier = 'premium';
  } else if (user.totalCreditsPurchased >= 1000) {
    user.userTier = 'standard';
  }

  // Log the webhook-processed credit addition
  const usageRecord = {
    action: 'credit',
    amount: creditAmount,
    description: `Credit purchase - ${creditAmount} credits via PayPal (Webhook Confirmed)`,
    timestamp: new Date(),
    metadata: {
      type: 'credit_purchase_confirmed',
      reason: 'paypal_webhook_payment_sale',
      paymentMethod: 'paypal',
      orderId: paymentId,
      previousCredits: previousCredits,
      newTotalCredits: user.credits,
      paymentAmount: amount,
      currency: resource.amount?.currency_code || 'USD',
      confirmed: true,
      confirmedBy: 'paypal_webhook',
      webhookEventId: eventData.id,
      webhookResourceType: eventData.resource_type
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

  // Save user data
  try {
    await user.save();
    console.log(`✅ [WEBHOOK] Successfully processed payment sale for user ${user.email}`);
    console.log(`📊 [WEBHOOK] Credits: ${previousCredits} → ${user.credits} (+${creditAmount})`);

    return {
      success: true,
      creditsAdded: creditAmount,
      totalCredits: user.credits,
      userTier: user.userTier
    };
  } catch (saveError) {
    console.error(`❌ [WEBHOOK] Failed to save user ${user.email}:`, saveError);
    return { success: false, message: 'Database save failed' };
  }
}

async function processSubscriptionCreated(eventData: any) {
  console.log('🔄 [WEBHOOK] Processing subscription created event:', eventData.id);

  const resource = eventData.resource;
  const subscriptionId = resource.id;
  const subscriptionStatus = resource.status;

  if (subscriptionStatus !== 'ACTIVE') {
    console.log(`⏳ [WEBHOOK] Subscription not active yet. Status: ${subscriptionStatus}`);
    return { success: false, message: 'Subscription not active' };
  }

  // Find user by subscription ID in usage history
  await dbConnect();
  const user = await User.findOne({
    'usageHistory.metadata.subscriptionId': subscriptionId
  });

  if (!user) {
    console.error(`❌ [WEBHOOK] No user found for subscription ID: ${subscriptionId}`);
    return { success: false, message: 'User not found' };
  }

  // Check if subscription already processed
  const existingSubscription = user.usageHistory?.find(
    (record: any) => record.metadata?.confirmedBy === 'paypal_webhook' &&
                     record.metadata?.subscriptionId === subscriptionId
  );

  if (existingSubscription) {
    console.log(`⚠️ [WEBHOOK] Subscription already processed by webhook: ${subscriptionId}`);
    return { success: true, message: 'Subscription already processed', alreadyProcessed: true };
  }

  // Get subscription plan from resource
  const planId = resource.plan_id || 'pro'; // Default to pro if not specified
  const subscriptionType = planId.includes('enterprise') ? 'enterprise' : 'pro';

  // Add monthly credits based on subscription type
  const monthlyCreditAmounts = {
    pro: 1000,
    enterprise: 5000
  };

  const monthlyCredits = monthlyCreditAmounts[subscriptionType as keyof typeof monthlyCreditAmounts] || 1000;
  const previousCredits = user.credits || 0;
  const newCreditTotal = previousCredits + monthlyCredits;

  // Update user subscription and credits
  user.credits = Math.max(0, newCreditTotal);
  user.subscription = {
    type: subscriptionType,
    paypalSubscriptionId: subscriptionId,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    cancelAtPeriodEnd: false
  };
  user.subscriptionStatus = 'active';
  user.paymentMethod = 'paypal';
  user.lastSubscriptionActivation = new Date();

  // Update user tier based on subscription
  if (subscriptionType === 'enterprise') {
    user.userTier = 'enterprise';
  } else if (subscriptionType === 'pro') {
    user.userTier = 'pro';
  }

  // Log the webhook-processed subscription activation
  const usageRecord = {
    action: 'credit',
    amount: monthlyCredits,
    description: `Monthly subscription credits - ${subscriptionType} plan via PayPal (Webhook Confirmed)`,
    timestamp: new Date(),
    metadata: {
      type: 'subscription_monthly_credits',
      reason: 'paypal_webhook_subscription_created',
      subscription: subscriptionType,
      paymentMethod: 'paypal',
      subscriptionId: subscriptionId,
      monthlyCredits: monthlyCredits,
      previousCredits: previousCredits,
      newTotalCredits: user.credits,
      nextCreditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      confirmed: true,
      confirmedBy: 'paypal_webhook',
      webhookEventId: eventData.id,
      webhookResourceType: eventData.resource_type
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

  // Save user data
  try {
    await user.save();
    console.log(`✅ [WEBHOOK] Successfully processed subscription for user ${user.email}`);
    console.log(`📊 [WEBHOOK] Credits: ${previousCredits} → ${user.credits} (monthly: ${monthlyCredits})`);

    return {
      success: true,
      subscriptionType: subscriptionType,
      creditsAdded: monthlyCredits,
      totalCredits: user.credits,
      userTier: user.userTier
    };
  } catch (saveError) {
    console.error(`❌ [WEBHOOK] Failed to save user ${user.email}:`, saveError);
    return { success: false, message: 'Database save failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 [WEBHOOK] Received PayPal webhook');

    // Verify webhook signature
    const isValidWebhook = await verifyPayPalWebhook(request);
    if (!isValidWebhook) {
      console.error('❌ [WEBHOOK] Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const eventData = await request.json();
    console.log('📥 [WEBHOOK] Event data:', {
      id: eventData.id,
      event_type: eventData.event_type,
      resource_type: eventData.resource_type,
      status: eventData.resource?.status
    });

    // Handle different event types
    switch (eventData.event_type) {
      case 'PAYMENT.SALE.COMPLETED':
        const paymentResult = await processPaymentSale(eventData);
        if (paymentResult.success) {
          console.log('✅ [WEBHOOK] Payment sale processed successfully');
          return NextResponse.json({
            success: true,
            message: 'Payment processed',
            data: paymentResult
          });
        } else {
          console.error('❌ [WEBHOOK] Payment sale processing failed:', paymentResult.message);
          return NextResponse.json(
            { error: paymentResult.message },
            { status: 400 }
          );
        }

      case 'BILLING.SUBSCRIPTION.CREATED':
        const subscriptionResult = await processSubscriptionCreated(eventData);
        if (subscriptionResult.success) {
          console.log('✅ [WEBHOOK] Subscription created processed successfully');
          return NextResponse.json({
            success: true,
            message: 'Subscription processed',
            data: subscriptionResult
          });
        } else {
          console.error('❌ [WEBHOOK] Subscription processing failed:', subscriptionResult.message);
          return NextResponse.json(
            { error: subscriptionResult.message },
            { status: 400 }
          );
        }

      case 'PAYMENT.CAPTURE.COMPLETED':
        console.log('💳 [WEBHOOK] Payment capture completed - already handled by sale event');
        return NextResponse.json({
          success: true,
          message: 'Payment capture noted'
        });

      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${eventData.event_type}`);
        return NextResponse.json({
          success: true,
          message: 'Event received but not processed'
        });
    }

  } catch (error) {
    console.error('❌ [WEBHOOK] Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Webhook verification endpoint for PayPal
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const challengeCode = url.searchParams.get('challenge_code');
    const verifyToken = url.searchParams.get('verify_token');

    if (!challengeCode || !verifyToken) {
      return NextResponse.json(
        { error: 'Missing verification parameters' },
        { status: 400 }
      );
    }

    console.log('🔐 [WEBHOOK] Verifying webhook with PayPal');
    console.log('🔐 [WEBHOOK] Challenge Code:', challengeCode);
    console.log('🔐 [WEBHOOK] Verify Token:', verifyToken);

    // TODO: Implement proper webhook verification response
    // This should return the challenge_code to verify webhook ownership
    return NextResponse.json({
      success: true,
      challenge_code: challengeCode,
      verified: true
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Webhook verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 500 }
    );
  }
}
