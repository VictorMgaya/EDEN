import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe (you'll need to add your secret key to environment variables)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { type, credits, plan } = await request.json();

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
        metadata: {
          type: 'credits',
          creditAmount: creditAmount.toString(),
        },
      });

      return NextResponse.json({ url: session.url });
    }

    if (type === 'subscription') {
      // Handle subscription plans
      const planPrices = {
        pro: { id: 'price_pro_id', amount: 29 }, // Replace with actual Stripe price IDs
        enterprise: { id: 'price_enterprise_id', amount: 99 },
      };

      const selectedPlan = planPrices[plan as keyof typeof planPrices];
      if (!selectedPlan) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
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
        metadata: {
          type: 'subscription',
          plan: plan,
        },
      });

      return NextResponse.json({ url: session.url });
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
