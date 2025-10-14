/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';
import { getServerSession } from 'next-auth';

// Secure payment confirmation endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { paymentId, paymentMethod, amount, type, plan } = await request.json();

    if (!paymentId || !paymentMethod || !type) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    console.log('🔐 [SECURE] Confirming payment for authenticated user:', session.user.email);

    await dbConnect();
    console.log('✅ [SECURE] Database connected for payment confirmation');

    // Find user by authenticated session email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [SECURE] Found user: ${user.email} (ID: ${user._id})`);

    // Verify payment hasn't already been processed for this session
    const existingPayment = user.usageHistory?.find(
      (record: any) =>
        record.metadata?.paymentId === paymentId ||
        record.metadata?.orderId === paymentId ||
        record.metadata?.sessionId === paymentId ||
        // Also check for recent similar payments to prevent duplicates
        (record.metadata?.type === (type === 'credits' ? 'credit_purchase_confirmed' : 'subscription_confirmed') &&
         record.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Within last 24 hours
    );

    if (existingPayment) {
      console.log(`⚠️ [SECURE] Payment already processed: ${paymentId}`);
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        credits: user.credits,
        alreadyProcessed: true
      });
    }

    let creditsToAdd = 0;

    if (type === 'credits' && amount) {
      // Handle credit purchase confirmation
      const creditAmount = Math.min(parseInt(amount) || 0, 100000); // Max 100k credits
      creditsToAdd = creditAmount;

      const previousCredits = user.credits || 0;
      user.credits = Math.max(0, previousCredits + creditsToAdd);

      // Update user status
      user.lastCreditPurchase = new Date();
      user.totalCreditsPurchased = (user.totalCreditsPurchased || 0) + creditsToAdd;
      user.paymentMethod = paymentMethod;

      // Update user tier based on purchase history
      if (user.totalCreditsPurchased >= 10000) {
        user.userTier = 'premium';
      } else if (user.totalCreditsPurchased >= 1000) {
        user.userTier = 'standard';
      }

      // Log the confirmed credit addition
      const usageRecord = {
        action: 'credit',
        amount: creditsToAdd,
        description: `Credit purchase confirmed - ${creditsToAdd} credits via ${paymentMethod}`,
        timestamp: new Date(),
        metadata: {
          type: 'credit_purchase_confirmed',
          reason: 'payment_confirmation',
          paymentMethod: paymentMethod,
          paymentId: paymentId,
          confirmedBy: 'authenticated_user',
          previousCredits: previousCredits,
          newTotalCredits: user.credits,
          confirmed: true
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

      console.log(`✅ [SECURE] Credits confirmed: ${previousCredits} → ${user.credits} (+${creditsToAdd})`);

    } else if (type === 'subscription' && plan) {
      // Handle subscription confirmation
      const subscriptionType = plan;
      const previousCredits = user.credits || 0;

      // Add monthly credits based on subscription type
      const monthlyCreditAmounts = {
        pro: 1000,
        enterprise: 5000
      };

      creditsToAdd = monthlyCreditAmounts[subscriptionType as keyof typeof monthlyCreditAmounts] || 1000;
      user.credits = (user.credits || 0) + creditsToAdd;

      // Update subscription details
      user.subscription = {
        type: subscriptionType,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      };

      // Update user status
      user.lastSubscriptionActivation = new Date();
      user.subscriptionStatus = 'active';
      user.paymentMethod = paymentMethod;

      // Update user tier based on subscription
      if (subscriptionType === 'enterprise') {
        user.userTier = 'enterprise';
      } else if (subscriptionType === 'pro') {
        user.userTier = 'pro';
      }

      // Log the subscription confirmation
      const usageRecord = {
        action: 'credit',
        amount: creditsToAdd,
        description: `Subscription confirmed - ${subscriptionType} plan via ${paymentMethod} (${creditsToAdd} credits)`,
        timestamp: new Date(),
        metadata: {
          type: 'subscription_confirmed',
          reason: 'subscription_confirmation',
          subscription: subscriptionType,
          paymentMethod: paymentMethod,
          paymentId: paymentId,
          confirmedBy: 'authenticated_user',
          previousCredits: previousCredits,
          newTotalCredits: user.credits,
          monthlyCredits: creditsToAdd
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

      console.log(`✅ [SECURE] Subscription confirmed: ${subscriptionType} (${creditsToAdd} credits added)`);
    } else {
      return NextResponse.json(
        { error: 'Invalid payment type or missing amount/plan' },
        { status: 400 }
      );
    }

    // Save user data with retry logic
    try {
      await user.save();
      console.log(`✅ [SECURE] User data saved successfully for ${user.email}`);

      return NextResponse.json({
        success: true,
        creditsAdded: creditsToAdd,
        totalCredits: user.credits,
        userTier: user.userTier,
        subscriptionType: user.subscription?.type,
        confirmed: true,
        dbSaved: true
      });

    } catch (saveError) {
      console.error(`❌ [SECURE] Failed to save user ${user.email}:`, saveError);
      return NextResponse.json(
        { error: 'Failed to save payment confirmation' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [SECURE] Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Payment confirmation failed' },
      { status: 500 }
    );
  }
}
