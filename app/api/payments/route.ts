import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { rateLimit } from '@/lib/rateLimit';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

// Initialize Stripe (you'll need to add your secret key to environment variables)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const responseHeaders = {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
    };

    const { type, credits, plan } = await request.json();

    // Get optional user session for existing users
    console.log('🔍 [PAYMENT] Checking for existing user session...');

    // Optional user identification - not required for payment
    const userEmail = request.headers.get('x-user-email');

    let user = null;
    if (userEmail) {
      // Connect to database and check if user exists (optional)
      await dbConnect();
      console.log('✅ [PAYMENT] Database connected for optional user check');

      user = await User.findOne({ email: userEmail });
      if (user) {
        console.log(`✅ [PAYMENT] Existing user found: ${user.email} (ID: ${user._id})`);
        console.log(`📊 [PAYMENT] Current user credits: ${user.credits || 0}`);
        console.log(`🔒 [PAYMENT] Current subscription: ${user.subscription?.type || 'freemium'}`);
      } else {
        console.log(`ℹ️ [PAYMENT] New user - will be created after successful payment`);
      }
    } else {
      console.log(`ℹ️ [PAYMENT] No user email provided - guest checkout`);
    }

    if (type === 'credits') {
      // Handle credit purchase
      const creditAmount = parseInt(credits) || 100;
      const usdAmount = Math.ceil(creditAmount / 500); // 500 credits = 1 USD

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${creditAmount} Credits`,
                description: `Purchase ${creditAmount} credits for your account`,
              },
              unit_amount: usdAmount * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_method_types: ['card'],
        success_url: `${request.headers.get('origin')}/purchase/success?type=credits&amount=${creditAmount}`,
        cancel_url: `${request.headers.get('origin')}/purchase/cancelled`,
        customer_email: userEmail || undefined,
        metadata: {
          type: 'credits',
          creditAmount: creditAmount.toString(),
          userEmail: userEmail || '',
        },
      });

      return NextResponse.json({ url: session.url }, { headers: responseHeaders });
    }

    if (type === 'subscription') {
      // Handle subscription plans
      const planPrices = {
        pro: {
          id: process.env.STRIPE_PRO_PRICE_ID,
          amount: 29
        },
        enterprise: {
          id: process.env.STRIPE_ENTERPRISE_PRICE_ID,
          amount: 99
        },
      };

      const selectedPlan = planPrices[plan as keyof typeof planPrices];
      if (!selectedPlan || !selectedPlan.id || selectedPlan.id.startsWith('price_your_')) {
        return NextResponse.json({
          error: 'Subscription not configured',
          message: 'Please configure Stripe Price IDs in your environment variables. See STRIPE_SETUP_README.md for instructions.'
        }, { status: 500 });
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: selectedPlan.id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        payment_method_types: ['card'],
        success_url: `${request.headers.get('origin')}/purchase/success?type=subscription&plan=${plan}`,
        cancel_url: `${request.headers.get('origin')}/purchase/cancelled`,
        customer_email: userEmail || undefined,
        metadata: {
          type: 'subscription',
          plan: plan,
          userEmail: userEmail || '',
        },
      });

      return NextResponse.json({ url: session.url }, { headers: responseHeaders });
    }

    if (type === 'paypal_credits') {
      // Handle PayPal credit purchase
      const creditAmount = parseInt(credits) || 100;
      const usdAmount = Math.ceil(creditAmount / 500); // 500 credits = 1 USD

      // Create PayPal order
      const paypalOrder = await createPayPalOrder(usdAmount, 'credits', creditAmount, userEmail);

      return NextResponse.json({
        orderId: paypalOrder.id,
        approvalUrl: paypalOrder.approvalUrl
      }, { headers: responseHeaders });
    }

    if (type === 'paypal_subscription') {
      // Handle PayPal subscription
      const subscriptionPrices = {
        pro: 29,
        enterprise: 99,
      };

      const amount = subscriptionPrices[plan as keyof typeof subscriptionPrices] || 29;

      // Create PayPal subscription
      const paypalSubscription = await createPayPalSubscription(amount, plan, userEmail);

      return NextResponse.json({
        subscriptionId: paypalSubscription.id,
        approvalUrl: paypalSubscription.approvalUrl
      }, { headers: responseHeaders });
    }

    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
  } catch (error) {
    console.error('Payment error:', error);

    // Provide more specific error messages for common issues
    let errorMessage = 'Payment failed';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('PayPal plan ID not configured')) {
        errorMessage = error.message;
        statusCode = 500;
      } else if (error.message.includes('PayPal auth failed')) {
        errorMessage = 'PayPal authentication failed. Please check your PayPal credentials.';
        statusCode = 500;
      } else if (error.message.includes('PayPal order creation failed')) {
        errorMessage = 'Failed to create PayPal payment. Please try again.';
        statusCode = 500;
      } else if (error.message.includes('PayPal subscription creation failed')) {
        errorMessage = 'Failed to create PayPal subscription. Please check your plan configuration.';
        statusCode = 500;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// PayPal helper functions
async function getPayPalAccessToken() {
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
    throw new Error(`PayPal auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createPayPalOrder(amount: number, type: string, creditAmount?: number, userEmail?: string | null) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
          description: type === 'credits' ? `${creditAmount} Credits` : 'Subscription Purchase',
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/paypal/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/purchase/cancelled`,
      },
      metadata: {
        type,
        creditAmount: creditAmount?.toString(),
        userEmail: userEmail || '',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`PayPal order creation failed: ${response.statusText}`);
  }

  const order = await response.json();

  // Find approval URL
  const approvalUrl = order.links?.find((link: { rel: string; href: string }) => link.rel === 'approve')?.href;

  return {
    id: order.id,
    approvalUrl,
  };
}

async function createPayPalSubscription(amount: number, plan: string, userEmail?: string | null) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      plan_id: getPayPalPlanId(plan),
      subscriber: {
        email_address: userEmail || undefined,
      },
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/paypal/success?type=subscription&plan=${plan}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/purchase/cancelled`,
      },
      metadata: {
        type: 'subscription',
        plan,
        userEmail: userEmail || '',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`PayPal subscription creation failed: ${response.statusText}`);
  }

  const subscription = await response.json();

  // Find approval URL
  const approvalUrl = subscription.links?.find((link: { rel: string; href: string }) => link.rel === 'approve')?.href;

  return {
    id: subscription.id,
    approvalUrl,
  };
}

function getPayPalPlanId(plan: string): string {
  // Map our plans to PayPal plan IDs (you'll need to create these in your PayPal account)
  const planIds = {
    pro: process.env.PAYPAL_PRO_PLAN_ID || '',
    enterprise: process.env.PAYPAL_ENTERPRISE_PLAN_ID || '',
  };

  const planId = planIds[plan as keyof typeof planIds] || '';

  if (!planId || planId.includes('your_paypal_')) {
    throw new Error(`PayPal plan ID not configured for ${plan} plan. Please set PAYPAL_${plan.toUpperCase()}_PLAN_ID in environment variables.`);
  }

  return planId;
}

export async function GET() {
  return NextResponse.json({ message: 'Payment API endpoint' });
}
