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
        await handleFailedSubscriptionPayment(failedInvoice);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(deletedSubscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(updatedSubscription);
        break;

      case 'customer.subscription.created':
        const createdSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(createdSubscription);
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

    // Handle credit purchases
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
      const previousCredits = user.credits || 0;
      user.credits = previousCredits + creditsToAdd;

      // Log the credit addition with detailed information
      const usageRecord = {
        action: 'credit',
        amount: creditsToAdd,
        description: `Credit purchase - ${creditsToAdd} credits via Stripe`,
        timestamp: new Date(),
        metadata: {
          type: 'credit_purchase',
          reason: 'payment_success',
          subscription: user.subscription?.type || 'freemium',
          paymentIntent: session.payment_intent,
          sessionId: session.id,
          previousCredits: previousCredits,
          newTotalCredits: user.credits
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

      console.log(`✅ Successfully added ${creditsToAdd} credits to user ${customerEmail}. Total credits: ${user.credits}`);
    }

    // Handle subscription purchases in checkout.session.completed
    if (session.mode === 'subscription' && session.subscription) {
      console.log(`🔍 Processing subscription checkout session: ${session.id}`);
      console.log(`   - Customer Email: ${session.customer_details?.email || session.customer_email}`);
      console.log(`   - Subscription ID: ${session.subscription}`);

      // Get subscription details from Stripe
      const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
      const subscription = subscriptionResponse as unknown as ExtendedSubscription;

      // Find user by customer email
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (!customerEmail) {
        console.error('No customer email found for subscription purchase');
        return;
      }

      const user = await User.findOne({ email: customerEmail });

      if (!user) {
        console.error(`User not found: ${customerEmail}`);
        return;
      }

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

      // Calculate subscription expiration date
      const subscriptionEndDate = new Date(subscription.current_period_end * 1000);

      // Update user subscription with comprehensive details
      const previousSubscriptionType = user.subscription?.type || 'freemium';

      user.subscription = {
        type: subscriptionType,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: subscriptionEndDate,
        cancelAtPeriodEnd: false
      };

      // Update additional user fields based on subscription
      if (subscriptionType === 'pro') {
        user.credits = Math.max(user.credits || 0, 100); // Ensure at least 100 credits for pro
      } else if (subscriptionType === 'enterprise') {
        user.credits = Math.max(user.credits || 0, 500); // Ensure at least 500 credits for enterprise
      }

      // Log subscription activation with detailed information
      const usageRecord = {
        action: 'credit',
        amount: 0,
        description: `Subscription activated - ${subscriptionType} plan via checkout`,
        timestamp: new Date(),
        metadata: {
          type: 'subscription_activated',
          reason: 'checkout_completed',
          subscription: subscriptionType,
          previousSubscription: previousSubscriptionType,
          sessionId: session.id,
          subscriptionId: subscription.id,
          amountPaid: session.amount_total,
          currency: session.currency,
          status: subscription.status
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

      console.log(`✅ Successfully activated subscription for user ${customerEmail}:`);
      console.log(`   - Previous: ${previousSubscriptionType} → Current: ${subscriptionType}`);
      console.log(`   - Expires: ${subscriptionEndDate.toISOString()}`);
      console.log(`   - Stripe Subscription ID: ${subscription.id}`);
    }
  } catch (error) {
    console.error('❌ Error handling successful payment:', error);
    throw error; // Re-throw to ensure webhook knows about the failure
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice) {
  try {
    await dbConnect();

    const customerEmail = invoice.customer_email;
    const customerId = invoice.customer as string;

    console.log(`🔍 Processing subscription payment for invoice: ${invoice.id}`);
    console.log(`   - Customer Email: ${customerEmail}`);
    console.log(`   - Customer ID: ${customerId}`);

    // Try multiple methods to find the user
    let user = null;

    // Method 1: Find by Stripe customer ID (most reliable)
    if (customerId) {
      user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
      if (user) {
        console.log(`✅ Found user by Stripe customer ID: ${user.email}`);
      }
    }

    // Method 2: Fall back to email if customer ID didn't work
    if (!user && customerEmail) {
      user = await User.findOne({ email: customerEmail });
      if (user) {
        console.log(`✅ Found user by email: ${user.email}`);
      }
    }

    if (!user) {
      console.error(`❌ User not found with customer ID: ${customerId} or email: ${customerEmail}`);
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

    // Calculate subscription expiration date
    const subscriptionStartDate = new Date(subscription.current_period_start * 1000);
    const subscriptionEndDate = new Date(subscription.current_period_end * 1000);

    // Update user subscription with comprehensive details
    const previousSubscriptionType = user.subscription?.type || 'freemium';

    user.subscription = {
      type: subscriptionType,
      stripeCustomerId: invoice.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: subscriptionEndDate,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false
    };

    // Update user credits based on subscription type
    if (subscriptionType === 'pro') {
      user.credits = Math.max(user.credits || 0, 100); // Ensure at least 100 credits for pro
    } else if (subscriptionType === 'enterprise') {
      user.credits = Math.max(user.credits || 0, 500); // Ensure at least 500 credits for enterprise
    }

    // Log subscription activation/update with detailed information
    const usageRecord = {
      action: 'credit',
      amount: 0,
      description: `Subscription ${subscriptionType === previousSubscriptionType ? 'renewed' : 'upgraded'} - ${subscriptionType} plan`,
      timestamp: new Date(),
      metadata: {
        type: 'subscription_payment',
        reason: 'subscription_activated',
        subscription: subscriptionType,
        previousSubscription: previousSubscriptionType,
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
        subscriptionStartDate: subscriptionStartDate.toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        status: subscription.status
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

    console.log(`✅ Successfully updated subscription for user ${customerEmail}:`);
    console.log(`   - Previous: ${previousSubscriptionType} → Current: ${subscriptionType}`);
    console.log(`   - Expires: ${subscriptionEndDate.toISOString()}`);
    console.log(`   - Stripe Subscription ID: ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error handling subscription payment:', error);
    throw error; // Re-throw to ensure webhook knows about the failure
  }
}

async function handleFailedSubscriptionPayment(invoice: Stripe.Invoice) {
  try {
    await dbConnect();

    const customerEmail = invoice.customer_email;

    if (!customerEmail) {
      console.error('No customer email found for failed subscription payment');
      return;
    }

    const user = await User.findOne({ email: customerEmail });

    if (!user) {
      console.error(`User not found: ${customerEmail}`);
      return;
    }

    // Log the failed payment
    const usageRecord = {
      action: 'debit',
      amount: 0,
      description: `Subscription payment failed - ${invoice.id}`,
      timestamp: new Date(),
      metadata: {
        type: 'payment_failed',
        reason: 'subscription_payment_failed',
        invoiceId: invoice.id,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count
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

    console.log(`⚠️ Logged failed subscription payment for user ${customerEmail}`);
  } catch (error) {
    console.error('❌ Error handling failed subscription payment:', error);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  try {
    await dbConnect();

    // Find user by Stripe customer ID
    const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer });

    if (!user) {
      console.error(`User not found for subscription cancellation. Customer ID: ${subscription.customer}`);
      return;
    }

    const previousSubscriptionType = user.subscription?.type || 'freemium';
    const cancellationDate = new Date();

    // Update subscription to cancelled status
    user.subscription = {
      type: 'freemium', // Downgrade to freemium
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: cancellationDate, // Set expiry to cancellation date
      cancelAtPeriodEnd: true
    };

    // Log the cancellation
    const usageRecord = {
      action: 'debit',
      amount: 0,
      description: `Subscription cancelled - ${previousSubscriptionType} plan`,
      timestamp: cancellationDate,
      metadata: {
        type: 'subscription_cancelled',
        reason: 'user_cancelled',
        previousSubscription: previousSubscriptionType,
        subscriptionId: subscription.id,
        cancelledAt: cancellationDate.toISOString(),
        cancelReason: subscription.cancellation_details?.reason || 'unknown'
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

    console.log(`✅ Successfully cancelled subscription for user ${user.email}:`);
    console.log(`   - Previous: ${previousSubscriptionType} → Current: freemium`);
    console.log(`   - Cancelled at: ${cancellationDate.toISOString()}`);
  } catch (error) {
    console.error('❌ Error handling subscription cancellation:', error);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    await dbConnect();

    // Find user by Stripe customer ID
    const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer });

    if (!user) {
      console.error(`User not found for subscription update. Customer ID: ${subscription.customer}`);
      return;
    }

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

    const previousSubscriptionType = user.subscription?.type || 'freemium';

    // Update subscription details
    user.subscription = {
      type: subscriptionType,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date((subscription as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false
    };

    // Log the update
    const usageRecord = {
      action: 'credit',
      amount: 0,
      description: `Subscription updated - ${subscriptionType} plan`,
      timestamp: new Date(),
      metadata: {
        type: 'subscription_updated',
        reason: 'subscription_modified',
        subscription: subscriptionType,
        previousSubscription: previousSubscriptionType,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString()
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

    console.log(`✅ Successfully updated subscription for user ${user.email}:`);
    console.log(`   - Status: ${subscription.status}`);
  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    await dbConnect();

    console.log(`🔍 Processing subscription creation: ${subscription.id}`);
    console.log(`   - Customer ID: ${subscription.customer}`);
    console.log(`   - Status: ${subscription.status}`);

    // Get customer details from Stripe
    const customerResponse = await stripe.customers.retrieve(subscription.customer as string);
    const customer = customerResponse as Stripe.Customer;

    if (!customer.email) {
      console.error(`❌ No email found for customer: ${subscription.customer}`);
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: customer.email });

    if (!user) {
      console.error(`❌ User not found: ${customer.email}`);
      return;
    }

    console.log(`✅ Found user for subscription creation: ${user.email}`);

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

    // Update user subscription with customer ID and subscription details
    user.subscription = {
      type: subscriptionType,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date((subscription as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
      cancelAtPeriodEnd: false
    };

    // Update user credits based on subscription type
    if (subscriptionType === 'pro') {
      user.credits = Math.max(user.credits || 0, 100); // Ensure at least 100 credits for pro
    } else if (subscriptionType === 'enterprise') {
      user.credits = Math.max(user.credits || 0, 500); // Ensure at least 500 credits for enterprise
    }

    // Log subscription creation
    const usageRecord = {
      action: 'credit',
      amount: 0,
      description: `Subscription created - ${subscriptionType} plan`,
      timestamp: new Date(),
      metadata: {
        type: 'subscription_created',
        reason: 'subscription_created',
        subscription: subscriptionType,
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString()
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

    console.log(`✅ Successfully created subscription for user ${user.email}:`);
    console.log(`   - Subscription Type: ${subscriptionType}`);
    console.log(`   - Customer ID: ${subscription.customer}`);
    console.log(`   - Subscription ID: ${subscription.id}`);
    console.log(`   - Expires: ${user.subscription.currentPeriodEnd?.toISOString()}`);
  } catch (error) {
    console.error('❌ Error handling subscription creation:', error);
  }
}
