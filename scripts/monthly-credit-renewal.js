import mongoose from 'mongoose';

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === 'your_paypal_client_id_here') {
    throw new Error('PayPal Client ID not configured');
  }

  if (!PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_SECRET === 'your_paypal_client_secret_here') {
    throw new Error('PayPal Client Secret not configured');
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
    throw new Error(`PayPal auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function checkPayPalSubscriptionStatus(subscriptionId) {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to check subscription ${subscriptionId}: ${response.statusText}`);
      return null;
    }

    const subscription = await response.json();
    return subscription.status; // 'ACTIVE', 'CANCELLED', 'EXPIRED', etc.
  } catch (error) {
    console.error(`Error checking subscription ${subscriptionId}:`, error);
    return null;
  }
}

async function processMonthlyCreditRenewal() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get current date
    const now = new Date();

    // Find users with active subscriptions that need renewal
    const User = mongoose.model('User');

    // Find users who:
    // 1. Have a subscription with currentPeriodEnd in the past 24 hours
    // 2. Have an active PayPal subscription
    const usersNeedingRenewal = await User.find({
      'subscription.type': { $in: ['pro', 'enterprise'] },
      'subscription.paypalSubscriptionId': { $exists: true, $ne: null },
      'subscription.currentPeriodEnd': { $lte: now },
      'subscription.cancelAtPeriodEnd': false
    });

    console.log(`📊 Found ${usersNeedingRenewal.length} users needing credit renewal`);

    for (const user of usersNeedingRenewal) {
      try {
        console.log(`🔄 Processing renewal for user: ${user.email}`);

        // Check if PayPal subscription is still active
        const paypalStatus = await checkPayPalSubscriptionStatus(user.subscription.paypalSubscriptionId);

        if (paypalStatus !== 'ACTIVE') {
          console.log(`⚠️ PayPal subscription ${user.subscription.paypalSubscriptionId} is ${paypalStatus}, skipping renewal`);
          continue;
        }

        // Calculate monthly credits based on subscription type
        const monthlyCreditAmounts = {
          pro: 1000,
          enterprise: 5000
        };

        const monthlyCredits = monthlyCreditAmounts[user.subscription.type] || 1000;
        const previousCredits = user.credits || 0;

        // Add monthly credits
        user.credits = (user.credits || 0) + monthlyCredits;

        // Update subscription period end (next month)
        user.subscription.currentPeriodEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        // Update last credit renewal timestamp
        user.lastCreditRenewal = now;

        // Log the renewal
        const usageRecord = {
          action: 'credit',
          amount: monthlyCredits,
          description: `Monthly subscription renewal - ${user.subscription.type} plan (${monthlyCredits} credits)`,
          timestamp: now,
          metadata: {
            type: 'subscription_monthly_renewal',
            reason: 'paypal_subscription_renewal',
            subscription: user.subscription.type,
            paymentMethod: 'paypal',
            subscriptionId: user.subscription.paypalSubscriptionId,
            previousCredits: previousCredits,
            newTotalCredits: user.credits,
            nextRenewalDate: user.subscription.currentPeriodEnd.toISOString()
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

        // Save user
        await user.save();

        console.log(`✅ Renewed ${user.subscription.type} subscription for ${user.email}`);
        console.log(`📊 Credits: ${previousCredits} → ${user.credits} (+${monthlyCredits})`);

      } catch (error) {
        console.error(`❌ Failed to renew subscription for user ${user.email}:`, error);
      }
    }

    console.log('🎉 Monthly credit renewal completed');

  } catch (error) {
    console.error('❌ Error in monthly credit renewal:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the renewal process if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting monthly credit renewal process...');
  processMonthlyCreditRenewal()
    .then(() => {
      console.log('✅ Process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Process failed:', error);
      process.exit(1);
    });
}

export { processMonthlyCreditRenewal };
