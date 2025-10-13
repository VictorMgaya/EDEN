/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/model/user';

/**
 * Credit Management System
 * Handles credit balance updates, periodic refreshes, and payment processing
 */

export interface CreditUpdateResult {
  success: boolean;
  previousCredits: number;
  newCredits: number;
  creditsAdded: number;
  reason: string;
  userEmail: string;
}

export interface SubscriptionUpdateResult {
  success: boolean;
  previousSubscription: string;
  newSubscription: string;
  creditsGuaranteed: number;
  subscriptionEndDate: Date;
  userEmail: string;
}

/**
 * Updates user credits with comprehensive validation and tracking
 */
export async function updateUserCredits(
  userEmail: string,
  creditsToAdd: number,
  reason: string,
  metadata: Record<string, string | number | boolean | Date> = {}
): Promise<CreditUpdateResult> {
  try {
    await dbConnect();
    console.log(`🔄 [CREDIT] Updating credits for ${userEmail}: +${creditsToAdd} (${reason})`);

    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new Error(`User not found: ${userEmail}`);
    }

    // Validate credit amount
    if (creditsToAdd < 0) {
      throw new Error('Cannot add negative credits');
    }

    const previousCredits = user.credits || 0;
    const newCreditTotal = previousCredits + creditsToAdd;

    // Ensure credits don't go negative
    user.credits = Math.max(0, newCreditTotal);

    // Update last credit purchase timestamp for balance tracking
    user.lastCreditPurchase = new Date();

    // Create usage record
    const usageRecord = {
      action: 'credit',
      amount: creditsToAdd,
      description: reason,
      timestamp: new Date(),
      metadata: {
        type: 'credit_update',
        reason: reason.toLowerCase().replace(/\s+/g, '_'),
        previousCredits: previousCredits,
        newTotalCredits: user.credits,
        ...metadata
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

    // Save with retry logic
    try {
      await user.save();
      console.log(`✅ [CREDIT] Successfully updated credits: ${previousCredits} → ${user.credits}`);
    } catch (saveError) {
      console.error(`❌ [CREDIT] Failed to save user ${userEmail}:`, saveError);
      // Try to save again with fresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      await user.save();
      console.log(`✅ [CREDIT] Successfully saved user ${userEmail} on retry`);
    }

    return {
      success: true,
      previousCredits,
      newCredits: user.credits,
      creditsAdded: creditsToAdd,
      reason,
      userEmail
    };

  } catch (error) {
    console.error(`❌ [CREDIT] Error updating credits for ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Updates user subscription with comprehensive validation and tracking
 */
export async function updateUserSubscription(
  userEmail: string,
  subscriptionType: 'freemium' | 'pro' | 'enterprise',
  subscriptionId: string,
  platform: 'stripe' | 'paypal',
  subscriptionEndDate: Date,
  metadata: Record<string, any> = {}
): Promise<SubscriptionUpdateResult> {
  try {
    await dbConnect();
    console.log(`🔄 [SUBSCRIPTION] Updating subscription for ${userEmail}: ${subscriptionType}`);

    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new Error(`User not found: ${userEmail}`);
    }

    const previousSubscription = user.subscription?.type || 'freemium';
    const previousCredits = user.credits || 0;

    // Define credit guarantees for each subscription type
    const creditGuarantees = {
      freemium: 0,
      pro: 100,
      enterprise: 500
    };

    const guaranteedCredits = creditGuarantees[subscriptionType] || 0;

    // Update subscription details
    user.subscription = {
      type: subscriptionType,
      stripeCustomerId: platform === 'stripe' ? subscriptionId : user.subscription?.stripeCustomerId,
      paypalSubscriptionId: platform === 'paypal' ? subscriptionId : user.subscription?.paypalSubscriptionId,
      currentPeriodEnd: subscriptionEndDate,
      cancelAtPeriodEnd: false
    };

    // Update credits based on subscription type with minimum guarantees
    user.credits = Math.max(user.credits || 0, guaranteedCredits);

    // Update subscription activation timestamp
    user.lastSubscriptionActivation = new Date();

    // Create usage record
    const usageRecord = {
      action: 'credit',
      amount: user.credits - previousCredits,
      description: `Subscription activated - ${subscriptionType} plan via ${platform}`,
      timestamp: new Date(),
      metadata: {
        type: 'subscription_activated',
        reason: 'subscription_activated',
        subscription: subscriptionType,
        previousSubscription: previousSubscription,
        platform: platform,
        subscriptionId: subscriptionId,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        previousCredits: previousCredits,
        newCredits: user.credits,
        guaranteedCredits: guaranteedCredits,
        ...metadata
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

    // Save with retry logic
    try {
      await user.save();
      console.log(`✅ [SUBSCRIPTION] Successfully updated subscription: ${previousSubscription} → ${subscriptionType}`);
      console.log(`📊 [SUBSCRIPTION] Credits updated: ${previousCredits} → ${user.credits} (guaranteed: ${guaranteedCredits})`);
    } catch (saveError) {
      console.error(`❌ [SUBSCRIPTION] Failed to save subscription for user ${userEmail}:`, saveError);
      // Try to save again with fresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      await user.save();
      console.log(`✅ [SUBSCRIPTION] Successfully saved subscription for user ${userEmail} on retry`);
    }

    return {
      success: true,
      previousSubscription,
      newSubscription: subscriptionType,
      creditsGuaranteed: guaranteedCredits,
      subscriptionEndDate,
      userEmail
    };

  } catch (error) {
    console.error(`❌ [SUBSCRIPTION] Error updating subscription for ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Processes periodic credit refresh for users (every 6 hours as mentioned)
 * This function can be called by a cron job or scheduled task
 */
export async function processPeriodicCreditRefresh(): Promise<void> {
  try {
    await dbConnect();
    console.log('🔄 [CREDIT_REFRESH] Starting periodic credit refresh...');

    // Find users who need credit refresh (last purchase > 6 hours ago)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const usersNeedingRefresh = await User.find({
      $or: [
        { lastCreditPurchase: { $lt: sixHoursAgo } },
        { lastCreditPurchase: { $exists: false } }
      ],
      credits: { $lt: 100 } // Only refresh users with low credits
    });

    console.log(`📊 [CREDIT_REFRESH] Found ${usersNeedingRefresh.length} users needing credit refresh`);

    for (const user of usersNeedingRefresh) {
      try {
        // Give users 10 credits every 6 hours if they're low on credits
        const refreshAmount = 10;
        const reason = 'Periodic credit refresh (6-hour cycle)';

        await updateUserCredits(user.email, refreshAmount, reason, {
          type: 'periodic_refresh',
          cycle: '6_hours',
          timestamp: new Date().toISOString() || new Date().toString()
        });

        console.log(`✅ [CREDIT_REFRESH] Refreshed ${refreshAmount} credits for ${user.email}`);

      } catch (userError) {
        console.error(`❌ [CREDIT_REFRESH] Failed to refresh credits for ${user.email}:`, userError);
      }
    }

    console.log(`✅ [CREDIT_REFRESH] Completed periodic credit refresh for ${usersNeedingRefresh.length} users`);

  } catch (error) {
    console.error('❌ [CREDIT_REFRESH] Error in periodic credit refresh:', error);
    throw error;
  }
}

/**
 * Validates and processes payment success data
 */
export async function processPaymentSuccess(
  userEmail: string,
  paymentType: 'credits' | 'subscription',
  amount?: number,
  plan?: string,
  platform: 'stripe' | 'paypal' = 'stripe',
  externalId?: string
): Promise<CreditUpdateResult | SubscriptionUpdateResult> {
  try {
    if (paymentType === 'credits' && amount) {
      return await updateUserCredits(
        userEmail,
        amount,
        `Credit purchase via ${platform}`,
        {
          platform,
          externalId: externalId || '',
          paymentType: 'one_time'
        }
      );
    } else if (paymentType === 'subscription' && plan) {
      const subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      return await updateUserSubscription(
        userEmail,
        plan as 'pro' | 'enterprise',
        externalId || '',
        platform,
        subscriptionEndDate,
        {
          platform,
          externalId,
          paymentType: 'subscription'
        }
      );
    } else {
      throw new Error('Invalid payment type or missing amount/plan');
    }
  } catch (error) {
    console.error(`❌ [PAYMENT_PROCESS] Error processing payment for ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Gets user credit and subscription status
 */
export async function getUserStatus(userEmail: string): Promise<{
  credits: number;
  subscription: string;
  lastCreditPurchase?: Date;
  lastSubscriptionActivation?: Date;
  subscriptionEndDate?: Date;
} | null> {
  try {
    await dbConnect();

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return null;
    }

    return {
      credits: user.credits || 0,
      subscription: user.subscription?.type || 'freemium',
      lastCreditPurchase: user.lastCreditPurchase,
      lastSubscriptionActivation: user.lastSubscriptionActivation,
      subscriptionEndDate: user.subscription?.currentPeriodEnd
    };

  } catch (error) {
    console.error(`❌ [USER_STATUS] Error getting status for ${userEmail}:`, error);
    return null;
  }
}

/**
 * Deducts credits from user account (for usage tracking)
 */
export async function deductUserCredits(
  userEmail: string,
  creditsToDeduct: number,
  reason: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    if (creditsToDeduct < 0) {
      throw new Error('Cannot deduct negative credits');
    }

    await dbConnect();

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new Error(`User not found: ${userEmail}`);
    }

    const previousCredits = user.credits || 0;

    if (previousCredits < creditsToDeduct) {
      throw new Error(`Insufficient credits: ${previousCredits} < ${creditsToDeduct}`);
    }

    user.credits = previousCredits - creditsToDeduct;

    // Create usage record for deduction
    const usageRecord = {
      action: 'debit',
      amount: creditsToDeduct,
      description: reason,
      timestamp: new Date(),
      metadata: {
        type: 'credit_usage',
        reason: reason.toLowerCase().replace(/\s+/g, '_'),
        previousCredits: previousCredits,
        remainingCredits: user.credits,
        ...metadata
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
    console.log(`✅ [CREDIT_DEDUCT] Deducted ${creditsToDeduct} credits from ${userEmail}. Remaining: ${user.credits}`);

    return true;

  } catch (error) {
    console.error(`❌ [CREDIT_DEDUCT] Error deducting credits from ${userEmail}:`, error);
    return false;
  }
}
