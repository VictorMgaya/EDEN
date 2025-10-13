import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

// Extend Stripe subscription type to include period properties
interface ExtendedSubscription extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

// This is your Stripe webhook secret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature') || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleSubscriptionPayment(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.error('Subscription payment failed:', failedInvoice.id);
        // Handle failed subscription payment
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    await dbConnect();

    const { type, creditAmount } = session.metadata || {};

    if (type === 'credits' && creditAmount) {
      // Find user by customer email or customer ID
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (!customerEmail) {
        console.error('No customer email found for credit purchase');
        return;
      }

      const user = await User.findOne({ email: customerEmail });

      if (!user) {
        console.error(`User not found: ${customerEmail}`);
        return;
      }

      // Add credits to user account
      const creditsToAdd = parseInt(creditAmount);
      user.credits = (user.credits || 0) + creditsToAdd;

      // Log the credit addition
      const usageRecord = {
        action: 'credit',
        amount: creditsToAdd,
        description: `Credit purchase - ${creditsToAdd} credits`,
        metadata: {
          type: 'purchase',
          paymentIntent: session.payment_intent,
          sessionId: session.id
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

      await user.save();

      console.log(`Added ${creditsToAdd} credits to user ${customerEmail}`);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice) {
  try {
    await dbConnect();

    const customerEmail = invoice.customer_email;

    if (!customerEmail) {
      console.error('No customer email found for subscription');
      return;
    }

    const user = await User.findOne({ email: customerEmail });

    if (!user) {
      console.error(`User not found: ${customerEmail}`);
      return;
    }

    // Update subscription status based on the invoice
    const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string }).subscription;

    if (!subscriptionId) {
      console.error('No subscription found in invoice');
      return;
    }

    const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
    const subscription = subscriptionResponse as unknown as ExtendedSubscription;

    // Map Stripe subscription to our subscription types
    let subscriptionType = 'freemium';

    if (subscription.items?.data.length > 0) {
      const priceId = subscription.items.data[0].price?.id;

      // Map actual price IDs to subscription types
      const priceMapping: { [key: string]: string } = {
        [process.env.STRIPE_PRO_PRICE_ID || '']: 'pro',
        [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'enterprise',
      };

      subscriptionType = priceMapping[priceId] || 'freemium';
    }

    // Update user subscription
    user.subscription = {
      type: subscriptionType,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: false
    };

    // Log subscription update
    const usageRecord = {
      action: 'credit',
      amount: 0,
      description: `Subscription activated - ${subscriptionType} plan`,
      metadata: {
        type: 'subscription_activated',
        subscriptionType: subscriptionType,
        invoiceId: invoice.id,
        subscriptionId: subscription.id
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

    await user.save();

    console.log(`Updated subscription for user ${customerEmail} to ${subscriptionType}`);
  } catch (error) {
    console.error('Error handling subscription payment:', error);
  }
}
