import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { rateLimit } from '@/lib/rateLimit';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

// Initialize Stripe (you'll need to add your secret key to environment variables)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

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

    // Get user session for authentication
    console.log('🔍 [PAYMENT] Validating user session...');

    // For now, we'll use a simple approach - in production you should use proper session management
    // This is a temporary fix until proper NextAuth integration is implemented
    const userEmail = request.headers.get('x-user-email');
    const userId = request.headers.get('x-user-id');

    if (!userEmail || !userId) {
      console.error('❌ [PAYMENT] No user authentication provided');
      return NextResponse.json({
        error: 'User authentication required',
        message: 'Please log in to make a purchase'
      }, { status: 401 });
    }

    // Connect to database and verify user exists
    await dbConnect();
    console.log('✅ [PAYMENT] Database connected for user validation');

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.error(`❌ [PAYMENT] User not found in database: ${userEmail}`);
      console.error('❌ [PAYMENT] Cannot create checkout session for non-existent user');
      return NextResponse.json({
        error: 'User not found',
        message: 'Please create an account before making a purchase'
      }, { status: 404 });
    }

    console.log(`✅ [PAYMENT] User validated: ${user.email} (ID: ${user._id})`);
    console.log(`📊 [PAYMENT] Current user credits: ${user.credits || 0}`);
    console.log(`🔒 [PAYMENT] Current subscription: ${user.subscription?.type || 'freemium'}`);

    if (type === 'credits') {
      // Handle credit purchase
      const creditAmount = parseInt(credits) || 100;
      const usdAmount = Math.ceil(creditAmount / 500); // 500 credits = 1 USD

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
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
        success_url: `${request.headers.get('origin')}/purchase/success?type=credits&amount=${creditAmount}`,
        cancel_url: `${request.headers.get('origin')}/purchase/cancelled`,
        customer_email: userEmail,
        metadata: {
          type: 'credits',
          creditAmount: creditAmount.toString(),
          userEmail: userEmail,
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
        payment_method_types: ['card'],
        line_items: [
          {
            price: selectedPlan.id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${request.headers.get('origin')}/purchase/success?type=subscription&plan=${plan}`,
        cancel_url: `${request.headers.get('origin')}/purchase/cancelled`,
        customer_email: userEmail,
        metadata: {
          type: 'subscription',
          plan: plan,
          userEmail: userEmail,
        },
      });

      return NextResponse.json({ url: session.url }, { headers: responseHeaders });
    }

    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Payment API endpoint' });
}
