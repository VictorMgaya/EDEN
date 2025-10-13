import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

// Email service for sending payment notifications
async function sendPaymentSuccessEmail(userEmail: string, paymentType: string, amount?: number, plan?: string) {
  try {
    console.log(`📧 Sending payment success email to ${userEmail}`);

    // For now, we'll use a simple console.log to simulate email sending
    // In production, you would integrate with an email service like SendGrid, Mailgun, etc.
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
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send(emailData);

    // Example with Mailgun:
    // const mailgun = require('mailgun-js')({
    //   apiKey: process.env.MAILGUN_API_KEY,
    //   domain: process.env.MAILGUN_DOMAIN
    // });
    // await mailgun.messages().send(emailData);

    console.log(`✅ Email notification prepared for ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send payment success email to ${userEmail}:`, error);
    return false;
  }
}

// Database connection cache to avoid repeated connections
let dbConnectionCache: boolean = false;
let dbConnectionTimestamp: number = 0;
const DB_CONNECTION_TTL = 5 * 60 * 1000; // 5 minutes

async function getDbConnection(): Promise<void> {
  const now = Date.now();
  if (!dbConnectionCache || (now - dbConnectionTimestamp) > DB_CONNECTION_TTL) {
    console.log('🔄 Establishing new database connection for webhook');
    await dbConnect();
    dbConnectionCache = true;
    dbConnectionTimestamp = now;
  } else {
    console.log('🔄 Using cached database connection for webhook');
  }
}

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
    console.log('🎯 [WEBHOOK] ========== WEBHOOK RECEIVED ==========');
    console.log('🕒 Timestamp:', new Date().toISOString());
    console.log('🌐 Request URL:', request.url);
    console.log('📋 Request method:', request.method);

    // Log all headers for debugging
    const allHeaders = Object.fromEntries(request.headers.entries());
    console.log('📨 All headers:', allHeaders);

    const body = await request.text();
    const sig = request.headers.get('stripe-signature') || '';

    console.log('📦 [WEBHOOK] Raw body length:', body.length);
    console.log('🔐 [WEBHOOK] Stripe signature present:', !!sig);
    console.log('🔑 [WEBHOOK] Webhook secret configured:', !!endpointSecret);
    console.log('🔑 [WEBHOOK] Webhook secret value:', endpointSecret ? 'LOADED' : 'NOT LOADED');

    if (!endpointSecret) {
      console.error('❌ [WEBHOOK] STRIPE_WEBHOOK_SECRET not configured!');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!sig) {
      console.error('❌ [WEBHOOK] No stripe-signature header found!');
      console.error('❌ [WEBHOOK] This means Stripe is not sending signed webhooks');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      console.log('✅ [WEBHOOK] Signature verified successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ [WEBHOOK] Signature verification failed:`, errorMessage);
      console.error(`❌ [WEBHOOK] Body preview:`, body.substring(0, 200) + '...');
      console.error(`❌ [WEBHOOK] Signature:`, sig);
      return NextResponse.json({
        error: 'Invalid signature',
        details: errorMessage,
        signatureLength: sig.length,
        bodyLength: body.length
      }, { status: 400 });
    }

    console.log('📋 [WEBHOOK] Event type:', event.type);
    console.log('🆔 [WEBHOOK] Event ID:', event.id);
    console.log('🎯 [WEBHOOK] ======================================');

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
    console.log('🔄 [WEBHOOK] Processing successful payment...');
    console.log('Session ID:', session.id);
    console.log('Session mode:', session.mode);
    console.log('Customer email:', session.customer_details?.email || session.customer_email);

    await getDbConnection();
    console.log('✅ [WEBHOOK] Database connected for successful payment');

    const { type, creditAmount } = session.metadata || {};

    // Handle credit purchases
    if (type === 'credits' && creditAmount) {
      // Find user by customer email or customer ID
      const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.userEmail;

      if (!customerEmail) {
        console.error('❌ CRITICAL: No customer email found for credit purchase');
        console.error('❌ Session ID:', session.id);
        console.error('❌ Session metadata:', session.metadata);
        console.error('❌ Customer details:', session.customer_details);
        return;
      }

      console.log(`🔍 Looking for user with email: ${customerEmail}`);
      const user = await User.findOne({ email: customerEmail });

      if (!user) {
        console.error(`❌ CRITICAL: User not found in database: ${customerEmail}`);
        console.error(`❌ This means the user was not validated before creating the checkout session`);
        console.error(`❌ Session ID: ${session.id}`);
        console.error(`❌ Customer Email: ${customerEmail}`);
        console.error(`❌ Metadata:`, session.metadata);

        // Log total users in database for debugging
        const totalUsers = await User.countDocuments();
        console.error(`❌ Total users in database: ${totalUsers}`);

        return;
      }

      console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);
      console.log(`Current subscription: ${user.subscription?.type || 'none'}`);
      console.log(`Current credits: ${user.credits || 0}`);

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

      console.log(`💾 Saving user to database...`);
      await user.save();
      console.log(`✅ Successfully added ${creditsToAdd} credits to user ${customerEmail}. Total credits: ${user.credits}`);
      console.log(`✅ User saved with new credits: ${user.credits}`);

      // Send payment success email
      await sendPaymentSuccessEmail(customerEmail, 'credits', creditsToAdd);
    }

    // Handle subscription purchases in checkout.session.completed
    if (session.mode === 'subscription' && session.subscription) {
      console.log(`🔍 Processing subscription checkout session: ${session.id}`);
      console.log(`   - Customer Email: ${session.customer_details?.email || session.customer_email}`);
      console.log(`   - Customer ID: ${session.customer}`);
      console.log(`   - Subscription ID: ${session.subscription}`);

      // Get subscription details from Stripe
      const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
      const subscription = subscriptionResponse as unknown as ExtendedSubscription;

      console.log(`🔍 Subscription details:`);
      console.log(`   - Subscription Customer ID: ${subscription.customer}`);
      console.log(`   - Subscription Status: ${subscription.status}`);

      // Try multiple methods to find the user
      let user = null;
      const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.userEmail;

      // Method 1: Try to find by Stripe customer ID if available
      if (session.customer) {
        console.log(`🔍 Looking for user by Stripe customer ID: ${session.customer}`);
        user = await User.findOne({ 'subscription.stripeCustomerId': session.customer });
        if (user) {
          console.log(`✅ Found user by Stripe customer ID: ${user.email}`);
        }
      }

      // Method 2: Try email if customer ID didn't work
      if (!user && customerEmail) {
        console.log(`🔍 Looking for user by email: ${customerEmail}`);
        user = await User.findOne({ email: customerEmail });
        if (user) {
          console.log(`✅ Found user by email: ${user.email}`);
        }
      }

      // Method 3: If no user found, log the issue with detailed information
      if (!user) {
        console.error(`❌ CRITICAL: No user found for subscription purchase`);
        console.error(`   - Session Customer ID: ${session.customer}`);
        console.error(`   - Session Email: ${customerEmail}`);
        console.error(`   - Subscription Customer ID: ${subscription.customer}`);
        console.error(`   - Session Metadata:`, session.metadata);

        // Log all users with similar emails to help debug
        if (customerEmail) {
          const similarUsers = await User.find({
            email: { $regex: customerEmail.split('@')[0], $options: 'i' }
          }).limit(5);
          if (similarUsers.length > 0) {
            console.error(`❌ Found users with similar emails:`);
            similarUsers.forEach(u => console.error(`   - ${u.email} (ID: ${u._id})`));
          }
        }

        // Log total user count to see if database is empty
        const totalUsers = await User.countDocuments();
        console.error(`❌ Total users in database: ${totalUsers}`);

        return;
      }

      console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);
      console.log(`Current subscription: ${user.subscription?.type || 'none'}`);
      console.log(`Current credits: ${user.credits || 0}`);

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

      console.log(`💾 Saving user to database...`);
      await user.save();
      console.log(`✅ Successfully activated subscription for user ${customerEmail}:`);
      console.log(`   - Previous: ${previousSubscriptionType} → Current: ${subscriptionType}`);
      console.log(`   - Expires: ${subscriptionEndDate.toISOString()}`);
      console.log(`   - Stripe Subscription ID: ${subscription.id}`);
      console.log(`   - New credits: ${user.credits}`);
      console.log(`✅ User saved with subscription type: ${user.subscription.type}`);

      // Send payment success email for subscription
      if (customerEmail) {
        await sendPaymentSuccessEmail(customerEmail, 'subscription', undefined, subscriptionType);
      }
    }
  } catch (error) {
    console.error('❌ Error handling successful payment:', error);
    throw error; // Re-throw to ensure webhook knows about the failure
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice) {
  try {
    console.log('🔄 Connecting to database for subscription payment...');
    await getDbConnection();
    console.log('✅ Database connected for subscription payment');

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
    console.log('🔄 Connecting to database for failed subscription payment...');
    await getDbConnection();
    console.log('✅ Database connected for failed subscription payment');

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
    console.log('🔄 Connecting to database for subscription cancellation...');
    await getDbConnection();
    console.log('✅ Database connected for subscription cancellation');

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
    console.log('🔄 Connecting to database for subscription update...');
    await getDbConnection();
    console.log('✅ Database connected for subscription update');

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
    console.log('🔄 Connecting to database for subscription creation...');
    await getDbConnection();
    console.log('✅ Database connected for subscription creation');

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
