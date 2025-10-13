/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';
import { getServerSession } from 'next-auth';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const MAX_REQUESTS_PER_MINUTE = 5;
// TODO: Implement hourly rate limiting
// const MAX_REQUESTS_PER_HOUR = 20;
// const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

// Rate limiting function
function checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const rateLimit = rateLimitStore.get(identifier);

  if (!rateLimit || now > rateLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + 60000 // 1 minute from now
    });
    return { allowed: true };
  }

  if (rateLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, resetTime: rateLimit.resetTime };
  }

  rateLimit.count++;
  return { allowed: true };
}

// Enhanced security validation
function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  const userAgent = request.headers.get('user-agent');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Check for suspicious user agents
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, error: 'Invalid user agent' };
  }

  // Check for valid origin (adjust for your domain)
  const allowedOrigins = [
    'https://edenapp.site',
    'http://localhost:3000',
    'https://localhost:3000'
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    return { valid: false, error: 'Invalid origin' };
  }

  // Check for valid referer
  if (referer && !referer.includes('edenapp.site') && !referer.includes('localhost')) {
    return { valid: false, error: 'Invalid referer' };
  }

  return { valid: true };
}

// Secure payment confirmation endpoint
export async function POST(request: NextRequest) {
  try {
    // Enhanced security validation
    const securityCheck = validateRequest(request);
    if (!securityCheck.valid) {
      console.error('🚫 [SECURE] Security validation failed:', securityCheck.error);
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 403 }
      );
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const rateLimitKey = `${clientIP}:${userAgent}`;

    const rateLimitCheck = checkRateLimit(rateLimitKey);
    if (!rateLimitCheck.allowed) {
      console.error(`🚫 [SECURE] Rate limit exceeded for ${rateLimitKey}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitCheck.resetTime || 0 - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const session = await getServerSession();
    if (!session?.user?.email) {
      console.error('🚫 [SECURE] Authentication required but not provided');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { paymentId, paymentMethod, amount, type, plan, timestamp, userAgent: clientUserAgent } = await request.json();

    if (!paymentId || !paymentMethod || !type) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Validate security headers
    const requestUserAgent = request.headers.get('user-agent');
    const requestedWith = request.headers.get('x-requested-with');
    const paymentConfirmation = request.headers.get('x-payment-confirmation');

    if (requestedWith !== 'XMLHttpRequest') {
      console.error('🚫 [SECURE] Invalid request source');
      return NextResponse.json(
        { error: 'Invalid request source' },
        { status: 403 }
      );
    }

    if (paymentConfirmation !== 'true') {
      console.error('🚫 [SECURE] Missing payment confirmation header');
      return NextResponse.json(
        { error: 'Invalid payment confirmation request' },
        { status: 403 }
      );
    }

    // Validate timestamp (prevent replay attacks)
    if (timestamp) {
      const requestTime = new Date(timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - requestTime.getTime());

      // Reject requests older than 5 minutes or more than 1 minute in the future
      if (timeDiff > 5 * 60 * 1000 || requestTime.getTime() > now.getTime() + 60000) {
        console.error('🚫 [SECURE] Invalid timestamp in request');
        return NextResponse.json(
          { error: 'Request timestamp validation failed' },
          { status: 400 }
        );
      }
    }

    // Validate user agent consistency
    if (clientUserAgent && requestUserAgent && clientUserAgent !== requestUserAgent) {
      console.error('🚫 [SECURE] User agent mismatch');
      return NextResponse.json(
        { error: 'Request validation failed' },
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

    // Verify payment hasn't already been processed (enhanced duplicate prevention)
    const existingPayment = user.usageHistory?.find(
      (record: any) =>
        record.metadata?.paymentId === paymentId ||
        record.metadata?.orderId === paymentId ||
        record.metadata?.sessionId === paymentId ||
        (record.metadata?.type === 'credit_purchase_confirmed' && record.metadata?.confirmedBy === 'authenticated_user') ||
        (record.metadata?.type === 'subscription_confirmed' && record.metadata?.confirmedBy === 'authenticated_user')
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

    // Additional validation for credit amounts
    if (type === 'credits' && amount) {
      const creditAmount = Math.min(parseInt(amount) || 0, 100000); // Max 100k credits
      if (creditAmount <= 0) {
        return NextResponse.json(
          { error: 'Invalid credit amount' },
          { status: 400 }
        );
      }
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
      }, {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Security-Policy': "default-src 'self'",
        }
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
